import { AppShell } from "../components/AppShell";
import { Reveal } from "../components/Reveal";

export default function NotFoundApp() {
  return (
    <AppShell route="notFound">
      <main>
        <section className="contact-page clay-container" aria-labelledby="missing-title">
          <Reveal>
            <p className="chapter-label">Wrong turn.</p>
            <h1 id="missing-title">
              This page
              <br />
              isn’t <em>here.</em>
            </h1>
            <p className="contact-premise">
              The URL doesn’t match anything on gabcat.dev. The story is on the
              home page; a note still works if you meant to write.
            </p>
            <p>
              <a className="contact-direct" href="/">
                Back to the story ↗
              </a>
            </p>
            <p>
              <a className="text-link" href="/contact">
                Or say hello ↗
              </a>
            </p>
          </Reveal>
        </section>
      </main>
    </AppShell>
  );
}
