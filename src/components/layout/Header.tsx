import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import { brand } from "../../data/brand";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

const NAV = [
  { to: "/browse", label: "Browse Artists" },
  { to: "/about", label: "Mission" },
  { to: "/manifesto", label: "Manifesto" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-parchment-50/85 backdrop-blur-md border-b border-ink/10 supports-[backdrop-filter]:bg-parchment-50/70"
          : "bg-transparent",
      )}
    >
      <div className="container flex items-center justify-between h-16 sm:h-20">
        <Link to="/" className="group focusable rounded-sm">
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

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "font-sans text-sm tracking-wide transition-colors",
                  isActive
                    ? "text-burgundy-500"
                    : "text-ink-soft hover:text-ink",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
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

          {/* Mobile trigger */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-sm text-ink hover:bg-parchment-100 focusable"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 top-16 sm:top-20 z-50 bg-parchment-50"
          >
            <motion.nav
              initial={{ y: -16 }}
              animate={{ y: 0 }}
              exit={{ y: -16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="container py-8 flex flex-col gap-1 h-full"
            >
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "py-4 border-b border-ink/10 font-display text-3xl tracking-tight",
                      isActive ? "text-burgundy-500" : "text-ink",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-6 grid gap-3">
                <Button asChild size="lg">
                  <Link to="/browse">Commission an artist</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/signup/artist">Become an artist</Link>
                </Button>
              </div>
              <p className="mt-auto pt-8 font-serif italic text-ink-muted">
                {brand.motto}
                <span className="block text-xs not-italic font-sans uppercase tracking-[0.18em] mt-1">
                  {brand.mottoTranslation}
                </span>
              </p>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
