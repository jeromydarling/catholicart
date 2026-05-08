import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, Pause, Play } from "lucide-react";
import type { HeroManifest, HeroManifestWork } from "../data/hero-works";
import { cn } from "../lib/utils";

const SLIDE_MS = 7000;

// Manifest paths are relative ("assets/...") so they work under any
// `import.meta.env.BASE_URL` prefix (Pages serves at /catholicart/, dev at /).
const asset = (rel: string) =>
  `${import.meta.env.BASE_URL}${rel.replace(/^\/+/, "")}`;

export function HeroVideo() {
  const [manifest, setManifest] = useState<HeroManifest | null>(null);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}assets/manifest.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (cancelled) return;
        setManifest(m);
      })
      .catch(() => setManifest(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const works: HeroManifestWork[] = (manifest?.works ?? []).filter(
    (w) => w.image,
  );
  const length = works.length;

  useEffect(() => {
    if (paused || length === 0) return;
    const t = window.setTimeout(() => {
      setIndex((i) => (i + 1) % length);
    }, SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [index, paused, length]);

  // Audio: respect autoplay policy. Start muted; user click unmutes.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = muted;
    if (!paused) {
      a.play().catch(() => {
        /* autoplay blocked — silent fallback */
      });
    } else {
      a.pause();
    }
  }, [muted, paused]);

  const work = length > 0 ? works[index % length] : null;

  return (
    <div className="absolute inset-0 overflow-hidden bg-ink">
      {/* Cycling artwork — Ken Burns + cross-fade */}
      <AnimatePresence mode="sync">
        {work ? (
          <motion.div
            key={work.metId}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1.12 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.4, ease: "easeInOut" },
              scale: { duration: SLIDE_MS / 1000 + 1.4, ease: "linear" },
            }}
            className="absolute inset-0"
          >
            <img
              src={asset(work.image!)}
              alt={`${work.title} — ${work.artist}`}
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
              loading={index === 0 ? "eager" : "lazy"}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </motion.div>
        ) : (
          <FallbackPlate />
        )}
      </AnimatePresence>

      {/* Reverent dark vignette + warm tint for legibility and mood */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(28,22,14,0.55) 0%, rgba(28,22,14,0.35) 35%, rgba(28,22,14,0.65) 75%, rgba(28,22,14,0.85) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none mix-blend-multiply"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, transparent 30%, rgba(94,22,35,0.18) 100%)",
        }}
      />

      {/* Patron card — slides in/out with each work */}
      <AnimatePresence mode="wait">
        {work && (
          <motion.figure
            key={`caption-${work.metId}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute right-4 sm:right-6 lg:right-10 bottom-4 sm:bottom-8 lg:bottom-10 max-w-[88%] sm:max-w-md z-10"
          >
            <div className="rounded-md bg-parchment-50/95 backdrop-blur-md shadow-plate border border-ink/10 p-4 sm:p-5">
              <div className="font-sans text-[10px] uppercase tracking-[0.28em] text-burgundy-500 mb-1.5">
                Commissioned
              </div>
              <div className="font-display italic text-lg sm:text-xl text-ink leading-snug">
                {work.title}
              </div>
              <div className="mt-1 font-sans text-xs uppercase tracking-[0.18em] text-ink-muted">
                {work.artist} · {work.year}
              </div>
              <div className="mt-3 pt-3 border-t border-ink/10">
                <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-1">
                  Patron
                </div>
                <p className="font-serif text-sm text-ink-soft leading-snug">
                  {work.patron}
                </p>
              </div>
              <div className="mt-2 font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted/70">
                The Met · Open Access
              </div>
            </div>
          </motion.figure>
        )}
      </AnimatePresence>

      {/* Top-right controls */}
      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10 flex items-center gap-1.5">
        {manifest?.chant && (
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute chant" : "Mute chant"}
            className="grid h-9 w-9 place-items-center rounded-full bg-parchment-50/90 backdrop-blur text-ink hover:bg-parchment-50 shadow-sm transition-colors"
          >
            {muted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        )}
        {length > 0 && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Resume" : "Pause"}
            className="grid h-9 w-9 place-items-center rounded-full bg-parchment-50/90 backdrop-blur text-ink hover:bg-parchment-50 shadow-sm transition-colors"
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Progress pips */}
      {length > 1 && (
        <div className="absolute bottom-3 left-4 sm:left-6 lg:left-10 z-10 flex items-center gap-1.5">
          {works.map((w, i) => (
            <button
              key={w.metId}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${w.title}`}
              className={cn(
                "h-[3px] rounded-full transition-all",
                i === index
                  ? "w-10 bg-parchment-50"
                  : "w-5 bg-parchment-50/40 hover:bg-parchment-50/70",
              )}
            />
          ))}
        </div>
      )}

      {/* Audio (hidden) */}
      {manifest?.chant && (
        <audio
          ref={audioRef}
          src={asset(manifest.chant.src)}
          loop
          preload="auto"
          aria-hidden
        />
      )}
    </div>
  );
}

function FallbackPlate() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse at 30% 30%, #5e1623 0%, #1c160e 60%, #876b2c 130%)",
      }}
    >
      <div className="absolute inset-0 grid place-items-center text-parchment-50/40">
        <svg
          viewBox="0 0 200 260"
          className="w-1/3 max-w-[260px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <circle cx="100" cy="80" r="40" opacity="0.7" />
          <circle cx="100" cy="80" r="54" opacity="0.4" />
          <path
            d="M100 124 C70 140 60 200 70 240 L130 240 C140 200 130 140 100 124 Z"
            opacity="0.85"
          />
          <path d="M100 80 v-60 M70 30 h60" opacity="0.6" />
        </svg>
      </div>
    </div>
  );
}
