import { ArrowUpRight, GithubLogo, LinkedinLogo } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link } from "../../../lib/router";
import { CRAFTS, EMAIL, ROLES, SOCIALS, TROPHIES, WORK, hostOf } from "../content";
import { Magnetic } from "../Magnetic";
import { Lines, Rise, Stagger } from "../reveal";
import { FIGURE, FIGURES, WIDE, signal, smoothstep } from "../scene/stage";

const CHAPTERS = [
  { id: "top", label: "Signal", figure: FIGURE.horizon },
  { id: "story", label: "Listen", figure: FIGURE.wave },
  { id: "craft", label: "Build", figure: FIGURE.lattice },
  { id: "journey", label: "Ship", figure: FIGURE.globe },
  { id: "wins", label: "Wins", figure: FIGURE.trophy },
  { id: "work", label: "Work", figure: FIGURE.field },
  { id: "hello", label: "Hello", figure: FIGURE.hello },
] as const;

const [GITHUB, LINKEDIN] = SOCIALS;

function useSmoothScroll() {
  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    void import("../../../lib/lenis").then(({ initLenis }) => {
      const cleanup = initLenis({ lerp: 0.085 });
      if (cancelled) cleanup?.();
      else stop = cleanup;
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);
}

/** On wide screens the story's waveform runs as a low horizon line, so it sits between the lines of copy. */
function useCalmWave() {
  useEffect(() => {
    const wide = window.matchMedia(WIDE);
    const apply = () => signal.level(wide.matches ? 0.5 : 1);
    apply();
    wide.addEventListener("change", apply);
    return () => wide.removeEventListener("change", apply);
  }, []);
}

/** Blend the figure between chapters as the middle of the screen travels between them. */
function useChapters() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    let raf = 0;
    const weights = new Array(FIGURES).fill(0);
    const sections = CHAPTERS.map((chapter) => document.getElementById(chapter.id)!);
    // Page positions are measured only when the layout changes, so each frame just reads scrollY.
    const middles: number[] = [];
    const copyTops: number[] = [];
    const measure = () => {
      const y = window.scrollY;
      sections.forEach((el, i) => {
        const box = el.getBoundingClientRect();
        middles[i] = box.top + y + box.height / 2;
        copyTops[i] = (el.firstElementChild?.getBoundingClientRect().top ?? box.top) + y;
      });
    };
    measure();
    const resized = new ResizeObserver(measure);
    resized.observe(document.body);
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const vh = window.innerHeight;
      const y = window.scrollY;
      const centres = middles.map((middle) => middle - y - vh / 2);
      let i = 0;
      while (i < centres.length - 1 && centres[i + 1] <= 0) i++;
      const a = centres[i];
      const b = centres[Math.min(i + 1, centres.length - 1)];
      const raw = i >= centres.length - 1 || b === a ? 0 : Math.min(1, Math.max(0, -a / (b - a)));
      const t = smoothstep(0.3, 0.7, raw);
      const now = t > 0.5 ? i + 1 : i;
      weights.fill(0);
      weights[CHAPTERS[i].figure] += 1 - t;
      if (i < CHAPTERS.length - 1) weights[CHAPTERS[i + 1].figure] += t;
      // On phones the figure sits above the copy; fade it back as long copy scrolls up into it.
      const dim = window.innerWidth < 820 ? 0.1 + 0.9 * smoothstep(vh * 0.14, vh * 0.5, copyTops[now] - y) : 1;
      signal.show({ weights: [...weights], chaos: Math.sin(Math.PI * t), dim });
      setActive((prev) => (prev === now ? prev : now));
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      resized.disconnect();
    };
  }, []);
  return active;
}

export default function Home() {
  useSmoothScroll();
  useCalmWave();
  const active = useChapters();

  return (
    <>
      <nav className="sg-index" aria-label="Chapters">
        {CHAPTERS.map((chapter, i) => (
          <Link
            key={chapter.id}
            href={`/#${chapter.id}`}
            className={i === active ? "is-on" : undefined}
            aria-current={i === active ? "location" : undefined}
          >
            <i aria-hidden="true" />
            <span>{chapter.label}</span>
          </Link>
        ))}
      </nav>

      <main id="main" tabIndex={-1}>
        <section id="top" className="sg-sec sg-hero" aria-labelledby="hero-title">
          <div className="sg-copy">
            <Rise as="p" className="sg-label">
              Developer &amp; DevOps engineer · Naga City, PH
            </Rise>
            <Lines as="h1" id="hero-title" className="sg-h1" lines={["From noise", "to signal."]} delay={0.1} />
            <Rise as="p" className="sg-lede" delay={0.35}>
              I’m Gabriel Catimbang. I take half-formed ideas and turn them into software people use, then keep it
              running.
            </Rise>
            <Rise className="sg-actions" delay={0.5}>
              <Magnetic>
                <Link className="sg-btn is-solid" href="/#work">
                  See the work
                </Link>
              </Magnetic>
              <Magnetic>
                <Link className="sg-btn" href="/contact">
                  Get in touch
                </Link>
              </Magnetic>
            </Rise>
          </div>
        </section>

        {/* Wide screens: the headline above a horizon of sound, the story and the stat below it. */}
        <section id="story" className="sg-sec sg-listen" aria-labelledby="story-title">
          <div className="sg-copy">
            <div className="sg-listen-head">
              <p className="sg-label">2022 – 2025 · Bell Canada, through Quantrics</p>
              <Lines id="story-title" className="sg-h2" lines={["First, I learned", "to listen."]} />
            </div>
            <Rise as="p" className="sg-body">
              Before writing code, I spent three years on the other side of a support chat, solving strangers’
              problems in real time. Every conversation started with someone who needed something to work, and the
              answer always began with listening.
            </Rise>
            <Rise className="sg-stat">
              <b>4×</b>
              <span>Bell All-Star, top 10% of performers</span>
            </Rise>
          </div>
        </section>

        {/* Wide screens: an exploded view, the four crafts in two columns either side of the lattice. */}
        <section id="craft" className="sg-sec sg-build" aria-labelledby="craft-title">
          <div className="sg-copy">
            <div className="sg-build-head">
              <p className="sg-label">What I do</p>
              <Lines id="craft-title" className="sg-h2" lines={["Then I built", "the fix."]} />
            </div>
            <Rise as="p" className="sg-body">
              Four parts of the job, one habit behind all of them: listen first, then make it work.
            </Rise>
            <Stagger as="ol" className="sg-crafts">
              {CRAFTS.map((craft, i) => (
                <li key={craft.tag}>
                  <span>
                    {String(i + 1).padStart(2, "0")} {craft.tag}
                  </span>
                  <b>{craft.title}</b>
                  <p>{craft.copy}</p>
                  <small>{craft.tools.join(" · ")}</small>
                </li>
              ))}
            </Stagger>
          </div>
        </section>

        <section id="journey" className="sg-sec" aria-labelledby="journey-title">
          <div className="sg-copy">
            <p className="sg-label">2022 – now · {ROLES.length} roles</p>
            <Lines id="journey-title" className="sg-h2" lines={["Now I keep it", "running."]} />
            <Rise as="p" className="sg-body">
              Production moved off Vercel onto servers we control. Pipelines test, build and deploy on their own, so
              launch day feels like any other day.
            </Rise>
            <Stagger as="ol" className="sg-roles">
              {ROLES.map((role) => (
                <li key={`${role.role} ${role.company}`} className={role.current ? "is-now" : undefined}>
                  <span>{role.period}</span>
                  <b>{role.role}</b>
                  <small>{role.company}</small>
                </li>
              ))}
            </Stagger>
            <Rise as="p" className="sg-note">
              Every orange arc on the globe starts in Naga City. One of them ends in Toronto.
            </Rise>
          </div>
        </section>

        <section id="wins" className="sg-sec sg-right" aria-labelledby="wins-title">
          <div className="sg-copy">
            <p className="sg-label">2024 – 2025 · Hackathons and CTFs</p>
            <Lines id="wins-title" className="sg-h2" lines={["Seven podiums,", "so far."]} />
            <Stagger as="ol" className="sg-wins">
              {TROPHIES.map((trophy, i) => (
                <li key={trophy.event} onPointerEnter={() => signal.focus(i)} onPointerLeave={() => signal.focus(null)}>
                  <span>{trophy.place}</span>
                  <b>{trophy.event}</b>
                  <em>{trophy.detail}</em>
                  <small>{trophy.year}</small>
                </li>
              ))}
            </Stagger>
          </div>
        </section>

        <section id="work" className="sg-sec sg-work" aria-labelledby="work-title">
          <div className="sg-wide">
            <p className="sg-label">Selected work</p>
            <Lines id="work-title" className="sg-h2" lines={["Things people", "actually use."]} />
            <Stagger as="ul" className="sg-projects">
              {WORK.map((work) => (
                <li key={work.name}>
                  <a href={work.href} target="_blank" rel="noreferrer noopener">
                    <span className="sg-pname">{work.name}</span>
                    <span className="sg-pmeta">
                      <span>{work.tagline}</span>
                      <small>{work.tech.join(" / ")}</small>
                    </span>
                    <span className="sg-plink">
                      {work.live ? hostOf(work.href) : "GitHub"} <ArrowUpRight size={16} weight="bold" aria-hidden />
                    </span>
                  </a>
                </li>
              ))}
            </Stagger>
          </div>
        </section>

        <section id="hello" className="sg-sec sg-hello" aria-labelledby="hello-title">
          <div className="sg-center">
            <h2 id="hello-title" className="sg-sr">
              Say hello
            </h2>
            <Rise as="p" className="sg-hello-line">
              A project, a role, or a what if you can’t shake. Tell me about it.
            </Rise>
            <Rise className="sg-actions is-center" delay={0.1}>
              <Link className="sg-btn is-solid is-big" href="/contact">
                Get in touch
              </Link>
            </Rise>
            <p className="sg-contact-meta">
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              <a href={GITHUB.href} target="_blank" rel="noreferrer noopener" aria-label="GitHub">
                <GithubLogo size={18} weight="bold" />
              </a>
              <a href={LINKEDIN.href} target="_blank" rel="noreferrer noopener" aria-label="LinkedIn">
                <LinkedinLogo size={18} weight="bold" />
              </a>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
