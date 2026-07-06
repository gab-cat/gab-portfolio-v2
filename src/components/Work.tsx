import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { PROJECTS } from "../data";
import { Reveal, SectionHeading } from "./Reveal";

/*
  03 · THE WORK — "the deck"
  Each project is a full card that pins to the viewport; the next one slides
  up and stacks on top, edges peeking like a hand of cards. Cards underneath
  ease back slightly as they're covered.
*/

function Card({
  project,
  i,
  total,
  progress,
}: {
  project: (typeof PROJECTS)[number];
  i: number;
  total: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  // As the NEXT card arrives, this one settles back into the deck.
  const scale = useTransform(
    progress,
    [(i + 0.35) / total, (i + 1) / total],
    [1, i === total - 1 ? 1 : 0.955],
  );

  return (
    <div className="sticky" style={{ top: `${92 + i * 26}px` }}>
      <motion.a
        href={project.href}
        target="_blank"
        rel="noreferrer"
        style={{ scale }}
        className="group relative block origin-top overflow-hidden rounded-3xl border border-line bg-card p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] transition-colors duration-500 hover:border-flame/50 sm:p-10 md:p-14"
      >
        {/* watermark index */}
        <span
          aria-hidden
          className="text-outline-flame pointer-events-none absolute -top-6 right-2 font-display text-[9rem] leading-none font-bold opacity-25 transition-opacity duration-500 select-none group-hover:opacity-60 md:-top-10 md:right-6 md:text-[15rem]"
        >
          {project.index}
        </span>

        {/* card top rule */}
        <div className="mb-8 flex items-center gap-4 md:mb-10">
          <span className="font-mono text-xs tracking-[0.2em] text-flame uppercase">
            {project.index} — {String(total).padStart(2, "0")}
          </span>
          <span aria-hidden className="h-px w-16 bg-line transition-colors duration-500 group-hover:bg-flame/40" />
        </div>

        <div className="relative max-w-2xl">
          <h3 className="font-display text-4xl font-bold tracking-tight transition-colors duration-300 group-hover:text-flame sm:text-5xl md:text-6xl">
            {project.name}
          </h3>
          <p className="mt-3 font-serif text-xl text-ember italic md:text-2xl">
            {project.tagline}
          </p>
          <p className="mt-5 leading-relaxed text-fog md:text-lg">
            {project.story}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 md:mt-10">
          {project.tech.map((t) => (
            <span
              key={t}
              className="rounded-full border border-line px-3 py-1 font-mono text-xs text-fog transition-colors duration-300 group-hover:border-flame/40 group-hover:text-ink"
            >
              {t}
            </span>
          ))}
          <span className="ml-auto hidden items-center gap-2 font-mono text-sm text-fog transition-colors duration-300 group-hover:text-flame sm:flex">
            visit
            <span
              aria-hidden
              className="inline-block transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
            >
              ↗
            </span>
          </span>
        </div>
      </motion.a>
    </div>
  );
}

export function Work() {
  const deckRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: deckRef,
    offset: ["start 0.7", "end end"],
  });

  return (
    <section id="work" className="mx-auto max-w-6xl px-5 pt-12 pb-28 sm:px-8 md:pt-14 md:pb-36">
      <SectionHeading
        kicker="03 · the work"
        title={
          <>
            Things I've built{" "}
            <em className="font-serif text-[1.12em] text-flame">
              (that people actually used)
            </em>
            .
          </>
        }
        sub="No mockups, no “concept pieces” — every one of these shipped and met real users. Scroll to deal the deck."
      />

      <div ref={deckRef} className="grid gap-10 pb-8">
        {PROJECTS.map((project, i) => (
          <Card
            key={project.name}
            project={project}
            i={i}
            total={PROJECTS.length}
            progress={scrollYProgress}
          />
        ))}
      </div>

      <Reveal>
        <p className="mt-10 text-center font-mono text-sm text-fog">
          more experiments live on{" "}
          <a
            href="https://github.com/gab-cat"
            target="_blank"
            rel="noreferrer"
            className="text-flame underline-offset-4 hover:underline"
          >
            github.com/gab-cat
          </a>
        </p>
      </Reveal>
    </section>
  );
}
