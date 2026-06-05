import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, Globe, Mail } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Ornament } from "../components/Ornament";
import { Seo } from "../components/Seo";
import { DiscoveryMap } from "../components/DiscoveryMap";
import {
  DIRECTORY_ENTRIES,
  DIRECTORY_COUNTRIES,
  type DirectoryEntry,
} from "../data/discovery-directory";

// /map — shown when the seed guild directory is hidden but the
// researched discovery directory is live. Mapbox globe with one pin
// per researched artist or workshop. Clear "not yet a member"
// framing in the side panel.

export default function DiscoveryMapPage() {
  const [selected, setSelected] = useState<DirectoryEntry | null>(null);

  return (
    <PageShell>
      <Seo
        title="Map — Catholic sacred artists worldwide · Locavit"
        description="A worldwide map of researched living Catholic sacred artists and religious-order workshops. Iconographers, sculptors, vestment makers, illuminators."
        path="/map"
      />
      <section className="container pt-12 sm:pt-16 max-w-4xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          The geography of sacred craft
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink leading-[1.05]">
          {DIRECTORY_ENTRIES.length} hands,
          <span className="block italic text-burgundy-500 mt-1">
            {DIRECTORY_COUNTRIES.length} countries.
          </span>
        </h1>
        <p className="mt-5 font-serif text-lg text-ink-soft max-w-2xl leading-relaxed">
          A researched directory of living Catholic sacred artists and
          religious-order workshops worldwide — iconographers,
          sculptors, vestment makers, illuminators, stone carvers.
          These artists are <strong className="font-medium">not yet
          members of the Locavit guild</strong>; we've listed them so
          commissioners can find and contact them directly.
        </p>
        <Ornament className="my-8" />
      </section>

      <section className="container max-w-7xl pb-8">
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <DiscoveryMap
              className="h-[60dvh] min-h-[420px] max-h-[680px] rounded-md overflow-hidden border border-ink/10"
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />
            <p className="mt-3 font-serif text-xs italic text-ink-muted">
              Click a pin to see the artist. Pins approximate the city
              listed in public sources.
            </p>
          </div>

          <aside className="lg:col-span-4">
            {selected ? <EntryPanel entry={selected} /> : <IntroPanel />}
          </aside>
        </div>
      </section>

      {/* CTA */}
      <section className="container max-w-4xl py-16">
        <div className="rounded-md border border-ink/10 bg-parchment-100/40 px-6 sm:px-10 py-8 text-center">
          <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-burgundy-500 mb-2">
            Are you on this map?
          </div>
          <h2 className="font-display text-2xl sm:text-3xl tracking-tight text-ink">
            Claim your guild profile.
          </h2>
          <p className="mt-3 font-serif text-base text-ink-soft max-w-xl mx-auto leading-relaxed">
            If you're one of the artists listed, write to{" "}
            <a
              href="mailto:hello@locavit.com"
              className="text-burgundy-500 hover:text-burgundy-600 underline underline-offset-2"
            >
              hello@locavit.com
            </a>{" "}
            and we'll set you up as a founding member of the Locavit
            guild — at no cost, with full control over your profile.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/directory">
                Browse the full directory <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/features">Every feature of the guild</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function IntroPanel() {
  return (
    <div className="rounded-md border border-ink/10 bg-parchment-50 p-6 h-full">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mb-2">
        How to read the map
      </div>
      <h3 className="font-display text-xl text-ink leading-tight">
        Click any pin.
      </h3>
      <p className="mt-3 font-serif text-sm text-ink-soft leading-relaxed">
        Each pin is one researched Catholic sacred artist or
        religious-order workshop. Click it to see their disciplines,
        notable works, and how to contact them directly.
      </p>
      <hr className="my-4 border-t border-ink/10" />
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-burgundy-500 mb-2">
        Not yet a member
      </div>
      <p className="font-serif text-sm text-ink-soft leading-relaxed">
        These artists are not part of the Locavit guild. The
        directory exists to help commissioners discover real living
        Catholic artists in the meantime.
      </p>
    </div>
  );
}

function EntryPanel({ entry }: { entry: DirectoryEntry }) {
  return (
    <div className="rounded-md border border-burgundy-500/30 bg-parchment-50 p-6 h-full">
      <div className="flex items-start gap-2 mb-2">
        <div className="grow">
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600">
            {entry.type}
          </div>
          <h3 className="mt-1 font-display text-xl text-ink leading-tight">
            {entry.name}
          </h3>
        </div>
        {entry.order && (
          <span className="shrink-0 rounded-sm bg-burgundy-500/10 px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-[0.18em] text-burgundy-500">
            {entry.order}
          </span>
        )}
      </div>
      <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted">
        {[entry.city, entry.region, entry.country].filter(Boolean).join(" · ")}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {entry.disciplines.map((d) => (
          <span
            key={d}
            className="rounded-sm bg-parchment-100 px-2 py-0.5 font-sans text-[10px] text-ink-soft"
          >
            {d}
          </span>
        ))}
      </div>
      {entry.notableWorks.length > 0 && (
        <>
          <div className="mt-4 font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600">
            Notable works
          </div>
          <ul className="mt-1 font-serif text-sm text-ink-soft leading-snug space-y-1">
            {entry.notableWorks.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </>
      )}
      {entry.endorser && (
        <>
          <div className="mt-4 font-sans text-[10px] uppercase tracking-[0.22em] text-olive-600">
            Endorsing institutions
          </div>
          <p className="mt-1 font-serif text-sm text-ink leading-snug">
            {entry.endorser}
          </p>
        </>
      )}
      <hr className="my-4 border-t border-ink/10" />
      <div className="flex flex-wrap gap-3">
        {entry.website && (
          <a
            href={entry.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-sm bg-burgundy-500 px-3 py-1.5 font-sans text-[11px] uppercase tracking-[0.18em] text-parchment-50 hover:bg-burgundy-600"
          >
            <Globe className="h-3 w-3" /> Visit website
          </a>
        )}
        {entry.email && (
          <a
            href={`mailto:${entry.email}`}
            className="inline-flex items-center gap-1.5 rounded-sm border border-ink/15 bg-parchment-50 px-3 py-1.5 font-sans text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-parchment-100"
          >
            <Mail className="h-3 w-3" /> Email
          </a>
        )}
        {entry.sourceUrl && (
          <a
            href={entry.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink self-center"
          >
            Source <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
      <p className="mt-5 font-sans text-[10px] uppercase tracking-[0.22em] text-burgundy-500/80">
        Not yet a Locavit member
      </p>
    </div>
  );
}
