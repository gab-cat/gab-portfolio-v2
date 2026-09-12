import { motion, useReducedMotion, useInView, useAnimationControls } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

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
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: "0px 0px -35px 0px" });
  const controls = useAnimationControls();
  useEffect(() => {
    if (visible && !reduced) {
      void controls.start({ opacity: [0, 1], y: [y, 0], filter: ["blur(4px)", "blur(0px)"], transition: { duration: .85, delay, ease: EASE } });
    } else if (reduced) {
      controls.stop();
      controls.set({ opacity: 1, y: 0, filter: "none" });
    }
  }, [visible, reduced, controls, delay, y]);
  return <motion.div ref={ref} className={className} initial={false} animate={controls}>{children}</motion.div>;
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
        <h2 className="font-display max-w-3xl text-4xl leading-[1.05] font-bold tracking-tight text-balance md:text-6xl">
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
