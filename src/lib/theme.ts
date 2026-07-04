import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const THEME_EVENT = "gab:themechange";

export function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);
  window.dispatchEvent(new Event(THEME_EVENT));
}

/**
 * Flip the theme. When the browser supports the View Transitions API the
 * new mode sweeps out from `origin` (the toggle button) as a growing circle;
 * otherwise everything cross-fades.
 */
export function setTheme(next: Theme, origin?: { x: number; y: number }) {
  if (next === currentTheme()) return;

  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { ready: Promise<void> };
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!doc.startViewTransition || reduced || !origin) {
    document.documentElement.classList.add("theme-fade");
    apply(next);
    window.setTimeout(
      () => document.documentElement.classList.remove("theme-fade"),
      500,
    );
    return;
  }

  const transition = doc.startViewTransition(() => apply(next));
  transition.ready.then(() => {
    const { x, y } = origin;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${radius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 650,
        easing: "cubic-bezier(0.33, 1, 0.68, 1)",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  });
}

export function toggleTheme(origin?: { x: number; y: number }): Theme {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  setTheme(next, origin);
  return next;
}

export function useTheme(): Theme {
  // Starts as "light" so server render is deterministic; the effect syncs the
  // real theme immediately after hydration.
  const [theme, set] = useState<Theme>("light");
  useEffect(() => {
    const onChange = () => set(currentTheme());
    onChange();
    window.addEventListener(THEME_EVENT, onChange);
    return () => window.removeEventListener(THEME_EVENT, onChange);
  }, []);
  return theme;
}
