// Seed endorsements for the 12 mock artists. In production these come
// from a database — here they're keyed by artist slug and merged into
// the artists array at module load. Tokens are stable strings so the
// /verify/:token and /chancery/:token routes work for demos.
//
// Status mix is intentional, to demonstrate every state on the live site:
//   8 fully endorsed (institutional email path)
//   1 endorsed + chancery confirmed (the full free-webmail success path)
//   2 endorsed-chancery-pending (free-webmail, chancery still pending)
//   1 pending (application just submitted)

import type { Verification } from "../types";

function endorsed(opts: {
  slug: string;
  role?: Verification["role"];
  verifierName: string;
  verifierEmail: string;
  parishOrCommunity: string;
  parishWebsite?: string;
  endorsedDaysAgo: number;
}): Verification {
  const now = Date.now();
  const created = new Date(now - opts.endorsedDaysAgo * 86400000 - 6 * 86400000)
    .toISOString();
  const endorsed = new Date(now - opts.endorsedDaysAgo * 86400000).toISOString();
  const expires = new Date(
    now - opts.endorsedDaysAgo * 86400000 + 365 * 86400000,
  ).toISOString();
  return {
    token: `seed_${opts.slug}_v1`,
    status: "endorsed",
    role: opts.role ?? "pastor",
    verifierName: opts.verifierName,
    verifierEmail: opts.verifierEmail,
    verifierEmailIsFreeWebmail: false,
    parishOrCommunity: opts.parishOrCommunity,
    parishWebsite: opts.parishWebsite,
    createdAt: created,
    endorsedAt: endorsed,
    expiresAt: expires,
  };
}

function chanceryConfirmed(opts: {
  slug: string;
  role?: Verification["role"];
  verifierName: string;
  verifierEmail: string;
  parishOrCommunity: string;
  parishWebsite?: string;
  diocese: string;
  chanceryEmail: string;
}): Verification {
  const now = Date.now();
  const created = new Date(now - 90 * 86400000).toISOString();
  const endorsed = new Date(now - 80 * 86400000).toISOString();
  const chancery = new Date(now - 73 * 86400000).toISOString();
  const expires = new Date(now - 73 * 86400000 + 365 * 86400000).toISOString();
  return {
    token: `seed_${opts.slug}_v1`,
    chanceryToken: `seed_${opts.slug}_c1`,
    status: "chancery-confirmed",
    role: opts.role ?? "pastor",
    verifierName: opts.verifierName,
    verifierEmail: opts.verifierEmail,
    verifierEmailIsFreeWebmail: true,
    parishOrCommunity: opts.parishOrCommunity,
    parishWebsite: opts.parishWebsite,
    diocese: opts.diocese,
    chanceryEmail: opts.chanceryEmail,
    createdAt: created,
    endorsedAt: endorsed,
    chanceryConfirmedAt: chancery,
    expiresAt: expires,
  };
}

function chanceryPending(opts: {
  slug: string;
  role?: Verification["role"];
  verifierName: string;
  verifierEmail: string;
  parishOrCommunity: string;
  diocese: string;
  chanceryEmail: string;
}): Verification {
  const now = Date.now();
  const created = new Date(now - 8 * 86400000).toISOString();
  const endorsed = new Date(now - 4 * 86400000).toISOString();
  return {
    token: `seed_${opts.slug}_v1`,
    chanceryToken: `seed_${opts.slug}_c1`,
    status: "endorsed-chancery-pending",
    role: opts.role ?? "pastor",
    verifierName: opts.verifierName,
    verifierEmail: opts.verifierEmail,
    verifierEmailIsFreeWebmail: true,
    parishOrCommunity: opts.parishOrCommunity,
    diocese: opts.diocese,
    chanceryEmail: opts.chanceryEmail,
    createdAt: created,
    endorsedAt: endorsed,
  };
}

function pending(opts: {
  slug: string;
  role?: Verification["role"];
  verifierName: string;
  verifierEmail: string;
  parishOrCommunity: string;
}): Verification {
  return {
    token: `seed_${opts.slug}_v1`,
    status: "pending",
    role: opts.role ?? "pastor",
    verifierName: opts.verifierName,
    verifierEmail: opts.verifierEmail,
    verifierEmailIsFreeWebmail: false,
    parishOrCommunity: opts.parishOrCommunity,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  };
}

export const SEED_VERIFICATIONS: Record<string, Verification> = {
  "maria-chrysostom": endorsed({
    slug: "maria-chrysostom",
    verifierName: "Fr. Mark Stanley",
    verifierEmail: "fr.stanley@holytrinity-pittsburgh.org",
    parishOrCommunity: "Holy Trinity Catholic Church, Pittsburgh PA",
    parishWebsite: "https://holytrinity-pittsburgh.org",
    endorsedDaysAgo: 95,
  }),
  "br-andrew-of-subiaco": endorsed({
    slug: "br-andrew-of-subiaco",
    role: "religious-superior",
    verifierName: "Abbot Mauro Meacci, OSB",
    verifierEmail: "abate@subiacocas.org",
    parishOrCommunity: "Sacro Speco di Subiaco, Italy",
    parishWebsite: "https://benedettini-subiaco.org",
    endorsedDaysAgo: 220,
  }),
  "giovanna-solis": endorsed({
    slug: "giovanna-solis",
    verifierName: "Padre Manuel Ortega",
    verifierEmail: "p.ortega@catedralasuncion.mx",
    parishOrCommunity: "Catedral de la Asunción, Ciudad de México",
    parishWebsite: "https://catedralasuncion.mx",
    endorsedDaysAgo: 150,
  }),
  "tobias-wren": endorsed({
    slug: "tobias-wren",
    verifierName: "Fr. James Heading",
    verifierEmail: "frheading@plymouthdiocese.org.uk",
    parishOrCommunity:
      "Our Lady of the Portal & St. Piran, Truro, Cornwall",
    parishWebsite: "https://truroparish.org.uk",
    endorsedDaysAgo: 60,
  }),
  "annunciata-park": chanceryConfirmed({
    slug: "annunciata-park",
    verifierName: "Fr. Andrew Kim Tae-yong",
    verifierEmail: "frkim.andrew@gmail.com",
    parishOrCommunity: "Myeongdong Cathedral parish, Seoul",
    diocese: "Archdiocese of Seoul",
    chanceryEmail: "chancery@catholic.or.kr",
  }),
  "felix-donnegan": endorsed({
    slug: "felix-donnegan",
    verifierName: "Fr. Brendan Kilcoyne",
    verifierEmail: "fr.kilcoyne@galwaycathedral.ie",
    parishOrCommunity: "Galway Cathedral parish, Ireland",
    parishWebsite: "https://galwaycathedral.ie",
    endorsedDaysAgo: 30,
  }),
  "bartolomeu-camara": chanceryPending({
    slug: "bartolomeu-camara",
    verifierName: "Padre João Carlos",
    verifierEmail: "padre.joaocarlos@yahoo.com.br",
    parishOrCommunity: "Igreja de São José, Recife",
    diocese: "Arquidiocese de Olinda e Recife",
    chanceryEmail: "chancelaria@arquidiocesedeolindaerecife.org.br",
  }),
  "sr-clare-of-avila": endorsed({
    slug: "sr-clare-of-avila",
    role: "religious-superior",
    verifierName: "Mother Eileen, OCD",
    verifierEmail: "prioress@abiquiu-carmel.org",
    parishOrCommunity: "Discalced Carmelite Monastery, Abiquiú NM",
    parishWebsite: "https://abiquiu-carmel.org",
    endorsedDaysAgo: 180,
  }),
  "henrik-aslaksen": endorsed({
    slug: "henrik-aslaksen",
    verifierName: "Fr. Sigurd Sverre Stangeland",
    verifierEmail: "fr.stangeland@katolsk.no",
    parishOrCommunity: "St. Paul's Catholic Church, Bergen",
    parishWebsite: "https://katolsk.no/bergen",
    endorsedDaysAgo: 110,
  }),
  "theo-marchand": endorsed({
    slug: "theo-marchand",
    verifierName: "Mgr. Olivier de Germay",
    verifierEmail: "secretariat@primatiale-st-jean.fr",
    parishOrCommunity: "Primatiale Saint-Jean, Lyon",
    parishWebsite: "https://primatiale-st-jean.fr",
    endorsedDaysAgo: 40,
  }),
  "imogen-fairbairn": pending({
    slug: "imogen-fairbairn",
    verifierName: "Fr. Patrick Boylan",
    verifierEmail: "frboylan@stpatricks-edinburgh.org",
    parishOrCommunity: "St. Patrick's, Edinburgh",
  }),
  "esteban-vega-cruz": chanceryPending({
    slug: "esteban-vega-cruz",
    verifierName: "Padre Francisco Aguilera",
    verifierEmail: "frfran.aguilera@hotmail.com",
    parishOrCommunity: "Parroquia de Santiago, Granada",
    diocese: "Archdiócesis de Granada",
    chanceryEmail: "secretaria@archidiocesisgranada.es",
  }),
};
