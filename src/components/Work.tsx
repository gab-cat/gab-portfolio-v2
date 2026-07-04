import { PROJECTS } from "../data";
import { Reveal, SectionHeading } from "./Reveal";

export function Work() {
  return (
    <section id="work" className="mx-auto max-w-6xl px-5 py-28 sm:px-8 md:py-36">
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
        sub="No mockups, no “concept pieces” — every one of these shipped and met real users."
      />

      <div>
        {PROJECTS.map((project, i) => (
          <Reveal key={project.name} delay={i * 0.05}>
            <a
              href={project.href}
              target="_blank"
              rel="noreferrer"
              className="group grid items-baseline gap-x-8 gap-y-3 border-t border-line py-10 transition-colors duration-300 last:border-b hover:bg-glow md:grid-cols-[72px_1fr_auto] md:px-4 md:py-12"
            >
              <span className="text-outline-flame font-display text-3xl font-bold md:text-4xl">
                {project.index}
              </span>

              <div>
                <h3 className="font-display text-3xl font-bold tracking-tight transition-colors duration-300 group-hover:text-flame md:text-5xl">
                  {project.name}
                </h3>
                <p className="mt-2 font-serif text-xl text-ember italic md:text-2xl">
                  {project.tagline}
                </p>
                <p className="mt-3 max-w-2xl leading-relaxed text-fog">
                  {project.story}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.tech.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-line px-3 py-1 font-mono text-xs text-fog transition-colors duration-300 group-hover:border-flame/40 group-hover:text-ink"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <span
                aria-hidden
                className="hidden self-center font-display text-3xl text-fog transition-all duration-300 group-hover:translate-x-1.5 group-hover:-translate-y-1.5 group-hover:text-flame md:block"
              >
                ↗
              </span>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
