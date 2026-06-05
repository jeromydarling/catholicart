import { cn } from "../../lib/utils";

// A chromeless browser shell for marketing screenshots. The chrome is
// deliberately minimal — traffic lights, a faux URL bar — so the
// content inside reads as "a real app, captured." We use this to wrap
// little React mockups of the live product so the marketing pages can
// show the work without needing actual image assets.

export function BrowserFrame({
  url = "locavit.com",
  children,
  className,
  tone = "parchment",
}: {
  url?: string;
  children: React.ReactNode;
  className?: string;
  tone?: "parchment" | "ink";
}) {
  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden shadow-plate border border-ink/10",
        tone === "parchment" ? "bg-parchment-50" : "bg-ink",
        className,
      )}
    >
      {/* Chrome */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2.5 border-b",
          tone === "parchment"
            ? "bg-parchment-100/70 border-ink/10"
            : "bg-ink/95 border-parchment-50/10",
        )}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="block h-2.5 w-2.5 rounded-full bg-burgundy-500/70" aria-hidden />
          <span className="block h-2.5 w-2.5 rounded-full bg-gold-500/70" aria-hidden />
          <span className="block h-2.5 w-2.5 rounded-full bg-olive-500/70" aria-hidden />
        </div>
        <div
          className={cn(
            "ml-3 grow truncate rounded-sm px-3 py-1 font-sans text-[10px] sm:text-[11px] tracking-wide",
            tone === "parchment"
              ? "bg-parchment-50 text-ink-muted border border-ink/10"
              : "bg-parchment-50/10 text-parchment-100 border border-parchment-50/10",
          )}
        >
          <span className="text-olive-500">●</span>{" "}
          <span className="text-ink-muted/80">{url}</span>
        </div>
      </div>
      {/* Content slot */}
      <div className="relative">{children}</div>
    </div>
  );
}
