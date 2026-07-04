import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { CURRENTLY } from "../data";
import { scrollToId } from "../lib/lenis";
import { Magnetic } from "./Magnetic";
import { EASE } from "./Reveal";
import { Terminal } from "./Terminal";

function Currently() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % CURRENTLY.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-baseline gap-2 font-mono text-sm">
      <span className="shrink-0 text-fog">currently:</span>
      <span className="relative block h-[1.4em] flex-1 overflow-hidden whitespace-nowrap">
        <AnimatePresence initial={false}>
          <motion.span
            key={i}
            className="absolute inset-x-0 text-flame"
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-110%", opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            {CURRENTLY[i]}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}

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

/** One masthead line, letters rising out of an overflow-hidden slot. */
function MastheadLine({
  word,
  delay,
  className = "",
}: {
  word: string;
  delay: number;
  className?: string;
}) {
  return (
    <span className="block overflow-hidden pb-[0.06em]" aria-hidden>
      {word.split("").map((letter, i) => (
        <motion.span
          key={i}
          className={`inline-block ${className}`}
          initial={{ y: "108%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.7, delay: delay + i * 0.035, ease: EASE }}
        >
          {letter}
        </motion.span>
      ))}
    </span>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* geometric backdrop: diamond lattice + plus marks */}
      <div aria-hidden className="bg-geo geo-fade pointer-events-none absolute inset-0" />
      <div aria-hidden className="bg-plus geo-fade pointer-events-none absolute inset-0" />

      {/* warm glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-168 w-2xl rounded-full blur-3xl"
        style={{ background: "var(--glow)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-52 bottom-0 h-144 w-xl rounded-full blur-3xl"
        style={{ background: "var(--glow)" }}
      />

      {/* slow-spinning dashed ring behind the terminal side */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[62%] -right-56 hidden h-176 w-176 -translate-y-1/2 rounded-full border border-dashed border-flame/20 animate-[spin-slow_90s_linear_infinite] lg:block"
      />

      <div className="relative mx-auto flex min-h-svh max-w-6xl flex-col px-5 pt-24 pb-10 sm:px-8">
        {/* dateline — like the top rule of a broadsheet */}
        <motion.div
          className="flex items-center justify-between gap-4 border-y border-line py-3 font-mono text-xs text-fog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flame opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-flame" />
            </span>
            open to opportunities
          </span>
          <span className="hidden md:inline">
            Naga City, PH — <ManilaClock /> UTC+8
          </span>
          <span className="hidden sm:inline">
            portfolio — vol. 02
          </span>
        </motion.div>

        {/* masthead */}
        <h1 className="mt-8 font-display leading-[0.88] font-bold tracking-[-0.03em] uppercase select-none md:mt-10">
          <span className="sr-only">Gabriel Catimbang</span>
          <span className="block text-[clamp(3rem,11.6vw,10.8rem)]">
            <MastheadLine word="Gabriel" delay={0.2} />
          </span>
          <span className="block text-[clamp(3rem,11.6vw,10.8rem)]">
            <MastheadLine
              word="Catimbang"
              delay={0.5}
              className="masthead-hollow"
            />
          </span>
        </h1>

        {/* pitch + terminal, collage row — terminal rides up over the masthead */}
        <div className="mt-10 grid flex-1 items-start gap-12 lg:mt-4 lg:grid-cols-[1fr_minmax(0,530px)] lg:gap-16">
          <div className="max-w-xl lg:pt-16">
            <motion.p
              className="font-serif text-2xl leading-snug text-ink italic md:text-[1.7rem]"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.0, ease: EASE }}
            >
              I build <span className="text-flame">things</span> for the
              internet — and I keep them{" "}
              <span className="text-flame">alive</span>.
            </motion.p>

            <motion.p
              className="mt-5 leading-relaxed text-fog md:text-lg"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.15, ease: EASE }}
            >
              Developer & DevOps engineer from the Philippines. By day I ship
              products people actually use; by night I collect hackathon
              trophies — seven so far.
            </motion.p>

            <motion.div
              className="mt-6 max-w-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1.3 }}
            >
              <Currently />
            </motion.div>

            <motion.div
              className="mt-9 flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.4, ease: EASE }}
            >
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
            </motion.div>
          </div>

          {/* the terminal, riding up over the masthead's baseline */}
          <motion.div
            className="relative lg:-mt-24"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.85, ease: EASE }}
          >
            <Terminal />
          </motion.div>
        </div>

        {/* bottom rule with scroll cue */}
        <motion.div
          className="mt-12 flex items-center justify-between border-t border-line pt-5 font-mono text-xs text-fog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.7 }}
        >
          <span>
            gabcat<span className="text-flame">.dev</span> — orange & black,
            always
          </span>
          <span className="flex items-center gap-2">
            scroll
            <motion.span
              aria-hidden
              className="inline-block h-px w-10 bg-fog"
              animate={{ scaleX: [1, 0.4, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
        </motion.div>
      </div>
    </section>
  );
}
