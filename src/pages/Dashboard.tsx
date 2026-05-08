import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";
import { artistBySlug } from "../data/artists";
import { categoryBySlug } from "../data/categories";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Ornament } from "../components/Ornament";
import { useStore } from "../lib/store";
import { formatPrice } from "../lib/utils";

export default function Dashboard() {
  const { requests, signedUpArtist } = useStore();

  return (
    <PageShell>
      <section className="container pt-12 sm:pt-16">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
          Your dashboard
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink leading-[1.05]">
          Your commissions
        </h1>
        <p className="mt-4 font-serif text-lg text-ink-muted max-w-2xl">
          A simple register of what you have asked of the guild. Each request
          is held quietly until the artist replies.
        </p>
        <Ornament className="my-10" />
      </section>

      <section className="container max-w-4xl">
        {signedUpArtist && (
          <div className="mb-10 rounded-md border border-ink/10 bg-burgundy-500/5 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-burgundy-500 text-parchment-50">
                <span className="font-display text-base">
                  {signedUpArtist.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-display text-xl text-ink">
                  Welcome, {signedUpArtist.name.split(" ")[0]}.
                </div>
                <p className="mt-1 font-serif text-sm text-ink-soft">
                  Your application is under review. A reader will reply within
                  two weeks. In the prototype, you may continue to browse and
                  test the commission flow.
                </p>
              </div>
            </div>
          </div>
        )}

        {requests.length === 0 ? (
          <div className="rounded-md border border-dashed border-ink/15 p-10 sm:p-16 text-center">
            <div className="grid h-12 w-12 mx-auto place-items-center rounded-full bg-parchment-100 text-ink-muted">
              <Inbox className="h-5 w-5" />
            </div>
            <h2 className="mt-6 font-display text-3xl text-ink leading-tight">
              No commissions yet.
            </h2>
            <p className="mt-3 font-serif text-base text-ink-muted max-w-md mx-auto">
              When you request work from a guild artist, the conversation
              will be kept here.
            </p>
            <Button asChild className="mt-6">
              <Link to="/browse">Browse the guild</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {requests.map((r) => {
              const artist = artistBySlug(r.artistSlug);
              const cat = categoryBySlug(r.category);
              if (!artist) return null;
              return (
                <li
                  key={r.id}
                  className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-5 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                        Commission · {cat?.name}
                      </div>
                      <div className="mt-1 font-display text-2xl text-ink">
                        <Link
                          to={`/artists/${artist.slug}`}
                          className="hover:text-burgundy-500"
                        >
                          {artist.honorific ? `${artist.honorific} ` : ""}
                          {artist.name}
                        </Link>
                      </div>
                      <div className="mt-1 font-sans text-xs uppercase tracking-[0.18em] text-ink-muted">
                        From {r.fromName} · sent{" "}
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="gold">Sent</Badge>
                      <Badge variant="outline">{r.setting}</Badge>
                      {r.budgetUsd ? (
                        <Badge variant="burgundy">
                          Budget {formatPrice(r.budgetUsd)}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-4 font-serif text-base text-ink-soft leading-relaxed line-clamp-4 whitespace-pre-line">
                    {r.description}
                  </p>
                  <div className="mt-4 pt-4 border-t border-ink/5 flex flex-wrap gap-3 text-xs font-sans uppercase tracking-[0.18em] text-ink-muted">
                    <span>id · {r.id}</span>
                    {r.preferredDeadline && (
                      <span>by {r.preferredDeadline}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
