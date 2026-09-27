import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowUpRight, Moon, SquaresFour, Sun, X } from "@phosphor-icons/react";
import { toggleTheme, useTheme } from "../../src/lib/theme";
import "./switcher.css";

export const DIRECTIONS = [
  { slug: "signal", name: "Signal", line: "22,000 particles that become your portrait" },
  { slug: "keys", name: "GC-61", line: "A 3D mechanical keyboard you can type on" },
  { slug: "onebit", name: "1-Bit Bicol", line: "A dithered flight from Naga City to the internet" },
  { slug: "kinetic", name: "Kinetic", line: "Variable type that reacts to you" },
  { slug: "toybox", name: "Toybox", line: "A physics playground of your career" },
] as const;

/** Round one, kept for comparison. */
export const EARLIER = [
  { slug: "support", name: "Support Chat" },
  { slug: "status", name: "Status Page" },
  { slug: "line", name: "The Line" },
  { slug: "zine", name: "Issue 01" },
  { slug: "film", name: "Feature Film" },
] as const;

export type Slug = (typeof DIRECTIONS)[number]["slug"] | (typeof EARLIER)[number]["slug"];

/** Review chrome shared by every direction: hop between them and flip the theme. */
export function Switcher({ current }: { current?: Slug }) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const flip = (event: MouseEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    toggleTheme({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
  };

  return (
    <div className="xs" ref={root}>
      {open && (
        <nav className="xs-menu" aria-label="Design directions">
          <a className="xs-home" href="/explorations/">
            All directions
          </a>
          <ol>
            {DIRECTIONS.map((d, i) => (
              <li key={d.slug}>
                <a href={`/explorations/${d.slug}/`} aria-current={d.slug === current ? "page" : undefined}>
                  <span className="xs-n">{i + 1}</span>
                  <span>
                    <b>{d.name}</b>
                    <small>{d.line}</small>
                  </span>
                </a>
              </li>
            ))}
          </ol>
          <p className="xs-earlier">
            Round one:{" "}
            {EARLIER.map((d, i) => (
              <span key={d.slug}>
                <a href={`/explorations/${d.slug}/`} aria-current={d.slug === current ? "page" : undefined}>
                  {d.name}
                </a>
                {i < EARLIER.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
          <a className="xs-live" href="/">
            Current site <ArrowUpRight size={14} weight="bold" aria-hidden />
          </a>
        </nav>
      )}
      <div className="xs-bar">
        <button
          type="button"
          className="xs-btn"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={16} weight="bold" aria-hidden /> : <SquaresFour size={16} weight="bold" aria-hidden />}
          <span>Directions</span>
        </button>
        <button
          type="button"
          className="xs-btn xs-icon"
          onClick={flip}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={16} weight="bold" aria-hidden /> : <Moon size={16} weight="bold" aria-hidden />}
        </button>
      </div>
    </div>
  );
}
