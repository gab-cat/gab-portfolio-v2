import { useEffect, useRef, useState } from "react";
import type { SculptureController } from "../lib/sculpture";
import { isUserPaused, onMotionChange, setMotionPaused } from "../lib/motion";

export type SculptureChapter =
  | "connection"
  | "building"
  | "possibility"
  | "pressure"
  | "together"
  | "robot"
  | "servers"
  | "database"
  | "controller"
  | "diorama"
  | "lost"
  | "merch"
  | "guild"
  | "generals"
  | "tarot";

/** Layout slots share one renderer; each chapter has its own clay piece.
 * `track` names a section whose scroll progress drives the piece, for slots
 * that stay sticky while their chapter scrolls past. */
export function Sculpture({
  chapter,
  className = "",
  track,
}: {
  chapter: SculptureChapter;
  className?: string;
  track?: string;
}) {
  return (
    <div
      className={`chapter-sculpture ${className}`}
      data-sculpture={chapter}
      data-track={track}
      aria-hidden="true"
    >
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
    const observer = new IntersectionObserver(([entry]) => setAtFooter(entry.isIntersecting), { threshold: 0.6 });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);
  useEffect(() => onMotionChange(() => setPaused(isUserPaused())), []);
  useEffect(() => {
    let cancelled = false;
    let idle = 0;
    const load = () => {
      if (cancelled || controller.current) return;
      import("../lib/sculpture")
        .then(({ createSculpture }) => {
          if (cancelled || !host.current) return;
          controller.current = createSculpture(host.current, () => setReady(false));
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
      { rootMargin: "400px" },
    );
    slots.forEach((slot) => observer.observe(slot));
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (win.requestIdleCallback) {
      idle = win.requestIdleCallback(load, { timeout: 3000 });
    } else {
      idle = window.setTimeout(load, 900);
    }
    return () => {
      cancelled = true;
      observer.disconnect();
      win.cancelIdleCallback?.(idle);
      clearTimeout(idle);
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);
  return (
    <>
      <div ref={host} className="story-world" aria-hidden="true" />
      {ready && !atFooter && (
        <button
          className="world-motion"
          onClick={() => setMotionPaused(!paused)}
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
