import { PROJECTS } from "../data";
import { Reveal } from "./Reveal";

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
            <span>THE CAMPUS COLLECTION ↗</span>
          </div>
          <div className="merch-content">
            <div>
              <span className="mock-label">WEAR YOUR COMMUNITY.</span>
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
              <span>THE EVERYDAY TEE</span>
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
        <span className="guild-top">
          ATENEO DE NAGA UNIVERSITY <span>EST. COMMUNITY</span>
        </span>
        <div className="guild-type">
          &lt;cs<span>guild</span>/&gt;
        </div>
        <div className="guild-star">✳</div>
        <span className="guild-bottom">
          A place for the next
          <br />
          “I made this.”<span>CODE. CONNECT. CREATE.</span>
        </span>
      </div>
    );
  if (index === 2)
    return (
      <div className="project-art art-generals" aria-hidden="true">
        <span className="board-label">YOUR NEXT MOVE CHANGES EVERYTHING.</span>
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
          GAMES OF THE GENERALS <span>YOUR MOVE ↗</span>
        </span>
      </div>
    );
  return (
    <div className="project-art art-tarot" aria-hidden="true">
      <span className="tarot-label">A LITTLE GUIDANCE FROM THE UNIVERSE.</span>
      <div className="tarot-cards">
        <div className="tarot-card tarot-left">
          ☾<small>THE MOON</small>
        </div>
        <div className="tarot-card tarot-center">
          <span>XVII</span>✷<small>THE STAR</small>
        </div>
        <div className="tarot-card tarot-right">
          ☼<small>THE SUN</small>
        </div>
      </div>
      <span className="tarot-wordmark">
        Your Daily Tarot<span>GOOD MORNING, COSMOS.</span>
      </span>
    </div>
  );
}

export function Work() {
  return (
    <section id="work" className="work-section studio-container section-space">
      <Reveal className="section-intro">
        <div>
          <p className="eyebrow">Selected work · Built & shipped</p>
          <h2>
            Less talk.
            <br />
            <span className="soft-text">More “it’s live.”</span>
          </h2>
        </div>
        <p>
          A few things I’ve put into the world.
          <br />
          Real products, real people on the other side.
        </p>
      </Reveal>
      <div className="projects-grid">
        {PROJECTS.map((project, i) => (
          <Reveal
            key={project.name}
            className={`project project-${i}`}
            delay={(i % 2) * 0.08}
          >
            <a
              className="project-link"
              href={project.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.name} — ${i === 1 ? "visit website" : "explore on GitHub"} (opens in a new tab)`}
            >
              <ProjectArt index={i} />
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
      <div className="work-footnote">
        <span>Project artwork, made for this portfolio.</span>
        <a
          className="text-link"
          href="https://github.com/gab-cat"
          target="_blank"
          rel="noreferrer"
        >
          More on GitHub ↗
        </a>
      </div>
    </section>
  );
}
