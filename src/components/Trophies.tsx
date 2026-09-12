import { TROPHIES } from "../data";
import { Sculpture } from "./Sculpture";
import { Reveal } from "./Reveal";

export function Trophies() {
  const featured = TROPHIES[0];
  return (
    <section id="wins" className="wins-section recognition-chapter section-space">
      <div className="studio-container">
        <Reveal className="recognition-intro">
          <p className="chapter-label">A little pressure. A lot of possibility.</p>
          <h2>Sometimes, the<br />deadline is <em>Sunday.</em></h2>
          <p className="chapter-copy">Hackathons are where I find out how far a what if can go in a weekend. A few of those ideas made it onto a podium.</p>
        </Reveal>
        <div className="recognition-stage">
          <Reveal className="champion-plinth">
            <div className="champion-art"><Sculpture chapter="pressure" /><span aria-hidden="true">1</span></div>
            <div className="champion-caption">
              <span className="champion-kicker">{featured.place} · {featured.year}</span>
              <h3>{featured.event}</h3>
              <p>{featured.detail}</p>
            </div>
          </Reveal>
          <div className="recognition-wall">
            {TROPHIES.slice(1).map((trophy, i) => (
              <Reveal key={trophy.event} delay={(i % 2) * .12} className="recognition-tile">
                <span className="recognition-year">{trophy.year}</span>
                <strong className="recognition-place">{trophy.place}</strong>
                <h3>{trophy.event}</h3>
                <p>{trophy.detail}</p>
              </Reveal>
            ))}
          </div>
        </div>
        <p className="recognition-outro">Good ideas deserve to leave the sketchbook. <em>Yours could be next.</em></p>
      </div>
    </section>
  );
}
