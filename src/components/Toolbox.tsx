import { useState } from "react";
import { TOOLBOX } from "../data";
import { Reveal } from "./Reveal";

/*
  05 · THE TOOLBOX — "the orbit"
  Every tool orbits the center on its own dashed ring — one ring per group,
  alternating directions, chips counter-rotating so they stay upright.
  Hovering the system freezes it; hovering a legend entry lights its ring.
  Echoes the hero: same rings, same icosphere energy. Falls back to a tidy
  grid below lg.
*/

const RING = [
  { radius: 118, duration: 70, reverse: false },
  { radius: 176, duration: 95, reverse: true },
  { radius: 234, duration: 120, reverse: false },
  { radius: 292, duration: 145, reverse: true },
] as const;

function Orbit({ hot }: { hot: number | null }) {
  return (
    <div className="orbit-stage relative hidden h-168 select-none lg:block">
      {/* soft center glow */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: "var(--glow)" }}
      />

      {/* dashed ring tracks */}
      {RING.map((ring, i) => (
        <div
          key={ring.radius}
          aria-hidden
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed transition-colors duration-500 ${
            hot === i ? "border-flame/50" : "border-line"
          }`}
          style={{ width: ring.radius * 2, height: ring.radius * 2 }}
        />
      ))}

      {/* orbiting chips, one rotor layer per group */}
      {TOOLBOX.map((group, i) => {
        const { radius, duration, reverse } = RING[i];
        const spin = reverse ? "spin-rev" : "spin-slow";
        const counter = reverse ? "spin-slow" : "spin-rev";
        return (
          <div
            key={group.group}
            className="orbit-spin absolute inset-0"
            style={{ animation: `${spin} ${duration}s linear infinite` }}
          >
            {group.items.map((item, j) => {
              const angle = (360 / group.items.length) * j + i * 30;
              return (
                <div
                  key={item}
                  className="absolute top-1/2 left-1/2"
                  style={{
                    transform: `rotate(${angle}deg) translateY(-${radius}px) rotate(${-angle}deg)`,
                  }}
                >
                  <div
                    className="orbit-spin"
                    style={{ animation: `${counter} ${duration}s linear infinite` }}
                  >
                    <span
                      className={`absolute top-0 left-0 block -translate-x-1/2 -translate-y-1/2 rounded-full border px-3.5 py-1.5 font-mono text-xs whitespace-nowrap shadow-sm transition-all duration-300 hover:scale-110 ${
                        hot === i
                          ? "border-flame/60 bg-card text-flame"
                          : "border-line bg-card text-fog hover:border-flame/60 hover:text-flame"
                      }`}
                    >
                      {item}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* center node */}
      <div className="absolute top-1/2 left-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-line bg-card shadow-[0_20px_60px_-20px_var(--glow)]">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flame opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-flame" />
        </span>
        <span className="mt-2.5 font-mono text-xs text-fog">~/toolbox</span>
      </div>
    </div>
  );
}

export function Toolbox() {
  const [hot, setHot] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-6xl overflow-x-clip px-5 pt-14 pb-28 sm:px-8 md:pt-16 md:pb-32">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,20rem)_1fr]">
        {/* heading + legend */}
        <div>
          <Reveal>
            <p className="mb-4 font-mono text-xs tracking-[0.25em] text-flame uppercase">
              05 · the toolbox
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance md:text-5xl">
              What I{" "}
              <em className="font-serif text-[1.12em] text-flame">
                build with
              </em>
              .
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-5 text-base text-fog md:text-lg">
              Grouped for humans, not recruiters' keyword scanners.
            </p>
          </Reveal>

          <Reveal delay={0.24} className="hidden lg:block">
            <ul className="mt-10" onMouseLeave={() => setHot(null)}>
              {TOOLBOX.map((group, i) => (
                <li key={group.group}>
                  <button
                    type="button"
                    onMouseEnter={() => setHot(i)}
                    onFocus={() => setHot(i)}
                    onBlur={() => setHot(null)}
                    className={`group flex w-full items-baseline gap-4 border-t border-line py-4 text-left transition-colors duration-300 last:border-b ${
                      hot === i ? "text-flame" : ""
                    }`}
                  >
                    <span className="font-mono text-xs text-fog">
                      0{i + 1}
                    </span>
                    <span className="font-display text-lg font-bold tracking-tight">
                      {group.group}
                      <span className="text-flame">.</span>
                    </span>
                    <span className="ml-auto font-mono text-xs text-fog">
                      ×{group.items.length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-6 font-mono text-xs text-fog">
              hover the system to freeze it ✦
            </p>
          </Reveal>
        </div>

        {/* the orbital system (lg+) */}
        <Reveal className="hidden lg:block">
          <Orbit hot={hot} />
        </Reveal>

        {/* compact fallback (below lg) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
          {TOOLBOX.map((group, i) => (
            <Reveal key={group.group} delay={i * 0.07}>
              <div className="h-full rounded-2xl border border-line bg-card p-6 transition-colors duration-500 hover:border-flame/40">
                <p className="font-mono text-xs text-fog">0{i + 1}</p>
                <h3 className="mt-1 font-display text-lg font-bold tracking-tight">
                  {group.group}
                  <span className="text-flame">.</span>
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-line px-3 py-1 font-mono text-xs text-fog"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
