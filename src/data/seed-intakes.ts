import type { InstitutionalIntake, Proposal } from "../types";

function daysAgoIso(d: number) {
  const t = new Date();
  t.setDate(t.getDate() - d);
  return t.toISOString();
}
function daysFromNow(d: number) {
  const t = new Date();
  t.setDate(t.getDate() + d);
  return t.toISOString().slice(0, 10);
}

// Seed one open intake (the Diocese of Galway is commissioning 14
// stations of the cross for a new parish) so the partnerships page
// has real content for the demo.
export function seedIntakes(): InstitutionalIntake[] {
  return [
    {
      id: "seed_ink_galway_stations",
      kind: "diocese-bulk",
      institutionName: "Diocese of Galway, Kilmacduagh & Kilfenora",
      diocese: "Diocese of Galway, Kilmacduagh & Kilfenora",
      contactName: "Most Rev. Brendan Kelly",
      contactEmail: "chancery@diocesegalway.ie",
      contactRole: "Bishop",
      title: "Fourteen stations of the cross for the new parish of An Spidéal",
      brief:
        "We are completing a new parish church on the Connemara coast and need a full set of Stations of the Cross — fourteen panels, hand-carved or low-relief cast, designed to read across a low-vaulted nave. The Irish-language community at An Spidéal asks for visible local idiom (rope, the cross of bog oak, the muted greens of the Burren). The bishop's vision is severity, not sentimentality. Budget is firm; timing is set for the church's dedication on the Feast of the Assumption.",
      craft: "sculpture",
      budgetTotalUsd: 56000,
      budgetPerWorkUsd: 4000,
      quantity: 14,
      preferredDelivery: daysFromNow(220),
      feastDeadline: {
        feastSlug: "assumption",
        date: daysFromNow(220),
        name: "Assumption of Mary",
      },
      invoicingTerms: "net-30",
      poNumber: "DGAL-2026-0007",
      status: "open",
      approvalChain: [
        { role: "Pastor", name: "Fr. Conn Ó Maoláin", status: "approved", decidedAt: daysAgoIso(12) },
        { role: "Bishop", name: "Most Rev. Brendan Kelly", status: "approved", decidedAt: daysAgoIso(10) },
        { role: "Finance Council", name: "Diocesan Finance Council", status: "approved", decidedAt: daysAgoIso(8) },
        { role: "Architect", name: "Donal Treacy, ARB", status: "pending" },
      ],
      proposalIds: ["seed_prp_donnegan", "seed_prp_subiaco"],
      commissionIds: [],
      createdAt: daysAgoIso(14),
      updatedAt: daysAgoIso(2),
    },
  ];
}

export function seedProposals(): Proposal[] {
  return [
    {
      id: "seed_prp_donnegan",
      intakeId: "seed_ink_galway_stations",
      artistSlug: "felix-donnegan",
      artistName: "Felix Donnegan",
      pricePerWorkUsd: 3800,
      totalPriceUsd: 53200,
      estimatedWeeks: 28,
      pitchBody:
        "Carved from a single felled bog-oak from Inchagoill — the same wood the old parish chest is made from. Low-relief, ~24×18in panels. The figure of Christ in each station emerges from the grain; no painted polychrome. I'll travel to An Spidéal twice during the work for site survey and consultation.",
      paletteFrom: "#8a5028",
      paletteTo: "#3a200a",
      status: "shortlisted",
      submittedAt: daysAgoIso(7),
    },
    {
      id: "seed_prp_subiaco",
      intakeId: "seed_ink_galway_stations",
      artistSlug: "br-andrew-of-subiaco",
      artistName: "Br. Andrew of Subiaco, OSB",
      pricePerWorkUsd: 4000,
      totalPriceUsd: 56000,
      estimatedWeeks: 32,
      pitchBody:
        "I propose bronze low-relief panels with a wax-patina that ages to a green-bronze in the Connemara salt air. Each station 20×16in. I will work with two of our brothers at the Subiaco foundry and travel for installation. Budget meets the per-work cap exactly.",
      paletteFrom: "#5d6f3d",
      paletteTo: "#1f2a11",
      status: "submitted",
      submittedAt: daysAgoIso(4),
    },
  ];
}
