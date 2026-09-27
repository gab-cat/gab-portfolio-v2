import Lenis from "lenis";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

/** One Lenis instance per exploration page. Reduced-motion visitors keep native scroll. */
export function useSmoothScroll(options: { lerp?: number } = {}) {
  const lenisRef = useRef<Lenis | null>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: options.lerp ?? 0.1, touchMultiplier: 1.4 });
    lenisRef.current = lenis;
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onClick = (event: MouseEvent) => {
      const a = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const el = document.querySelector(a.getAttribute("href")!);
      if (!el) return;
      event.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: 0, duration: 1.4 });
    };
    document.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [options.lerp]);
  return lenisRef;
}

/**
 * Masked line reveal: each line rises out of its own clip, staggered.
 * Pass lines explicitly so wraps are designed, not accidental.
 */
export function RiseLines({
  lines,
  as: Tag = "h2",
  className,
  delay = 0,
  stagger = 0.08,
  once = true,
  style,
  id,
}: {
  id?: string;
  lines: ReactNode[];
  as?: ElementType;
  className?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once, margin: "0px 0px -12% 0px" });
  const reduced = useReducedMotion();
  return (
    <Tag ref={ref} id={id} className={className} style={style}>
      {lines.map((line, i) => (
        <span key={i} style={{ display: "block", overflow: "hidden", paddingBottom: "0.06em", marginBottom: "-0.06em" }}>
          <motion.span
            style={{ display: "block" }}
            initial={reduced ? false : { y: "110%" }}
            animate={seen || reduced ? { y: "0%" } : { y: "110%" }}
            transition={{ duration: 1.05, delay: delay + i * stagger, ease: [0.19, 1, 0.22, 1] }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Fade-and-rise for supporting copy. */
export function Rise({
  children,
  className,
  delay = 0,
  y = 24,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "p" | "li" | "section";
}) {
  const reduced = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, delay, ease: [0.19, 1, 0.22, 1] }}
    >
      {children}
    </Comp>
  );
}

/** A 0 to 100 counter for preloaders. It parks near 86 until `ready`, then lands. */
export function useLoaderCount(ready: boolean, duration = 1400) {
  const reduced = useReducedMotion();
  const readyRef = useRef(ready);
  const [count, setCount] = useState(reduced ? 100 : 0);
  const [done, setDone] = useState(!!reduced);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let shown = 0;
    let timer = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const target = readyRef.current && t >= 1 ? 100 : Math.min(86, (1 - Math.pow(1 - t, 3)) * 100);
      shown += (target - shown) * 0.14;
      if (target === 100 && shown > 99.4) {
        setCount(100);
        timer = window.setTimeout(() => setDone(true), 280);
        return;
      }
      setCount(Math.floor(shown));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [duration, reduced]);
  return { count, done };
}
