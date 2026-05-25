// Saved artists + compare list. Both backed by localStorage.

const SAVED_KEY = "ars-sacra:saved-artists";
const COMPARE_KEY = "ars-sacra:compare-artists";
const COMPARE_MAX = 4;

const subscribers = new Set<() => void>();
export function subscribeSaved(fn: () => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
function fanout() {
  subscribers.forEach((fn) => fn());
}

function load(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
function save(key: string, slugs: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(slugs));
  } catch {
    /* ignore */
  }
}

export function getSaved(): string[] {
  return load(SAVED_KEY);
}
export function isSaved(slug: string): boolean {
  return getSaved().includes(slug);
}
export function toggleSaved(slug: string): boolean {
  const cur = getSaved();
  const i = cur.indexOf(slug);
  const next = i === -1 ? [...cur, slug] : cur.filter((s) => s !== slug);
  save(SAVED_KEY, next);
  fanout();
  return next.includes(slug);
}

export function getCompareList(): string[] {
  return load(COMPARE_KEY);
}
export function isInCompare(slug: string): boolean {
  return getCompareList().includes(slug);
}
export function toggleCompare(slug: string): boolean {
  const cur = getCompareList();
  const i = cur.indexOf(slug);
  if (i !== -1) {
    save(COMPARE_KEY, cur.filter((s) => s !== slug));
    fanout();
    return false;
  }
  if (cur.length >= COMPARE_MAX) return false;
  save(COMPARE_KEY, [...cur, slug]);
  fanout();
  return true;
}
export function clearCompare() {
  save(COMPARE_KEY, []);
  fanout();
}
export { COMPARE_MAX };
