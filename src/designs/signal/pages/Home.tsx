import { ArrowRight, GithubLogo, LinkedinLogo } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Link } from "../../../lib/router";
import { dial, Dial } from "../Dial";
import { ALL_WORK, CRAFTS, EMAIL, ROLES, SOCIALS, TROPHIES, WORK, spell, type Work } from "../content";
import { Magnetic } from "../Magnetic";
import { usePeek } from "../Peek";
import { Lines, Rise, Stagger } from "../reveal";
import { FIGURE, FIGURES, WIDE, signal, smoothstep, type World } from "../scene/stage";
import { worldOf } from "../world";

const CHAPTERS = [
  { id: "top", label: "Signal", figure: FIGURE.horizon },
  { id: "story", label: "Listen", figure: FIGURE.wave },
  { id: "craft", label: "Build", figure: FIGURE.lattice },
  { id: "journey", label: "Ship", figure: FIGURE.globe },
  { id: "wins", label: "Wins", figure: FIGURE.trophy },
  { id: "work", label: "Work", figure: FIGURE.world },
  { id: "hello", label: "Hello", figure: FIGURE.hello },
] as const;

const [GITHUB, LINKEDIN] = SOCIALS;
const WORK_CHAPTER = CHAPTERS.findIndex((chapter) => chapter.figure === FIGURE.world);
/** The world beside the work chapter's heading, until a project is pointed at. */
const HOME_WORLD: World = { seed: "home", bands: 5, rings: 7, moons: WORK.length };

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
function useChapters(pointed: RefObject<Work | null>) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    let raf = 0;
    const weights = new Array(FIGURES).fill(0);
    const sections = CHAPTERS.map((chapter) => document.getElementById(chapter.id)!);
    // Page positions are measured only when the layout changes, so each frame just reads scrollY.
    const middles: number[] = [];
    const copyTops: number[] = [];
    const workTitle = document.getElementById("work-title");
    let workMiddle = 0;
    let end = 1;
    const measure = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      end = Math.max(1, document.documentElement.scrollHeight - vh);
      sections.forEach((el, i) => {
        const box = el.getBoundingClientRect();
        middles[i] = box.top + y + box.height / 2;
        copyTops[i] = (el.firstElementChild?.getBoundingClientRect().top ?? box.top) + y;
      });
      const title = workTitle?.getBoundingClientRect();
      workMiddle = title ? title.top + y + title.height / 2 : 0;
      // Each chapter's station on the dial is where the page locks onto it.
      dial.stations = middles.map((middle) => Math.min(1, Math.max(0, (middle - vh / 2) / end)));
    };
    let lastY = window.scrollY;
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
      const narrow = window.innerWidth < 820;
      // On phones the figure sits above the copy; fade it back as long copy scrolls up into it.
      // The work planet needs no fading: it rides along with its heading, so it never meets the list.
      const dim = narrow && now !== WORK_CHAPTER ? 0.1 + 0.9 * smoothstep(vh * 0.14, vh * 0.5, copyTops[now] - y) : 1;
      const chaos = Math.sin(Math.PI * t);
      // Where the planet rests: level with the heading on wide screens, just above it on phones.
      const rest = narrow || window.innerWidth / vh < 1.1 ? vh * 0.19 + 150 : vh * 0.3;
      // Pointing at a project turns the planet into that project's world.
      const world = pointed.current ? worldOf(pointed.current) : HOME_WORLD;
      signal.show({ weights: [...weights], chaos, dim, world, lift: rest - (workMiddle - y) });
      dial.progress = Math.min(1, Math.max(0, y / end));
      dial.noise = Math.max(chaos, Math.min(1, Math.abs(y - lastY) / 50));
      lastY = y;
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
  const pointed = useRef<Work | null>(null);
  const active = useChapters(pointed);
  const peek = usePeek(WORK);

  return (
    <>
      {/* The hero and the closing call to action stay clear of it. */}
      <Dial stations={CHAPTERS} active={active} away={active === 0 || active === CHAPTERS.length - 1} />

      <main id="main" tabIndex={-1}>
        <section id="top" className="sg-sec sg-hero" aria-labelledby="hero-title">
          <div className="sg-copy">
            <Lines as="h1" id="hero-title" className="sg-h1" lines={["From noise", "to signal."]} delay={0.1} />
            <Rise as="p" className="sg-lede" delay={0.35}>
              I’m Gabriel Catimbang, a developer and DevOps engineer in Naga City, PH. I turn{" "}
              <span className="sg-nowrap">half-formed</span> ideas into software people use, then keep it running.
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
              <Lines id="story-title" className="sg-h2" lines={["First, I learned", "to listen."]} />
            </div>
            <div className="sg-listen-story">
              <Rise as="p" className="sg-body">
                Before writing code, I spent three years on the other side of a support chat, solving strangers’
                problems in real time. Every conversation started with someone who needed something to work, and the
                answer always began with listening.
              </Rise>
              <Rise as="p" className="sg-meta" delay={0.1}>
                Bell Canada, through Quantrics · 2022 – 2025
              </Rise>
            </div>
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
            <Lines id="wins-title" className="sg-h2" lines={[`${spell(TROPHIES.length)} awards,`, "so far."]} />
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
            <Lines id="work-title" className="sg-h2" lines={["Things people", "actually use."]} />
            <Stagger
              as="ul"
              className="sg-projects"
              onPointerMove={peek.list.onPointerMove}
              onPointerLeave={() => {
                peek.list.onPointerLeave();
                pointed.current = null;
              }}
            >
              {WORK.map((work) => (
                <li
                  key={work.slug}
                  onPointerEnter={(event) => {
                    peek.row(work).onPointerEnter(event);
                    pointed.current = work;
                  }}
                >
                  <Link href={work.path}>
                    <span className="sg-pname" data-peek-avoid>
                      {work.name}
                    </span>
                    <span className="sg-pmeta">
                      <span>{work.tagline}</span>
                      <small>{work.tech.slice(0, 4).join(" / ")}</small>
                    </span>
                    <span className="sg-plink">
                      {work.year} <ArrowRight size={16} weight="bold" aria-hidden />
                    </span>
                    {work.thumb && (
                      <img className="sg-thumb" src={work.thumb} width={320} height={200} alt="" loading="lazy" decoding="async" />
                    )}
                  </Link>
                </li>
              ))}
            </Stagger>
            {peek.view}
            <Rise className="sg-actions">
              <Magnetic>
                <Link className="sg-btn" href="/work">
                  See all {ALL_WORK.length} projects <ArrowRight size={16} weight="bold" aria-hidden />
                </Link>
              </Magnetic>
            </Rise>
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
