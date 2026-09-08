import { useRef } from "react";
import type { PointerEvent, ReactNode } from "react";

export function DepthArt({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    ref.current?.style.setProperty("--tilt-x", `${(0.5 - y) * 9}deg`);
    ref.current?.style.setProperty("--tilt-y", `${(x - 0.5) * 11}deg`);
    ref.current?.style.setProperty("--shine-x", `${x * 100}%`);
    ref.current?.style.setProperty("--shine-y", `${y * 100}%`);
  };
  const reset = () => {
    ref.current?.style.setProperty("--tilt-x", "0deg");
    ref.current?.style.setProperty("--tilt-y", "0deg");
  };
  return <div className="depth-art" onPointerMove={move} onPointerLeave={reset}>
    <div className="depth-art-plane" ref={ref}>{children}<div className="depth-art-shine" aria-hidden="true" /></div>
  </div>;
}
