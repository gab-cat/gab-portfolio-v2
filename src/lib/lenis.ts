import Lenis from "lenis";

let lenis: Lenis | null = null;

/** One Lenis instance for the whole app; skipped for reduced-motion users. */
export function initLenis(): (() => void) | undefined {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  lenis = new Lenis({
    lerp: 0.12,
    wheelMultiplier: 1,
    touchMultiplier: 1.3,
  });

  let frame = 0;
  const raf = (time: number) => {
    lenis?.raf(time);
    frame = requestAnimationFrame(raf);
  };
  frame = requestAnimationFrame(raf);

  return () => {
    cancelAnimationFrame(frame);
    lenis?.destroy();
    lenis = null;
  };
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el, { offset: -64, duration: 1.15 });
  } else {
    el.scrollIntoView({ behavior: "smooth" });
  }
}

export function stopLenis() {
  lenis?.stop();
}

export function startLenis() {
  lenis?.start();
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { duration: 1.15 });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}
