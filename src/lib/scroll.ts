type SmoothScroller = {
  scrollTo: (target: HTMLElement | number, options?: { duration: number }) => void;
  stop: () => void;
  start: () => void;
};

let scroller: SmoothScroller | null = null;

export function setScroller(next: SmoothScroller | null) {
  scroller = next;
}

function prefersReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (scroller) scroller.scrollTo(el, { duration: 1.15 });
  else el.scrollIntoView({ behavior: prefersReduced() ? "instant" : "smooth" });
}

export function scrollToTop() {
  if (scroller) scroller.scrollTo(0, { duration: 1.15 });
  else window.scrollTo({ top: 0, behavior: prefersReduced() ? "instant" : "smooth" });
}

export function stopLenis() {
  scroller?.stop();
}

export function startLenis() {
  scroller?.start();
}
