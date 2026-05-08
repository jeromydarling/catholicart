// Static commission metadata for each artwork shown in the hero.
// The Met API and the fetch script provide title/artist/year/image at build
// time; this file holds the part the API can't tell us — who commissioned
// the work, and why that mattered.

export interface HeroWork {
  metId: number;
  patron: string;
  why: string;
}

export const HERO_WORKS: HeroWork[] = [
  {
    metId: 437877,
    patron:
      "A private Catholic patron in the Dutch Republic — likely for a schuilkerk, a hidden Catholic church.",
    why: "Painted for the faithful underground in Protestant Holland.",
  },
  {
    metId: 435638,
    patron:
      "Jeanne de Boubais, abbess of the Cistercian convent of Flines, for her abbey church.",
    why: "An abbess commissioning an altarpiece for the women under her care.",
  },
  {
    metId: 437423,
    patron:
      "King Philip IV of Spain, through the Spanish Ambassador in Rome, for the Royal Chapel.",
    why: "A king commissioning Roman painting for the chapel of his court.",
  },
  {
    metId: 437216,
    patron:
      "Commissioned for Rosary devotion — likely a confraternity or guild of the Rosary.",
    why: "A lay confraternity commissioning teaching art for the faithful.",
  },
  {
    metId: 436455,
    patron:
      "A Sienese household — small panels of this size were commissioned for personal devotion.",
    why: "Personal devotional painting; the household icons of medieval Tuscany.",
  },
  {
    metId: 436572,
    patron:
      "Toledan patrons during El Greco's Spanish period — for private chapels and oratories.",
    why: "Spanish nobility commissioning Greek-trained Mannerist painting for chapel walls.",
  },
];

// Manifest shape produced by scripts/fetch-assets.mjs.
export interface HeroManifest {
  fetchedAt: string;
  works: HeroManifestWork[];
  chant: HeroChant | null;
}
export interface HeroManifestWork {
  metId: number;
  title: string;
  artist: string;
  year: string;
  medium: string;
  dimensions: string;
  creditLine: string;
  patron: string;
  why: string;
  image: string | null;
  metPage: string;
}
export interface HeroChant {
  title: string;
  attribution: string;
  src: string;
}
