import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(usd: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usd);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Ecclesiastical and other abbreviations that end in a period and must
// NOT be treated as a sentence boundary when extracting a title.
const TITLE_ABBREVS = new Set([
  "St", "Sts", "Sr", "Fr", "Br", "Bl", "Ven", "Mr", "Mrs", "Ms",
  "Dr", "Mt", "Rev", "Msgr", "Vbl", "Dom", "Hon", "Ord", "OSB",
  "OFM", "OP", "SJ", "OCD",
]);

// Pulls a usable title out of a patron's scope description. Takes the
// first natural sentence of the first line, skipping abbreviations like
// "St." or "Fr." so they don't cause premature truncation. Falls back
// to a length-capped slice with an ellipsis.
export function deriveTitle(scope: string | undefined, maxLen = 80): string {
  if (!scope) return "Untitled";
  const firstLine = scope.split(/\n/)[0].trim();
  // Find first sentence terminator (. ! ?) followed by space + capital letter,
  // skipping known abbreviations.
  const re = /([.!?])\s+(?=[A-Z])/g;
  let cut = firstLine.length;
  let m: RegExpExecArray | null;
  while ((m = re.exec(firstLine))) {
    const before = firstLine.slice(0, m.index);
    const lastWord = (before.match(/(\S+)$/)?.[1] ?? "").replace(/[.!?]$/, "");
    if (TITLE_ABBREVS.has(lastWord)) continue;
    cut = m.index + 1;
    break;
  }
  let title = firstLine.slice(0, cut).trim();
  if (title.length > maxLen) title = title.slice(0, maxLen - 1).trimEnd() + "…";
  return title || "Untitled";
}
