import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Ornament } from "../components/Ornament";
import { Seo } from "../components/Seo";
import { api } from "../lib/api";

interface PublicLetter {
  from: string;
  to: string;
  artist_slug: string;
  category: string | null;
  for_feast: string | null;
  completed_at: string | null;
  letter: string;
  vision: string | null;
}

// /letters — the public letter archive. Anonymized first letters
// from patrons whose commissions were completed and who opted in to
// share. A literacy resource for future patrons: "this is how you
// write a commission letter."
export default function Letters() {
  const [letters, setLetters] = useState<PublicLetter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.publicLetters();
      if (cancelled) return;
      if (res.ok) setLetters(res.data.letters);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <PageShell>
      <Seo
        title="The Letter Archive — Ars Sacra"
        description="Anonymized first letters from patrons to guild artists, shared with permission. A literacy resource: this is how you write a commission letter."
        path="/letters"
      />
      <section className="container pt-12 sm:pt-16 max-w-3xl">
        <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-3">
          The letter archive
        </div>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-ink leading-[1.05]">
          How patrons write to artists.
        </h1>
        <p className="mt-5 font-serif text-lg text-ink-muted leading-relaxed">
          Every commission through the guild begins with a letter from the
          patron. Below are letters whose authors gave permission to share
          them — anonymized to initials. A small literacy: this is how
          you write to someone whose hand you want.
        </p>
        <Ornament className="my-10" />

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-ink-muted mx-auto" />
          </div>
        ) : letters.length === 0 ? (
          <div className="rounded-md border border-dashed border-ink/15 p-10 text-center">
            <p className="font-serif text-ink-muted">
              No letters in the archive yet. When patrons opt in to share
              theirs after delivery, they'll appear here.
            </p>
          </div>
        ) : (
          <ol className="space-y-10">
            {letters.map((l, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.3 }}
                className="rounded-md border border-ink/10 bg-parchment-50 shadow-card p-6 sm:p-8"
              >
                <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-muted mb-3">
                  From {l.from} to{" "}
                  <Link
                    to={`/artists/${l.artist_slug}`}
                    className="text-burgundy-500 hover:text-burgundy-600"
                  >
                    {l.to}
                  </Link>
                  {l.category && (
                    <>
                      {" · "}
                      <span className="capitalize">{l.category.replace(/-/g, " ")}</span>
                    </>
                  )}
                  {l.for_feast && <> · for {l.for_feast}</>}
                </div>
                <blockquote className="border-l-2 border-burgundy-500/40 pl-4 font-serif text-base text-ink leading-relaxed whitespace-pre-line">
                  {l.letter}
                </blockquote>
                {l.vision && (
                  <>
                    <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-600 mt-6 mb-2">
                      The artist's reply
                    </div>
                    <blockquote className="border-l-2 border-gold-500/60 pl-4 font-serif text-base text-ink-soft italic leading-relaxed whitespace-pre-line">
                      {l.vision}
                    </blockquote>
                  </>
                )}
              </motion.li>
            ))}
          </ol>
        )}

        <Ornament className="my-12" />
        <p className="font-serif italic text-base text-ink-muted text-center max-w-xl mx-auto leading-relaxed">
          You can opt in to share your letter from your commission workspace
          after delivery. Default is private; nothing publishes without your
          mark.
        </p>
      </section>
    </PageShell>
  );
}
