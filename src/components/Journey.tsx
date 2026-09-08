import { JOURNEY } from "../data";
import { Sculpture } from "./Sculpture";
import { Reveal } from "./Reveal";

export function Journey() {
  return (
    <section
      id="journey"
      className="journey-section studio-container section-space narrative-split"
    >
      <div className="chapter-sticky">
        <Reveal>
          <h2>
            Then I moved
            <br />
            to the other side
            <br />
            <em>of the screen.</em>
          </h2>
          <p className="chapter-copy">
            An apprenticeship became full-stack work. Websites became
            infrastructure. Each step gave me a little more of the picture.
          </p>
        </Reveal>
        <Sculpture chapter="building" />
      </div>
      <div className="experience-list">
        {JOURNEY.map((job) => (
          <Reveal key={job.company + job.period}>
            <details className="experience" open>
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
