import Lenis from "lenis";
import { setScroller } from "./scroll";

/** One Lenis instance for the homepage; skipped for reduced-motion users. */
export function initLenis(): (() => void) | undefined {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const lenis = new Lenis({
    lerp: 0.12,
    wheelMultiplier: 1,
    touchMultiplier: 1.3,
  });

  setScroller(lenis);

  let frame = 0;
  const raf = (time: number) => {
    lenis.raf(time);
    frame = requestAnimationFrame(raf);
  };
  frame = requestAnimationFrame(raf);

  return () => {
    cancelAnimationFrame(frame);
    setScroller(null);
    lenis.destroy();
  };
}
