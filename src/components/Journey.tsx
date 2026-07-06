import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { useRef, useState } from "react";
import { JOURNEY } from "../data";
import { EASE, Reveal } from "./Reveal";

/*
  02 · THE JOURNEY — "the timeline"
  A flame line draws itself down the page as you scroll; each stop ignites
  when you reach it. On desktop, a giant hollow year sits sticky beside the
  list and flips as the chapters change.
*/

const startYear = (period: string) => period.match(/\d{4}/)?.[0] ?? "";

function Heading() {
  return (
    <>
      <Reveal>
        <p className="mb-4 font-mono text-xs tracking-[0.25em] text-flame uppercase">
          02 · the journey
        </p>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className="font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance md:text-5xl">
          Places I've made things{" "}
          <em className="font-serif text-[1.12em] text-flame">better</em>.
        </h2>
      </Reveal>
      <Reveal delay={0.16}>
        <p className="mt-5 max-w-md text-base text-fog md:text-lg">
          From answering support chats to running the servers. Every stop
          taught me something the next one needed.
        </p>
      </Reveal>
    </>
  );
}

export function Journey() {
  const listRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 0.72", "end 0.55"],
  });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(JOURNEY.length - 1, Math.max(0, Math.floor(v * JOURNEY.length))));
  });

  const year = startYear(JOURNEY[active].period);

  return (
    <section
      id="journey"
      className="bg-linear-to-b from-paper via-surface/70 to-paper"
    >
      <div className="mx-auto max-w-6xl px-5 py-28 sm:px-8 md:py-36">
        {/* mobile heading */}
        <div className="mb-14 lg:hidden">
          <Heading />
        </div>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          {/* sticky column: heading + the giant year */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <Heading />

              <div aria-hidden className="relative mt-12 h-36 select-none">
                <AnimatePresence initial={false}>
                  <motion.span
                    key={year}
                    initial={{ y: 44, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -44, opacity: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="masthead-hollow absolute top-0 left-0 font-display text-[8.5rem] leading-none font-bold opacity-40"
                  >
                    {year}
                  </motion.span>
                </AnimatePresence>
              </div>

              <p aria-hidden className="mt-4 font-mono text-sm text-fog">
                <span className="text-flame">
                  {String(active + 1).padStart(2, "0")}
                </span>{" "}
                / {String(JOURNEY.length).padStart(2, "0")}
              </p>
            </div>
          </div>

          {/* the timeline itself */}
          <div ref={listRef} className="relative">
            {/* rail + self-drawing flame line */}
            <div
              aria-hidden
              className="absolute top-2 bottom-2 left-[7px] w-px bg-line"
            />
            <motion.div
              aria-hidden
              style={{ scaleY: scrollYProgress }}
              className="absolute top-2 bottom-2 left-[7px] w-px origin-top bg-linear-to-b from-flame to-ember"
            />

            {JOURNEY.map((job, i) => {
              const lit = i <= active;
              return (
                <Reveal key={`${job.company}-${job.period}`} delay={0.05}>
                  <article className="group relative py-7 pl-12 md:py-8">
                    {/* node */}
                    <span
                      aria-hidden
                      className={`absolute top-[2.35rem] left-0 h-[15px] w-[15px] rounded-full border-2 transition-all duration-500 md:top-[2.6rem] ${
                        lit
                          ? "border-flame bg-flame shadow-[0_0_16px_var(--glow),0_0_6px_rgba(255,92,26,0.5)]"
                          : "border-line bg-paper"
                      }`}
                    />
                    <p
                      className={`font-mono text-sm transition-colors duration-500 ${
                        lit ? "text-flame" : "text-fog"
                      }`}
                    >
                      {job.period}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-bold tracking-tight transition-transform duration-300 group-hover:translate-x-1.5 md:text-2xl">
                      {job.role}{" "}
                      <span className="font-normal text-flame">
                        · {job.company}
                      </span>
                    </h3>
                    <p className="mt-2 max-w-xl leading-relaxed text-fog">
                      {job.blurb}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
