import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, GithubLogo, LinkedinLogo } from "@phosphor-icons/react";
import { Magnetic } from "../shared/Magnetic";
import { Switcher } from "../shared/Switcher";
import { Rise, RiseLines, useLoaderCount, useSmoothScroll } from "../shared/motion";
import { smoothstep } from "../shared/gl";
import { CONTACT_HREF, EMAIL, GITHUB, HALFTONE, LINKEDIN, TROPHIES, WORK, hostOf } from "../shared/content";
import { TARGETS, type SignalController } from "./scene";

const CHAPTERS = [
  { id: "top", label: "Signal", target: 0 },
  { id: "listen", label: "Listen", target: 1 },
  { id: "build", label: "Build", target: 2 },
  { id: "ship", label: "Ship", target: 3 },
  { id: "wins", label: "Wins", target: 4 },
  { id: "work", label: "Work", target: 5 },
  { id: "hello", label: "Hello", target: 6 },
] as const;

export function App() {
  useSmoothScroll({ lerp: 0.085 });
  const reduced = useReducedMotion() ?? false;
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<SignalController | null>(null);
  const [ready, setReady] = useState(false);
  const [flat, setFlat] = useState(false);
  const [active, setActive] = useState(0);
  const { count, done } = useLoaderCount(ready || flat, 1500);

  useEffect(() => {
    let cancelled = false;
    import("./scene")
      .then(({ createSignal }) => createSignal(host.current!, () => !cancelled && setReady(true)))
      .then((ctl) => {
        if (cancelled) return ctl?.dispose();
        if (!ctl) setFlat(true);
        scene.current = ctl;
      })
      .catch(() => setFlat(true));
    return () => {
      cancelled = true;
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  // Blend the figure between chapters as the viewport centre travels between them.
  useEffect(() => {
    let raf = 0;
    const weights = new Array(TARGETS).fill(0);
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const mid = window.innerHeight / 2;
      const centres = CHAPTERS.map((c) => {
        const r = document.getElementById(c.id)!.getBoundingClientRect();
        return r.top + r.height / 2 - mid;
      });
      let i = 0;
      while (i < centres.length - 1 && centres[i + 1] <= 0) i++;
      const a = centres[i];
      const b = centres[Math.min(i + 1, centres.length - 1)];
      const raw = i >= centres.length - 1 || b === a ? 0 : Math.min(1, Math.max(0, -a / (b - a)));
      const t = smoothstep(0.3, 0.7, raw);
      weights.fill(0);
      weights[CHAPTERS[i].target] += 1 - t;
      if (i < CHAPTERS.length - 1) weights[CHAPTERS[i + 1].target] += t;
      scene.current?.setState({ weights: [...weights], chaos: Math.sin(Math.PI * t) });
      const now = t > 0.5 ? i + 1 : i;
      setActive((prev) => (prev === now ? prev : now));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <div ref={host} className={`sg-canvas ${ready ? "is-ready" : ""}`} aria-hidden />
      {flat && <img className="sg-flat" src={HALFTONE} alt="" aria-hidden />}
      <div className="sg-grain" aria-hidden />

      <AnimatePresence>
        {!done && (
          <motion.div
            className="sg-loader"
            exit={reduced ? undefined : { opacity: 0, transition: { duration: 0.9, ease: [0.65, 0, 0.35, 1] } }}
          >
            <span className="sg-loader-label">Tuning in</span>
            <span className="sg-loader-count">{String(count).padStart(3, "0")}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sg-nav">
        <a href="#top" className="sg-mark">
          Gabriel Catimbang
        </a>
        <nav aria-label="Sections">
          <a href="#work">Work</a>
          <a href="#hello">Contact</a>
        </nav>
      </header>

      <nav className="sg-index" aria-label="Chapters">
        {CHAPTERS.map((c, i) => (
          <a key={c.id} href={`#${c.id}`} className={i === active ? "is-on" : ""} aria-current={i === active ? "true" : undefined}>
            <i aria-hidden />
            <span>{c.label}</span>
          </a>
        ))}
      </nav>

      <main className="sg">
        <section id="top" className="sg-sec sg-hero" aria-labelledby="sg-title">
          <div className="sg-copy" key={done ? "live" : "wait"}>
            <p className="sg-label">Developer &amp; DevOps engineer, Naga City</p>
            <RiseLines id="sg-title" as="h1" lines={["From noise", "to signal."]} className="sg-h1" delay={0.1} />
            <Rise delay={0.35} as="p" className="sg-lede">
              I'm Gabriel Catimbang. I take half-formed ideas and turn them into software
              people use, then keep it running.
            </Rise>
            <Rise delay={0.5} className="sg-actions">
              <Magnetic>
                <a className="sg-btn is-solid" href="#work">
                  See the work
                </a>
              </Magnetic>
              <Magnetic>
                <a className="sg-btn" href={CONTACT_HREF}>
                  Get in touch
                </a>
              </Magnetic>
            </Rise>
          </div>
        </section>

        <section id="listen" className="sg-sec" aria-labelledby="sg-listen">
          <div className="sg-copy">
            <p className="sg-label">2022 - 2025. Bell Canada, through Quantrics</p>
            <RiseLines id="sg-listen" lines={["First, I learned", "to listen."]} className="sg-h2" />
            <Rise as="p" className="sg-body">
              Three years in a support chat, one stranger at a time. Every conversation
              started with someone who needed something to work, and the answer always
              began with listening.
            </Rise>
            <Rise className="sg-stat">
              <b>4×</b>
              <span>Bell All-Star, top 10% of performers</span>
            </Rise>
          </div>
        </section>

        <section id="build" className="sg-sec" aria-labelledby="sg-build">
          <div className="sg-copy">
            <p className="sg-label">2024 - now. ThePILLARS, Old.St Labs, CS Guild</p>
            <RiseLines id="sg-build" lines={["Then I built", "the fix."]} className="sg-h2" />
            <Rise as="p" className="sg-body">
              Frontend apprentice to full-stack in six months. Vue, Nuxt, Express, then
              Next.js and NestJS. Fast pages, calm interfaces, code the next person can read.
            </Rise>
            <Rise className="sg-stat">
              <b>2,750+</b>
              <span>students used MerchTrack in its first week</span>
            </Rise>
          </div>
        </section>

        <section id="ship" className="sg-sec" aria-labelledby="sg-ship">
          <div className="sg-copy">
            <p className="sg-label">2025 - now. Detken Development</p>
            <RiseLines id="sg-ship" lines={["Now I keep it", "running."]} className="sg-h2" />
            <Rise as="p" className="sg-body">
              Production moved off Vercel onto servers we control. Pipelines test, build and
              deploy on their own, so launch day feels like any other day.
            </Rise>
            <Rise as="p" className="sg-note">
              Every orange arc on the globe starts in Naga City. One of them ends in Toronto.
            </Rise>
          </div>
        </section>

        <section id="wins" className="sg-sec sg-right" aria-labelledby="sg-wins">
          <div className="sg-copy">
            <p className="sg-label">2024 - 2025. Hackathons and CTFs</p>
            <RiseLines id="sg-wins" lines={["Seven podiums,", "so far."]} className="sg-h2" />
            <ol className="sg-wins">
              {TROPHIES.map((t, i) => (
                <Rise as="li" key={t.event} delay={i * 0.05}>
                  <span>{t.place}</span>
                  <b>{t.event}</b>
                  <small>{t.year}</small>
                </Rise>
              ))}
            </ol>
          </div>
        </section>

        <section id="work" className="sg-sec sg-work" aria-labelledby="sg-work">
          <div className="sg-wide">
            <RiseLines id="sg-work" lines={["Things people", "actually use."]} className="sg-h2" />
            <ul className="sg-projects">
              {WORK.map((w) => (
                <Rise as="li" key={w.name}>
                  <a href={w.href} target="_blank" rel="noreferrer">
                    <span className="sg-pname">{w.name}</span>
                    <span className="sg-pmeta">
                      <span>{w.tagline}</span>
                      <small>{w.tech.join(" / ")}</small>
                    </span>
                    <span className="sg-plink">
                      {w.live ? hostOf(w.href) : "GitHub"} <ArrowUpRight size={16} weight="bold" aria-hidden />
                    </span>
                  </a>
                </Rise>
              ))}
            </ul>
          </div>
        </section>

        <section id="hello" className="sg-sec sg-hello" aria-labelledby="sg-hello">
          <div className="sg-center">
            <h2 id="sg-hello" className="sg-sr">
              Hello
            </h2>
            <Rise as="p" className="sg-hello-line">
              A project, a role, or a what if you can't shake. Tell me about it.
            </Rise>
            <Rise className="sg-actions is-center">
              <Magnetic strength={0.4}>
                <a className="sg-btn is-solid is-big" href={CONTACT_HREF}>
                  Get in touch
                </a>
              </Magnetic>
            </Rise>
            <p className="sg-contact-meta">
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              <a href={GITHUB} target="_blank" rel="noreferrer" aria-label="GitHub">
                <GithubLogo size={18} weight="bold" />
              </a>
              <a href={LINKEDIN} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <LinkedinLogo size={18} weight="bold" />
              </a>
            </p>
          </div>
        </section>
      </main>
      <Switcher current="signal" />
    </>
  );
}
