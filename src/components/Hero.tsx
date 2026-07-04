import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { CURRENTLY } from "../data";
import { scrollToId } from "../lib/lenis";
import { Magnetic } from "./Magnetic";
import { EASE } from "./Reveal";
import { Terminal } from "./Terminal";

function HeadlineLine({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className="block tracking-tighter"
        initial={{ y: "112%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

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
          second: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{time}</span>;
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* geometric backdrop: diamond lattice + plus marks, faded near the headline */}
      <div aria-hidden className="bg-geo geo-fade pointer-events-none absolute inset-0" />
      <div aria-hidden className="bg-plus geo-fade pointer-events-none absolute inset-0" />

      {/* warm glow behind the headline */}
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

      {/* slow-spinning dashed ring + static ring behind the terminal */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[44%] -right-56 hidden h-[46rem] w-[46rem] -translate-y-1/2 rounded-full border border-dashed border-flame/20 [animation:spin-slow_90s_linear_infinite] lg:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[44%] -right-40 hidden h-[38rem] w-[38rem] -translate-y-1/2 rounded-full border border-line lg:block"
      />

      {/* floating diamond accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[18%] right-[8%] hidden h-3 w-3 bg-flame [animation:float-bob_7s_ease-in-out_infinite] md:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[24%] left-[4%] hidden h-2.5 w-2.5 rotate-45 border border-flame/60 md:block"
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-5 pt-28 pb-16 sm:px-8 lg:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12">
          {/* Left: the pitch */}
          <div>
            <motion.p
              className="mb-6 flex items-center gap-2.5 font-mono text-sm text-fog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flame opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-flame" />
              </span>
              Hi, I'm Gabriel Catimbang — Gab for short.
            </motion.p>

            <h1 className="font-display text-[clamp(2.5rem,5.3vw,4.4rem)] leading-[1.04] font-bold tracking-tight">
              <HeadlineLine delay={0.15}>
                I build{" "}
                <em className="font-serif font-normal text-flame">things</em>
              </HeadlineLine>
              <HeadlineLine delay={0.27}>for the internet —</HeadlineLine>
              <HeadlineLine delay={0.39}>
                & keep them{" "}
                <span className="relative inline-block">
                  alive.
                  <motion.span
                    aria-hidden
                    className="absolute right-0 -bottom-1 left-0 h-[0.09em] origin-left bg-flame"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.7, delay: 1.15, ease: EASE }}
                  />
                </span>
              </HeadlineLine>
            </h1>

            <motion.p
              className="mt-7 max-w-xl text-base leading-relaxed text-fog md:text-lg"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65, ease: EASE }}
            >
              Developer & DevOps engineer from Naga City, Philippines. By day I
              ship products people actually use; by night I collect hackathon
              trophies — seven so far.
            </motion.p>

            <motion.div
              className="mt-7 max-w-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.85 }}
            >
              <Currently />
            </motion.div>

            <motion.div
              className="mt-10 flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.95, ease: EASE }}
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

          {/* Right: the toy */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55, ease: EASE }}
          >
            <Terminal />
          </motion.div>
        </div>

        {/* status strip */}
        <motion.div
          className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line pt-6 font-mono text-xs text-fog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.25 }}
        >
          <span>Naga City, PH</span>
          <span>
            local time <ManilaClock /> UTC+8
          </span>
          <span className="rounded-full border border-flame/40 px-3 py-1 text-flame">
            open to opportunities
          </span>
          <span className="ml-auto hidden items-center gap-2 sm:flex">
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
