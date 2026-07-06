import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { TROPHIES } from "../data";
import { EASE, Reveal, SectionHeading } from "./Reveal";

/*
  04 · THE WINS — "the spotlight"
  Hovering a row swings a giant ghost year across the backdrop and lights
  the row with a flame bar. Champion badges carry a slow shine sweep.
  Rows reveal with a left-to-right wipe instead of the usual fade-up.
*/

export function Trophies() {
  const [year, setYear] = useState<string>(TROPHIES[0].year);

  return (
    <section
      id="wins"
      className="relative overflow-hidden bg-linear-to-b from-paper via-surface/70 to-paper"
    >
      {/* ghost year, swapping with the hovered row */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden items-center overflow-hidden select-none lg:flex"
      >
        <AnimatePresence initial={false}>
          <motion.span
            key={year}
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-outline-flame absolute -right-12 font-display text-[24rem] leading-none font-bold opacity-[0.14]"
          >
            {year}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pt-28 pb-14 sm:px-8 md:pt-36 md:pb-16">
        <SectionHeading
          kicker="04 · the wins"
          title={
            <>
              The{" "}
              <em className="font-serif text-[1.12em] text-flame">
                trophy shelf
              </em>
              .
            </>
          }
          sub="Yes, it's real. And it's getting crowded."
        />

        <div onMouseLeave={() => setYear(TROPHIES[0].year)}>
          {TROPHIES.map((trophy, i) => {
            const champion = trophy.place.includes("Champion");
            return (
              <motion.div
                key={`${trophy.event}-${trophy.place}`}
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                whileInView={{ clipPath: "inset(0 0% 0 0)" }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, delay: i * 0.06, ease: EASE }}
              >
                <div
                  onMouseEnter={() => setYear(trophy.year)}
                  className="group relative flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-line py-6 pl-4 transition-all duration-300 last:border-b hover:pl-7 md:py-7"
                >
                  {/* flame bar that grows on hover */}
                  <span
                    aria-hidden
                    className="absolute top-0 bottom-0 left-0 w-[3px] origin-top scale-y-0 bg-linear-to-b from-flame to-ember transition-transform duration-400 group-hover:scale-y-100"
                  />
                  <span className="w-12 font-mono text-sm text-fog transition-colors duration-300 group-hover:text-flame">
                    {trophy.year}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 font-mono text-xs whitespace-nowrap ${
                      champion
                        ? "badge-shine bg-flame font-bold text-white"
                        : "border border-flame/50 text-flame"
                    }`}
                  >
                    {trophy.place}
                  </span>
                  <h3 className="font-display text-lg font-bold tracking-tight transition-colors duration-300 group-hover:text-flame md:text-2xl">
                    {trophy.event}
                  </h3>
                  <span className="hidden text-sm text-fog sm:inline">
                    {trophy.detail}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <Reveal delay={0.2}>
          <p className="mt-8 font-mono text-sm text-fog">
            <span className="text-flame">$</span> ls ~/trophies | wc -l
            <span className="text-flame"> → 7</span> … and counting.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
