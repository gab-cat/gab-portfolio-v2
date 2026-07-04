import { motion } from "motion/react";
import type { ReactNode } from "react";

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="mb-14 md:mb-20">
      <Reveal>
        <p className="mb-4 font-mono text-xs tracking-[0.25em] text-flame uppercase">
          {kicker}
        </p>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className="font-display max-w-3xl text-4xl leading-[1.05] font-bold tracking-tighter text-balance md:text-6xl">
          {title}
        </h2>
      </Reveal>
      {sub && (
        <Reveal delay={0.16}>
          <p className="mt-5 max-w-xl text-base text-fog md:text-lg">{sub}</p>
        </Reveal>
      )}
    </div>
  );
}
