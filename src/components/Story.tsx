import { animate, useInView } from "motion/react";
import { useEffect, useRef } from "react";
import { STATS } from "../data";
import { EASE, Reveal, SectionHeading } from "./Reveal";

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
    <span className="font-display text-5xl font-bold tracking-tight text-flame md:text-6xl">
      <span ref={ref}>0</span>
      {suffix}
    </span>
  );
}

function Accent({ children }: { children: React.ReactNode }) {
  return <em className="font-serif text-[1.12em] text-flame">{children}</em>;
}

export function Story() {
  return (
    <section id="story" className="mx-auto max-w-6xl px-5 py-28 sm:px-8 md:py-36">
      <SectionHeading
        kicker="01 · the story"
        title={
          <>
            Not your typical <Accent>origin story</Accent>.
          </>
        }
      />

      <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 text-lg leading-relaxed md:text-xl">
          <Reveal>
            <p>
              I started out answering support chats for Bell Canada — three
              years of talking to people at their{" "}
              <Accent>most frustrated</Accent>. It taught me what most
              engineers learn too late: technology is only good when it works
              for the person on the other end.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <p>
              So I learned to build. Within a year I went from apprentice to
              the person an entire publication calls when the website{" "}
              <Accent>must not go down</Accent>. These days I run
              infrastructure for a dev studio, lead tech for my university's
              CS community, and I'm finishing my Computer Science degree at
              Ateneo de Naga.
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <p>
              And on weekends? I enter hackathons.{" "}
              <Accent>I rarely come home empty-handed.</Accent>
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-12 self-start">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={0.1 + i * 0.08}>
              <div className="border-t-2 border-line pt-4 transition-colors duration-500 hover:border-flame">
                <CountUp value={stat.value} suffix={stat.suffix} />
                <p className="mt-2 font-display text-sm font-bold tracking-wide uppercase">
                  {stat.label}
                </p>
                <p className="mt-1 font-mono text-xs text-fog">{stat.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
