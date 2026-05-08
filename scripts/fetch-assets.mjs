// Fetches commissioned Catholic artworks from the Met Open Access API
// and a public-domain Gregorian chant recording from the Internet Archive.
// Runs in CI before `vite build`. Skips files that already exist (idempotent).
//
// Usage: node scripts/fetch-assets.mjs
//
// Output:
//   public/assets/met/<objectId>.jpg     (primary high-res image)
//   public/assets/audio/chant.mp3        (PD Gregorian chant)
//   public/assets/manifest.json          (joined metadata read by HeroVideo)

import { writeFile, mkdir, stat } from "node:fs/promises";
import { createWriteStream, existsSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ASSETS_DIR = resolve(ROOT, "public/assets");
const MET_DIR = resolve(ASSETS_DIR, "met");
const AUDIO_DIR = resolve(ASSETS_DIR, "audio");

// Curated commissioned Catholic artworks from the Met Open Access collection.
// Only Met object IDs verified from the public collection are listed —
// patron / commission notes are written from art-historical record (the
// Met's `creditLine` describes the museum's acquisition, not the original
// commission). Add more works only after verifying both the ID and the
// work's actual subject.
const WORKS = [
  {
    metId: 437877,
    fallbackTitle: "Allegory of the Catholic Faith",
    fallbackArtist: "Johannes Vermeer",
    fallbackYear: "ca. 1670–72",
    patron:
      "A private Catholic patron in the Dutch Republic — likely for a schuilkerk, a hidden Catholic church.",
    why: "Painted for the underground Catholic faithful in Protestant Holland.",
  },
  {
    metId: 435638,
    fallbackTitle: "The Cellier Altarpiece",
    fallbackArtist: "Jean Bellegambe",
    fallbackYear: "ca. 1508–14",
    patron:
      "Jeanne de Boubais, abbess of the Cistercian convent of Flines, for her abbey church.",
    why: "An abbess commissioning an altarpiece for the women under her care.",
  },
  {
    metId: 437423,
    fallbackTitle: "The Immaculate Conception",
    fallbackArtist: "Guido Reni",
    fallbackYear: "1627",
    patron:
      "King Philip IV of Spain, through the Spanish Ambassador in Rome, for the Royal Chapel.",
    why: "A king commissioning Roman painting for the chapel of his court.",
  },
  {
    metId: 437216,
    fallbackTitle: "The Fifteen Mysteries and the Virgin of the Rosary",
    fallbackArtist: "Netherlandish (Brussels) Painter",
    fallbackYear: "ca. 1515–20",
    patron:
      "Commissioned for Rosary devotion — likely a confraternity or guild of the Rosary.",
    why: "A confraternity commissioning teaching art for the faithful.",
  },
];

const CHANT = {
  // Public-domain Gregorian chant Mass on the Internet Archive.
  // Asperges Me — sprinkling rite, opens the Mass.
  url: "https://archive.org/download/GregorianChantMass/01_-_Asperges_me__Lord__sprinkle_me.mp3",
  filename: "asperges-me.mp3",
  title: "Asperges me",
  attribution:
    "Catholic Church, public-domain Gregorian Chant Mass. Internet Archive.",
};

async function ensureDir(p) {
  await mkdir(p, { recursive: true });
}

async function fileExists(p) {
  try {
    const s = await stat(p);
    return s.size > 0;
  } catch {
    return false;
  }
}

async function fetchToFile(url, dest, label) {
  if (await fileExists(dest)) {
    console.log(`  · cached  ${label}`);
    return true;
  }
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ars-sacra-prebuild/1.0" },
    });
    if (!res.ok) {
      console.warn(`  ! ${label} HTTP ${res.status}`);
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(dest, buf);
    console.log(`  ✓ ${label} (${(buf.length / 1024).toFixed(0)} kB)`);
    return true;
  } catch (e) {
    console.warn(`  ! ${label} ${e.message}`);
    return false;
  }
}

async function fetchMetObject(id) {
  const res = await fetch(
    `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
    { headers: { "User-Agent": "ars-sacra-prebuild/1.0" } },
  );
  if (!res.ok) throw new Error(`Met API HTTP ${res.status} for object ${id}`);
  return res.json();
}

async function main() {
  await ensureDir(MET_DIR);
  await ensureDir(AUDIO_DIR);

  console.log(`\n  Met Open Access — fetching ${WORKS.length} works`);

  const manifest = {
    fetchedAt: new Date().toISOString(),
    works: [],
    chant: null,
  };

  for (const w of WORKS) {
    const meta = {
      metId: w.metId,
      title: w.fallbackTitle,
      artist: w.fallbackArtist,
      year: w.fallbackYear,
      medium: "",
      dimensions: "",
      creditLine: "",
      patron: w.patron,
      why: w.why,
      image: `assets/met/${w.metId}.jpg`,
      metPage: `https://www.metmuseum.org/art/collection/search/${w.metId}`,
    };

    let primaryImage = null;
    try {
      const obj = await fetchMetObject(w.metId);
      meta.title = obj.title || meta.title;
      meta.artist = obj.artistDisplayName || meta.artist;
      meta.year = obj.objectDate || meta.year;
      meta.medium = obj.medium || "";
      meta.dimensions = obj.dimensions || "";
      meta.creditLine = obj.creditLine || "";
      primaryImage = obj.primaryImage || obj.primaryImageSmall || null;
    } catch (e) {
      console.warn(`  ! Met API ${w.metId}: ${e.message}`);
    }

    if (primaryImage) {
      const dest = resolve(MET_DIR, `${w.metId}.jpg`);
      const ok = await fetchToFile(primaryImage, dest, `${w.metId} ${meta.artist}`);
      if (!ok) meta.image = null;
    } else {
      meta.image = null;
    }

    manifest.works.push(meta);
  }

  console.log(`\n  Internet Archive — Gregorian chant`);
  const chantDest = resolve(AUDIO_DIR, CHANT.filename);
  const chantOk = await fetchToFile(CHANT.url, chantDest, CHANT.title);
  manifest.chant = chantOk
    ? {
        title: CHANT.title,
        attribution: CHANT.attribution,
        src: `assets/audio/${CHANT.filename}`,
      }
    : null;

  const manifestPath = resolve(ASSETS_DIR, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n  Wrote ${manifestPath}`);

  const ok = manifest.works.filter((w) => w.image).length;
  console.log(
    `\n  Result: ${ok}/${manifest.works.length} images, audio ${
      manifest.chant ? "✓" : "✗"
    }\n`,
  );
}

main().catch((e) => {
  console.error("\n  fetch-assets failed:", e);
  // Don't fail the build — HeroVideo gracefully handles missing assets.
  process.exit(0);
});
