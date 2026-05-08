import { Link } from "react-router-dom";
import { motion } from "motion/react";
import type { Category } from "../types";
import { cn } from "../lib/utils";

interface CategoryTileProps {
  category: Category;
  className?: string;
  index?: number;
  count?: number;
}

export function CategoryTile({
  category,
  className,
  index = 0,
  count,
}: CategoryTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: "easeOut" }}
      className={className}
    >
      <Link
        to={`/browse?category=${category.slug}`}
        className="group block rounded-md focusable"
      >
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-md border border-ink/10 shadow-card transition-transform duration-300 group-hover:-translate-y-0.5"
          style={{
            background: `linear-gradient(160deg, ${category.paletteFrom} 0%, ${category.paletteTo} 100%)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.45'/></svg>\")",
            }}
            aria-hidden
          />
          <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between text-parchment-50">
            <div className="flex items-start justify-between">
              <div className="font-display text-2xl sm:text-3xl">
                {category.glyph}
              </div>
              {typeof count === "number" && (
                <div className="font-sans text-[10px] uppercase tracking-[0.22em] opacity-80">
                  {count} {count === 1 ? "artist" : "artists"}
                </div>
              )}
            </div>
            <div>
              <div className="font-display text-2xl sm:text-3xl leading-tight">
                {category.name}
              </div>
              <p className="mt-2 font-serif text-sm leading-snug opacity-90 line-clamp-3">
                {category.blurb}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
