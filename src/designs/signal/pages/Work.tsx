import { ArrowRight } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link } from "../../../lib/router";
import { ALL_WORK, CERTIFICATIONS, CIRCLES, PROJECT_KINDS, SCHOOL, WORK_KINDS, type ProjectKind } from "../content";
import { Lines, Rise, Stagger } from "../reveal";
import { FIGURE, only, signal } from "../scene/stage";

type Filter = "all" | ProjectKind;

const FILTERS: Filter[] = ["all", ...WORK_KINDS];

export default function Work() {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = filter === "all" ? ALL_WORK : ALL_WORK.filter((work) => work.kind === filter);

  useEffect(() => {
    // The work chapter's dust, drifting past, held back so the list reads.
    signal.show(only(FIGURE.field, 0, 0.55));
  }, []);

  return (
    <main id="main" tabIndex={-1}>
      <section className="sg-sec sg-page" aria-labelledby="index-title">
        <div className="sg-wide">
          <Lines as="h1" id="index-title" className="sg-h1" lines={["Things", "I’ve built."]} delay={0.05} />
          <Rise as="p" className="sg-lede is-wide" delay={0.25}>
            Products, client work, hackathon builds, games, school projects and small tools, newest first. Client work
            appears under a codename, with what I built and owned but none of the client’s details.
          </Rise>
          <Rise delay={0.35}>
            <fieldset className="sg-topics sg-filter">
              <legend className="sg-sr">Show</legend>
              {FILTERS.map((kind) => (
                <label key={kind}>
                  <input
                    type="radio"
                    name="kind"
                    value={kind}
                    checked={filter === kind}
                    onChange={() => setFilter(kind)}
                  />
                  <span>{kind === "all" ? "Everything" : PROJECT_KINDS[kind]}</span>
                </label>
              ))}
            </fieldset>
          </Rise>
          <p className="sg-sr" aria-live="polite">
            {filter === "all" ? `Showing all ${shown.length} projects` : `Showing ${shown.length} of ${ALL_WORK.length}`}
          </p>
          {/* Keyed by the filter so each change staggers the new list in. */}
          <Stagger as="ol" key={filter} className="sg-index-list">
            {shown.map((work) => (
              <li key={work.slug}>
                <Link href={work.path}>
                  <span className="sg-iyear">{work.year}</span>
                  <span className="sg-iname">
                    <b>{work.name}</b>
                    <span>{work.tagline}</span>
                  </span>
                  <small className="sg-ikind">{work.kindLabel}</small>
                  <ArrowRight className="sg-iarrow" size={18} weight="bold" aria-hidden />
                </Link>
              </li>
            ))}
          </Stagger>
          {shown.length === 0 && (
            <p className="sg-empty">
              Nothing here yet.{" "}
              <button type="button" onClick={() => setFilter("all")}>
                Show everything
              </button>
            </p>
          )}
        </div>
      </section>

      <section className="sg-sec sg-page is-after" aria-labelledby="record-title">
        <div className="sg-wide sg-record">
          <div>
            <h2 id="record-title" className="sg-h3">
              School and community
            </h2>
            <Stagger as="ol" className="sg-roles">
              {SCHOOL.map((school) => (
                <li key={school.degree}>
                  <span>{school.period}</span>
                  <b>{school.degree}</b>
                  <small>{school.school}</small>
                  <p>{school.detail}</p>
                </li>
              ))}
              {CIRCLES.map((item) => (
                <li key={`${item.role} ${item.org}`}>
                  <span>{item.period}</span>
                  <b>{item.role}</b>
                  <small>{item.org}</small>
                  <p>{item.detail}</p>
                </li>
              ))}
            </Stagger>
          </div>
          <div>
            <h2 className="sg-h3">Certifications</h2>
            <Stagger as="ol" className="sg-roles">
              {CERTIFICATIONS.map((cert) => (
                <li key={cert.name}>
                  <span>{cert.year}</span>
                  <b>{cert.name}</b>
                  <small>{cert.issuer}</small>
                </li>
              ))}
            </Stagger>
          </div>
        </div>
      </section>
    </main>
  );
}
