// Liturgical calendar — Roman Rite, ordinary form. Movable feasts are
// computed from Easter via the Anonymous Gregorian algorithm. The shape is
// intentionally minimal: enough to drive a homepage banner, a feast-day
// deadline picker, and "this feast is N days away" messaging.

export type Season =
  | "advent"
  | "christmas"
  | "ordinary-1"   // After Christmas, before Lent
  | "lent"
  | "triduum"
  | "easter"
  | "ordinary-2"   // After Pentecost, before Advent
  | "christ-the-king";

export interface SeasonInfo {
  key: Season;
  name: string;
  shortName: string;
  color: "violet" | "white" | "green" | "red" | "rose";
  blurb: string;
  paletteFrom: string;
  paletteTo: string;
}

export const SEASONS: Record<Season, SeasonInfo> = {
  advent: {
    key: "advent",
    name: "Advent",
    shortName: "Advent",
    color: "violet",
    blurb: "We wait for the Word made flesh.",
    paletteFrom: "#4a3a72",
    paletteTo: "#1d1230",
  },
  christmas: {
    key: "christmas",
    name: "Christmas",
    shortName: "Christmas",
    color: "white",
    blurb: "The Word has been made flesh.",
    paletteFrom: "#f1d997",
    paletteTo: "#a87425",
  },
  "ordinary-1": {
    key: "ordinary-1",
    name: "Ordinary Time",
    shortName: "Ordinary",
    color: "green",
    blurb: "The slow growth of the kingdom.",
    paletteFrom: "#5d6f3d",
    paletteTo: "#2c3a17",
  },
  lent: {
    key: "lent",
    name: "Lent",
    shortName: "Lent",
    color: "violet",
    blurb: "Forty days in the desert.",
    paletteFrom: "#553c5e",
    paletteTo: "#2a1c30",
  },
  triduum: {
    key: "triduum",
    name: "Sacred Triduum",
    shortName: "Triduum",
    color: "red",
    blurb: "Three days at the heart of the year.",
    paletteFrom: "#6c1b1b",
    paletteTo: "#2c0808",
  },
  easter: {
    key: "easter",
    name: "Easter",
    shortName: "Easter",
    color: "white",
    blurb: "He is risen, as he said.",
    paletteFrom: "#f4e3a3",
    paletteTo: "#9a6f1a",
  },
  "ordinary-2": {
    key: "ordinary-2",
    name: "Ordinary Time",
    shortName: "Ordinary",
    color: "green",
    blurb: "Walking with the Spirit.",
    paletteFrom: "#5d6f3d",
    paletteTo: "#2c3a17",
  },
  "christ-the-king": {
    key: "christ-the-king",
    name: "Christ the King",
    shortName: "Christ the King",
    color: "white",
    blurb: "All things gathered in him.",
    paletteFrom: "#c79b3b",
    paletteTo: "#5e3e0e",
  },
};

// ── Computus (Easter date for a given Gregorian year) ─────────────
export function easterFor(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function nextSunday(after: Date): Date {
  const d = new Date(after);
  const day = d.getDay(); // 0 = Sunday
  const offset = day === 0 ? 7 : 7 - day;
  return addDays(d, offset);
}

// First Sunday of Advent: the Sunday closest to Nov 30 (Andrew the Apostle).
function adventFirstSunday(year: number): Date {
  const andrew = new Date(year, 10, 30); // Nov 30
  const day = andrew.getDay();
  // If Nov 30 is Sunday, that IS the first Sunday of Advent
  if (day === 0) return andrew;
  // Otherwise the Sunday closest: shift forward or back ≤3 days
  const forward = addDays(andrew, (7 - day) % 7);
  const back = addDays(andrew, -day);
  const dForward = forward.getTime() - andrew.getTime();
  const dBack = andrew.getTime() - back.getTime();
  return dForward <= dBack ? forward : back;
}

export interface Feast {
  slug: string;
  name: string;
  date: Date;
  // For grouping in UI
  rank: "solemnity" | "feast" | "memorial";
  // Optional patron saint linkage (slug into saints registry)
  saintSlug?: string;
}

export function feastsForLiturgicalYear(date: Date): Feast[] {
  // Liturgical year that CONTAINS `date` runs from Advent of (date.year - δ) to Christ the King.
  // To make the picker useful we return next 18 months of feasts from `date`.
  const startYear = date.getFullYear();
  const out: Feast[] = [];

  for (const yr of [startYear, startYear + 1]) {
    const easter = easterFor(yr);
    out.push(
      { slug: "ash-wednesday", name: "Ash Wednesday", date: addDays(easter, -46), rank: "feast" },
      { slug: "palm-sunday", name: "Palm Sunday", date: addDays(easter, -7), rank: "solemnity" },
      { slug: "holy-thursday", name: "Holy Thursday", date: addDays(easter, -3), rank: "solemnity" },
      { slug: "good-friday", name: "Good Friday", date: addDays(easter, -2), rank: "solemnity" },
      { slug: "easter", name: "Easter Sunday", date: easter, rank: "solemnity" },
      { slug: "divine-mercy", name: "Divine Mercy Sunday", date: addDays(easter, 7), rank: "feast", saintSlug: "faustina" },
      { slug: "ascension", name: "Ascension of the Lord", date: addDays(easter, 39), rank: "solemnity" },
      { slug: "pentecost", name: "Pentecost", date: addDays(easter, 49), rank: "solemnity" },
      { slug: "trinity", name: "Holy Trinity", date: addDays(easter, 56), rank: "solemnity" },
      { slug: "corpus-christi", name: "Corpus Christi", date: addDays(easter, 60), rank: "solemnity" },
      { slug: "sacred-heart", name: "Sacred Heart of Jesus", date: addDays(easter, 68), rank: "solemnity" },
      // Fixed feasts
      { slug: "epiphany", name: "Epiphany of the Lord", date: new Date(yr, 0, 6), rank: "solemnity" },
      { slug: "presentation", name: "Presentation of the Lord", date: new Date(yr, 1, 2), rank: "feast" },
      { slug: "annunciation", name: "Annunciation", date: new Date(yr, 2, 25), rank: "solemnity", saintSlug: "mary" },
      { slug: "joseph", name: "St. Joseph", date: new Date(yr, 2, 19), rank: "solemnity", saintSlug: "joseph" },
      { slug: "patrick", name: "St. Patrick", date: new Date(yr, 2, 17), rank: "memorial", saintSlug: "patrick" },
      { slug: "john-baptist", name: "Nativity of John the Baptist", date: new Date(yr, 5, 24), rank: "solemnity", saintSlug: "john-baptist" },
      { slug: "peter-paul", name: "Sts. Peter & Paul", date: new Date(yr, 5, 29), rank: "solemnity", saintSlug: "peter-paul" },
      { slug: "transfiguration", name: "Transfiguration", date: new Date(yr, 7, 6), rank: "feast" },
      { slug: "assumption", name: "Assumption of Mary", date: new Date(yr, 7, 15), rank: "solemnity", saintSlug: "mary" },
      { slug: "michael-archangels", name: "Sts. Michael, Gabriel, Raphael", date: new Date(yr, 8, 29), rank: "feast", saintSlug: "michael" },
      { slug: "therese", name: "St. Thérèse of Lisieux", date: new Date(yr, 9, 1), rank: "memorial", saintSlug: "therese" },
      { slug: "francis", name: "St. Francis of Assisi", date: new Date(yr, 9, 4), rank: "memorial", saintSlug: "francis" },
      { slug: "all-saints", name: "All Saints", date: new Date(yr, 10, 1), rank: "solemnity" },
      { slug: "all-souls", name: "All Souls", date: new Date(yr, 10, 2), rank: "feast" },
      { slug: "christ-the-king", name: "Christ the King", date: lastSundayBefore(adventFirstSunday(yr)), rank: "solemnity" },
      { slug: "advent-1", name: "First Sunday of Advent", date: adventFirstSunday(yr), rank: "solemnity" },
      { slug: "immaculate-conception", name: "Immaculate Conception", date: new Date(yr, 11, 8), rank: "solemnity", saintSlug: "mary" },
      { slug: "guadalupe", name: "Our Lady of Guadalupe", date: new Date(yr, 11, 12), rank: "feast", saintSlug: "mary" },
      { slug: "christmas", name: "Christmas", date: new Date(yr, 11, 25), rank: "solemnity" },
    );
  }

  // Filter to upcoming + sort
  return out
    .filter((f) => f.date.getTime() >= startOfDay(date).getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function lastSundayBefore(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - 7);
  // step back to Sunday
  while (r.getDay() !== 0) r.setDate(r.getDate() - 1);
  return r;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function currentSeason(date: Date = new Date()): SeasonInfo {
  const yr = date.getFullYear();
  const easter = easterFor(yr);
  const ashWed = addDays(easter, -46);
  const holyThursday = addDays(easter, -3);
  const easterEnd = addDays(easter, 49); // through Pentecost inclusive
  const adventThis = adventFirstSunday(yr);
  const adventLast = adventFirstSunday(yr - 1);
  const christmasEnd = new Date(yr, 0, 13); // Baptism of the Lord ~ Jan ~13 (approximate)

  const t = startOfDay(date).getTime();

  // Christmas season (handles year wrap): from Dec 25 of prev year through Baptism of the Lord
  const lastChristmas = new Date(yr - 1, 11, 25);
  if (t >= startOfDay(lastChristmas).getTime() && t <= startOfDay(christmasEnd).getTime()) {
    return SEASONS.christmas;
  }

  if (t >= startOfDay(adventThis).getTime() && t < new Date(yr, 11, 25).getTime()) {
    return SEASONS.advent;
  }

  // After Christ the King through start of Advent: still ordinary-2 essentially (rare)
  if (t >= startOfDay(adventLast).getTime() && t < startOfDay(lastChristmas).getTime()) {
    return SEASONS.advent;
  }

  if (t >= startOfDay(ashWed).getTime() && t < startOfDay(holyThursday).getTime()) {
    return SEASONS.lent;
  }

  if (t >= startOfDay(holyThursday).getTime() && t < startOfDay(easter).getTime()) {
    return SEASONS.triduum;
  }

  if (t >= startOfDay(easter).getTime() && t <= startOfDay(easterEnd).getTime()) {
    return SEASONS.easter;
  }

  // Ordinary time: before Lent or after Easter
  if (t < startOfDay(ashWed).getTime()) return SEASONS["ordinary-1"];
  return SEASONS["ordinary-2"];
}

export function daysUntil(d: Date, from: Date = new Date()): number {
  const ms = startOfDay(d).getTime() - startOfDay(from).getTime();
  return Math.round(ms / 86_400_000);
}
