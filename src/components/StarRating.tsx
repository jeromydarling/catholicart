import { Star } from "lucide-react";
import { cn } from "../lib/utils";

interface StarRatingProps {
  value: number;          // 0..5, can be fractional for averages
  max?: number;            // default 5
  onChange?: (v: 1 | 2 | 3 | 4 | 5) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizes = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export function StarRating({
  value,
  max = 5,
  onChange,
  size = "md",
  label,
  className,
}: StarRatingProps) {
  const interactive = !!onChange;
  return (
    <div className={cn("inline-flex items-center gap-1", className)} role={interactive ? "radiogroup" : undefined} aria-label={label}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        const filled = n <= Math.round(value);
        const half = !filled && n - value < 1 && n - value > 0;
        if (interactive) {
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
              onClick={() => onChange(n as 1 | 2 | 3 | 4 | 5)}
              className={cn(
                "rounded-sm focusable transition-transform hover:scale-110",
                filled ? "text-gold-500" : "text-ink-muted/30",
              )}
            >
              <Star className={cn(sizes[size], filled && "fill-current")} />
            </button>
          );
        }
        return (
          <span
            key={n}
            className={cn(filled ? "text-gold-500" : half ? "text-gold-500/60" : "text-ink-muted/25")}
          >
            <Star className={cn(sizes[size], filled && "fill-current")} aria-hidden />
          </span>
        );
      })}
    </div>
  );
}
