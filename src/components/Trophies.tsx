import { TROPHIES } from "../data";
import { Reveal, SectionHeading } from "./Reveal";

export function Trophies() {
  return (
    <section id="wins" className="bg-surface/60">
      <div className="mx-auto max-w-6xl px-5 py-28 sm:px-8 md:py-36">
        <SectionHeading
          kicker="04 · the wins"
          title={
            <>
              The <em className="font-serif text-[1.12em] text-flame">trophy shelf</em>.
            </>
          }
          sub="Yes, it's real. And it's getting crowded."
        />

        <div>
          {TROPHIES.map((trophy, i) => {
            const champion = trophy.place.includes("Champion");
            return (
              <Reveal key={`${trophy.event}-${trophy.place}`} delay={i * 0.04}>
                <div className="group flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-line py-6 transition-all duration-300 last:border-b hover:translate-x-1.5 md:px-4">
                  <span className="w-12 font-mono text-sm text-fog">
                    {trophy.year}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 font-mono text-xs whitespace-nowrap ${
                      champion
                        ? "bg-flame font-bold text-white"
                        : "border border-flame/50 text-flame"
                    }`}
                  >
                    {trophy.place}
                  </span>
                  <h3 className="font-display text-lg font-bold tracking-tight transition-colors duration-300 group-hover:text-flame md:text-xl">
                    {trophy.event}
                  </h3>
                  <span className="hidden text-sm text-fog sm:inline">
                    {trophy.detail}
                  </span>
                </div>
              </Reveal>
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
