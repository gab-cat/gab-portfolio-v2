import { useEffect } from "react";
import { Link } from "../../../lib/router";
import { Lines, Rise } from "../reveal";
import { FIGURE, only, signal } from "../scene/stage";

export default function NotFound() {
  useEffect(() => {
    signal.show(only(FIGURE.lost, 0.12));
    // Now and then the picture drops out, like a channel with no signal.
    const glitch = window.setInterval(() => signal.kick(0.5), 3800);
    return () => clearInterval(glitch);
  }, []);

  return (
    <main id="main" tabIndex={-1}>
      <section className="sg-sec sg-lost" aria-labelledby="lost-title">
        <div className="sg-copy">
          <Rise as="p" className="sg-label">
            Error 404
          </Rise>
          <Lines as="h1" id="lost-title" className="sg-h1" lines={["No signal", "here."]} delay={0.05} />
          <Rise as="p" className="sg-lede" delay={0.25}>
            The URL doesn’t match anything on gabcat.dev. The story is on the home page, and a note still works if you
            meant to write.
          </Rise>
          <Rise className="sg-actions" delay={0.4}>
            <Link className="sg-btn is-solid" href="/">
              Back home
            </Link>
            <Link className="sg-btn" href="/contact">
              Get in touch
            </Link>
          </Rise>
        </div>
      </section>
    </main>
  );
}
