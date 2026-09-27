import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, GithubLogo, LinkedinLogo } from "@phosphor-icons/react";
import { Switcher } from "../shared/Switcher";
import { Rise, RiseLines, useSmoothScroll } from "../shared/motion";
import { CONTACT_HREF, EMAIL, GITHUB, LINKEDIN, TROPHIES, WORK, hostOf } from "../shared/content";
import { LEGS, type OneBitController } from "./scene";

const STOPS = [
  { id: "top", label: "Mayon", coords: "13.26°N 123.69°E" },
  { id: "listen", label: "Naga City", coords: "13.62°N 123.19°E" },
  { id: "build", label: "Naga River", coords: "13.62°N 123.18°E" },
  { id: "ship", label: "Climb", coords: "13.55°N 123.35°E" },
  { id: "wins", label: "Cloud deck", coords: "13.30°N 123.60°E" },
  { id: "work", label: "Orbit", coords: "Low Earth orbit" },
  { id: "hello", label: "Your team", coords: "Anywhere" },
] as const;

export function App() {
  useSmoothScroll({ lerp: 0.08 });
  const host = useRef<HTMLDivElement>(null);
  const ctl = useRef<OneBitController | null>(null);
  const altRef = useRef<HTMLSpanElement>(null);
  const [leg, setLeg] = useState(0);
  const [flat, setFlat] = useState(false);

  useEffect(() => {
    let dead = false;
    import("./scene").then(({ createOneBit }) => {
      if (dead) return;
      const c = createOneBit(host.current!);
      if (!c) setFlat(true);
      ctl.current = c;
    });
    return () => {
      dead = true;
      ctl.current?.dispose();
      ctl.current = null;
    };
  }, []);

  // continuous leg index from where the viewport centre sits between sections
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const mid = window.innerHeight / 2;
      const centres = STOPS.map((s) => {
        const r = document.getElementById(s.id)!.getBoundingClientRect();
        return r.top + r.height / 2 - mid;
      });
      let i = 0;
      while (i < centres.length - 1 && centres[i + 1] <= 0) i++;
      const a = centres[i];
      const b = centres[Math.min(i + 1, centres.length - 1)];
      const t = i >= centres.length - 1 || b === a ? 0 : Math.min(1, Math.max(0, -a / (b - a)));
      const u = Math.min(LEGS.length - 1, i + t);
      ctl.current?.setLeg(u);
      const now = Math.round(u);
      setLeg((prev) => (prev === now ? prev : now));
      const hud = ctl.current?.hud();
      if (hud && altRef.current) altRef.current.textContent = String(Math.round(hud.alt * 12)).padStart(4, "0");
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <div ref={host} className="ob-canvas" aria-hidden />
      {flat && <div className="ob-flat" aria-hidden />}

      <header className="ob-hud ob-top">
        <a href="#top" className="ob-mark">
          GABCAT/1-BIT
        </a>
        <span className="ob-readout">
          <span>{STOPS[leg].coords}</span>
          <span>
            ALT <span ref={altRef}>0000</span> M
          </span>
        </span>
        <a href={CONTACT_HREF} className="ob-btn is-small">
          Get in touch
        </a>
      </header>

      <nav className="ob-hud ob-route" aria-label="Route">
        {STOPS.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} className={i === leg ? "is-on" : i < leg ? "is-past" : ""}>
            <i aria-hidden />
            <span>{s.label}</span>
          </a>
        ))}
      </nav>

      <main className="ob">
        <section id="top" className="ob-sec is-left" aria-labelledby="ob-title">
          <div className="ob-box is-hero">
            <p className="ob-kicker">Gabriel Catimbang. Developer and DevOps engineer.</p>
            <RiseLines id="ob-title" as="h1" className="ob-h1" lines={["From Naga City", "to the internet."]} delay={0.4} />
            <Rise as="p" className="ob-body" delay={0.7}>
              A flight over Bicol, from the first job to the next one. Mayon is on the horizon.
            </Rise>
            <Rise className="ob-actions" delay={0.85}>
              <a className="ob-btn" href="#listen">
                Take off
              </a>
              <a className="ob-link" href="#work">
                Skip to the work
              </a>
            </Rise>
          </div>
        </section>

        <section id="listen" className="ob-sec is-right" aria-labelledby="ob-listen">
          <div className="ob-box">
            <p className="ob-kicker">2022 - 2025. Bell Canada, from Naga</p>
            <RiseLines id="ob-listen" className="ob-h2" lines={["First, I", "listened."]} />
            <Rise as="p" className="ob-body">
              Three years in a support chat for customers on the other side of the world. Four
              All-Star awards, top 10%. Every ticket started with someone who needed something to
              work.
            </Rise>
          </div>
        </section>

        <section id="build" className="ob-sec is-left" aria-labelledby="ob-build">
          <div className="ob-box">
            <p className="ob-kicker">2024 - now. ThePILLARS, Old.St Labs</p>
            <RiseLines id="ob-build" className="ob-h2" lines={["Then I built", "the fix."]} />
            <Rise as="p" className="ob-body">
              Apprentice to full-stack in six months. Then MerchTrack: 2,750+ students in its first
              week, and the servers held.
            </Rise>
          </div>
        </section>

        <section id="ship" className="ob-sec is-right" aria-labelledby="ob-ship">
          <div className="ob-box">
            <p className="ob-kicker">2025 - now. Detken Development</p>
            <RiseLines id="ob-ship" className="ob-h2" lines={["Now I keep it", "in the air."]} />
            <Rise as="p" className="ob-body">
              Production off Vercel and onto servers we control. Pipelines that test, build and deploy
              themselves. Boring launches, on purpose.
            </Rise>
          </div>
        </section>

        <section id="wins" className="ob-sec is-left" aria-labelledby="ob-wins">
          <div className="ob-box is-wide">
            <p className="ob-kicker">Above the clouds</p>
            <RiseLines id="ob-wins" className="ob-h2" lines={["Seven podiums."]} />
            <ul className="ob-list">
              {TROPHIES.map((t) => (
                <li key={t.event}>
                  <span>{t.place}</span>
                  <b>{t.event}</b>
                  <small>{t.year}</small>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="work" className="ob-sec is-right" aria-labelledby="ob-work">
          <div className="ob-box is-wide">
            <p className="ob-kicker">The internet</p>
            <RiseLines id="ob-work" className="ob-h2" lines={["Things people use."]} />
            <ul className="ob-list is-work">
              {WORK.map((w) => (
                <li key={w.name}>
                  <a href={w.href} target="_blank" rel="noreferrer">
                    <b>{w.name}</b>
                    <span>{w.tagline}</span>
                    <small>
                      {w.live ? hostOf(w.href) : "GitHub"} <ArrowUpRight size={12} weight="bold" aria-hidden />
                    </small>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="hello" className="ob-sec is-center" aria-labelledby="ob-hello">
          <div className="ob-box is-hero">
            <p className="ob-kicker">Next stop</p>
            <RiseLines id="ob-hello" className="ob-h1" lines={["Your team."]} />
            <Rise as="p" className="ob-body">
              The beacon is Naga City. Projects, roles, collaborations: tell me where we're going.
            </Rise>
            <Rise className="ob-actions">
              <a className="ob-btn" href={CONTACT_HREF}>
                Get in touch
              </a>
              <a className="ob-link" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
            </Rise>
            <p className="ob-social">
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
      <Switcher current="onebit" />
    </>
  );
}
