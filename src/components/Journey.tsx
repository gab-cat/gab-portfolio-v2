import { JOURNEY } from "../data";
import { Reveal } from "./Reveal";

export function Journey() {
  return (
    <section
      id="journey"
      className="journey-section studio-container section-space"
    >
      <Reveal className="section-intro">
        <div>
          <p className="eyebrow">Experience</p>
          <h2>
            Always building.
            <br />
            <span className="soft-text">Always becoming.</span>
          </h2>
        </div>
        <p>
          From support chats to production servers.
          <br />
          Every chapter adds something.
        </p>
      </Reveal>
      <div className="experience-list">
        {[...JOURNEY].reverse().map((job) => (
          <Reveal key={job.company + job.period}>
            <details className="experience">
              <summary>
                <span className="experience-period">{job.period}</span>
                <span className="experience-title">
                  <strong>{job.role}</strong>
                  <span>{job.company}</span>
                </span>
                <span className="experience-toggle">+</span>
              </summary>
              <p>{job.blurb}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
