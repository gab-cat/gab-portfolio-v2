import { motion, AnimatePresence, useDragControls } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { scrollToId } from "../lib/lenis";
import { Magnetic } from "./Magnetic";
import { EASE } from "./Reveal";
import { SphereField } from "./SphereField";
import { Terminal, type WindowAction } from "./Terminal";

type WindowState = "open" | "minimized" | "maximized" | "closed";

function ManilaClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-PH", {
          timeZone: "Asia/Manila",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{time}</span>;
}

export function Hero() {
  const stageRef = useRef<HTMLElement>(null);
  const dragControls = useDragControls();
  const [win, setWin] = useState<WindowState>("open");

  const onWindowAction = (action: WindowAction) => {
    setWin((prev) => {
      switch (action) {
        case "close":
          return "closed";
        case "minimize":
          return prev === "minimized" ? "open" : "minimized";
        case "maximize":
          return prev === "maximized" ? "open" : "maximized";
      }
    });
  };

  return (
    <section
      ref={stageRef}
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-5 pt-24 pb-20 text-center sm:px-8"
      /* bottom edge slants at the same 1.2° as the marquee tape, so the hero
         backdrop ends exactly on the banner instead of leaking past it */
      style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 2.1vw), 0 100%)" }}
    >
      {/* moving geometry: diamond lattice + drifting plus marks, faded at center */}
      <div aria-hidden className="bg-geo geo-fade pointer-events-none absolute inset-0" />
      <div aria-hidden className="bg-plus geo-fade plus-drift pointer-events-none absolute inset-0" />

      {/* centered halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[38%] left-1/2 h-[44rem] w-[70rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: "var(--glow)" }}
      />

      {/* the icosphere from the original site — a horizon dome rising below
          the name, never overlapping it */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-42%] h-[85%]"
      >
        <SphereField className="h-full w-full" focalScale={0.8} />
      </div>

      {/* counter-rotating dashed rings behind the stage */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[44%] left-1/2 hidden h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-flame/15 animate-[spin-slow_90s_linear_infinite] md:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[44%] left-1/2 hidden h-[33rem] w-[33rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-flame/10 animate-[spin-rev_70s_linear_infinite] md:block"
      />

      {/* the name — split around the glass so both words stay readable */}
      <motion.h1
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-10 pb-[10svh] font-display leading-[0.84] font-bold tracking-[-0.04em] uppercase select-none md:gap-[17svh]"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, ease: EASE }}
      >
        <span className="sr-only">Gabriel Catimbang</span>
        <span aria-hidden className="block text-[clamp(4rem,17vw,17rem)] opacity-90">
          Gabriel
        </span>
        <span
          aria-hidden
          className="masthead-hollow block text-[clamp(4rem,17vw,17rem)] opacity-35"
        >
          Catimbang
        </span>
      </motion.h1>

      {/* frosted-glass terminal — drag from chrome; traffic lights work */}
      <motion.div
        className={`relative z-10 mt-[5svh] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          win === "maximized" ? "w-[min(48rem,94vw)]" : "w-[min(33rem,94vw)]"
        }`}
        initial={{ opacity: 0, y: 34 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.35, ease: EASE }}
      >
        <AnimatePresence mode="wait">
          {win === "closed" ? (
            <motion.button
              key="reopen"
              type="button"
              onClick={() => setWin("open")}
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 6 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="mx-auto flex items-center gap-2 rounded-full border border-white/10 bg-term/70 px-4 py-2 font-mono text-xs text-[#8a8375] shadow-[0_16px_40px_-20px_var(--glow)] backdrop-blur-xl transition-colors hover:border-flame/40 hover:text-[#ece5d6]"
            >
              <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
              <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
              <span className="h-2 w-2 rounded-full bg-[#28c840]" />
              reopen terminal
            </motion.button>
          ) : (
            <motion.div
              key="window"
              drag
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={stageRef}
              dragElastic={0.06}
              dragMomentum={false}
              whileDrag={{ scale: 1.015, cursor: "grabbing", zIndex: 40 }}
              className="relative"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <Terminal
                glass
                windowState={
                  win === "maximized"
                    ? "maximized"
                    : win === "minimized"
                      ? "minimized"
                      : "open"
                }
                onWindowAction={onWindowAction}
                onChromePointerDown={(e) => dragControls.start(e)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* pitch + meta + CTAs */}
      <motion.div
        className="relative z-10 mt-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.6, ease: EASE }}
      >
        <p className="font-serif text-xl text-ink italic sm:text-2xl md:text-[1.55rem]">
          I build <span className="text-flame">things</span> for the internet —
          and I keep them <span className="text-flame">alive</span>.
        </p>

        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-xs tracking-[0.18em] text-fog uppercase">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flame opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-flame" />
          </span>
          open to opportunities — Naga City, PH — <ManilaClock /> UTC+8
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Magnetic>
            <button
              onClick={() => scrollToId("work")}
              className="rounded-full bg-flame px-7 py-3.5 font-display text-sm font-bold tracking-wide text-white transition-transform duration-300 hover:scale-[1.04] active:scale-95"
            >
              See the work ↓
            </button>
          </Magnetic>
          <Magnetic>
            <button
              onClick={() => scrollToId("hello")}
              className="rounded-full border border-line px-7 py-3.5 font-display text-sm font-bold tracking-wide transition-colors duration-300 hover:border-flame hover:text-flame"
            >
              Say hello
            </button>
          </Magnetic>
        </div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        className="absolute bottom-16 left-1/2 flex -translate-x-1/2 items-center gap-2 font-mono text-xs text-fog"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.3 }}
      >
        scroll
        <motion.span
          aria-hidden
          className="inline-block h-px w-10 bg-fog"
          animate={{ scaleX: [1, 0.4, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
