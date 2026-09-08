import { useEffect, useState } from "react";
import { scrollToId } from "../lib/lenis";

function ManilaClock() {
  const [time, setTime] = useState("--:--");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-PH", {
          timeZone: "Asia/Manila",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);
  return <span>{time} PHT</span>;
}

function CutoutPortrait() {
  return (
    <figure className="cutout-portrait">
      <div className="portrait-halftone" aria-hidden="true" />
      <svg
        className="portrait-cutout"
        viewBox="0 0 900 1200"
        role="img"
        aria-label="Gab Catimbang in a navy shirt, with a black-and-white halftone print treatment"
      >
        <defs>
          {/* Derive the silhouette from the untextured portrait so white
              halftone dots inside the subject stay opaque in both themes. */}
          <filter
            id="portrait-matte"
            colorInterpolationFilters="sRGB"
            x="0"
            y="0"
            width="100%"
            height="100%"
          >
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -0.3333 -0.3333 -0.3333 0 1"
            />
            <feComponentTransfer>
              <feFuncA type="linear" slope="50" intercept="-1" />
            </feComponentTransfer>
          </filter>
          <mask
            id="portrait-silhouette"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="900"
            height="1200"
            style={{ maskType: "alpha" }}
          >
            <image
              href="/portraits/gab-editorial.webp"
              width="900"
              height="1200"
              filter="url(#portrait-matte)"
            />
          </mask>
        </defs>
        <image
          href="/portraits/gab-halftone.webp"
          width="900"
          height="1200"
          mask="url(#portrait-silhouette)"
        />
      </svg>
      <figcaption>
        <span className="cutout-name">Yep, that’s me.</span>
        <span className="eyebrow">Always a work in progress ↗</span>
      </figcaption>
    </figure>
  );
}

export function Hero() {
  return (
    <section className="hero studio-container" id="top">
      <div className="hero-eyebrow">
        <span className="eyebrow">Independent mind. Full-stack maker.</span>
        <span className="eyebrow hero-location">
          Naga City, Philippines <span className="tiny-star">✳</span>{" "}
          <ManilaClock />
        </span>
      </div>
      <h1 className="hero-name">
        <span>GABRIEL</span>
        <span className="hero-surname">
          CATIMBANG<span className="name-period">.</span>
        </span>
      </h1>
      <div className="hero-main">
        <div className="hero-intro">
          <p className="hero-thesis">
            I build things for the internet.
            <br />
            <span>And keep them alive.</span>
          </p>
          <p className="hero-description">
            Developer, DevOps engineer, and the person who asks “what if?” —
            then opens a code editor.
          </p>
          <div className="hero-actions">
            <button className="round-link" onClick={() => scrollToId("work")}>
              <span className="round-link-icon">↘</span> Explore my work
            </button>
            <button className="text-link" onClick={() => scrollToId("hello")}>
              Let’s talk <span>↗</span>
            </button>
          </div>
        </div>
      </div>
      <CutoutPortrait />
      <div className="hero-bottom">
        <span className="availability">
          <i /> Open to good opportunities
        </span>
        <span className="eyebrow">A little curiosity goes a long way.</span>
        <button className="eyebrow" onClick={() => scrollToId("work")}>
          Scroll to explore ↓
        </button>
      </div>
    </section>
  );
}
