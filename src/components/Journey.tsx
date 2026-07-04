import { JOURNEY } from "../data";
import { Reveal, SectionHeading } from "./Reveal";

export function Journey() {
  return (
    <section id="journey" className="bg-surface/60">
      <div className="mx-auto max-w-6xl px-5 py-28 sm:px-8 md:py-36">
        <SectionHeading
          kicker="02 · the journey"
          title={
            <>
              Places I've made things{" "}
              <em className="font-serif text-[1.12em] text-flame">better</em>.
            </>
          }
          sub="From answering support chats to running the servers. Every stop taught me something the next one needed."
        />

        <div>
          {JOURNEY.map((job, i) => (
            <Reveal key={`${job.company}-${job.period}`} delay={i * 0.05}>
              <article className="group grid gap-2 border-t border-line py-8 transition-colors duration-300 last:border-b hover:bg-glow md:grid-cols-[200px_1fr] md:gap-8 md:px-4">
                <p className="font-mono text-sm text-fog transition-colors duration-300 group-hover:text-flame">
                  {job.period}
                </p>
                <div>
                  <h3 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                    {job.role}{" "}
                    <span className="font-normal text-flame">
                      · {job.company}
                    </span>
                  </h3>
                  <p className="mt-2 max-w-2xl leading-relaxed text-fog">
                    {job.blurb}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
