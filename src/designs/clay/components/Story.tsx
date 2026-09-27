import { lazy, Suspense, useState, type CSSProperties, type SyntheticEvent } from "react";
import { Reveal } from "./Reveal";
import { StoryPortrait } from "./StoryPortrait";
import { Sculpture } from "./Sculpture";

const Terminal = lazy(() =>
  import("./Terminal").then((mod) => ({ default: mod.Terminal })),
);

export function Story() {
  const [terminal, setTerminal] = useState(false);
  const onToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    if (event.currentTarget.open) setTerminal(true);
  };
  return (
    <section id="story" className="story-section">
      <div className="clay-container story-grid">
        <Reveal className="story-visual">
          <div className="portrait-card">
            <StoryPortrait />
            <span className="portrait-tag">
              <b>3 years</b> on the other side of a support chat
            </span>
          </div>
          <Sculpture chapter="connection" className="story-bubbles" />
        </Reveal>
        <div className="story-copy">
          <Reveal>
            <p className="chapter-label" style={{ "--chip": "var(--sage)" } as CSSProperties}>
              Chapter one · Listen
            </p>
            <h2 className="chapter-title">
              First, I learned <em>to listen.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="story-lead">
              Before I wrote code, I spent three years on the other side of a
              support chat.
            </p>
            <p>
              At Bell Canada, every conversation started with someone who needed
              something to work. Listening closely mattered more than having the
              fastest answer.
            </p>
            <p>
              That stayed with me. Eventually, I wanted to do more than help
              people work around a problem. I wanted to build the thing that
              solved it.
            </p>
            <a
              className="text-link"
              href="https://linkedin.com/in/gabrielcatimbang"
              target="_blank"
              rel="noreferrer noopener"
            >
              A bit more about me <span aria-hidden="true">↗</span>
            </a>
          </Reveal>
        </div>
      </div>

      <div className="clay-container story-terminal">
        <details className="terminal-disclosure" onToggle={onToggle}>
          <summary>
            <span className="terminal-disclosure-icon" aria-hidden="true">&gt;_</span>
            <span className="terminal-disclosure-text">
              <b>Prefer the command line?</b>
              <span>There’s a working terminal in here. Try <code>help</code> or <code>sudo hire-me</code>.</span>
            </span>
            <span className="terminal-disclosure-toggle" aria-hidden="true">+</span>
          </summary>
          <div className="terminal-wrap">
            {terminal && (
              <Suspense fallback={null}>
                <Terminal />
              </Suspense>
            )}
          </div>
        </details>
      </div>
    </section>
  );
}
