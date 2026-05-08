// Patron-saint registry. Powers patron-saint matching across browse,
// commission scope, and the homepage "saints commissioned this month".

export interface Saint {
  slug: string;
  name: string;             // canonical
  also?: string[];          // alternate names / search aliases
  feastMonth: number;       // 1-12
  feastDay: number;
  patronOf: string[];       // a few short patronages — "expectant mothers", "lost causes", etc.
  blurb: string;             // 1-2 sentences
  paletteFrom: string;
  paletteTo: string;
}

export const saints: Saint[] = [
  {
    slug: "mary",
    name: "Blessed Virgin Mary",
    also: ["Mary", "Theotokos", "Our Lady", "Madonna"],
    feastMonth: 1, feastDay: 1,
    patronOf: ["motherhood", "the Church", "the Americas"],
    blurb: "Mother of God under many titles. Most-depicted of all sacred subjects.",
    paletteFrom: "#3a4d8f", paletteTo: "#15214c",
  },
  {
    slug: "joseph",
    name: "St. Joseph",
    also: ["Joseph the Worker", "Patron of the Universal Church"],
    feastMonth: 3, feastDay: 19,
    patronOf: ["fathers", "workers", "a happy death", "the Universal Church"],
    blurb: "Husband of Mary, foster father of Jesus, model of the silent and faithful man.",
    paletteFrom: "#7a5320", paletteTo: "#3a230a",
  },
  {
    slug: "michael",
    name: "St. Michael the Archangel",
    also: ["Michael", "Archangel"],
    feastMonth: 9, feastDay: 29,
    patronOf: ["soldiers", "police", "those in spiritual combat"],
    blurb: "The captain of the heavenly host. Defender against the powers of darkness.",
    paletteFrom: "#7e1414", paletteTo: "#2c0606",
  },
  {
    slug: "patrick",
    name: "St. Patrick of Ireland",
    also: ["Patrick"],
    feastMonth: 3, feastDay: 17,
    patronOf: ["Ireland", "engineers", "exiles"],
    blurb: "Bishop, missionary, slave-turned-evangelist who brought the Gospel to Ireland.",
    paletteFrom: "#3f6c44", paletteTo: "#1a2e1d",
  },
  {
    slug: "francis",
    name: "St. Francis of Assisi",
    also: ["Francis"],
    feastMonth: 10, feastDay: 4,
    patronOf: ["the poor", "ecology", "Italy", "animals"],
    blurb: "Stigmatic, founder of the Friars Minor. Preached to the birds; rebuilt the Church.",
    paletteFrom: "#a07943", paletteTo: "#4a3517",
  },
  {
    slug: "therese",
    name: "St. Thérèse of Lisieux",
    also: ["Thérèse", "Therese", "Little Flower"],
    feastMonth: 10, feastDay: 1,
    patronOf: ["missions", "the sick", "the small"],
    blurb: "Doctor of the Church. The Little Way: ordinary love as the path to holiness.",
    paletteFrom: "#c87f8c", paletteTo: "#5a2f3a",
  },
  {
    slug: "augustine",
    name: "St. Augustine of Hippo",
    also: ["Augustine"],
    feastMonth: 8, feastDay: 28,
    patronOf: ["theologians", "converts", "those with restless hearts"],
    blurb: "Bishop, Doctor of the Church, author of the Confessions. \"Late have I loved Thee.\"",
    paletteFrom: "#7d3a3a", paletteTo: "#2e1212",
  },
  {
    slug: "thomas-aquinas",
    name: "St. Thomas Aquinas",
    also: ["Aquinas", "the Angelic Doctor"],
    feastMonth: 1, feastDay: 28,
    patronOf: ["students", "universities", "philosophers"],
    blurb: "Dominican friar and Doctor of the Church. Wedded reason to revelation.",
    paletteFrom: "#3a3f6e", paletteTo: "#13162e",
  },
  {
    slug: "jpii",
    name: "St. John Paul II",
    also: ["John Paul II", "Karol Wojtyła"],
    feastMonth: 10, feastDay: 22,
    patronOf: ["families", "the youth", "World Youth Day"],
    blurb: "The Polish Pope. Author of the Letter to Artists.",
    paletteFrom: "#c79b3b", paletteTo: "#5e3e0e",
  },
  {
    slug: "faustina",
    name: "St. Faustina Kowalska",
    also: ["Faustina", "Sr. Faustina"],
    feastMonth: 10, feastDay: 5,
    patronOf: ["mercy", "the dying"],
    blurb: "The secretary of Divine Mercy. Saw Jesus and recorded his words for our age.",
    paletteFrom: "#e8e9ed", paletteTo: "#9caac4",
  },
  {
    slug: "john-vianney",
    name: "St. John Vianney",
    also: ["Vianney", "Curé d'Ars", "Cure of Ars"],
    feastMonth: 8, feastDay: 4,
    patronOf: ["parish priests"],
    blurb: "The Curé of Ars. Patron of parish priests; lived in the confessional.",
    paletteFrom: "#3a3a3a", paletteTo: "#0d0d0d",
  },
  {
    slug: "padre-pio",
    name: "St. Padre Pio",
    also: ["Padre Pio", "Pio of Pietrelcina"],
    feastMonth: 9, feastDay: 23,
    patronOf: ["civil defense", "stress relief", "adolescents"],
    blurb: "Capuchin friar, stigmatic, confessor of nations.",
    paletteFrom: "#5a4636", paletteTo: "#231914",
  },
  {
    slug: "kolbe",
    name: "St. Maximilian Kolbe",
    also: ["Kolbe", "Maximilian"],
    feastMonth: 8, feastDay: 14,
    patronOf: ["prisoners", "journalists", "pro-life movement"],
    blurb: "Polish Conventual Franciscan. Died in place of another at Auschwitz.",
    paletteFrom: "#3e3a52", paletteTo: "#15101e",
  },
  {
    slug: "anthony",
    name: "St. Anthony of Padua",
    also: ["Anthony", "Padua"],
    feastMonth: 6, feastDay: 13,
    patronOf: ["lost things", "the poor", "Portugal"],
    blurb: "Doctor of the Church. Hammer of heretics; herald of the lost.",
    paletteFrom: "#7c5a32", paletteTo: "#33240f",
  },
  {
    slug: "cecilia",
    name: "St. Cecilia",
    also: ["Cecilia"],
    feastMonth: 11, feastDay: 22,
    patronOf: ["music", "musicians", "composers"],
    blurb: "Roman virgin and martyr. Patroness of sacred music.",
    paletteFrom: "#a3506b", paletteTo: "#3e1a26",
  },
  {
    slug: "catherine-siena",
    name: "St. Catherine of Siena",
    also: ["Catherine", "Siena"],
    feastMonth: 4, feastDay: 29,
    patronOf: ["Europe", "nurses", "those struggling with their faith"],
    blurb: "Mystic, Doctor of the Church, who told popes the truth.",
    paletteFrom: "#5b3a72", paletteTo: "#1f1131",
  },
  {
    slug: "bernadette",
    name: "St. Bernadette of Lourdes",
    also: ["Bernadette", "Lourdes"],
    feastMonth: 4, feastDay: 16,
    patronOf: ["the sick", "the poor", "those mocked for piety"],
    blurb: "Visionary of Lourdes. \"I am the Immaculate Conception.\"",
    paletteFrom: "#9aaad3", paletteTo: "#39456b",
  },
  {
    slug: "john-baptist",
    name: "St. John the Baptist",
    also: ["John the Baptist", "Forerunner"],
    feastMonth: 6, feastDay: 24,
    patronOf: ["preachers", "tailors", "converts"],
    blurb: "Forerunner of the Lord. \"He must increase; I must decrease.\"",
    paletteFrom: "#7a4f1f", paletteTo: "#2e1c0a",
  },
  {
    slug: "peter-paul",
    name: "Sts. Peter & Paul",
    also: ["Peter", "Paul", "Peter and Paul"],
    feastMonth: 6, feastDay: 29,
    patronOf: ["the Universal Church", "Rome", "missionaries"],
    blurb: "The two pillars of the Apostolic Church.",
    paletteFrom: "#a8721e", paletteTo: "#3f2a0a",
  },
  {
    slug: "guadalupe",
    name: "Our Lady of Guadalupe",
    also: ["Guadalupe", "Tepeyac"],
    feastMonth: 12, feastDay: 12,
    patronOf: ["the Americas", "the unborn"],
    blurb: "The Mestiza Virgin who appeared at Tepeyac in 1531. Mother of the New World.",
    paletteFrom: "#2e6b6b", paletteTo: "#0e2929",
  },
];

export function findSaint(query: string): Saint | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return saints.find((s) => {
    if (s.name.toLowerCase().includes(q)) return true;
    if (s.slug === q) return true;
    return (s.also ?? []).some((a) => a.toLowerCase().includes(q));
  });
}

export function searchSaints(query: string): Saint[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return saints.filter((s) => {
    if (s.name.toLowerCase().includes(q)) return true;
    if (s.slug.includes(q)) return true;
    return (s.also ?? []).some((a) => a.toLowerCase().includes(q));
  });
}

export function saintBySlug(slug: string): Saint | undefined {
  return saints.find((s) => s.slug === slug);
}
