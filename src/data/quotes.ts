import type { Quote } from "../types";

// Quotes drawn from John Paul II's Letter to Artists (1999) and other sources.
// Where wording is paraphrased rather than verbatim, the citation is general.
// Verify exact wording against the Vatican document before publishing.
export const quotes: Quote[] = [
  {
    text:
      "To all who are passionately dedicated to the search for new “epiphanies” of beauty so that through their creative work as artists they may offer these as gifts to the world.",
    attribution: "John Paul II",
    citation: "Letter to Artists, salutation (1999)",
  },
  {
    text:
      "The divine Artist passes on a spark of his own surpassing wisdom to the human artist, calling him to share in his creative power.",
    attribution: "John Paul II",
    citation: "Letter to Artists, §1 (paraphrased)",
  },
  {
    text:
      "Not all are called to be artists in the specific sense of the term. Yet, as Genesis has it, all men and women are entrusted with the task of crafting their own life.",
    attribution: "John Paul II",
    citation: "Letter to Artists, §2",
  },
  {
    text:
      "Beauty is the visible form of the good, just as the good is the metaphysical condition of beauty.",
    attribution: "John Paul II",
    citation: "Letter to Artists, §3",
  },
  {
    text:
      "Every genuine artistic intuition goes beyond what the senses perceive and, reaching beneath reality’s surface, strives to interpret its hidden mystery.",
    attribution: "John Paul II",
    citation: "Letter to Artists, §6",
  },
  {
    text:
      "The Church has need of art. Art must make perceptible, and as far as possible attractive, the world of the spirit, of the invisible, of God.",
    attribution: "John Paul II",
    citation: "Letter to Artists, §12",
  },
  {
    text:
      "May your art help to affirm that true beauty which, as a glimmer of the Spirit of God, will transfigure matter, opening the human soul to the sense of the eternal.",
    attribution: "John Paul II",
    citation: "Letter to Artists, §16",
  },
  {
    text:
      "Artists of the world, may your many different paths all lead to that infinite Ocean of beauty where wonder becomes awe, exhilaration, unspeakable joy.",
    attribution: "John Paul II",
    citation: "Letter to Artists, conclusion",
  },
  {
    text:
      "Through his work man not only transforms nature, adapting it to his own needs, but he also achieves fulfilment as a human being and indeed, in a sense, becomes “more a human being.”",
    attribution: "John Paul II",
    citation: "Laborem Exercens, §9 (1981)",
  },
  {
    text: "The world will be saved by beauty.",
    attribution: "Fyodor Dostoevsky",
    citation: "The Idiot",
  },
];

export const heroQuote = quotes[0];
export const closingQuote = quotes[7];
