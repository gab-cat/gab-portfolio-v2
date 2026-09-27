import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, GithubLogo, LinkedinLogo } from "@phosphor-icons/react";
import { Magnetic } from "../shared/Magnetic";
import { Switcher } from "../shared/Switcher";
import { Rise, RiseLines, useSmoothScroll } from "../shared/motion";
import { smoothstep } from "../shared/gl";
import {
  CONTACT_HREF,
  EMAIL,
  GITHUB,
  LINKEDIN,
  ROLES_NEWEST,
  TOOLBOX,
  TROPHIES,
  WORK,
  fmtMonth,
  hostOf,
} from "../shared/content";
import { LAYERS, type KeysController, type Layer } from "./scene";

const SECTIONS = ["top", "inside", "log", "work", "wins", "enter"] as const;

const CALLOUTS: Record<Layer, { name: string; role: string; tools: string }> = {
  keycaps: { name: "Keycaps", role: "Frontend. The part people touch.", tools: TOOLBOX[0].items.slice(0, 3).join(", ") },
  switches: { name: "Switches", role: "Backend. How it responds.", tools: "NestJS, Express, TypeScript" },
  plate: { name: "Plate", role: "Data. What keeps it steady.", tools: TOOLBOX[2].items.join(", ") },
  pcb: { name: "PCB", role: "Infrastructure. The wiring nobody sees.", tools: "Docker, AWS, Nginx, Linux" },
  case: { name: "Case and cable", role: "Pipelines. How it gets to you.", tools: "GitHub Actions" },
};

const COMMANDS: { words: string[]; target: string; reply: string }[] = [
  { words: ["WORK", "PROJECTS"], target: "#work", reply: "LOADING WORK" },
  { words: ["WINS", "AWARDS"], target: "#wins", reply: "7 PODIUMS" },
  { words: ["LOG", "JOBS", "CV"], target: "#log", reply: "READING LOG" },
  { words: ["INSIDE", "STACK"], target: "#inside", reply: "EXPLODING" },
  { words: ["HIRE", "HELLO", "HI", "CONTACT"], target: CONTACT_HREF, reply: "OPENING CONTACT" },
];

const ROLE_CODES = ROLES_NEWEST.map((_, i) => `R-${String(ROLES_NEWEST.length - i).padStart(2, "0")}`);

export function App() {
  const lenis = useSmoothScroll({ lerp: 0.09 });
  const host = useRef<HTMLDivElement>(null);
  const ctl = useRef<KeysController | null>(null);
  const callouts = useRef<Record<Layer, HTMLDivElement | null>>({ keycaps: null, switches: null, plate: null, pcb: null, case: null });
  const leaders = useRef<Record<Layer, SVGPolylineElement | null>>({ keycaps: null, switches: null, plate: null, pcb: null, case: null });
  const calloutLayer = useRef<HTMLDivElement>(null);
  const buffer = useRef("");
  const sectionRef = useRef(0);
  const [flat, setFlat] = useState(false);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    setTouch(window.matchMedia("(hover: none)").matches);
    let dead = false;
    import("./scene").then(({ createKeys }) => {
      if (dead) return;
      const c = createKeys(host.current!);
      if (!c) setFlat(true);
      ctl.current = c;
      c?.onKey((code, label) => handleKey(code, label.length === 1 ? label : code === "Space" ? " " : ""));
    });
    return () => {
      dead = true;
      ctl.current?.dispose();
      ctl.current = null;
    };
  }, []);

  const go = useCallback(
    (target: string) => {
      if (target.startsWith("#")) {
        const el = document.querySelector<HTMLElement>(target);
        if (!el) return;
        if (lenis.current) lenis.current.scrollTo(el, { duration: 1.6 });
        else el.scrollIntoView({ behavior: "smooth" });
      } else {
        window.setTimeout(() => (window.location.href = target), 500);
      }
    },
    [lenis],
  );

  const handleKey = useCallback(
    (code: string, char: string) => {
      const c = ctl.current;
      if (code === "Enter") {
        const word = buffer.current.trim();
        buffer.current = "";
        if (!word && sectionRef.current === SECTIONS.length - 1) {
          c?.setDisplay("OPENING CONTACT");
          go(CONTACT_HREF);
          return;
        }
        const hit = COMMANDS.find((cmd) => cmd.words.includes(word));
        if (hit) {
          c?.setDisplay(hit.reply);
          go(hit.target);
        } else {
          c?.setDisplay(word ? "TRY: WORK / WINS / HIRE" : "GC-61 READY");
        }
        return;
      }
      if (code === "Backspace") buffer.current = buffer.current.slice(0, -1);
      else if (char && /^[a-z0-9 ]$/i.test(char)) buffer.current = (buffer.current + char.toUpperCase()).slice(-16);
      else return;
      c?.setDisplay(buffer.current || "GC-61 READY");
    },
    [go],
  );

  // the visitor's real keyboard drives the 3D one
  useEffect(() => {
    const typing = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(el.tagName));
    const down = (e: KeyboardEvent) => {
      if (typing(e.target) || e.metaKey || e.ctrlKey) return;
      ctl.current?.press(e.code, true);
      if (e.repeat) return;
      if (e.code === "Space" && buffer.current) e.preventDefault();
      handleKey(e.code, e.key.length === 1 ? e.key : "");
    };
    const up = (e: KeyboardEvent) => ctl.current?.press(e.code, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [handleKey]);

  // scroll position picks the camera stop; callouts follow the exploded layers
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const mid = window.innerHeight / 2;
      const centres = SECTIONS.map((id) => {
        const r = document.getElementById(id)!.getBoundingClientRect();
        return r.top + r.height / 2 - mid;
      });
      let i = 0;
      while (i < centres.length - 1 && centres[i + 1] <= 0) i++;
      const a = centres[i];
      const b = centres[Math.min(i + 1, centres.length - 1)];
      const raw = i >= centres.length - 1 || b === a ? 0 : Math.min(1, Math.max(0, -a / (b - a)));
      const t = smoothstep(0.25, 0.75, raw);
      sectionRef.current = t > 0.5 ? i + 1 : i;
      const c = ctl.current;
      if (!c) return;
      c.setProgress(i, t);
      // labels live in a column on the right; leader lines run to each layer
      const anchors = c.anchors();
      const visible = anchors.keycaps.visible && window.innerWidth > 860;
      calloutLayer.current?.classList.toggle("is-on", visible);
      if (!visible) return;
      const colX = window.innerWidth - Math.min(300, window.innerWidth * 0.24) - 28;
      let floor = 90;
      LAYERS.forEach((l) => {
        const el = callouts.current[l];
        const line = leaders.current[l];
        if (!el || !line) return;
        const p = anchors[l];
        const y = Math.max(p.y - 18, floor);
        floor = y + 84;
        el.style.transform = `translate3d(${colX}px, ${y}px, 0)`;
        const elbow = colX - 40;
        line.setAttribute("points", `${p.x},${p.y} ${elbow},${y + 18} ${colX - 6},${y + 18}`);
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <div ref={host} className="kb-canvas" aria-hidden />
      <div className="kb-callouts" ref={calloutLayer} aria-hidden>
        <svg className="kb-leaders">
          {LAYERS.map((l) => (
            <polyline
              key={l}
              ref={(el) => {
                leaders.current[l] = el;
              }}
            />
          ))}
        </svg>
        {LAYERS.map((l) => (
          <div
            key={l}
            ref={(el) => {
              callouts.current[l] = el;
            }}
            className="kb-callout"
          >
            <div>
              <b>{CALLOUTS[l].name}</b>
              <span>{CALLOUTS[l].role}</span>
              <small>{CALLOUTS[l].tools}</small>
            </div>
          </div>
        ))}
      </div>

      <header className="kb-nav">
        <a href="#top" className="kb-logo">
          <span>GC-61</span> Gabriel Catimbang
        </a>
        <nav aria-label="Sections">
          <a href="#inside">Inside</a>
          <a href="#log">Log</a>
          <a href="#work">Work</a>
          <a href="#wins">Results</a>
        </nav>
        <a className="kb-btn is-small" href={CONTACT_HREF}>
          Get in touch
        </a>
      </header>

      <main className="kb">
        <section id="top" className="kb-sec kb-hero" aria-labelledby="kb-title">
          <div className="kb-hero-copy">
            <p className="kb-label">
              <span>GC-61</span>
              <span>Developer and DevOps engineer</span>
              <span>Naga City, PH</span>
            </p>
            <RiseLines id="kb-title" as="h1" className="kb-h1" lines={["A developer,", "fully assembled."]} delay={0.2} />
            <Rise as="p" className="kb-lede" delay={0.45}>
              Frontend, backend, infrastructure and pipelines, built by one person in Naga City.
              Go on, {touch ? "tap a key." : "type something."}
            </Rise>
            <Rise className="kb-try" delay={0.6}>
              {"WORK".split("").map((k) => (
                <kbd key={k}>{k}</kbd>
              ))}
              <kbd className="is-wide">enter</kbd>
              <span>{touch ? "Tap the keys on the board." : "Type WORK, then press enter."}</span>
            </Rise>
          </div>
          {flat && <p className="kb-flat">This page needs WebGL to show the keyboard.</p>}
        </section>

        <section id="inside" className="kb-sec kb-inside" aria-labelledby="kb-inside">
          <div className="kb-panel">
            <p className="kb-label">
              <span>Exploded view</span>
            </p>
            <RiseLines id="kb-inside" className="kb-h2" lines={["Five layers.", "One person."]} />
            <Rise as="p" className="kb-body">
              Pull a keyboard apart and it's the same stack I work in every day. What you touch,
              how it responds, what holds it steady, the wiring, and the cable that gets it to you.
            </Rise>
          </div>
        </section>

        <section id="log" className="kb-sec kb-log" aria-labelledby="kb-log">
          <div className="kb-wrap">
            <RiseLines id="kb-log" className="kb-h2" lines={["Service log."]} />
            <ol className="kb-roles">
              {ROLES_NEWEST.map((r, i) => (
                <Rise as="li" key={r.id} delay={(i % 2) * 0.06}>
                  <span className="kb-code">{ROLE_CODES[i]}</span>
                  <b>{r.company}</b>
                  <span className="kb-role">{r.role}</span>
                  <p>{r.blurb}</p>
                  <time>
                    {fmtMonth(r.start)} to {r.end ? fmtMonth(r.end) : "now"}
                  </time>
                </Rise>
              ))}
            </ol>
          </div>
        </section>

        <section id="work" className="kb-sec kb-work" aria-labelledby="kb-work">
          <div className="kb-wrap">
            <RiseLines id="kb-work" className="kb-h2" lines={["Firmware."]} />
            <Rise as="p" className="kb-body">
              Things I built that people use every day.
            </Rise>
            <ul className="kb-tiles">
              {WORK.map((w, i) => (
                <Rise as="li" key={w.name} delay={i * 0.06}>
                  <a href={w.href} target="_blank" rel="noreferrer">
                    <span className="kb-code">FW-0{i + 1}</span>
                    <span className="kb-dot">{w.name}</span>
                    <span className="kb-tag">{w.tagline}</span>
                    <span className="kb-spec">{w.tech.join(" / ")}</span>
                    <span className="kb-go">
                      {w.live ? hostOf(w.href) : "GitHub"} <ArrowUpRight size={14} weight="bold" aria-hidden />
                    </span>
                  </a>
                </Rise>
              ))}
            </ul>
          </div>
        </section>

        <section id="wins" className="kb-sec kb-wins" aria-labelledby="kb-wins">
          <div className="kb-wrap">
            <RiseLines id="kb-wins" className="kb-h2" lines={["Test results."]} />
            <ul className="kb-results">
              {TROPHIES.map((t, i) => (
                <Rise as="li" key={t.event} delay={i * 0.04}>
                  <span className="kb-dot is-small">{t.place}</span>
                  <b>{t.event}</b>
                  <span>{t.detail}</span>
                  <time>{t.year}</time>
                </Rise>
              ))}
            </ul>
          </div>
        </section>

        <section id="enter" className="kb-sec kb-enter" aria-labelledby="kb-enter">
          <div className="kb-enter-copy">
            <RiseLines id="kb-enter" as="h2" className="kb-h1" lines={["Press enter."]} />
            <Rise as="p" className="kb-lede">
              {touch ? "Tap the orange key, or the button." : "The orange key on the board, or the one on your desk."} Either way
              it opens a conversation.
            </Rise>
            <Rise className="kb-enter-actions">
              <Magnetic>
                <a className="kb-btn" href={CONTACT_HREF}>
                  Get in touch <kbd className="is-wide">enter</kbd>
                </a>
              </Magnetic>
              <a className="kb-mail" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
            </Rise>
          </div>
          <footer className="kb-foot">
            <span>GC-61. Assembled in Naga City, Philippines.</span>
            <span className="kb-foot-links">
              <a href={GITHUB} target="_blank" rel="noreferrer" aria-label="GitHub">
                <GithubLogo size={18} weight="bold" />
              </a>
              <a href={LINKEDIN} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <LinkedinLogo size={18} weight="bold" />
              </a>
            </span>
          </footer>
        </section>
      </main>
      <Switcher current="keys" />
    </>
  );
}
