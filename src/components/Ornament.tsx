import { cn } from "../lib/utils";

interface OrnamentProps {
  className?: string;
  variant?: "fleuron" | "cross" | "dot";
}

// Decorative dividers in the spirit of illuminated manuscripts.
export function Ornament({ className, variant = "fleuron" }: OrnamentProps) {
  if (variant === "dot") {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-3 text-gold-500",
          className,
        )}
        aria-hidden
      >
        <span className="block h-px w-12 bg-gold-500/40" />
        <span className="text-sm">✦</span>
        <span className="block h-px w-12 bg-gold-500/40" />
      </div>
    );
  }

  if (variant === "cross") {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-gold-500",
          className,
        )}
        aria-hidden
      >
        <svg
          viewBox="0 0 80 24"
          className="h-5 w-24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        >
          <line x1="0" y1="12" x2="32" y2="12" />
          <path d="M40 6 v12 M34 12 h12" />
          <line x1="48" y1="12" x2="80" y2="12" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center text-gold-500",
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 120 18"
        className="h-4 w-32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      >
        <path d="M2 9 L48 9" />
        <path d="M52 9 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0" />
        <path d="M56 1 v4 M56 13 v4" />
        <path d="M64 9 a4 4 0 1 0 -8 0" opacity="0.4" />
        <path d="M72 9 L118 9" />
      </svg>
    </div>
  );
}
