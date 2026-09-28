import { useEffect, useRef } from "react";
import { Link } from "../../lib/router";

/**
 * What the home page's scroll loop hands the dial each frame: how far down
 * the page we are, how much static to show (between chapters or while
 * scrolling fast), and where each chapter sits along the page.
 */
export const dial = { progress: 0, noise: 0, stations: [] as number[] };

type Station = { id: string; label: string };

const BAND_LOW = 88;
const BAND_HIGH = 108;
const PAD = 10; // room above and below the band so the end bars can swell
const STEP = 5; // px between bars
const REACH = 64; // how far above and below the needle the waveform swells

const frequency = (p: number) => (BAND_LOW + p * (BAND_HIGH - BAND_LOW)).toFixed(1);
const hash = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/**
 * The home page's scroll progress as a radio tuner. A column of spectrum
 * bars is the band: passed bars are ink, the ones ahead are faint. The
 * orange needle rides the scroll with a live waveform around it that turns
 * to static between chapters and settles into a clean wave on each one.
 */
export function Dial({ stations, active, away }: { stations: readonly Station[]; active: number; away: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const tag = useRef<HTMLParagraphElement>(null);
  const freq = useRef<HTMLElement>(null);
  const nav = useRef<HTMLElement>(null);
  const lit = useRef(active);
  lit.current = active;
  const off = useRef(away);
  off.current = away;

  useEffect(() => {
    const el = canvas.current!;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    let ink = "#000";
    let fog = "#888";
    let accent = "#f60";
    const paint = () => {
      const css = getComputedStyle(root);
      ink = css.getPropertyValue("--ink").trim();
      fog = css.getPropertyValue("--fog").trim();
      accent = css.getPropertyValue("--accent").trim();
    };
    paint();
    const themed = new MutationObserver(paint);
    themed.observe(root, { attributes: true, attributeFilter: ["class"] });

    let w = 0;
    let h = 0;
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = el.clientWidth;
      h = el.clientHeight;
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const sized = new ResizeObserver(fit);
    sized.observe(el);

    const links = nav.current!.querySelectorAll("a");
    let raf = 0;
    let shown = dial.progress;
    let hiss = 0;
    let placed = "";
    let readout = "";
    let offAt = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      // Once the tune-out has played, stop painting until the dial comes back.
      if (!off.current) offAt = 0;
      else if (!offAt) offAt = now;
      if (!w || !h || (offAt && now - offAt > 900)) return;
      const t = still ? 0 : now / 1000;
      shown += (dial.progress - shown) * 0.25;
      hiss += ((still ? 0 : dial.noise) - hiss) * 0.12;
      const band = h - PAD * 2;
      const ny = PAD + shown * band;

      // Station links follow the chapters; they only move when the layout does.
      const key = dial.stations.join();
      if (key !== placed) {
        placed = key;
        dial.stations.forEach((s, i) => links[i]?.style.setProperty("top", `${PAD + s * band}px`));
      }
      tag.current!.style.transform = `translate3d(0, ${ny.toFixed(1)}px, 0)`;
      const f = frequency(shown);
      if (f !== readout) freq.current!.textContent = readout = f;

      ctx.clearRect(0, 0, w, h);
      const axis = w / 2;
      const frame = Math.floor(t * 22);
      for (let y = PAD; y <= h - PAD + 0.1; y += STEP) {
        const k = y / STEP;
        const d = (y - ny) / REACH;
        const env = Math.exp(-d * d);
        // A clean travelling wave when locked on, per-frame static when not.
        const clean = 0.5 + 0.5 * Math.sin(y * 0.19 - t * 3.1) * Math.cos(y * 0.041 + t * 1.3);
        const noise = hash(k, frame);
        const swing = clean * (1 - hiss) + noise * hiss;
        const idle = 0.5 + 0.5 * Math.sin(k * 0.9 + t * 0.8) * Math.sin(k * 0.37 - t * 0.5);
        const far = 2 + idle * 5 + hash(k, 7) * 3 + hiss * noise * 6;
        const len = far + env * (w - far) * (0.15 + 0.6 * swing);
        const passed = y < ny;
        ctx.globalAlpha = passed ? 0.7 : 0.3;
        ctx.fillStyle = passed ? ink : fog;
        ctx.fillRect(axis - len / 2, y - 0.35, len, 0.7);
        if (env > 0.02) {
          ctx.globalAlpha = env * env;
          ctx.fillStyle = accent;
          ctx.fillRect(axis - len / 2, y - 0.35, len, 0.7);
        }
      }

      dial.stations.forEach((s, i) => {
        const on = i === lit.current;
        const sy = PAD + s * band;
        ctx.globalAlpha = on ? 1 : sy < ny ? 0.8 : 0.45;
        ctx.fillStyle = on ? accent : ink;
        ctx.beginPath();
        ctx.arc(axis, sy, on ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // The needle: a hairline across the band, brighter where it meets the axis.
      const glow = ctx.createLinearGradient(0, 0, w, 0);
      glow.addColorStop(0, "transparent");
      glow.addColorStop(0.5, accent);
      glow.addColorStop(1, accent);
      ctx.globalAlpha = 1;
      ctx.fillStyle = glow;
      ctx.fillRect(0, ny - 0.5, w + 12, 1);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      themed.disconnect();
      sized.disconnect();
    };
  }, []);

  return (
    <nav ref={nav} className={`sg-dial${away ? " is-away" : ""}`} aria-label="Chapters" inert={away}>
      <canvas ref={canvas} aria-hidden="true" />
      <p ref={tag} className="sg-dial-tag" aria-hidden="true">
        <span>{stations[active].label}</span>
        <b>
          <i ref={freq}>{frequency(dial.progress)}</i>
          <small>FM</small>
        </b>
      </p>
      {stations.map((station, i) => (
        <Link
          key={station.id}
          href={`/#${station.id}`}
          className={i === active ? "is-on" : undefined}
          aria-current={i === active ? "location" : undefined}
        >
          <span>{station.label}</span>
        </Link>
      ))}
    </nav>
  );
}
