import { AppShell } from "../components/AppShell";
import { Link } from "../lib/router";
import { Reveal } from "../components/Reveal";
import { Sculpture, StoryWorld } from "../components/Sculpture";

export default function NotFoundApp() {
  return (
    <AppShell route="notFound">
      <StoryWorld />
      <main>
        <section className="missing-page clay-container" aria-labelledby="missing-title">
          <Reveal className="missing-copy">
            <p className="chapter-label">Wrong turn.</p>
            <h1 id="missing-title">
              This page
              <br />
              isn’t <em>here.</em>
            </h1>
            <p className="missing-premise">
              The URL doesn’t match anything on gabcat.dev. Even the machine
              misses the hole sometimes. The story is on the home page, and a
              note still works if you meant to write.
            </p>
            <div className="missing-actions">
              <Link className="btn btn-ink" href="/">
                Back to the story <span aria-hidden="true">↗</span>
              </Link>
              <Link className="btn btn-card" href="/contact">
                Or say hello <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </Reveal>
          <div className="missing-stage">
            <Sculpture chapter="lost" />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
