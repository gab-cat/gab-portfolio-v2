import { ArrowLeft, ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { useEffect } from "react";
import { Link, useRouter } from "../../../lib/router";
import { ALL_WORK } from "../content";
import { Lines, Rise, Stagger } from "../reveal";
import { FIGURE, only, signal } from "../scene/stage";

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/** Keyed by path, so moving to the next project replays its entrance instead of swapping text in place. */
export default function Project() {
  const { path } = useRouter();
  return <CaseStudy key={path} path={path} />;
}

function CaseStudy({ path }: { path: string }) {
  // The router only sends known /work/<slug> paths here.
  const index = Math.max(0, ALL_WORK.findIndex((work) => work.path === path));
  const work = ALL_WORK[index];
  const next = ALL_WORK[(index + 1) % ALL_WORK.length];

  useEffect(() => {
    signal.show(only(FIGURE.field, 0, 0.4));
  }, []);

  return (
    <main id="main" tabIndex={-1}>
      <article className="sg-sec sg-page sg-case" aria-labelledby="case-title">
        <div className="sg-wide">
          <Rise>
            <Link className="sg-back" href="/work">
              <ArrowLeft size={15} weight="bold" aria-hidden /> All projects
            </Link>
          </Rise>
          <Lines as="h1" id="case-title" className="sg-h2 sg-case-title" lines={[work.name]} delay={0.05} />
          <Rise as="p" className="sg-lede is-wide" delay={0.2}>
            {work.story}
          </Rise>
          {work.confidential && (
            <Rise as="p" className="sg-status" delay={0.25}>
              Confidential work for {lowerFirst(work.confidential)}. The name is a codename
              {work.image ? ", and the screenshot has names, logos and people blurred." : "."}
            </Rise>
          )}
          <Rise as="dl" className="sg-facts" delay={0.3}>
            <div>
              <dt>Year</dt>
              <dd>{work.year}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{work.role}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{work.kindLabel}</dd>
            </div>
            <div>
              <dt>Built with</dt>
              <dd>{work.tech.join(", ")}</dd>
            </div>
          </Rise>
          {(work.links.length > 0 || work.status) && (
            <Rise className="sg-case-links" delay={0.35}>
              {work.links.length > 0 && (
                <div className="sg-actions">
                  {work.links.map((link, i) => (
                    <a
                      key={link.href}
                      className={`sg-btn${i === 0 ? " is-solid" : ""}`}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {link.label} <span className="sg-host">{link.host}</span>
                      <ArrowUpRight size={15} weight="bold" aria-hidden />
                    </a>
                  ))}
                </div>
              )}
              {work.status && <p className="sg-status">{work.status}</p>}
            </Rise>
          )}
          {work.image && (
            <Rise as="figure" className="sg-shot">
              <img
                src={work.image}
                width={1280}
                height={800}
                loading="lazy"
                decoding="async"
                alt={
                  work.confidential
                    ? `${work.name}, a redacted screenshot of the live product.`
                    : `${work.name}, a screenshot of the live site.`
                }
              />
            </Rise>
          )}
          <div className="sg-case-body">
            <section aria-labelledby="built-title">
              <h2 id="built-title" className="sg-h3">
                What I built
              </h2>
              <Stagger as="ul" className="sg-points">
                {work.built.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </Stagger>
            </section>
            {work.results.length > 0 && (
              <section aria-labelledby="results-title">
                <h2 id="results-title" className="sg-h3">
                  What came of it
                </h2>
                <Stagger as="ul" className="sg-points is-results">
                  {work.results.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </Stagger>
              </section>
            )}
          </div>
          <nav className="sg-actions sg-case-nav" aria-label="More projects">
            <Link className="sg-btn" href="/work">
              All projects
            </Link>
            <Link className="sg-btn is-solid" href={next.path}>
              Next: {next.name} <ArrowRight size={15} weight="bold" aria-hidden />
            </Link>
          </nav>
        </div>
      </article>
    </main>
  );
}
