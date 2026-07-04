import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

/**
 * A soft orange ring that trails the pointer and swells over anything
 * clickable. Accent only — the native cursor stays. Desktop, motion-friendly
 * users only.
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);

  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  const x = useSpring(mx, { stiffness: 350, damping: 28, mass: 0.45 });
  const y = useSpring(my, { stiffness: 350, damping: 28, mass: 0.45 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    setEnabled(true);

    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
      setHovering(
        !!(e.target as Element | null)?.closest?.("a, button, input, [data-magnet]"),
      );
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[80] rounded-full border border-flame/50"
      style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      animate={{
        width: hovering ? 44 : 26,
        height: hovering ? 44 : 26,
        backgroundColor: hovering ? "var(--glow)" : "rgba(0,0,0,0)",
      }}
      transition={{ duration: 0.2 }}
    />
  );
}
