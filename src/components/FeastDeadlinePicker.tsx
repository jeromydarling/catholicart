import { useMemo, useState } from "react";
import { ChevronDown, Clock, AlertTriangle } from "lucide-react";
import { feastsForLiturgicalYear, daysUntil } from "../lib/liturgical";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "../lib/utils";

interface FeastDeadlinePickerProps {
  // Min weeks the artist needs (controls the "tight" warning)
  minWeeks?: number;
  // What gets emitted when the user selects something
  onChange?: (value: { date: string; feastSlug?: string; feastName?: string } | null) => void;
  defaultFeastSlug?: string;
  // For the form post: hidden input names
  dateName?: string;
  feastSlugName?: string;
  feastNameName?: string;
}

// A feast-day-aware deadline picker. Patrons can pick a feast, a custom
// date, or no deadline. We surface "this is tight" warnings when the
// chosen date is sooner than the artist's minimum turnaround.
export function FeastDeadlinePicker({
  minWeeks = 6,
  onChange,
  defaultFeastSlug,
  dateName = "deadline",
  feastSlugName = "feastSlug",
  feastNameName = "feastName",
}: FeastDeadlinePickerProps) {
  const upcoming = useMemo(() => feastsForLiturgicalYear(new Date()).slice(0, 18), []);

  const initial = upcoming.find((f) => f.slug === defaultFeastSlug);
  const [selected, setSelected] = useState<
    | { kind: "feast"; slug: string; name: string; date: string }
    | { kind: "date"; date: string }
    | null
  >(
    initial
      ? {
          kind: "feast",
          slug: initial.slug,
          name: initial.name,
          date: toIsoDate(initial.date),
        }
      : null,
  );
  const [open, setOpen] = useState(false);

  const dateValue =
    selected?.kind === "feast" ? selected.date : selected?.kind === "date" ? selected.date : "";

  const days = dateValue ? daysUntil(new Date(dateValue)) : null;
  const tight = days !== null && days < minWeeks * 7;

  function emit(
    next: { kind: "feast"; slug: string; name: string; date: string } | { kind: "date"; date: string } | null,
  ) {
    setSelected(next);
    if (!onChange) return;
    if (next === null) onChange(null);
    else if (next.kind === "feast") onChange({ date: next.date, feastSlug: next.slug, feastName: next.name });
    else onChange({ date: next.date });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>For a particular feast (optional)</Label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-full items-center justify-between rounded-sm border border-ink/15 bg-parchment-50 px-3 font-sans text-sm text-ink hover:border-ink/30 focusable"
          >
            <span className={cn(selected ? "text-ink" : "text-ink-muted")}>
              {selected?.kind === "feast"
                ? `${selected.name} · ${formatDateShort(new Date(selected.date))}`
                : "Pick a feast or solemnity"}
            </span>
            <ChevronDown className="h-4 w-4 text-ink-muted" />
          </button>
          {open && (
            <div className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-sm border border-ink/15 bg-parchment-50 shadow-plate">
              <ul className="py-1">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      emit(null);
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 font-sans text-sm text-ink-muted hover:bg-parchment-100"
                  >
                    No specific feast
                  </button>
                </li>
                {upcoming.map((f) => (
                  <li key={f.slug + f.date.toISOString()}>
                    <button
                      type="button"
                      onClick={() => {
                        emit({
                          kind: "feast",
                          slug: f.slug,
                          name: f.name,
                          date: toIsoDate(f.date),
                        });
                        setOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 font-sans text-sm hover:bg-parchment-100 flex items-baseline justify-between gap-3"
                    >
                      <span className="text-ink">{f.name}</span>
                      <span className="text-ink-muted text-xs tabular-nums">
                        {formatDateShort(f.date)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ddl-date">…or pick a date directly</Label>
        <Input
          id="ddl-date"
          type="date"
          value={selected?.kind === "date" ? selected.date : ""}
          onChange={(e) => {
            if (!e.target.value) emit(null);
            else emit({ kind: "date", date: e.target.value });
          }}
        />
      </div>

      {/* Hidden inputs so plain <form> submissions carry the data */}
      <input type="hidden" name={dateName} value={dateValue} />
      <input
        type="hidden"
        name={feastSlugName}
        value={selected?.kind === "feast" ? selected.slug : ""}
      />
      <input
        type="hidden"
        name={feastNameName}
        value={selected?.kind === "feast" ? selected.name : ""}
      />

      {tight && (
        <div className="rounded-sm border border-burgundy-500/30 bg-burgundy-500/5 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-burgundy-500 shrink-0 mt-0.5" />
          <p className="font-serif text-sm text-ink-soft leading-relaxed">
            <strong className="text-ink">That's in {days} days.</strong> Most
            artists need {minWeeks}+ weeks for sacred work. Reach out anyway —
            we'll help find someone who can deliver in time, or commission for
            next year's feast.
          </p>
        </div>
      )}

      {!tight && days !== null && (
        <div className="rounded-sm border border-olive-500/30 bg-olive-500/5 p-3 flex items-start gap-2">
          <Clock className="h-4 w-4 text-olive-600 shrink-0 mt-0.5" />
          <p className="font-serif text-sm text-ink-soft leading-relaxed">
            <strong className="text-ink">{days} days</strong> — comfortable
            turnaround for a careful work.
          </p>
        </div>
      )}
    </div>
  );
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDateShort(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
