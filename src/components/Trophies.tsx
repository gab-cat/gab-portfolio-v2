import { TROPHIES } from "../data";
import { Reveal } from "./Reveal";

export function Trophies() {
  return (
    <section id="wins" className="wins-section studio-container section-space">
      <div className="wins-layout">
        <Reveal>
          <p className="eyebrow">A competitive streak</p>
          <h2>
            Ideas with
            <br />
            some hardware
            <br />
            to show for it<span className="text-flame">.</span>
          </h2>
          <div className="award-rosette" aria-hidden="true">
            <span>✺</span>
            <b>
              Built under
              <br />
              pressure.
            </b>
          </div>
          <p className="wins-caption">
            A few good weekends.
            <br />A growing trophy shelf.
          </p>
        </Reveal>
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
