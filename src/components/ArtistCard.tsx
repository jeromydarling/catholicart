import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";
import type { Artist } from "../types";
import { cn, formatPrice, initials } from "../lib/utils";
import { categoryBySlug } from "../data/categories";
import { isVerified } from "../data/artists";
import { Badge } from "./ui/badge";

interface ArtistCardProps {
  artist: Artist;
  className?: string;
  index?: number;
}

export function ArtistCard({ artist, className, index = 0 }: ArtistCardProps) {
  const primary = categoryBySlug(artist.categories[0]);
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: "easeOut" }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-md border border-ink/10 bg-parchment-50 shadow-card",
        className,
      )}
    >
      <Link
        to={`/artists/${artist.slug}`}
        className="absolute inset-0 z-10 focusable rounded-md"
        aria-label={`View ${artist.name}'s profile`}
      />
      <div
        className="relative aspect-[5/4] overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${artist.portraitFrom} 0%, ${artist.portraitTo} 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid h-24 w-24 sm:h-28 sm:w-28 place-items-center rounded-full bg-parchment-50/15 ring-1 ring-parchment-50/30 backdrop-blur-[2px]">
            <span className="font-display text-3xl text-parchment-50/90 tracking-wide">
              {initials(artist.name)}
            </span>
          </div>
        </div>
        <div className="absolute right-3 top-3 flex gap-1.5">
          {artist.acceptingCommissions ? (
            <Badge variant="gold" className="backdrop-blur-sm bg-gold-500/30 text-parchment-50 ring-parchment-50/40">
              Accepting
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-parchment-50/30 text-parchment-50 ring-parchment-50/30">
              Booked
            </Badge>
          )}
        </div>
      </div>
      <div className="p-5 sm:p-6 flex flex-col gap-3 grow">
        <div>
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <h3 className="font-display text-xl sm:text-2xl text-ink leading-tight flex items-center gap-2">
              <span>
                {artist.honorific && (
                  <span className="text-ink-muted text-base mr-1">
                    {artist.honorific}
                  </span>
                )}
                {artist.name}
              </span>
              {isVerified(artist) && (
                <span
                  className="text-olive-600"
                  title={`Endorsed by ${artist.verification?.verifierName}`}
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                </span>
              )}
            </h3>
          </div>
          <div className="font-sans text-xs uppercase tracking-[0.18em] text-ink-muted">
            {primary?.name} · {artist.city}
          </div>
        </div>
        <p className="font-serif text-[15px] text-ink-soft leading-snug line-clamp-3">
          {artist.vocationStatement}
        </p>
        <div className="mt-auto pt-3 flex items-baseline justify-between border-t border-ink/5">
          <div className="font-sans text-xs uppercase tracking-[0.18em] text-ink-muted">
            From
          </div>
          <div className="font-display text-lg text-burgundy-500">
            {formatPrice(artist.startingAt)}
            {artist.customPricing && (
              <span className="ml-1 text-xs text-ink-muted font-sans normal-case tracking-normal">
                · custom welcome
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
