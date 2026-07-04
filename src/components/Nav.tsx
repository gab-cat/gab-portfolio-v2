import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { scrollToId, scrollToTop, startLenis, stopLenis } from "../lib/lenis";
import { toggleTheme, useTheme } from "../lib/theme";
import { EASE } from "./Reveal";

const LINKS = [
  { id: "story", label: "story" },
  { id: "journey", label: "journey" },
  { id: "work", label: "work" },
  { id: "wins", label: "wins" },
] as const;

function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={ref}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`grid h-10 w-10 place-items-center rounded-full border border-line transition-colors duration-300 hover:border-flame hover:text-flame ${className}`}
      onClick={() => {
        const rect = ref.current?.getBoundingClientRect();
        toggleTheme(
          rect
            ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
            : undefined,
        );
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -60, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 60, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="block"
        >
          {theme === "dark" ? (
            /* moon */
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          ) : (
            /* sun */
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scrollspy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const { id } of LINKS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  // Freeze the page behind the mobile menu
  useEffect(() => {
    if (open) {
      stopLenis();
      document.body.style.overflow = "hidden";
    } else {
      startLenis();
      document.body.style.overflow = "";
    }
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    // wait a beat so the overlay clears before we glide
    window.setTimeout(() => scrollToId(id), open ? 80 : 0);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
          scrolled
            ? "border-b border-line bg-paper/75 backdrop-blur-md"
            : "border-b border-transparent"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <button
            onClick={scrollToTop}
            className="font-display text-lg font-bold tracking-tight"
            aria-label="Back to top"
          >
            gabcat<span className="text-flame">.dev</span>
          </button>

          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => go(id)}
                className={`rounded-full px-4 py-2 font-mono text-[13px] transition-colors duration-300 ${
                  active === id
                    ? "text-flame"
                    : "text-fog hover:text-ink"
                }`}
              >
                {active === id ? "● " : ""}
                {label}
              </button>
            ))}
            <button
              onClick={() => go("hello")}
              className="ml-2 rounded-full border border-flame/50 px-4 py-2 font-mono text-[13px] text-flame transition-colors duration-300 hover:bg-flame hover:text-white"
            >
              say hello
            </button>
            <ThemeToggle className="ml-3" />
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            <button
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full border border-line"
            >
              <span className="relative block h-3 w-5">
                <span
                  className={`absolute left-0 block h-[2px] w-5 bg-ink transition-transform duration-300 ${
                    open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-[2px] w-5 bg-ink transition-transform duration-300 ${
                    open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col justify-center bg-paper px-8 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {[...LINKS, { id: "hello", label: "say hello" }].map(
              ({ id, label }, i) => (
                <motion.button
                  key={id}
                  onClick={() => go(id)}
                  className="border-b border-line py-5 text-left font-display text-4xl font-bold tracking-tight transition-colors hover:text-flame"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.06 * i, ease: EASE }}
                >
                  {label}
                  <span className="text-flame">.</span>
                </motion.button>
              ),
            )}
            <motion.p
              className="mt-8 font-mono text-xs text-fog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Naga City, PH — open to opportunities
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
