import type { Category } from "../types";

export const categories: Category[] = [
  {
    slug: "sacred-painting",
    name: "Sacred Painting",
    shortName: "Painting",
    blurb:
      "Oil, tempera, and fresco — the slow craft of pigment laid over time, in service of the sacred image.",
    glyph: "✣",
    paletteFrom: "#7a1f2c",
    paletteTo: "#42101a",
  },
  {
    slug: "iconography",
    name: "Iconography",
    shortName: "Icons",
    blurb:
      "Egg tempera and gold leaf in the Byzantine canon. Written, not merely painted — windows into heaven.",
    glyph: "☧",
    paletteFrom: "#a8893f",
    paletteTo: "#5e1623",
  },
  {
    slug: "sculpture",
    name: "Sculpture",
    shortName: "Sculpture",
    blurb:
      "Stone, bronze, and wood. Bodies, beasts, and saints rendered in three dimensions for chapel and home.",
    glyph: "†",
    paletteFrom: "#6b5e48",
    paletteTo: "#1c160e",
  },
  {
    slug: "stained-glass-mosaic",
    name: "Stained Glass & Mosaic",
    shortName: "Glass & Mosaic",
    blurb:
      "Light passing through coloured glass; tesserae set into mortar. The architecture of the luminous.",
    glyph: "❖",
    paletteFrom: "#1d3a6b",
    paletteTo: "#142a51",
  },
  {
    slug: "sacred-music",
    name: "Sacred Music",
    shortName: "Music",
    blurb:
      "Mass settings, motets, hymns, and chant. Composed for the liturgy, for the choir, for the household.",
    glyph: "𝄞",
    paletteFrom: "#535835",
    paletteTo: "#1c160e",
  },
  {
    slug: "sacred-poetry",
    name: "Sacred Poetry",
    shortName: "Poetry",
    blurb:
      "Sonnets, litanies, occasional verse. Words chosen with care for births, weddings, funerals, feast days.",
    glyph: "❦",
    paletteFrom: "#7a1f2c",
    paletteTo: "#a8893f",
  },
  {
    slug: "liturgical-drama",
    name: "Liturgical Drama",
    shortName: "Drama",
    blurb:
      "Mystery plays, miracle plays, scripted devotions for parish, school, and stage.",
    glyph: "✜",
    paletteFrom: "#5e1623",
    paletteTo: "#3a3024",
  },
  {
    slug: "image-making",
    name: "Photography & Image-Making",
    shortName: "Photography",
    blurb:
      "Portrait, pilgrimage, liturgy. The patient art of seeing, framed for the wall and the page.",
    glyph: "◉",
    paletteFrom: "#1d3a6b",
    paletteTo: "#3a3024",
  },
];

export function categoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}
