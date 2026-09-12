import { useEffect, useRef, useState } from "react";
import type { SculptureController } from "../lib/sculpture";

export type SculptureChapter =
  | "curiosity"
  | "connection"
  | "building"
  | "possibility"
  | "pressure"
  | "together";

/** Layout slots share one renderer; each chapter has its own physical form. */
export function Sculpture({
  chapter = "curiosity",
  className = "",
}: {
  chapter?: SculptureChapter;
  className?: string;
}) {
  return (
    <div
      className={`chapter-sculpture ${className}`}
      data-sculpture={chapter}
      aria-hidden="true"
    >
      <div className="sculpture-halo" />
      <div className="sculpture-fallback">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

export function StoryWorld() {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<SculptureController | null>(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [atFooter, setAtFooter] = useState(false);
  useEffect(() => {
    const footer = document.getElementById("footer");
    if (!footer) return;
    const observer = new IntersectionObserver(([entry]) => setAtFooter(entry.isIntersecting), { threshold: .6 });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let cancelled = false;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setPaused(preference.matches);
    syncMotion();
    preference.addEventListener("change", syncMotion);
    import("../lib/sculpture")
      .then(({ createSculpture }) => {
        if (cancelled || !host.current) return;
        controller.current = createSculpture(host.current, () =>
          setReady(false),
        );
        setReady(!!controller.current);
      })
      .catch(() => setReady(false));
    return () => {
      cancelled = true;
      preference.removeEventListener("change", syncMotion);
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);
  useEffect(() => controller.current?.setPaused(paused), [paused, ready]);
  return (
    <>
      <div ref={host} className="story-world" aria-hidden="true" />
      {ready && !atFooter && (
        <button
          className="world-motion"
          onClick={() => setPaused(!paused)}
          aria-pressed={paused}
          aria-label={paused ? "Resume 3D motion" : "Pause 3D motion"}
        >
          <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>{" "}
          {paused ? "Resume motion" : "Pause motion"}
        </button>
      )}
    </>
  );
}
