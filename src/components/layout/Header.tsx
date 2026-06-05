import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react";
import { brand } from "../../data/brand";
import { Button } from "../ui/button";
import { LanguagePicker } from "../LanguagePicker";
import { cn } from "../../lib/utils";
import { MENUS, type MegaMenuDef, type MegaMenuFeature, type MenuLink } from "./menu-config";

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const headerRef = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<number | null>(null);

  // Close everything on route change.
  useEffect(() => {
    setDrawerOpen(false);
    setOpenMenu(null);
  }, [location.pathname]);

  // Scrolled state for the translucent backdrop.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [drawerOpen]);

  // ESC closes mega menu, click outside header closes it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    const onClick = (e: MouseEvent) => {
      if (!headerRef.current) return;
      if (!headerRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, []);

  // Hover-with-intent: open immediately, close after small delay so users
  // can move from trigger to panel without it snapping shut.
  function scheduleClose() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), 120);
  }
  function cancelClose() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  const activeMenu = MENUS.find((m) => m.id === openMenu) ?? null;

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-40 transition-colors duration-300",
        scrolled || openMenu
          ? "bg-parchment-50/92 backdrop-blur-md border-b border-ink/10 supports-[backdrop-filter]:bg-parchment-50/80"
          : "bg-transparent",
      )}
    >
      <div className="container flex items-center justify-between h-16 sm:h-20">
        <Link
          to="/"
          className="group focusable rounded-sm shrink-0"
          onMouseEnter={() => setOpenMenu(null)}
        >
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl tracking-tight text-ink">
              {brand.name}
            </span>
            <span
              className="hidden sm:inline-block font-sans text-[10px] uppercase tracking-[0.22em] text-gold-500/90"
              aria-hidden
            >
              Est. AD
            </span>
          </div>
        </Link>

        {/* Desktop nav: 3 mega-menu triggers */}
        <nav
          className="hidden lg:flex items-center gap-1"
          onMouseLeave={scheduleClose}
        >
          {MENUS.map((menu) => (
            <MegaMenuTrigger
              key={menu.id}
              menu={menu}
              isOpen={openMenu === menu.id}
              onOpen={() => {
                cancelClose();
                setOpenMenu(menu.id);
              }}
              onToggle={() =>
                setOpenMenu((cur) => (cur === menu.id ? null : menu.id))
              }
            />
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <LanguagePicker />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link to="/signup/artist">For Artists</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/browse">Commission</Link>
          </Button>

          {/* Mobile/tablet trigger */}
          <button
            type="button"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((v) => !v)}
            className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-sm text-ink hover:bg-parchment-100 focusable"
          >
            {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mega-menu panel — full-bleed, slides under the bar */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            key={activeMenu.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className="hidden lg:block absolute inset-x-0 top-full bg-parchment-50/96 backdrop-blur-md border-b border-ink/10 supports-[backdrop-filter]:bg-parchment-50/85 shadow-card"
            role="region"
            aria-label={`${activeMenu.label} menu`}
          >
            <MegaMenuPanel menu={activeMenu} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile/tablet drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="lg:hidden fixed inset-0 top-16 sm:top-20 z-50 bg-parchment-50 overflow-y-auto"
          >
            <motion.div
              initial={{ y: -12 }}
              animate={{ y: 0 }}
              exit={{ y: -12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="container py-8 pb-24"
            >
              <MobileNav />

              <div className="mt-10 grid gap-3">
                <Button asChild size="lg">
                  <Link to="/browse">Commission an artist</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/signup/artist">For artists</Link>
                </Button>
              </div>

              <p className="mt-10 font-serif italic text-ink-muted">
                {brand.motto}
                <span className="block text-xs not-italic font-sans uppercase tracking-[0.18em] mt-1">
                  {brand.mottoTranslation}
                </span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ───────── Desktop trigger ─────────
function MegaMenuTrigger({
  menu,
  isOpen,
  onOpen,
  onToggle,
}: {
  menu: MegaMenuDef;
  isOpen: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onOpen}
      onClick={onToggle}
      aria-haspopup="true"
      aria-expanded={isOpen}
      className={cn(
        "inline-flex items-center gap-1 px-3 py-2 rounded-sm font-sans text-sm tracking-wide transition-colors focusable",
        isOpen
          ? "text-burgundy-500"
          : "text-ink-soft hover:text-ink",
      )}
    >
      {menu.label}
      <ChevronDown
        className={cn(
          "h-3.5 w-3.5 transition-transform duration-200",
          isOpen && "rotate-180",
        )}
        aria-hidden
      />
    </button>
  );
}

// ───────── Desktop mega-menu panel ─────────
function MegaMenuPanel({ menu }: { menu: MegaMenuDef }) {
  return (
    <div className="container py-10 grid grid-cols-12 gap-10">
      {/* Columns of links */}
      <div className="col-span-7 grid grid-cols-2 gap-x-10 gap-y-8">
        {menu.columns.map((col) => (
          <div key={col.heading}>
            <div className="font-sans text-[10px] uppercase tracking-[0.28em] text-gold-600 mb-4">
              {col.heading}
            </div>
            <ul className="space-y-1">
              {col.links.map((link) => (
                <li key={link.to}>
                  <MenuLinkRow link={link} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Featured panel */}
      <div className="col-span-5">
        <FeatureCard feature={menu.feature} />
      </div>
    </div>
  );
}

function MenuLinkRow({ link }: { link: MenuLink }) {
  const Icon = link.icon;
  return (
    <Link
      to={link.to}
      className="group flex items-start gap-3 -mx-3 px-3 py-3 rounded-sm hover:bg-parchment-100 focusable transition-colors"
    >
      {Icon && (
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-burgundy-500/10 text-burgundy-500 group-hover:bg-burgundy-500 group-hover:text-parchment-50 transition-colors">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <div className="grow min-w-0">
        <div className="font-display text-base text-ink leading-tight">
          {link.label}
        </div>
        {link.description && (
          <div className="mt-0.5 font-serif text-sm text-ink-muted leading-snug">
            {link.description}
          </div>
        )}
      </div>
    </Link>
  );
}

function FeatureCard({ feature }: { feature: MegaMenuFeature }) {
  return (
    <Link
      to={feature.to}
      className="group block relative overflow-hidden rounded-md border border-ink/10 shadow-card focusable h-full min-h-[220px]"
      style={{
        background: `linear-gradient(135deg, ${feature.paletteFrom}, ${feature.paletteTo})`,
      }}
    >
      <div
        className="absolute inset-0 opacity-25 mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.45'/></svg>\")",
        }}
        aria-hidden
      />
      <div className="absolute inset-3 border border-parchment-50/15" aria-hidden />
      <div className="relative p-7 h-full flex flex-col text-parchment-50">
        <div className="font-sans text-[10px] uppercase tracking-[0.28em] text-gold-300/90">
          {feature.eyebrow}
        </div>
        <div
          className="mt-3 font-display italic text-2xl leading-tight tracking-tight"
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          {feature.title}
        </div>
        <p className="mt-3 font-serif text-sm leading-relaxed text-parchment-100/85 max-w-xs">
          {feature.body}
        </p>
        <div className="mt-auto pt-6 inline-flex items-center font-sans text-xs uppercase tracking-[0.22em] text-gold-300 group-hover:text-parchment-50 transition-colors">
          {feature.cta}
          <ArrowRight className="h-3.5 w-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

// ───────── Mobile nav ─────────
function MobileNav() {
  return (
    <div className="space-y-8">
      {MENUS.map((menu) => (
        <section key={menu.id}>
          <div className="font-sans text-[11px] uppercase tracking-[0.28em] text-gold-600 mb-4">
            {menu.label}
          </div>
          <ul className="space-y-1 -mx-2">
            {menu.columns.flatMap((c) => c.links).map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-start gap-3 px-2 py-3 rounded-sm focusable",
                        isActive
                          ? "bg-burgundy-500/10 text-burgundy-500"
                          : "text-ink hover:bg-parchment-100",
                      )
                    }
                  >
                    {Icon && (
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-burgundy-500/10 text-burgundy-500">
                        <Icon className="h-4 w-4" />
                      </span>
                    )}
                    <span className="grow min-w-0">
                      <span className="block font-display text-lg leading-tight">
                        {link.label}
                      </span>
                      {link.description && (
                        <span className="mt-0.5 block font-serif text-sm text-ink-muted leading-snug">
                          {link.description}
                        </span>
                      )}
                    </span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
