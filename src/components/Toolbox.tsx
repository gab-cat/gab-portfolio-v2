import { TOOLBOX } from "../data";
import { Reveal, SectionHeading } from "./Reveal";

export function Toolbox() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-28 sm:px-8 md:py-32">
      <SectionHeading
        kicker="05 · the toolbox"
        title={
          <>
            What I{" "}
            <em className="font-serif text-[1.12em] text-flame">build with</em>.
          </>
        }
        sub="Grouped for humans, not recruiters' keyword scanners."
      />

      <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {TOOLBOX.map((group, i) => (
          <Reveal key={group.group} delay={i * 0.07}>
            <div className="border-t-2 border-line pt-4 transition-colors duration-500 hover:border-flame">
              <h3 className="font-display text-lg font-bold tracking-tight">
                {group.group}
                <span className="text-flame">.</span>
              </h3>
              <ul className="mt-4 space-y-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="font-mono text-sm text-fog transition-colors duration-200 hover:text-flame"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
