import type { CSSProperties } from "react";
import { TROPHIES } from "../data";
import { Sculpture } from "./Sculpture";
import { Reveal } from "./Reveal";

const TILE_COLORS = ["#fffaf2", "var(--butter)", "#fffaf2", "var(--sky)", "#fffaf2", "var(--blush)"];

export function Trophies() {
  const featured = TROPHIES[0];
  return (
    <section id="wins" className="wins-tray">
      <div className="clay-container">
        <Reveal className="wins-intro">
          <p className="chapter-label" style={{ "--chip": "var(--lilac)" } as CSSProperties}>
            Chapter four · A little pressure, a lot of possibility
          </p>
          <h2 className="chapter-title">
            Sometimes, the deadline is <em>Sunday.</em>
          </h2>
          <p className="chapter-copy">
            Hackathons are where I find out how far a what if can go in a
            weekend. A few of those ideas made it onto a podium.
          </p>
        </Reveal>
        <div className="wins-stage">
          <Reveal className="champion-card">
            <Sculpture chapter="pressure" className="champion-trophy" />
            <div className="champion-caption">
              <span className="champion-kicker">
                {featured.place} · {featured.year}
              </span>
              <h3>{featured.event}</h3>
              <p>{featured.detail}</p>
            </div>
          </Reveal>
          <ul className="wins-wall">
            {TROPHIES.slice(1).map((trophy, i) => (
              <li key={trophy.event}>
                <Reveal
                  delay={(i % 2) * 0.1}
                  className="win-tile"
                >
                  <div style={{ "--tile": TILE_COLORS[i] } as CSSProperties} className="win-tile-inner">
                    <span className="win-year">{trophy.year}</span>
                    <strong className="win-place">{trophy.place}</strong>
                    <h3>{trophy.event}</h3>
                    <p>{trophy.detail}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
        <p className="wins-outro">
          Good ideas deserve to leave the sketchbook. <em>Yours could be next.</em>
        </p>
      </div>
    </section>
  );
}
