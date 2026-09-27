import { useEffect, useLayoutEffect, useRef, type ElementType, type ReactNode, type RefObject } from "react";

/**
 * Scroll reveals that behave with prerendered HTML. Copy that is already on
 * screen when the page first hydrates stays put (hiding it would flash and
 * delay the first paint that counts); everything below the fold, and
 * everything on later client-side visits, rises into place as it scrolls in.
 * Plain IntersectionObserver and Web Animations, no animation library.
 */

const EASING = "cubic-bezier(0.19, 1, 0.22, 1)";

let booted = false;
/** The frame calls this once; anything mounted after the first hydration is a client-side visit. */
export function useBootFlag() {
  useEffect(() => {
    booted = true;
  }, []);
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type Style = { opacity?: string; transform: string };

type Options = {
  parts: (root: HTMLElement) => HTMLElement[];
  from: Style;
  to: Style;
  duration: number;
  delay: number;
  gap: number;
};

function useReveal(ref: RefObject<HTMLElement | null>, { parts, from, to, duration, delay, gap }: Options) {
  // Survives StrictMode's second effect pass so nothing is hidden twice.
  const phase = useRef<"new" | "kept" | "hidden" | "shown">("new");

  // Runs once per mount on purpose: the decision is made against the first paint.
  useIsoLayoutEffect(() => {
    const root = ref.current;
    if (!root || phase.current !== "new") return;
    const box = root.getBoundingClientRect();
    const onScreen = box.top < window.innerHeight && box.bottom > 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || (!booted && onScreen)) {
      phase.current = "kept";
      return;
    }
    for (const el of parts(root)) Object.assign(el.style, from);
    phase.current = "hidden";
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!root || phase.current !== "hidden") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        phase.current = "shown";
        parts(root).forEach((el, i) => {
          // Drop the hidden inline style and let the animation hold the start frame through its delay.
          el.style.removeProperty("opacity");
          el.style.removeProperty("transform");
          el.animate([{ ...from }, { ...to }], {
            duration: duration * 1000,
            delay: (delay + i * gap) * 1000,
            easing: EASING,
            fill: "backwards",
          });
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);
}

const RISE = { from: { opacity: "0", transform: "translateY(24px)" }, to: { opacity: "1", transform: "translateY(0px)" } };
const LINE = { from: { transform: "translateY(130%)" }, to: { transform: "translateY(0%)" } };

type Common = { as?: ElementType; className?: string; id?: string; delay?: number };

/** Fade-and-rise for supporting copy. */
export function Rise({ as: Tag = "div", className, id, delay = 0, children }: Common & { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref, { parts: (root) => [root], ...RISE, duration: 0.9, delay, gap: 0 });
  return (
    <Tag ref={ref} id={id} className={className}>
      {children}
    </Tag>
  );
}

/** Fade-and-rise each child in turn: list rows, stats. */
export function Stagger({ as: Tag = "div", className, id, delay = 0, children }: Common & { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref, { parts: (root) => Array.from(root.children) as HTMLElement[], ...RISE, duration: 0.8, delay, gap: 0.06 });
  return (
    <Tag ref={ref} id={id} className={className}>
      {children}
    </Tag>
  );
}

/** Masked line reveal. Lines are passed explicitly so the breaks are designed, not accidental. */
export function Lines({ as: Tag = "h2", className, id, delay = 0, lines }: Common & { lines: ReactNode[] }) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref, {
    parts: (root) => Array.from(root.querySelectorAll<HTMLElement>(":scope > .sg-ln > span")),
    ...LINE,
    duration: 1.05,
    delay,
    gap: 0.08,
  });
  return (
    <Tag ref={ref} id={id} className={className}>
      {lines.map((line, i) => (
        <span className="sg-ln" key={i}>
          {/* the trailing space keeps "noise to" from reading as "noiseto" */}
          <span>
            {line}
            {i < lines.length - 1 ? " " : null}
          </span>
        </span>
      ))}
    </Tag>
  );
}
