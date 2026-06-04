import type {
  Commission,
  CommissionMessage,
  EscrowMilestone,
  EscrowStatus,
  WipUpdate,
} from "../types";
import { computePricing } from "../lib/pricing";

// Two seeded commissions covering the lifecycle states the workspace
// needs to render. They give the artist dashboard, public ledger, and
// WIP timeline real content on first load.

function msg(
  authorRole: CommissionMessage["authorRole"],
  authorName: string,
  body: string,
  daysAgo: number,
): CommissionMessage {
  return {
    id: `seed_msg_${authorRole}_${daysAgo}_${authorName.replace(/\s/g, "")}`,
    authorRole,
    authorName,
    body,
    createdAt: daysAgoIso(daysAgo),
  };
}

function wip(
  caption: string,
  paletteFrom: string,
  paletteTo: string,
  daysAgo: number,
  pattern?: WipUpdate["pattern"],
): WipUpdate {
  return {
    id: `seed_wip_${daysAgo}_${caption.slice(0, 6).replace(/\s/g, "")}`,
    caption,
    paletteFrom,
    paletteTo,
    pattern,
    postedAt: daysAgoIso(daysAgo),
  };
}

function daysAgoIso(d: number) {
  const t = new Date();
  t.setDate(t.getDate() - d);
  return t.toISOString();
}

function withEscrow(
  artistTotal: number,
  states: [EscrowStatus, EscrowStatus, EscrowStatus],
  daysAgo: [number, number, number],
): EscrowMilestone[] {
  const p = computePricing(artistTotal);
  return p.escrow.map((m, i) => ({
    ...m,
    status: states[i],
    fundedAt: states[i] !== "unfunded" ? daysAgoIso(daysAgo[i]) : undefined,
    releasedAt: states[i] === "released" ? daysAgoIso(Math.max(0, daysAgo[i] - 1)) : undefined,
  }));
}

export function seedCommissions(): Commission[] {
  // ── 1. In-progress: deposit funded, midpoint awaited ────────────────
  const c1Pricing = computePricing(2400);
  const c1: Commission = {
    id: "seed_cmn_immaculata",
    artistSlug: "annunciata-park",
    patronName: "Mary Beauchamp",
    patronEmail: "mary.b@stmichaels-pgh.org",
    category: "iconography",
    setting: "Domestic chapel or oratory",
    scope:
      "An icon of Our Lady of Guadalupe for our family's home oratory. Roughly 18×24in, gilded halo. We pray a daily rosary as a family — this is for our 25th wedding anniversary in May.",
    artistQuoteNote:
      "Thank you for this. I'd write her in egg tempera with 23kt gold leaf for the halo and stars. Mounted on poplar. I propose 18×24in as you suggest. Six weeks of work, beginning after the deposit clears. — Annunciata",
    artistTotalUsd: c1Pricing.artistTotalUsd,
    platformFeePct: c1Pricing.platformFeePct,
    platformFeeUsd: c1Pricing.platformFeeUsd,
    totalDueUsd: c1Pricing.totalDueUsd,
    preferredDeadline: "2026-05-15",
    parishOrChapel: "Family oratory · Pittsburgh, PA",
    diocese: "Diocese of Pittsburgh",
    stage: "in-progress",
    escrow: withEscrow(2400, ["released", "held", "unfunded"], [21, 7, 0]),
    messages: [
      msg("system", "Ars Sacra", "Mary Beauchamp sent a request.", 30),
      msg("patron", "Mary Beauchamp",
        "An icon of Our Lady of Guadalupe for our family's home oratory. ~18×24in, gilded halo. For our 25th anniversary in May.", 30),
      msg("artist", "Annunciata Park",
        "Thank you for this. I'd write her in egg tempera with 23kt gold leaf. Six weeks. — Annunciata", 28),
      msg("system", "Ars Sacra", "Artist quoted $2,400. Three milestones funded as work progresses.", 28),
      msg("system", "Ars Sacra", "Mary Beauchamp funded the deposit milestone. Funds held in escrow.", 22),
      msg("artist", "Annunciata Park",
        "The poplar panel is gessoed and rubbed smooth. Beginning the underdrawing tomorrow.", 18),
      msg("system", "Ars Sacra", "Mary Beauchamp released the deposit milestone to the artist.", 21),
      msg("artist", "Annunciata Park",
        "Underdrawing complete. Starting the gold leaf for the mantle stars.", 12),
      msg("artist", "Annunciata Park",
        "Halo and mantle stars laid. Beginning the face — the most patient part.", 7),
    ],
    wip: [
      wip("Poplar panel, gessoed and sanded", "#f5e6c8", "#e3c98c", 18, "frame"),
      wip("Underdrawing — proportions of the Theotokos", "#d8c39a", "#a98859", 12, "vesica"),
      wip("Gold leaf laid for the mantle and halo", "#f6d27a", "#b78521", 7, "halo"),
    ],
    createdAt: daysAgoIso(30),
  };

  // ── 2. Awaiting deposit: artist quoted, patron hasn't funded ────────
  const c2Pricing = computePricing(950);
  const c2: Commission = {
    id: "seed_cmn_st_joseph",
    artistSlug: "tobias-wren",
    patronName: "Fr. James Aldworth",
    patronEmail: "frjames@stcecilias.org",
    category: "sacred-painting",
    setting: "Parish or chapel",
    scope:
      "A modest oil panel of St. Joseph the Worker for our parish vestibule. Around 16×20in. We have very little budget, but we want it to last a hundred years.",
    artistQuoteNote:
      "Father, thank you. I'll paint him at the workbench, plane in hand, on linen-mounted panel. Linseed oil, lead-tin yellow, lapis. ~$950 covers materials and three weeks of my time. — Tobias",
    artistTotalUsd: c2Pricing.artistTotalUsd,
    platformFeePct: c2Pricing.platformFeePct,
    platformFeeUsd: c2Pricing.platformFeeUsd,
    totalDueUsd: c2Pricing.totalDueUsd,
    preferredDeadline: "2026-05-01",
    parishOrChapel: "St. Cecilia's, Cleveland OH",
    diocese: "Diocese of Cleveland",
    stage: "awaiting-deposit",
    escrow: withEscrow(950, ["unfunded", "unfunded", "unfunded"], [0, 0, 0]),
    messages: [
      msg("system", "Ars Sacra", "Fr. James Aldworth sent a request.", 4),
      msg("patron", "Fr. James Aldworth",
        "A modest oil panel of St. Joseph the Worker for our parish vestibule, ~16×20in. Limited budget but we want it to last.", 4),
      msg("artist", "Tobias Wren",
        "Father, thank you. I'll paint him at the workbench. Linen-mounted panel, linseed oil, lead-tin yellow, lapis. ~$950. — Tobias", 2),
      msg("system", "Ars Sacra", "Artist quoted $950. Three milestones funded as work progresses.", 2),
    ],
    wip: [],
    createdAt: daysAgoIso(4),
  };

  // ── 3. Delivered: completed last month ──────────────────────────────
  const c3Pricing = computePricing(1800);
  const c3: Commission = {
    id: "seed_cmn_crucifix",
    artistSlug: "felix-donnegan",
    patronName: "St. Bartholomew Anglican Use Parish",
    patronEmail: "rector@stbartholomew-aus.org",
    category: "sculpture",
    setting: "Parish or chapel",
    scope:
      "A processional crucifix in cherry, ~36in corpus, for our Lenten and Holy Week processions. The corpus should be sober, not sentimental.",
    artistQuoteNote:
      "I will carve the corpus from a single cherry block. The grain will run with the body. Three months of work. $1,800 covers wood, finishing, and labor. — Felix",
    artistTotalUsd: c3Pricing.artistTotalUsd,
    platformFeePct: c3Pricing.platformFeePct,
    platformFeeUsd: c3Pricing.platformFeeUsd,
    totalDueUsd: c3Pricing.totalDueUsd,
    // Set deadline a few weeks after completedAt so on-time = true
    preferredDeadline: new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10),
    parishOrChapel: "St. Bartholomew, Charleston SC",
    stage: "delivered",
    escrow: withEscrow(1800, ["released", "released", "released"], [120, 60, 30]),
    messages: [
      msg("system", "Ars Sacra", "St. Bartholomew sent a request.", 130),
      msg("patron", "Rector, St. Bartholomew",
        "A processional crucifix in cherry, ~36in corpus, for our Lenten processions. Sober, not sentimental.", 130),
      msg("artist", "Felix Donnegan",
        "I'll carve the corpus from a single cherry block. Three months of work. $1,800. — Felix", 128),
      msg("system", "Ars Sacra", "Artist quoted $1,800. Three milestones funded as work progresses.", 128),
      msg("system", "Ars Sacra", "Rector funded the deposit. Funds held in escrow.", 121),
      msg("system", "Ars Sacra", "Rector released the deposit milestone to the artist.", 120),
      msg("artist", "Felix Donnegan", "Block selected, dimensioning begins.", 110),
      msg("artist", "Felix Donnegan", "Roughed out. The body is taking shape.", 90),
      msg("artist", "Felix Donnegan", "Midpoint — the head and ribs are finished.", 65),
      msg("system", "Ars Sacra", "Rector released the midpoint milestone to the artist.", 60),
      msg("artist", "Felix Donnegan", "Final pass on the wounds and feet. Linseed oil rub.", 35),
      msg("system", "Ars Sacra", "Rector released the final payment. Commission delivered.", 30),
    ],
    wip: [
      wip("Cherry block, sourced from a single tree", "#c98e5a", "#7a4a23", 110, "cross"),
      wip("Roughed-out body — the cross emerges", "#b27840", "#5e3712", 90, "cross"),
      wip("Head and ribs, midpoint", "#a06632", "#4a2a0d", 65, "cross"),
      wip("Final — wounds and feet, oiled", "#8a5028", "#3a200a", 35, "cross"),
    ],
    blessing: {
      recordedAt: daysAgoIso(20),
      recordedBy: "Fr. Augustine Brooks",
      parishOrChapel: "St. Bartholomew, Charleston SC",
      note: "Processed through the parish on the First Sunday of Lent.",
    },
    certificate: {
      issuedAt: daysAgoIso(30),
      serial: "AS-2026-CRUX01",
      title: "Processional Crucifix in Cherry",
    },
    createdAt: daysAgoIso(130),
    completedAt: daysAgoIso(30),
  };

  return [c2, c1, c3];
}
