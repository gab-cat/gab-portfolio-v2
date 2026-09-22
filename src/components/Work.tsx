import type { CSSProperties } from "react";
import { PROJECTS } from "../data";
import { Sculpture, type SculptureChapter } from "./Sculpture";
import { Reveal } from "./Reveal";

const PROJECT_QUESTIONS = [
  "What if campus merch was the easy part?",
  "What if a community had a place of its own?",
  "What if game night didn’t need the same table?",
  "What if your morning came with a little magic?",
];

/* Each cover is a small clay set, lit like the rest of the site. */
const COVERS: { chapter: SculptureChapter; kind: string; tone: string }[] = [
  { chapter: "merch", kind: "Campus e-commerce", tone: "merch" },
  { chapter: "guild", kind: "Community hub", tone: "guild" },
  { chapter: "generals", kind: "Realtime multiplayer", tone: "generals" },
  { chapter: "tarot", kind: "Messenger bot", tone: "tarot" },
];

const PROJECT_TINTS = ["var(--sage)", "var(--lilac)", "var(--sky)", "var(--blush)"];

export function Work() {
  return (
    <section id="work" className="work-section">
      <div className="clay-container">
        <div className="work-intro">
          <Reveal>
            <p className="chapter-label" style={{ "--chip": "var(--sky)" } as CSSProperties}>
              Chapter three · Ideas, out in the open
            </p>
            <h2 className="chapter-title">
              A what if is better <em>out in the world.</em>
            </h2>
            <p className="chapter-copy">
              So I started shipping. A campus store. A home for a community. A
              game that brings people together. Little ideas, with real people
              on the other side.
            </p>
          </Reveal>
          <Sculpture chapter="possibility" className="work-globe" />
        </div>
        <div className="projects-grid">
          {PROJECTS.map((project, i) => (
            <Reveal
              key={project.name}
              className={`project project-${i}`}
              delay={(i % 2) * 0.08}
            >
              <p className="project-question">{PROJECT_QUESTIONS[i]}</p>
              <a
                className="project-link"
                href={project.href}
                target="_blank"
                rel="noreferrer noopener"
                style={{ "--tint": PROJECT_TINTS[i] } as CSSProperties}
                aria-label={`${project.name} — ${i === 1 ? "visit website" : "explore on GitHub"} (opens in a new tab)`}
              >
                <div className={`project-art project-art-${COVERS[i].tone}`}>
                  <Sculpture chapter={COVERS[i].chapter} />
                  <span className="project-kind" aria-hidden="true">{COVERS[i].kind}</span>
                  {i === 0 && (
                    <span className="art-sticker" aria-hidden="true">
                      2,750+<small>users in week one</small>
                    </span>
                  )}
                </div>
                <div className="project-heading">
                  <span className="project-index">{project.index}</span>
                  <h3>{project.name}</h3>
                  <span className="project-arrow" aria-hidden="true">↗</span>
                </div>
                <p className="project-tagline">{project.tagline}</p>
              </a>
              <p className="project-story">{project.story}</p>
              <div className="project-meta">
                <ul aria-label="Built with">
                  {project.tech.map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
                <span>{i === 1 ? "Live website" : "GitHub"} ↗</span>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="work-footnote">
          <p>Plus a drawer full of experiments, bots and weekend builds.</p>
          <a
            className="btn btn-ink"
            href="https://github.com/gab-cat"
            target="_blank"
            rel="noreferrer noopener"
          >
            More on GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
