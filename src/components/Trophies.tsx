import { TROPHIES } from "../data";
import { Sculpture } from "./Sculpture";
import { Reveal } from "./Reveal";

export function Trophies() {
  return (
    <section id="wins" className="wins-section studio-container section-space">
      <div className="wins-layout">
        <div className="chapter-sticky">
          <Reveal>
            <h2>
              Sometimes, the
              <br />
              deadline is
              <br />
              <em>Sunday.</em>
            </h2>
            <p className="chapter-copy">
              Hackathons are where I find out how far a what if can go in a
              weekend. A few of those ideas made it onto a podium.
            </p>
          </Reveal>
          <Sculpture chapter="pressure" />
        </div>
        <div className="award-list">
          {TROPHIES.map((trophy) => (
            <Reveal key={trophy.event}>
              <div className="award-row">
                <span className="award-year">{trophy.year}</span>
                <div>
                  <h3>{trophy.event}</h3>
                  <p>{trophy.detail}</p>
                  <span
                    className={
                      trophy.place === "Champion"
                        ? "award-place champion"
                        : "award-place"
                    }
                  >
                    {trophy.place === "Champion" && "↗ "}
                    {trophy.place}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
