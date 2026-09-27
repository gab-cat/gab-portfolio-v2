import { useRef, type PointerEvent, type ReactNode } from "react";

/**
 * Children drift toward a mouse cursor while hovered and spring back on
 * leave. The spring is a CSS transition (see .sg-magnet); touch and reduced
 * motion get no drift.
 */
export function Magnetic({ children, strength = 0.3 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  // Measured on entry, before any drift, so the pull doesn't feed back on itself.
  const home = useRef<DOMRect | null>(null);

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || event.pointerType !== "mouse") return;
    const box = (home.current ??= el.getBoundingClientRect());
    const x = (event.clientX - box.left - box.width / 2) * strength;
    const y = (event.clientY - box.top - box.height / 2) * strength;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  };

  const leave = () => {
    home.current = null;
    ref.current?.style.removeProperty("transform");
  };

  return (
    <div ref={ref} className="sg-magnet" onPointerMove={move} onPointerLeave={leave}>
      {children}
    </div>
  );
}
