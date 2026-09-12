import { PROJECTS } from "../data";
import { Sculpture } from "./Sculpture";
import { Reveal } from "./Reveal";
import { DepthArt } from "./DepthArt";

const PROJECT_QUESTIONS = [
  "What if campus merch was the easy part?",
  "What if a community had a place of its own?",
  "What if game night didn’t need the same table?",
  "What if your morning came with a little magic?",
];

function ProjectArt({ index }: { index: number }) {
  if (index === 0)
    return (
      <div className="project-art art-merch" aria-hidden="true">
        <div className="merch-orbit" />
        <div className="merch-window">
          <div className="mock-nav">
            <b>
              merchtrack<span>®</span>
            </b>
            <span>The campus collection ↗</span>
          </div>
          <div className="merch-content">
            <div>
              <strong>
                Campus.
                <br />
                Culture.
                <br />
                <em>Collected.</em>
              </strong>
              <span className="mock-shop">Find your everyday ↗</span>
            </div>
            <div className="shirt">
              <svg viewBox="0 0 200 220" fill="none">
                <path
                  d="M55 18 78 8c5 17 39 17 44 0l23 10 45 46-32 30-15-16 6 124H51l6-124-15 16-32-30 45-46Z"
                  fill="#23352c"
                />
                <path
                  d="M78 8c5 17 39 17 44 0"
                  stroke="#718775"
                  strokeWidth="5"
                />
                <text
                  x="100"
                  y="100"
                  textAnchor="middle"
                  fill="#ebf19e"
                  fontSize="21"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  GUILD
                </text>
                <text
                  x="100"
                  y="119"
                  textAnchor="middle"
                  fill="#ebf19e"
                  fontSize="7"
                  fontFamily="monospace"
                >
                  BUILT DIFFERENT.
                </text>
              </svg>
              <span>The everyday tee</span>
            </div>
          </div>
        </div>
        <span className="art-sticker">
          2,750+<small>users in week one</small>
        </span>
      </div>
    );
  if (index === 1)
    return (
      <div className="project-art art-guild" aria-hidden="true">
        <span className="guild-top">Ateneo de Naga University</span>
        <div className="guild-type">
          &lt;cs<span>guild</span>/&gt;
        </div>
        <div className="guild-star">✳</div>
        <span className="guild-bottom">
          A place for the next
          <br />
          “I made this.”<span>Code. Connect. Create.</span>
        </span>
      </div>
    );
  if (index === 2)
    return (
      <div className="project-art art-generals" aria-hidden="true">
        <span className="board-label">Your next move changes everything.</span>
        <div className="game-board">
          {Array.from({ length: 40 }, (_, i) => (
            <span key={i} className="board-cell">
              {[3, 5, 11, 16, 22, 26, 28, 33, 36].includes(i) && (
                <i className={i < 20 ? "piece-light" : "piece-dark"}>
                  {i % 3 === 0 ? "★" : "❯"}
                </i>
              )}
            </span>
          ))}
        </div>
        <span className="board-bottom">
          Games of the Generals <span>Your move ↗</span>
        </span>
      </div>
    );
  return (
    <div className="project-art art-tarot" aria-hidden="true">
      <span className="tarot-label">A little guidance from the universe.</span>
      <div className="tarot-cards">
        <div className="tarot-card tarot-left">
          ☾<small>The moon</small>
        </div>
        <div className="tarot-card tarot-center">
          <span>XVII</span>✷<small>The star</small>
        </div>
        <div className="tarot-card tarot-right">
          ☼<small>The sun</small>
        </div>
      </div>
      <span className="tarot-wordmark">
        Your Daily Tarot<span>Good morning, cosmos.</span>
      </span>
    </div>
  );
}

export function Work() {
  return (
    <section id="work" className="work-section work-gallery studio-container section-space">
      <div className="gallery-layout">
        <div className="gallery-intro">
          <Reveal>
            <p className="chapter-label">Ideas, out in the open</p>
            <h2>
              A what if is better
              <br />
              <em>out in the world.</em>
            </h2>
            <p className="chapter-copy">
              So I started shipping. A campus store. A home for a community. A
              game that brings people together. Little ideas, with real people
              on the other side.
            </p>
          </Reveal>
          <div className="gallery-sculpture"><Sculpture chapter="possibility" /></div>
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
                aria-label={`${project.name} — ${i === 1 ? "visit website" : "explore on GitHub"} (opens in a new tab)`}
              >
                <DepthArt>
                  <ProjectArt index={i} />
                </DepthArt>
                <div className="project-heading">
                  <h3>{project.name}</h3>
                  <span className="project-arrow">↗</span>
                </div>
                <p className="project-tagline">{project.tagline}</p>
              </a>
              <p className="project-story">{project.story}</p>
              <div className="project-meta">
                <span>{project.tech.join(" / ")}</span>
                <span>{i === 1 ? "Live website" : "GitHub"} ↗</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <div className="work-footnote">
        <a
          className="text-link"
          href="https://github.com/gab-cat"
          target="_blank"
          rel="noreferrer noopener"
        >
          More on GitHub ↗
        </a>
      </div>
    </section>
  );
}
