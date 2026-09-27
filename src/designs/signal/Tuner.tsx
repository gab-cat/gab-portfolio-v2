import { useEffect, useState } from "react";

/**
 * A small readout in the corner while the particle field loads: it counts
 * toward 86, lands on 100 when the field is up, then fades. It never covers
 * the page, so the prerendered copy is readable from the first paint.
 */
export function Tuner({ ready, failed }: { ready: boolean; failed: boolean }) {
  const [count, setCount] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (failed) return setGone(true);
    let raf = 0;
    let timer = 0;
    let shown = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 1200);
      const target = ready ? 100 : Math.min(86, (1 - Math.pow(1 - t, 3)) * 100);
      shown += (target - shown) * 0.16;
      if (ready && shown > 99.4) {
        setCount(100);
        timer = window.setTimeout(() => setGone(true), 900);
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
  }, [ready, failed]);

  return (
    <p className={`sg-tuner${count === 100 ? " is-locked" : ""}${gone ? " is-gone" : ""}`} aria-hidden="true">
      <span>{count === 100 ? "Signal locked" : "Tuning in"}</span>
      <b>{String(count).padStart(3, "0")}</b>
    </p>
  );
}
