import { cn } from "../lib/utils";
import type { Quote as QuoteT } from "../types";
import { Ornament } from "./Ornament";

interface QuoteProps {
  quote: QuoteT;
  className?: string;
  size?: "sm" | "md" | "lg";
  ornament?: boolean;
}

export function Quote({
  quote,
  className,
  size = "md",
  ornament = true,
}: QuoteProps) {
  const sizeClass =
    size === "lg"
      ? "text-2xl sm:text-3xl md:text-4xl leading-snug"
      : size === "sm"
        ? "text-lg sm:text-xl leading-snug"
        : "text-xl sm:text-2xl md:text-[1.65rem] leading-snug";

  return (
    <figure className={cn("text-center", className)}>
      {ornament && <Ornament className="mb-6" />}
      <blockquote
        className={cn(
          "font-display italic text-ink",
          sizeClass,
        )}
        style={{ textWrap: "balance" } as React.CSSProperties}
      >
        “{quote.text}”
      </blockquote>
      <figcaption className="mt-5 font-sans text-xs uppercase tracking-[0.22em] text-ink-muted">
        — {quote.attribution}
        {quote.citation && (
          <span className="block mt-1 normal-case tracking-normal text-[11px] text-ink-muted/80 font-serif italic">
            {quote.citation}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
