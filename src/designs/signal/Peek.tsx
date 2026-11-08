import { useEffect, useRef, useState, type PointerEvent } from "react";

type Shot = { slug: string; name: string; image?: string };

const WIDTH = 384;
const HEIGHT = 240;
const GAP = 28;
const EDGE = 16;

/**
 * A project's screenshot trailing a mouse pointer across a list of projects,
 * so the real thing shows before the click. Mouse only: touch has the
 * thumbnails in the rows, and keyboard users get the project page. The
 * screenshots are requested on the first hover, then cross-fade as the
 * pointer moves from row to row. It keeps clear of the hovered row's
 * [data-peek-avoid] text (the project's name), so it never hides what you
 * are pointing at. Under reduced motion it sits by the pointer without
 * trailing.
 */
export function usePeek(shots: readonly Shot[]) {
  const [armed, setArmed] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const motion = useRef({ x: 0, y: 0, tx: 0, ty: 0, px: 0, py: 0, raf: 0, settle: 0, placed: false, calm: false });
  // The hovered row, re-measured on every move: its name grows bolder on hover.
  const hovered = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const m = motion.current;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => (m.calm = calm.matches);
    sync();
    calm.addEventListener("change", sync);
    return () => {
      calm.removeEventListener("change", sync);
      cancelAnimationFrame(m.raf);
      clearTimeout(m.settle);
    };
  }, []);

  const draw = () => {
    const m = motion.current;
    const el = box.current;
    if (!el) return;
    const k = m.calm ? 1 : 0.16;
    m.x += (m.tx - m.x) * k;
    m.y += (m.ty - m.y) * k;
    el.style.transform = `translate3d(${m.x.toFixed(1)}px, ${m.y.toFixed(1)}px, 0)`;
    m.raf = Math.abs(m.tx - m.x) + Math.abs(m.ty - m.y) > 0.3 ? requestAnimationFrame(draw) : 0;
  };

  const aim = (event?: PointerEvent) => {
    const m = motion.current;
    if (event) {
      m.px = event.clientX;
      m.py = event.clientY;
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Right of the pointer and of the row's name, or left of the pointer when the right edge is near; never off screen.
    const from = Math.max(m.px, hovered.current ? textRight(hovered.current) : 0);
    const right = from + GAP + WIDTH <= w - EDGE;
    m.tx = right ? from + GAP : m.px - GAP - WIDTH;
    m.tx = Math.min(Math.max(m.tx, EDGE), w - WIDTH - EDGE);
    m.ty = Math.min(Math.max(m.py - HEIGHT / 2, EDGE), h - HEIGHT - EDGE);
    if (!m.placed) {
      // The first frame lands where it should, so it never flies in from a corner.
      m.x = m.tx;
      m.y = m.ty;
      m.placed = true;
    }
    if (!m.raf) m.raf = requestAnimationFrame(draw);
  };

  const mouse = (event: PointerEvent) => event.pointerType === "mouse";

  const list = {
    onPointerMove: (event: PointerEvent) => {
      if (mouse(event)) aim(event);
    },
    onPointerLeave: () => {
      setActive(null);
      hovered.current = null;
      motion.current.placed = false;
    },
  };

  const row = (shot: Shot) => ({
    onPointerEnter: (event: PointerEvent<HTMLElement>) => {
      if (!mouse(event)) return;
      setArmed(true);
      hovered.current = event.currentTarget;
      aim(event);
      setActive(shot.image ? shot.slug : null);
      // The name finishes growing bolder after the pointer stops; step aside once it has.
      clearTimeout(motion.current.settle);
      motion.current.settle = window.setTimeout(() => hovered.current && aim(), 560);
    },
  });

  const view = (
    <div ref={box} className={`sg-peek${active ? " is-on" : ""}`} aria-hidden="true">
      {armed &&
        shots.map(
          (shot) =>
            shot.image && (
              <img
                key={shot.slug}
                className={shot.slug === active ? "is-on" : undefined}
                src={shot.image}
                width={1280}
                height={800}
                alt=""
                decoding="async"
              />
            ),
        )}
    </div>
  );

  return { list, row, view };
}

/** Where the hovered row's name actually ends: its text, not its block, which can run the full column. */
function textRight(row: HTMLElement) {
  let right = 0;
  const range = document.createRange();
  for (const el of row.querySelectorAll("[data-peek-avoid]")) {
    // Text nodes only: a range over an element also returns its block boxes, which span the column.
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walk.nextNode(); node; node = walk.nextNode()) {
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) right = Math.max(right, rect.right);
    }
  }
  return right;
}
