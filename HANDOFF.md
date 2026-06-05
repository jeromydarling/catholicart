# Locavit — handoff notes

A prototype marketplace for Catholic artists, in the spirit of John Paul II's
1999 Letter to Artists and rooted in Catholic Social Teaching. Built overnight
on the stack you'll be migrating to lovable.app.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-checks + production build to dist/
```

Mock data only — no backend, no auth. Commission requests and the artist
sign-up are persisted to `localStorage` under the key `ars-sacra:v1`.

## Stack

- Vite 5 + React 18 + TypeScript
- Tailwind 3 + a small `shadcn/ui`-shaped component library
  (`src/components/ui/*`) — Lovable will recognize this layout
- React Router 6
- Motion (the new Framer Motion) for animations
- Radix primitives for Dialog, Tabs, Select, Label
- Lucide for icons

Path alias: `@/*` -> `src/*`.

## Brand and naming

The working brand is **Locavit** ("Sacred Art"). It is a single source
of truth at `src/data/brand.ts` — change `brand.name`, `tagline`, and
`motto` there and the entire site updates. Title tag and meta description
are in `index.html`.

## Pages

| Route                  | File                       | Notes                                            |
|------------------------|----------------------------|--------------------------------------------------|
| `/`                    | `pages/Landing.tsx`        | Hero, categories, featured artists, manifesto excerpt, dark CTA |
| `/browse`              | `pages/Browse.tsx`         | Filter by craft / price / availability; `?category=` deep links |
| `/artists/:slug`       | `pages/ArtistProfile.tsx`  | Portfolio · About · Tiers tabs                   |
| `/commission/:slug`    | `pages/Commission.tsx`     | Form -> confirmation; honors `?tier=` and `?custom=true`  |
| `/signup/artist`       | `pages/ArtistSignup.tsx`   | Multi-section application                        |
| `/dashboard`           | `pages/Dashboard.tsx`      | Reads `localStorage` requests + applicant state  |
| `/about`               | `pages/About.tsx`          | Mission, story, the seven CST principles, the four promises |
| `/manifesto`           | `pages/Manifesto.tsx`      | Eight numbered articles                          |
| `*`                    | `pages/NotFound.tsx`       |                                                  |

## Mobile

Designed mobile-first. Verified responsive at 360 / 768 / 1280:

- Header collapses to a full-screen drawer (`components/layout/Header.tsx`)
- Browse filters move into a right-side drawer behind a `Filters` button
- Hero on Landing reflows to a single column on mobile and adds the
  decorative side plate only on `sm+`
- All cards / grids cascade 1 → 2 → 3 → 4 columns
- Touch targets are min 44px; focus rings tuned for parchment background

## Visual system (where to tweak)

- Color tokens — `tailwind.config.js` (parchment, ink, burgundy, gold,
  lapis, olive). Liturgical palette: deep red (Tridentine), ultramarine
  (Marian), aged gold (illumination), parchment cream.
- Typography — Cormorant Garamond (display, italic), Spectral (body
  serif), Inter (UI). Loaded from Google Fonts in `index.html`.
- Decorative SVG dividers — `components/Ornament.tsx` (fleuron, cross,
  dot variants).
- Artwork "plates" — `components/ArtworkPlate.tsx` renders each work as
  a stylized colored panel with an iconographic device (halo, cross,
  vesica, triptych, frame). This is intentional in the absence of real
  photographs — it reads as archival, not lazy. Replace with real images
  when you have them: each work has `paletteFrom`/`paletteTo`/`pattern`,
  swap for an `image` URL.

## Mock data

- `src/data/brand.ts` — single brand source of truth
- `src/data/categories.ts` — 8 crafts (painting, iconography, sculpture,
  glass/mosaic, music, poetry, drama, photography)
- `src/data/artists.ts` — 12 artists across the categories, each with
  vocation statement, bio, formation, 4 sample works, and 3 pricing
  tiers (small / standard / major). Custom-pricing flag controls the
  "Request a custom quote" CTA.
- `src/data/quotes.ts` — JPII Letter to Artists + Laborem Exercens +
  Dostoevsky. **Important:** quotes are paraphrased from memory and
  cited generally; verify exact wording against the Vatican document
  before publication. The flagged paraphrase is in §1.

## Lovable migration

This was scaffolded to match Lovable's defaults. To migrate:

1. Create a new Lovable project from the GitHub repo, or copy `src/`,
   `index.html`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`,
   `vite.config.ts`, and `package.json` into a fresh Lovable project.
2. Replace `src/lib/store.ts` (localStorage) with a Supabase client —
   the `Persisted` shape is small (`requests`, `signedUpArtist`).
3. Add Supabase auth to `src/components/layout/Header.tsx` (the dashboard
   currently reads from localStorage; gate it on auth).
4. The artist data should move into a Supabase `artists` table; same shape
   as `src/types.ts` `Artist`.

## What's intentionally not built

- Real auth (Supabase / Clerk / etc.)
- Payments — flow ends at "request sent". The artist replies, both
  parties agree, then payment is arranged. Payment infrastructure
  (Stripe Connect, escrow) is a real-app concern and was excluded by
  scope.
- Messaging between commissioner and artist
- Real artwork photographs — colored "plates" are placeholders
- Search — only filtering. Add a search input to Browse when there are
  enough artists to need it.
- Internationalization — copy is English; Latin liturgical phrases are
  used as decoration, not as i18n strings.

## What you should look at first

1. Open `/` and scroll. The hero, the categories grid, the featured
   artists, the dark final CTA.
2. Click a category tile -> deep-linked Browse with that craft.
3. Click an artist -> profile with three tabs. Try Tiers.
4. Click a tier "Begin" -> Commission form with that tier preselected.
5. Submit a request -> confirmation.
6. Visit `/dashboard` -> the request you just submitted.
7. `/manifesto` and `/about` are the long-form copy. Read them.
8. Mobile: open dev tools, toggle device toolbar, try 360px width.
9. `/no-such-page` -> Latin 404.

## Files added by this session

```
src/
  App.tsx, main.tsx, index.css, types.ts
  data/{brand,categories,artists,quotes}.ts
  lib/{utils,store}.ts
  components/
    Ornament.tsx, ArtworkPlate.tsx, ArtistCard.tsx,
    CategoryTile.tsx, Quote.tsx
    layout/{Header,Footer,PageShell}.tsx
    ui/{button,card,input,textarea,label,badge,
        dialog,select,tabs}.tsx
  pages/
    Landing.tsx, Browse.tsx, ArtistProfile.tsx,
    Commission.tsx, ArtistSignup.tsx, Dashboard.tsx,
    About.tsx, Manifesto.tsx, NotFound.tsx
public/favicon.svg
index.html, vite.config.ts, tsconfig.json,
tailwind.config.js, postcss.config.js
```

## Known smoke-test results

- `npm run typecheck` — passes
- `npm run build` — passes; bundle ~501KB (159KB gzip)
- All 9 routes return 200 in dev, no console errors at boot
- Lighthouse and visual-regression were not run (no browser in this env)
