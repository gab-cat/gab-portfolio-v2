import type { CSSProperties } from "react";
import { CRAFT, TOOLBOX } from "../data";
import { Reveal } from "./Reveal";
import { Sculpture, type SculptureChapter } from "./Sculpture";

/* What I do: one wide diorama with the whole crew, then a stack of cards,
   one per part of the job, each starring its own clay character. */
const CAST: { chapter: SculptureChapter; tone: string }[] = [
  { chapter: "robot", tone: "build" },
  { chapter: "servers", tone: "ship" },
  { chapter: "database", tone: "store" },
  { chapter: "controller", tone: "play" },
];

export function Craft() {
  return (
    <section id="craft" className="craft-section" aria-labelledby="craft-title">
      <div className="clay-container">
        <div className="craft-intro">
          <Reveal>
            <p className="chapter-label" style={{ "--chip": "var(--flame)" } as CSSProperties}>
              The day job · What I do
            </p>
            <h2 id="craft-title" className="chapter-title">
              These days, I build it. <em>And keep it alive.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="craft-intro-copy">
            <p>
              Four parts of the job, one habit behind all of them: listen
              first, then make it work. Here’s the whole crew.
            </p>
          </Reveal>
        </div>
        <Reveal className="craft-diorama">
          <Sculpture chapter="diorama" className="craft-diorama-slot" />
        </Reveal>

        <div className="craft-stack">
          {CRAFT.map((card, i) => {
            const tools = TOOLBOX[i];
            const { chapter, tone } = CAST[i];
            return (
              <article
                key={card.tag}
                className={`stack-card stack-card-${tone}`}
                style={{ "--i": i } as CSSProperties}
                aria-labelledby={`craft-${tone}`}
              >
                <div className="stack-card-copy">
                  <p className="stack-tag" aria-hidden="true">
                    <span>{card.tag}</span>
                    <i />
                    <i />
                  </p>
                  <h3 id={`craft-${tone}`}>
                    <span className="sr-only">{card.tag}: </span>
                    {card.title[0]}
                    <br />
                    <em>{card.title[1]}</em>
                  </h3>
                  <p className="stack-card-text">{card.copy}</p>
                  <ul className="stack-tools" aria-label={`${tools.group} tools`}>
                    {tools.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="stack-proof">
                    <b>{card.proof[0]}</b> {card.proof[1]}
                  </p>
                </div>
                <div className="stack-card-stage">
                  <Sculpture chapter={chapter} />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
