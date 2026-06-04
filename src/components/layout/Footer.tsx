import { Link } from "react-router-dom";
import { brand } from "../../data/brand";
import { Ornament } from "../Ornament";

export function Footer() {
  return (
    <footer className="border-t border-ink/10 mt-20 sm:mt-28">
      <div className="container py-12 sm:py-16">
        <Ornament className="mb-10" />
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="font-display text-2xl text-ink">{brand.name}</div>
            <p className="mt-3 font-serif text-sm text-ink-muted leading-snug">
              {brand.longTagline}
            </p>
            <p className="mt-4 font-serif italic text-sm text-ink-muted">
              {brand.motto}
              <span className="block mt-1 not-italic font-sans uppercase tracking-[0.18em] text-[10px]">
                {brand.mottoTranslation}
              </span>
            </p>
          </div>
          <FooterCol heading="Commission">
            <FooterLink to="/browse">Browse artists</FooterLink>
            <FooterLink to="/map">Map of the guild</FooterLink>
            <FooterLink to="/about#how-it-works">How it works</FooterLink>
          </FooterCol>
          <FooterCol heading="For artists">
            <FooterLink to="/signup/artist">Apply to the guild</FooterLink>
            <FooterLink to="/dashboard">Artist dashboard</FooterLink>
            <FooterLink to="/manifesto">The manifesto</FooterLink>
          </FooterCol>
          <FooterCol heading="Trust & transparency">
            <FooterLink to="/ledger">The Ledger</FooterLink>
            <FooterLink to="/catalog">Annual catalog</FooterLink>
            <FooterLink to="/orders">Religious orders</FooterLink>
            <FooterLink to="/partnerships">For dioceses</FooterLink>
            <FooterLink to="/about">Mission</FooterLink>
          </FooterCol>
        </div>
        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 border-t border-ink/10 pt-10">
          <FooterCol heading="The culture engine">
            <FooterLink to="/journal">Beauty Manifesto</FooterLink>
            <FooterLink to="/report">Anti-Kitsch Report</FooterLink>
            <FooterLink to="/prize">Pulchritudo Prize</FooterLink>
            <FooterLink to="/apprenticeships">Apprenticeships</FooterLink>
          </FooterCol>
        </div>

        <div className="mt-12 pt-8 border-t border-ink/10 flex flex-col sm:flex-row justify-between gap-4 text-xs font-sans text-ink-muted">
          <div>
            © {new Date().getFullYear()} {brand.name}. A guild for Catholic artists.
          </div>
          <div className="font-serif italic">
            “The world will be saved by beauty.” — F. Dostoevsky
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-600 mb-3">
        {heading}
      </div>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        to={to}
        className="font-serif text-sm text-ink-soft hover:text-burgundy-500 transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}
