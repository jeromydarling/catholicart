import type { Review } from "../types";

function daysAgoIso(d: number) {
  const t = new Date();
  t.setDate(t.getDate() - d);
  return t.toISOString();
}

// Seed reviews so the artist track record has content out of the gate.
// One delivered commission (the cherry crucifix) seeded with a 5-star
// patron review + artist reply.
export function seedReviews(): Review[] {
  return [
    {
      id: "seed_rev_crucifix",
      commissionId: "seed_cmn_crucifix",
      artistSlug: "felix-donnegan",
      patronName: "St. Bartholomew Anglican Use Parish",
      rating: 5,
      body:
        "The cherry took the wounds in its grain. Felix never sentimentalized the body. We processed it through the parish on the first Sunday of Lent and the church went quiet. The work is what we asked for and more. We will commission again.",
      createdAt: daysAgoIso(18),
      artistReply: {
        body:
          "Thank you, Father. The cherry came from a tree felled in Galway after a storm — the patience was the tree's, not mine.",
        createdAt: daysAgoIso(17),
      },
    },
  ];
}
