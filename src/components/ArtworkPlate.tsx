import type { Artwork } from "../types";
import { cn } from "../lib/utils";

interface ArtworkPlateProps {
  artwork: Artwork;
  className?: string;
  aspect?: "portrait" | "landscape" | "square";
  showCaption?: boolean;
}

// Renders an artwork as a stylized "plate" — a hand-printed reproduction
// placeholder. We don't have real photographs of these works, so we present
// each as a colored panel with an ornamental device and the work's metadata,
// in the manner of an archival catalog or letterpress book plate.
export function ArtworkPlate({
  artwork,
  className,
  aspect = "portrait",
  showCaption = true,
}: ArtworkPlateProps) {
  const aspectClass =
    aspect === "portrait"
      ? "aspect-[3/4]"
      : aspect === "landscape"
        ? "aspect-[4/3]"
        : "aspect-square";

  return (
    <figure className={cn("group", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-sm shadow-card border border-ink/10",
          aspectClass,
        )}
        style={{
          background: `linear-gradient(135deg, ${artwork.paletteFrom} 0%, ${artwork.paletteTo} 100%)`,
        }}
      >
        {/* parchment grain over color */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.45'/></svg>\")",
          }}
          aria-hidden
        />
        {/* gold inner frame */}
        <div
          className="absolute inset-3 rounded-sm border border-parchment-50/20"
          aria-hidden
        />
        {/* device / pattern */}
        <div className="absolute inset-0 flex items-center justify-center text-parchment-50/85">
          <PatternGlyph pattern={artwork.pattern} />
        </div>
        {/* metadata */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-parchment-50">
          <div
            className="font-display italic text-base sm:text-lg leading-tight tracking-tight drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            {artwork.title}
          </div>
          <div className="mt-1 font-sans text-[10px] uppercase tracking-[0.22em] opacity-80">
            {artwork.medium} · {artwork.year}
          </div>
        </div>
      </div>
      {showCaption && (
        <figcaption className="mt-3 font-serif text-sm text-ink-muted leading-snug">
          <span className="italic">{artwork.title}</span>
          {artwork.dimensions && <span> · {artwork.dimensions}</span>}
          <span className="block text-xs text-ink-muted/80 mt-0.5">
            {artwork.caption}
          </span>
        </figcaption>
      )}
    </figure>
  );
}

function PatternGlyph({ pattern }: { pattern?: Artwork["pattern"] }) {
  const stroke = "currentColor";
  if (pattern === "halo") {
    return (
      <svg
        viewBox="0 0 200 240"
        className="h-3/4 w-3/4"
        fill="none"
        stroke={stroke}
        strokeWidth="1.2"
        opacity="0.55"
      >
        <circle cx="100" cy="80" r="44" />
        <circle cx="100" cy="80" r="56" opacity="0.5" />
        <path d="M100 124 v110 M70 234 h60" strokeWidth="0.9" />
      </svg>
    );
  }
  if (pattern === "cross") {
    return (
      <svg
        viewBox="0 0 200 240"
        className="h-3/4 w-3/4"
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
        opacity="0.5"
      >
        <path d="M100 30 v180 M50 90 h100" />
      </svg>
    );
  }
  if (pattern === "vesica") {
    return (
      <svg
        viewBox="0 0 200 240"
        className="h-3/4 w-3/4"
        fill="none"
        stroke={stroke}
        strokeWidth="1.1"
        opacity="0.55"
      >
        <path d="M100 40 C40 80 40 160 100 200 C160 160 160 80 100 40 Z" />
        <circle cx="100" cy="120" r="6" fill="currentColor" opacity="0.5" />
      </svg>
    );
  }
  if (pattern === "triptych") {
    return (
      <svg
        viewBox="0 0 200 240"
        className="h-3/4 w-3/4"
        fill="none"
        stroke={stroke}
        strokeWidth="1.1"
        opacity="0.55"
      >
        <path d="M40 40 v160 h36 v-160 z M82 30 v180 h36 v-180 z M124 40 v160 h36 v-160 z" />
      </svg>
    );
  }
  if (pattern === "frame") {
    return (
      <svg
        viewBox="0 0 200 240"
        className="h-3/4 w-3/4"
        fill="none"
        stroke={stroke}
        strokeWidth="1.1"
        opacity="0.5"
      >
        <rect x="30" y="30" width="140" height="180" rx="2" />
        <rect x="44" y="44" width="112" height="152" opacity="0.6" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 200 240"
      className="h-3/4 w-3/4"
      fill="none"
      stroke={stroke}
      strokeWidth="1.1"
      opacity="0.4"
    >
      <circle cx="100" cy="120" r="56" />
      <circle cx="100" cy="120" r="36" opacity="0.6" />
    </svg>
  );
}
