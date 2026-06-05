// One-shot importer for the Perplexity research dump → typed
// `src/data/discovery-directory.ts`. Re-runnable: drop a fresh CSV
// at scripts/.cache/discovery-source.md, run `node
// scripts/import-discovery.mjs`, and the data file regenerates.

import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, '.cache/discovery-source.md');
const OUT = resolve(__dirname, '../src/data/discovery-directory.ts');

// City → [lat, lon]. Approximate centroids — fine for a marker
// cluster map. Extend as new entries are added.
const CITY_COORDS = {
  'Hulbert, Oklahoma, USA': [35.93, -95.13],
  'Stamullen, County Meath, Ireland': [53.62, -6.27],
  'Abiquiu, New Mexico, USA': [36.21, -106.31],
  'Mount Angel, Oregon, USA': [45.07, -122.79],
  'Elgin, Moray, Scotland': [57.65, -3.32],
  'Le Barroux, Provence, France': [44.13, 5.10],
  'Conception, Missouri, USA': [40.24, -94.69],
  'Clyde, Missouri, USA': [40.27, -94.74],
  'Norcia, Umbria, Italy': [42.79, 13.10],
  'Alcalá de Henares, Madrid, Spain': [40.48, -3.36],
  'Lyon, Auvergne-Rhône-Alpes, France': [45.76, 4.84],
  ', , Italy': [41.87, 12.57],
  'Milan, Lombardy, Italy': [45.46, 9.19],
  'Auckland, , New Zealand': [-36.85, 174.76],
  'Corridonia, Marche, Italy': [43.25, 13.50],
  'Shrewsbury, England, United Kingdom': [52.71, -2.75],
  'Chichester, West Sussex, United Kingdom': [50.84, -0.78],
  'Seville, Andalusia, Spain': [37.39, -5.99],
  'Meriden, Connecticut, USA': [41.54, -72.81],
  'Hobart, Indiana, USA': [41.53, -87.27],
  'Chicago, Illinois, USA': [41.88, -87.63],
  'Minneapolis, Minnesota, USA': [44.98, -93.27],
  'Kennett Square, Pennsylvania, USA': [39.85, -75.71],
  'Philadelphia, Pennsylvania, USA': [39.95, -75.17],
  'Tennessee, Tennessee, USA': [35.86, -86.66],
  'Madison, Virginia, USA': [38.38, -78.26],
  'St. Louis, Missouri, USA': [38.63, -90.20],
  'Florence, Tuscany, Italy': [43.77, 11.26],
  'Bruno, Saskatchewan, Canada': [52.27, -105.50],
  'St. Jacobs, Ontario, Canada': [43.54, -80.55],
  'Alberta, Alberta, Canada': [53.93, -116.58],
  'Burnaby, British Columbia, Canada': [49.25, -122.96],
  'Halifax, Nova Scotia, Canada': [44.65, -63.58],
  'New South Wales, New South Wales, Australia': [-32.0, 147.0],
  'Portland, Oregon, USA': [45.52, -122.68],
  'Princeton, New Jersey, USA': [40.35, -74.66],
  'New York, New York, USA': [40.71, -74.01],
  'Warsaw, Masovian, Poland': [52.23, 21.01],
  'Lviv, Lviv Oblast, Ukraine': [49.84, 24.03],
  'Beirut, , Lebanon': [33.89, 35.50],
  'Lagos, Lagos State, Nigeria': [6.52, 3.38],
  'Paete, Laguna, Philippines': [14.36, 121.48],
  'Wales, , United Kingdom': [52.13, -3.78],
  'Oregon, Oregon, USA': [44.00, -120.50],
  'Mystic, Connecticut, USA': [41.35, -71.97],
  'Olympia, Washington, USA': [47.04, -122.89],
  'Campeche, , Mexico': [19.84, -90.53],
  'Massachusetts, Massachusetts, USA': [42.41, -71.38],
  'Brookfield, Vermont, USA': [44.04, -72.61],
};

function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

function parseCsvRow(line) {
  const fields = [];
  let i = 0;
  while (i < line.length) {
    let field = '';
    if (line[i] === '"') {
      i++;
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++;
          break;
        } else {
          field += line[i++];
        }
      }
      if (line[i] === ',') i++;
    } else {
      while (i < line.length && line[i] !== ',') {
        field += line[i++];
      }
      if (line[i] === ',') i++;
    }
    fields.push(field);
  }
  return fields;
}

function extractCsv(md) {
  // The clean deduplicated list is the LAST ```csv block in the file.
  const blocks = [...md.matchAll(/```csv\s*\n([\s\S]*?)```/g)];
  if (blocks.length === 0) throw new Error('No CSV block found');
  return blocks[blocks.length - 1][1];
}

function tsString(s) {
  if (s === null || s === undefined) return 'null';
  return JSON.stringify(s);
}

function tsStringArray(arr) {
  if (!arr || arr.length === 0) return '[]';
  return '[' + arr.map((s) => JSON.stringify(s)).join(', ') + ']';
}

const raw = await readFile(SOURCE, 'utf8');
const csv = extractCsv(raw);
const lines = csv.trim().split('\n');
const header = lines[0].split(',').map((s) => s.trim());

const entries = [];
const seenSlugs = new Set();
const missingCoords = new Set();

for (const line of lines.slice(1)) {
  if (!line.trim()) continue;
  const cols = parseCsvRow(line);
  if (cols.length < 16) {
    console.warn('Skipping short row:', line.slice(0, 80));
    continue;
  }
  const [
    name, type, order, city, region, country,
    disciplines, website, email, social,
    notableWorks, training, endorser,
    activeSince, sourceUrl, notes,
  ] = cols;

  let slug = slugify(name);
  let n = 1;
  while (seenSlugs.has(slug)) {
    n++;
    slug = `${slugify(name)}-${n}`;
  }
  seenSlugs.add(slug);

  const key = `${city.trim()}, ${region.trim()}, ${country.trim()}`;
  const coords = CITY_COORDS[key] ?? null;
  if (!coords) missingCoords.add(key);

  const splitMulti = (s) => (s ? s.split(';').map((x) => x.trim()).filter(Boolean) : []);
  const cleanOrNull = (s) => {
    const t = (s ?? '').trim();
    return t === '' ? null : t;
  };

  entries.push({
    id: slug,
    name: name.trim(),
    type: type.trim(),
    order: cleanOrNull(order),
    city: cleanOrNull(city),
    region: cleanOrNull(region),
    country: country.trim(),
    disciplines: splitMulti(disciplines),
    website: cleanOrNull(website),
    email: cleanOrNull(email),
    social: cleanOrNull(social),
    notableWorks: splitMulti(notableWorks),
    training: cleanOrNull(training),
    endorser: cleanOrNull(endorser),
    activeSince: activeSince.trim() ? parseInt(activeSince.trim(), 10) : null,
    sourceUrl: cleanOrNull(sourceUrl),
    notes: cleanOrNull(notes),
    lat: coords ? coords[0] : null,
    lon: coords ? coords[1] : null,
  });
}

const out = `// Generated by scripts/import-discovery.mjs from the Perplexity
// research dump. These are NOT Locavit members — they are publicly-
// researched Catholic sacred artists and religious-order workshops
// surfaced on /directory and /map so commissioners can discover them.
//
// Regenerate: drop a fresh CSV at scripts/.cache/discovery-source.md
// and run \`node scripts/import-discovery.mjs\`.

export interface DirectoryEntry {
  id: string;
  name: string;
  type: 'Individual' | 'Lay atelier' | 'Religious order workshop' | 'Monastery workshop';
  order: string | null;
  city: string | null;
  region: string | null;
  country: string;
  disciplines: string[];
  website: string | null;
  email: string | null;
  social: string | null;
  notableWorks: string[];
  training: string | null;
  endorser: string | null;
  activeSince: number | null;
  sourceUrl: string | null;
  notes: string | null;
  lat: number | null;
  lon: number | null;
}

export const DIRECTORY_ENTRIES: DirectoryEntry[] = ${JSON.stringify(entries, null, 2)};

export const DIRECTORY_COUNT = DIRECTORY_ENTRIES.length;

export const DIRECTORY_COUNTRIES = Array.from(
  new Set(DIRECTORY_ENTRIES.map((e) => e.country)),
).sort();

export const DIRECTORY_DISCIPLINES = Array.from(
  new Set(DIRECTORY_ENTRIES.flatMap((e) => e.disciplines)),
).sort();
`;

await writeFile(OUT, out);

console.log(`✓ Wrote ${entries.length} entries → ${OUT}`);
if (missingCoords.size > 0) {
  console.log(`⚠ ${missingCoords.size} location key(s) missing from CITY_COORDS:`);
  for (const k of missingCoords) console.log('  ' + k);
}
