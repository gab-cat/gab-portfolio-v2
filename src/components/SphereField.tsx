import { useEffect, useRef } from "react";
import { THEME_EVENT } from "../lib/theme";

/**
 * The wireframe icosahedron + orange particle field from the original site,
 * recreated with a plain 2D canvas projection instead of Three.js — same
 * motion (slow tumble, drifting particles, mouse parallax) at a fraction of
 * the weight. Pauses off-screen and renders a single static frame for
 * reduced-motion users.
 */

const RADIUS = 10;
const CAM_Z = 30;
const PARTICLE_COUNT = 220;

function buildIcosphere(): { verts: number[][]; edges: [number, number][] } {
  const t = (1 + Math.sqrt(5)) / 2;
  const base: number[][] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ];
  const faces: [number, number, number][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];

  const verts = base.map((v) => {
    const len = Math.hypot(...v);
    return v.map((c) => (c / len) * RADIUS);
  });

  // one subdivision pass (matches IcosahedronGeometry(10, 1))
  const midCache = new Map<string, number>();
  const midpoint = (a: number, b: number): number => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    const hit = midCache.get(key);
    if (hit !== undefined) return hit;
    const m = [0, 1, 2].map((i) => (verts[a][i] + verts[b][i]) / 2);
    const len = Math.hypot(...m);
    verts.push(m.map((c) => (c / len) * RADIUS));
    const idx = verts.length - 1;
    midCache.set(key, idx);
    return idx;
  };

  const edgeSet = new Set<string>();
  const edges: [number, number][] = [];
  const addEdge = (a: number, b: number) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push([a, b]);
  };

  for (const [a, b, c] of faces) {
    const ab = midpoint(a, b);
    const bc = midpoint(b, c);
    const ca = midpoint(c, a);
    for (const tri of [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]]) {
      addEdge(tri[0], tri[1]);
      addEdge(tri[1], tri[2]);
      addEdge(tri[2], tri[0]);
    }
  }
  return { verts, edges };
}

export function SphereField({
  className = "",
  focalScale = 0.62,
}: {
  className?: string;
  focalScale?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { verts, edges } = buildIcosphere();

    const particles = Array.from({ length: PARTICLE_COUNT }, () => [
      (Math.random() - 0.5) * 85,
      (Math.random() - 0.5) * 85,
      (Math.random() - 0.5) * 85,
    ]);

    let w = 0;
    let h = 0;
    let ink = "#f4efe5";
    let flame = "#ff5c1a";
    let mouseX = 0;
    let mouseY = 0;
    let camX = 0;
    let camY = 0;
    let raf = 0;
    let visible = true;
    const start = performance.now();

    const readColors = () => {
      const styles = getComputedStyle(document.documentElement);
      ink = styles.getPropertyValue("--ink").trim() || ink;
      flame = styles.getPropertyValue("--flame").trim() || flame;
    };
    readColors();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const project = (
      x: number, y: number, z: number,
      rotX: number, rotY: number, focal: number,
    ): [number, number, number] | null => {
      // rotate around X, then Y
      const cy1 = Math.cos(rotX), sy1 = Math.sin(rotX);
      const y1 = y * cy1 - z * sy1;
      const z1 = y * sy1 + z * cy1;
      const cx1 = Math.cos(rotY), sx1 = Math.sin(rotY);
      const x2 = x * cx1 + z1 * sx1;
      const z2 = -x * sx1 + z1 * cx1;
      const depth = CAM_Z - z2;
      if (depth < 4) return null;
      const s = focal / depth;
      return [w / 2 + (x2 - camX) * s, h / 2 - (y1 - camY) * s, depth];
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      camX += (mouseX * 4 - camX) * 0.03;
      camY += (-mouseY * 4 - camY) * 0.03;
      const focal = Math.min(w, h) * focalScale;

      ctx.clearRect(0, 0, w, h);

      // wireframe icosphere
      const rotX = t * 0.08;
      const rotY = t * 0.14;
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const [a, b] of edges) {
        const pa = project(verts[a][0], verts[a][1], verts[a][2], rotX, rotY, focal);
        const pb = project(verts[b][0], verts[b][1], verts[b][2], rotX, rotY, focal);
        if (!pa || !pb) continue;
        ctx.moveTo(pa[0], pa[1]);
        ctx.lineTo(pb[0], pb[1]);
      }
      ctx.stroke();

      // drifting particles
      const pRotX = mouseY * 0.2;
      const pRotY = -t * 0.05;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = flame;
      for (const [x, y, z] of particles) {
        const p = project(x, y, z, pRotX, pRotY, focal);
        if (!p) continue;
        const size = Math.min(3, Math.max(0.8, (focal / p[2]) * 0.34));
        ctx.fillRect(p[0], p[1], size, size);
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };

    const play = () => {
      if (raf || reduced || !visible || document.hidden) return;
      raf = requestAnimationFrame(loop);
    };
    const pause = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    if (reduced) {
      draw(start + 8000); // a single, settled frame
    } else {
      play();
    }

    const onMouse = (e: PointerEvent) => {
      mouseX = e.clientX / window.innerWidth - 0.5;
      mouseY = e.clientY / window.innerHeight - 0.5;
    };
    const onVisibility = () => (document.hidden ? pause() : play());
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visible ? play() : pause();
    });
    const ro = new ResizeObserver(resize);

    window.addEventListener("pointermove", onMouse, { passive: true });
    window.addEventListener(THEME_EVENT, readColors);
    document.addEventListener("visibilitychange", onVisibility);
    observer.observe(canvas);
    ro.observe(canvas);

    return () => {
      pause();
      window.removeEventListener("pointermove", onMouse);
      window.removeEventListener(THEME_EVENT, readColors);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
