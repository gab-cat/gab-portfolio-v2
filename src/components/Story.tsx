import { STATS, TOOLBOX } from "../data";
import { Reveal } from "./Reveal";
import { Terminal } from "./Terminal";

export function Story() {
  return (
    <section id="story" className="story-section section-space">
      <div className="studio-container">
        <Reveal className="story-grid">
          <div>
            <p className="eyebrow">The person behind the pull requests</p>
            <h2>
              People first.
              <br />
              Code follows<span className="text-flame">.</span>
            </h2>
            <span className="story-asterisk" aria-hidden="true">
              ✳
            </span>
          </div>
          <div className="story-copy">
            <p className="story-lead">
              Good technology starts with giving a damn about the person using
              it.
            </p>
            <p>
              Three years answering support chats for Bell Canada taught me
              that. So I went from solving problems in a chat window to solving
              them in a code editor.
            </p>
            <p>
              Now I build full-stack products, run infrastructure at Detken, and
              keep ThePILLARS online. I also lead tech for my university’s CS
              community at Ateneo de Naga.
            </p>
            <p>
              And when I’m not shipping? Probably at a hackathon, seeing how far
              an idea can go in a weekend.
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
        <Reveal className="stats-row">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <strong>
                {stat.value.toLocaleString("en-US")}
                {stat.suffix}
              </strong>
              <span>{stat.label}</span>
              <small>{stat.note}</small>
            </div>
          ))}
        </Reveal>
        <div className="toolbox-layout">
          <Reveal>
            <p className="eyebrow">The everyday toolkit</p>
            <h3>
              From first commit
              <br />
              to production.
            </h3>
          </Reveal>
          <div className="toolbox-grid">
            {TOOLBOX.map((group) => (
              <div key={group.group}>
                <h4>{group.group}</h4>
                <p>{group.items.join(" · ")}</p>
              </div>
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
