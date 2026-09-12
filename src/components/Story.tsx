import { TOOLBOX } from "../data";
import { Reveal } from "./Reveal";
import { StoryPortrait } from "./StoryPortrait";
import { Sculpture } from "./Sculpture";
import { Terminal } from "./Terminal";

export function Story() {
  return (
    <section id="story" className="story-section section-space">
      <div className="studio-container">
        <Reveal className="story-grid">
          <div className="story-visual">
            <h2>
              First, I learned
              <br />
              <em>to listen.</em>
            </h2>
            <div className="story-composition">
              <div className="story-portrait">
                <StoryPortrait />
              </div>
              <Sculpture chapter="connection" />
            </div>
          </div>
          <div className="story-copy">
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
              rel="noreferrer"
            >
              A bit more about me ↗
            </a>
          </div>
        </Reveal>
        <div className="toolbox-layout">
          <Reveal>
            <h3>
              These days, I build it.
              <br />
              And keep it alive.
            </h3>
          </Reveal>
          <div className="toolbox-grid">
            {TOOLBOX.map((group, i) => (
              <Reveal key={group.group} delay={i * .09}>
                <h4>{group.group}</h4>
                <p>{group.items.join(" · ")}</p>
              </Reveal>
            ))}
          </div>
        </div>
        <details className="terminal-disclosure">
          <summary>
            <span>
              <span className="text-flame">&gt;_</span> Prefer the command line?
            </span>
            <span className="terminal-disclosure-hint">
              There’s a working terminal in here. <b>+</b>
            </span>
          </summary>
          <div className="terminal-wrap">
            <Terminal />
          </div>
        </details>
      </div>
    </section>
  );
}
