import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { EASE } from "./Reveal";

/*
  Full-bleed transitions — each one a page-wide moment that foreshadows the
  section it leads into:
  - RouteDivider  → 02: a journey route draws itself across the whole page,
    waypoints lighting up as the line passes, from "2022" to "now".
  - ShippedDivider → 03: poster-scale text scrubbed sideways by the scroll
    itself — the page physically drags it along.
  - OrbitDivider  → 05: three enormous dashed rings rise over the horizon at
    different speeds, satellites crawling along their arcs.
*/

/* -- 01 → 02: the route --------------------------------------------------- */

const WAYPOINTS = [
  { x: 0, y: 90, f: 0.02 },
  { x: 320, y: 110, f: 0.24 },
  { x: 640, y: 55, f: 0.46 },
  { x: 1040, y: 105, f: 0.72 },
  { x: 1440, y: 60, f: 0.97 },
];

function Waypoint({
  x,
  y,
  f,
  progress,
}: {
  x: number;
  y: number;
  f: number;
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, [f - 0.04, f + 0.02], [0, 1]);
  return (
    <>
      <circle cx={x} cy={y} r="4" className="fill-paper stroke-line" strokeWidth="1.5" />
      <motion.circle cx={x} cy={y} r="4.5" style={{ opacity }} className="fill-flame" />
    </>
  );
}

export function RouteDivider() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.95", "end 0.35"],
  });

  const d =
    "M0,90 C120,150 200,150 320,110 S520,20 640,55 S900,140 1040,105 S1300,30 1440,60";

  return (
    <div ref={ref} aria-hidden className="relative z-10 -mt-4 -mb-8 md:-mb-12">
      <svg
        viewBox="0 0 1440 180"
        preserveAspectRatio="none"
        className="h-36 w-full md:h-48"
        fill="none"
      >
        {/* the plan: faint dashed route */}
        <path d={d} className="stroke-line" strokeWidth="1.5" strokeDasharray="3 7" />
        {/* the trip so far: flame line drawn by your scroll */}
        <motion.path
          d={d}
          className="stroke-flame"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ pathLength: scrollYProgress }}
        />
        {WAYPOINTS.map((w) => (
          <Waypoint key={w.x} {...w} progress={scrollYProgress} />
        ))}
      </svg>
      <span className="absolute bottom-1 left-[4%] font-mono text-xs tracking-[0.2em] text-fog uppercase">
        2022 · support chats
      </span>
      <span className="absolute top-1 right-[4%] font-mono text-xs tracking-[0.2em] text-flame uppercase">
        now · the servers
      </span>
    </div>
  );
}

/* -- 02 → 03: scroll-dragged poster text ---------------------------------- */

export function ShippedDivider() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["4%", "-44%"]);

  const phrase = (key: string) => (
    <span key={key} className="flex shrink-0 items-center">
      <span className="text-ink">Shipped</span>
      <span className="mx-6 text-3xl text-flame md:mx-10 md:text-5xl">✦</span>
      <span className="text-outline">not shelved</span>
      <span className="mx-6 text-3xl text-flame md:mx-10 md:text-5xl">✦</span>
    </span>
  );

  return (
    <div ref={ref} aria-hidden className="overflow-x-clip py-8 select-none md:py-12">
      <motion.div
        style={{ x }}
        className="flex w-max items-center font-display text-[4.5rem] leading-none font-bold tracking-tight whitespace-nowrap uppercase will-change-transform md:text-[8rem]"
      >
        {["a", "b", "c"].map(phrase)}
      </motion.div>
    </div>
  );
}

/* -- 04 → 05: the system rises over the horizon --------------------------- */

const RINGS = [
  { width: "72rem", spin: "spin-slow", duration: 130, cls: "border-flame/40" },
  { width: "97rem", spin: "spin-rev", duration: 170, cls: "border-line" },
  { width: "124rem", spin: "spin-slow", duration: 210, cls: "border-flame/25" },
] as const;

export function OrbitDivider() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // inner ring climbs fastest, like a moon outrunning its planets
  const rises = [
    useTransform(scrollYProgress, [0, 1], [110, -20]),
    useTransform(scrollYProgress, [0, 1], [70, -6]),
    useTransform(scrollYProgress, [0, 1], [36, 4]),
  ];

  return (
    <div
      ref={ref}
      aria-hidden
      className="relative z-10 -mb-10 h-48 overflow-hidden select-none md:h-64"
    >
      {RINGS.map((ring, i) => (
        <motion.div
          key={ring.width}
          style={{ y: rises[i] }}
          className="absolute top-0 left-1/2 -translate-x-1/2"
        >
          <div style={{ width: ring.width }} className="relative aspect-square">
            <div
              className={`absolute inset-0 rounded-full border border-dashed ${ring.cls}`}
              style={{ animation: `${ring.spin} ${ring.duration}s linear infinite` }}
            >
              {/* satellite riding the ring */}
              <span className="absolute top-0 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-flame shadow-[0_0_10px_var(--glow)]" />
            </div>
          </div>
        </motion.div>
      ))}

      {/* apex beacon */}
      <motion.span
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4, ease: EASE }}
        className="absolute top-[4.2rem] left-1/2 flex h-2.5 w-2.5 -translate-x-1/2 md:top-[5.6rem]"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-flame opacity-50" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-flame" />
      </motion.span>
    </div>
  );
}
