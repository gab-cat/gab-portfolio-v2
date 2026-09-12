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
    let idle = 0;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setPaused(preference.matches);
    syncMotion();
    preference.addEventListener("change", syncMotion);
    const load = () => {
      if (cancelled || controller.current) return;
      import("../lib/sculpture")
        .then(({ createSculpture }) => {
          if (cancelled || !host.current) return;
          controller.current = createSculpture(host.current, () =>
            setReady(false),
          );
          setReady(!!controller.current);
        })
        .catch(() => setReady(false));
    };
    const slots = document.querySelectorAll("[data-sculpture]");
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        load();
      },
      { rootMargin: "220px" },
    );
    slots.forEach((slot) => observer.observe(slot));
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (win.requestIdleCallback) {
      idle = win.requestIdleCallback(load, { timeout: 2200 });
    } else {
      idle = window.setTimeout(load, 400);
    }
    return () => {
      cancelled = true;
      observer.disconnect();
      win.cancelIdleCallback?.(idle);
      clearTimeout(idle);
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
