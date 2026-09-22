import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { MachineController } from "../lib/clay/machine";
import { isMotionPaused, onMotionChange } from "../lib/motion";
import { scrollToId } from "../lib/scroll";
import { Reveal } from "./Reveal";

/** Painted stand-in for the machine: shown before WebGL arrives, or instead of it. */
function HeroPoster() {
  return (
    <svg className="hero-poster" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <circle cx="1180" cy="250" r="95" fill="var(--butter)" opacity=".9" />
      <ellipse cx="260" cy="610" rx="620" ry="190" fill="#7fa36e" />
      <ellipse cx="1180" cy="620" rx="640" ry="210" fill="#5f8c5c" />
      <ellipse cx="720" cy="660" rx="760" ry="170" fill="#93b77d" />
      <rect x="0" y="640" width="1440" height="260" fill="#a9c690" />
    </svg>
  );
}

export function Hero() {
  const host = useRef<HTMLDivElement>(null);
  const machine = useRef<MachineController | null>(null);
  const [ready, setReady] = useState(false);
  const [shipped, setShipped] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setPaused(isMotionPaused());
    return onMotionChange(setPaused);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const load = () => {
      if (cancelled || machine.current) return;
      import("../lib/clay/machine")
        .then(({ createMachine }) => {
          if (cancelled || !host.current) return;
          machine.current = createMachine(host.current, {
            onReady: () => setReady(true),
            onShipped: setShipped,
          });
        })
        .catch(() => setReady(false));
    };
    const idle = win.requestIdleCallback
      ? win.requestIdleCallback(load, { timeout: 700 })
      : window.setTimeout(load, 120);
    return () => {
      cancelled = true;
      win.cancelIdleCallback?.(idle);
      clearTimeout(idle);
      machine.current?.dispose();
      machine.current = null;
    };
  }, []);

  const drop = () => machine.current?.drop();
  const onStageClick = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as Element).closest("a, button, p, h1")) return;
    drop();
  };

  return (
    <section
      className={`hero ${ready ? "is-live" : ""}`}
      id="top"
      aria-labelledby="hero-title"
      onClick={onStageClick}
    >
      <div className="hero-sky" aria-hidden="true" />
      <HeroPoster />
      <div ref={host} className="hero-scene" aria-hidden="true" />
      <div className="hero-shade" aria-hidden="true" />

      <div className="hero-copy clay-container">
        <Reveal y={40} className="hero-headline">
          <p className="hero-kicker">
            <span className="hero-kicker-dot" aria-hidden="true" />
            <span>
              Gabriel Catimbang · Developer &amp; DevOps
              <span className="hero-kicker-place"> · Naga City, PH</span>
            </span>
          </p>
          <h1 id="hero-title">
            It starts with
            <br />a <em>what if.</em>
          </h1>
        </Reveal>
        <Reveal delay={0.14} y={26} className="hero-aside">
          <p className="hero-premise">
            I’m <strong className="hero-premise-name">Gabriel Catimbang</strong>.
            I turn curiosity into things people use, and I build the pipelines
            that keep them running. Here’s how I got here.
          </p>
          <div className="hero-actions">
            <button className="btn btn-ink" onClick={() => scrollToId("story")}>
              Follow the curiosity <span aria-hidden="true">↓</span>
            </button>
            <button className="btn btn-card" onClick={() => scrollToId("work")}>
              See the work <span aria-hidden="true">↗</span>
            </button>
          </div>
        </Reveal>
      </div>

      {ready && (
        <div className="machine-console">
          <button
            className="drop-chip"
            onClick={drop}
            disabled={paused}
            aria-label="Drop an idea into the machine"
          >
            <span className="drop-ball" aria-hidden="true" />
            {paused ? "Machine paused" : "Drop an idea in"}
          </button>
          <span className="machine-count" aria-hidden="true">
            <b>{shipped.toString().padStart(3, "0")}</b> shipped
          </span>
        </div>
      )}
    </section>
  );
}
