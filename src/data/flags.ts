// Feature flags. Flip these single booleans to gate large slices of the
// site while we populate real content. Each flag is a soft hide — the
// underlying code and seed data are preserved, so flipping a flag back
// to `true` immediately restores the feature.

export const flags = {
  // Show the seed artist directory across /browse, /map, /artists/:slug,
  // landing-page featured, and similar surfaces. Turn back on when the
  // researched directory of real Catholic artists has been ingested.
  showArtistDirectory: false,

  // Show diocesan landing pages at /dioceses and /dioceses/:slug.
  // Turn back on when we have meaningful diocese-specific content to
  // surface (verified artists per diocese, chancery outreach copy, etc.).
  showDioceses: false,
} as const;
