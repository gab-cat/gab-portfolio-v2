import { useEffect } from "react";
import { Link } from "../../../lib/router";
import { Lines, Rise } from "../reveal";
import { FIGURE, only, signal } from "../scene/stage";

export default function NotFound() {
  useEffect(() => {
    // A radar sweeping an empty sky.
    signal.show(only(FIGURE.lost));
  }, []);

  return (
    <main id="main" tabIndex={-1}>
      <section className="sg-sec sg-lost" aria-labelledby="lost-title">
        <div className="sg-copy">
          <Lines as="h1" id="lost-title" className="sg-h1" lines={["Page not", "found."]} delay={0.05} />
          <Rise as="p" className="sg-lede" delay={0.25}>
            Nothing on gabcat.dev lives at this address. The projects are on the home page, and the contact form still
            works.
          </Rise>
          <Rise className="sg-actions" delay={0.4}>
            <Link className="sg-btn is-solid" href="/">
              Back home
            </Link>
            <Link className="sg-btn" href="/contact">
              Contact me
            </Link>
          </Rise>
        </div>
      </section>
    </main>
  );
}
