import { Reveal } from "./Reveal";
import { Sculpture } from "./Sculpture";
import { scrollToId } from "../lib/lenis";

export function Hero() {
  return (
    <section className="narrative-hero studio-container" id="top">
      <div className="hero-opening"><Reveal y={45}>
        <h1>
          It starts with
          <br />a <em>what if.</em>
        </h1></Reveal><Reveal delay={.12} y={30}>
        <p className="hero-byline">I’m Gabriel Catimbang.</p>
        <p className="hero-premise">
          A developer who turns curiosity into things people use.
          <br className="desktop-break" /> Here’s how I got here, and what
          happened along the way.
        </p>
        <button className="round-link" onClick={() => scrollToId("story")}>
          <span className="round-link-icon">↓</span> Follow the curiosity
        </button>
      </Reveal></div>
      <Sculpture className="hero-sculpture" />
      <div className="narrative-hero-bottom">
        <span>From Naga City to the internet.</span>
        <button onClick={() => scrollToId("work")}>
          Or jump to the things I’ve built ↗
        </button>
      </div>
    </section>
  );
}
