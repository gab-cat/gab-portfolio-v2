type SmoothScroller = {
  scrollTo: (target: HTMLElement | number, options?: { duration: number }) => void;
  stop: () => void;
  start: () => void;
};

let scroller: SmoothScroller | null = null;
const frameListeners = new Set<() => void>();

export function setScroller(next: SmoothScroller | null) {
  scroller = next;
}

/** Called by the smooth scroller right after it moves the page, in the same frame. */
export function emitScrollFrame() {
  frameListeners.forEach((listener) => listener());
}

/** Draw in lockstep with the smooth scroller so fixed-canvas art never trails the page. */
export function onScrollFrame(listener: () => void) {
  frameListeners.add(listener);
  return () => {
    frameListeners.delete(listener);
  };
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
