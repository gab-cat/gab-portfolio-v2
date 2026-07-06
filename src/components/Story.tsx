import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef } from "react";
import { STATS } from "../data";
import { EASE, Reveal } from "./Reveal";

/*
  01 · THE STORY — "the manifesto"
  One flowing statement instead of paragraphs. Each word inks itself in as
  you scroll past, like the page is being read aloud. Stats close it out as
  a full-width ledger strip.
*/

const MANIFESTO: { text: string; accent?: boolean }[] = [
  {
    text: "I started out answering support chats for Bell Canada — three years of talking to people at their",
  },
  { text: "most frustrated.", accent: true },
  {
    text: "It taught me what most engineers learn too late: technology is only good when it works for the person on the other end. So I learned to build. Within a year I went from apprentice to the person an entire publication calls when the website",
  },
  { text: "must not go down.", accent: true },
  {
    text: "These days I run infrastructure for a dev studio, lead tech for my university's CS community, and I'm finishing Computer Science at Ateneo de Naga. And on weekends? I enter hackathons.",
  },
  { text: "I rarely come home empty-handed.", accent: true },
];

function Word({
  progress,
  start,
  end,
  accent,
  children,
  still,
}: {
  progress: MotionValue<number>;
  start: number;
  end: number;
  accent?: boolean;
  children: string;
  still: boolean;
}) {
  const opacity = useTransform(progress, [start, end], [0.13, 1]);
  return (
    <motion.span
      style={{ opacity: still ? 1 : opacity }}
      className={accent ? "font-serif text-[1.08em] text-flame italic" : undefined}
    >
      {children}{" "}
    </motion.span>
  );
}

function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.82", "end 0.42"],
  });

  const words = MANIFESTO.flatMap((seg) =>
    seg.text.split(" ").map((word) => ({ word, accent: seg.accent })),
  );
  const n = words.length;

  return (
    <p
      ref={ref}
      className="max-w-5xl font-display text-[1.65rem] leading-[1.32] font-bold tracking-tight sm:text-3xl md:text-[2.55rem] md:leading-[1.28]"
    >
      {words.map(({ word, accent }, i) => (
        <Word
          key={i}
          progress={scrollYProgress}
          start={(i / n) * 0.92}
          end={(i / n) * 0.92 + 0.08}
          accent={accent}
          still={!!reduced}
        >
          {word}
        </Word>
      ))}
    </p>
  );
}

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ref.current.textContent = value.toLocaleString();
      return;
    }
    const controls = animate(0, value, {
      duration: 1.8,
      ease: EASE,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString();
      },
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span className="font-display text-6xl font-bold tracking-tight text-flame md:text-7xl">
      <span ref={ref}>0</span>
      {suffix}
    </span>
  );
}

/* Border recipe per cell: 2×2 ledger on mobile, single row on desktop */
const CELL_BORDERS = [
  "border-r border-b lg:border-r-0 lg:border-b-0",
  "border-b lg:border-b-0 lg:border-l",
  "border-r lg:border-r-0 lg:border-l",
  "lg:border-l",
];

export function Story() {
  const ghostRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ghostRef,
    offset: ["start end", "end start"],
  });
  const ghostY = useTransform(scrollYProgress, [0, 1], ["6rem", "-6rem"]);

  return (
    <section
      id="story"
      ref={ghostRef}
      className="relative overflow-hidden pt-28 pb-16 md:pt-40 md:pb-20"
    >
      {/* parallax ghost numeral */}
      <motion.span
        aria-hidden
        style={{ y: ghostY }}
        className="text-outline pointer-events-none absolute top-10 -right-6 font-display text-[16rem] leading-none font-bold opacity-[0.07] select-none md:text-[26rem]"
      >
        01
      </motion.span>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="mb-12 flex items-center gap-5 md:mb-16">
            <p className="shrink-0 font-mono text-xs tracking-[0.25em] text-flame uppercase">
              01 · the story
            </p>
            <span aria-hidden className="h-px flex-1 bg-line" />
            <p className="hidden shrink-0 font-mono text-xs text-fog sm:block">
              read as you scroll ↓
            </p>
          </div>
        </Reveal>

        <Manifesto />
      </div>

      {/* the ledger — stats as a full-width strip */}
      <div className="mx-auto mt-20 max-w-6xl px-5 sm:px-8 md:mt-28">
        <Reveal>
          <div className="grid grid-cols-2 border-y border-line lg:grid-cols-4">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className={`group border-line px-6 py-10 transition-colors duration-500 hover:bg-glow md:px-8 md:py-12 ${CELL_BORDERS[i]}`}
              >
                <CountUp value={stat.value} suffix={stat.suffix} />
                <p className="mt-3 font-display text-sm font-bold tracking-wide uppercase">
                  {stat.label}
                </p>
                <p className="mt-1 font-mono text-xs text-fog transition-colors duration-500 group-hover:text-flame">
                  {stat.note}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
