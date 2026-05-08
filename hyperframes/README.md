# Hyperframes — hero video composition

Hyperframes ([heygen-com/hyperframes](https://github.com/heygen-com/hyperframes))
is an HTML-native video rendering framework: you compose with HTML/CSS/JS, it
renders deterministically through headless Chrome + FFmpeg.

The site ships a React-rendered Ken Burns hero (`src/components/HeroVideo.tsx`)
that uses the same Met images. This directory holds an optional Hyperframes
composition for those who want a baked mp4 (e.g. for social posts, paid ads,
or a video background that survives JS-disabled browsing).

## Prerequisites

- Node 22+
- FFmpeg on PATH (`brew install ffmpeg` / `apt install ffmpeg`)
- Headless Chrome — Hyperframes installs this on first run via
  `@puppeteer/browsers`.

## Workflow

```bash
# 1. Fetch the Met artworks + chant audio (writes public/assets/)
npm run fetch-assets

# 2. Preview in the browser-backed studio
npx hyperframes preview hyperframes/hero

# 3. Render to mp4
npm run render-hero
# → public/assets/hero.mp4
```

The composition lives at `hyperframes/hero/`. It reads the manifest at
`public/assets/manifest.json` (produced by `fetch-assets`), so editing the
artwork list happens in `scripts/fetch-assets.mjs` — the composition follows.

## Embedding the rendered mp4

Once `public/assets/hero.mp4` exists, you can swap the React Ken Burns hero
for a `<video>` element in `src/pages/Landing.tsx`:

```tsx
<video
  src={`${import.meta.env.BASE_URL}assets/hero.mp4`}
  autoPlay loop muted playsInline
  className="absolute inset-0 h-full w-full object-cover"
/>
```

The current default is the React hero because it's responsive at every
breakpoint and respects user-controlled mute / pause; switch when you want
deterministic frames or a pre-rendered Open Graph video.
