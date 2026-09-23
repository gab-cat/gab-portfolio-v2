import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "../lib/router";
import { scrollToId, scrollToTop, startLenis, stopLenis } from "../lib/scroll";
import { toggleTheme, useTheme } from "../lib/theme";
import { EASE } from "./Reveal";

const LINKS = [
  { id: "story", label: "About" },
  { id: "journey", label: "Experience" },
  { id: "work", label: "Work" },
  { id: "wins", label: "Recognition" },
] as const;

function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={ref}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
      className={`icon-btn ${className}`}
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
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          ) : (
            /* sun */
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
  const { route, navigate } = useRouter();
  const home = route === "home";
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sections = [...LINKS, { id: "hello" }].map(({ id }) =>
      document.getElementById(id),
    );
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const section = sections.slice().reverse().find(
        (el) => el && el.getBoundingClientRect().top <= window.innerHeight * 0.4,
      );
      setActive(window.scrollY < 100 ? "" : section?.id ?? "");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
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

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const main = document.querySelector("main");
    main?.setAttribute("inert", "");
    const focusTimer = window.setTimeout(
      () => menu.current?.querySelector<HTMLButtonElement>("button")?.focus(),
      50,
    );
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
      if (event.key === "Tab") {
        const items = [
          menuButton.current,
          ...Array.from(
            menu.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
          ),
        ].filter((el): el is HTMLButtonElement => !!el);
        const current = items.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        const next = event.shiftKey
          ? (current - 1 + items.length) % items.length
          : (current + 1) % items.length;
        event.preventDefault();
        items[next]?.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth >= 900) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(focusTimer);
      main?.removeAttribute("inert");
      document.body.style.overflow =
        previousOverflow === "hidden" ? "" : previousOverflow;
      startLenis();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    if (id === "hello") { navigate("/contact"); return; }
    if (!home) { navigate(`/#${id}`); return; }
    // wait a beat so the overlay clears before we glide
    window.setTimeout(() => scrollToId(id), open ? 80 : 0);
  };

  return (
    <>
      <header className="nav-shell">
        <nav className="clay-nav" aria-label="Main navigation" data-scrolled={scrolled || undefined}>
          <button
            onClick={() => home ? scrollToTop() : navigate("/")}
            className="nav-brand"
            aria-label="Gabcat, back to top"
          >
            <span className="nav-mark" aria-hidden="true" />
            <span>
              gabcat<sup>®</sup>
            </span>
          </button>

          <div className="nav-links">
            {LINKS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => go(id)}
                aria-current={active === id ? "location" : undefined}
                className="nav-link"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="nav-actions">
            <button onClick={() => go("hello")} className="btn btn-flame btn-sm nav-cta">
              Let’s talk <span aria-hidden="true">↗</span>
            </button>
            <ThemeToggle />
            <button
              ref={menuButton}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
              className="icon-btn nav-menu-btn"
            >
              <span className="relative block h-3 w-5">
                <span
                  className={`absolute left-0 block h-[2px] w-5 rounded bg-ink transition-transform duration-300 ${
                    open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-[2px] w-5 rounded bg-ink transition-transform duration-300 ${
                    open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menu}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {[...LINKS, { id: "hello", label: "Say hello" }].map(
              ({ id, label }, i) => (
                <motion.button
                  key={id}
                  onClick={() => go(id)}
                  className="mobile-menu-link"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, delay: 0.05 * i, ease: EASE }}
                >
                  {label}
                  <span aria-hidden="true">↗</span>
                </motion.button>
              ),
            )}
            <motion.p
              className="mobile-menu-note"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Naga City, PH · open to the next good thing
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
