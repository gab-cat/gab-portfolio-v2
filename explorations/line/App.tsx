import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ArrowRight, ArrowUpRight, GithubLogo, LinkedinLogo, X } from "@phosphor-icons/react";
import { Switcher } from "../shared/Switcher";
import { CONTACT_HREF, EMAIL, GITHUB, LINKEDIN, WORK, hostOf } from "../shared/content";
import { H, LINES, LINE_ORDER, RUNNING, STATION, STATIONS, W, type LineId, type Station } from "./network";

const color = (line: LineId) => `var(--${line})`;

/** Below the overlay breakpoint the title sits above the map, so crop the empty sky. */
const FULL = { y: 0, h: H };
const CROPPED = { y: 270, h: H - 270 };
type Frame = typeof FULL;

function useFrame(): Frame {
  const query = "(max-width: 1100px)";
  const [cropped, setCropped] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const q = window.matchMedia(query);
    const on = () => setCropped(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return cropped ? CROPPED : FULL;
}

function Badge({ line, size = "md" }: { line: LineId; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={`ln-badge is-${size} on-${line}`} aria-label={LINES[line].name}>
      {LINES[line].letter}
    </span>
  );
}

/* ---------- the map ---------- */

function labelProps(s: Station) {
  if (s.label === "above-left") return { x: s.x - 16, y: s.y - 18, anchor: "end" as const, subDy: -15 };
  if (s.label === "above") return { x: s.x, y: s.y - 20, anchor: "middle" as const, subDy: -15 };
  return { x: s.x, y: s.y + 30, anchor: "middle" as const, subDy: 15 };
}

function NetworkMap({
  selected,
  onSelect,
  reduced,
  frame,
}: {
  selected: string | null;
  onSelect: (id: string | null) => void;
  reduced: boolean;
  frame: Frame;
}) {
  const key = (event: KeyboardEvent<SVGGElement>, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(id);
    }
  };

  return (
    <svg
      className={`ln-map ${reduced ? "is-still" : ""}`}
      viewBox={`0 ${frame.y} ${W} ${frame.h}`}
      role="group"
      aria-label="Transit map of Gabriel Catimbang's career. Four lines start in Naga City and three of them end at the station Your team."
    >
      {LINE_ORDER.map((id, i) => (
        <g key={id} style={{ "--i": i } as CSSProperties}>
          <path className="ln-track" d={LINES[id].path} stroke={color(id)} pathLength={1} />
          {LINES[id].extension && (
            <path className="ln-ext" d={LINES[id].extension} stroke={color(id)} />
          )}
        </g>
      ))}

      {!reduced &&
        RUNNING.map((id, i) => (
          <rect key={id} className="ln-train" width="22" height="9" x="-11" y="-4.5" rx="4.5" fill={color(id)}>
            <animateMotion
              dur={`${14 + i * 3}s`}
              begin={`${1.6 + i * 0.7}s`}
              repeatCount="indefinite"
              rotate="auto"
              path={LINES[id].path}
            />
          </rect>
        ))}

      {STATIONS.map((s, i) => {
        const l = labelProps(s);
        const interchange = s.lines.length > 1;
        const active = selected === s.id;
        return (
          <g
            key={s.id}
            className={`ln-stn ${active ? "is-active" : ""} ${s.terminal ? "is-terminal" : ""}`}
            style={{ "--d": `${0.9 + i * 0.035}s` } as CSSProperties}
            role="button"
            tabIndex={0}
            aria-label={`${s.name}, ${s.sub}`}
            aria-pressed={active}
            onClick={() => onSelect(active ? null : s.id)}
            onKeyDown={(e) => key(e, s.id)}
          >
            <circle className="ln-hit" cx={s.x} cy={s.y} r={20} />
            {s.terminal ? (
              <rect className="ln-term" x={s.x - 16} y={s.y - 78} width={32} height={156} rx={16} />
            ) : interchange ? (
              <circle className="ln-dot is-x" cx={s.x} cy={s.y} r={11} />
            ) : (
              <circle className="ln-dot" cx={s.x} cy={s.y} r={7} stroke={color(s.lines[0])} />
            )}
            {s.terminal ? (
              <>
                <text className="ln-sub" x={s.x} y={s.y - 112} textAnchor="middle">
                  {s.sub}
                </text>
                <text className="ln-name is-big" x={s.x} y={s.y - 92} textAnchor="middle">
                  {s.name}
                </text>
              </>
            ) : (
              <>
                <text className={`ln-name ${s.id === "naga" ? "is-big" : ""}`} x={l.x} y={l.y} textAnchor={l.anchor}>
                  {s.name}
                </text>
                <text className="ln-sub" x={l.x} y={l.y + l.subDy} textAnchor={l.anchor}>
                  {s.sub}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function StationCard({ station, frame, onClose }: { station: Station; frame: Frame; onClose: () => void }) {
  const left = (station.x / W) * 100;
  const top = ((station.y - frame.y) / frame.h) * 100;
  const flipX = station.x > W * 0.62;
  const below = station.y < 400 && !station.terminal;
  return (
    <motion.div
      className={`ln-card ${flipX ? "is-left" : ""} ${below ? "is-below" : ""}`}
      style={{ left: `${left}%`, top: `${top}%` }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      role="dialog"
      aria-label={station.name}
    >
      <div className="ln-card-top">
        <span className="ln-card-lines">
          {station.lines.map((l) => (
            <Badge key={l} line={l} size="sm" />
          ))}
        </span>
        <button type="button" onClick={onClose} aria-label="Close">
          <X size={14} weight="bold" />
        </button>
      </div>
      <h3>{station.name}</h3>
      <p>{station.body}</p>
      {station.terminal ? (
        <a className="ln-btn" href={CONTACT_HREF}>
          Get in touch <ArrowRight size={16} weight="bold" aria-hidden />
        </a>
      ) : (
        station.href && (
          <a className="ln-link" href={station.href} target="_blank" rel="noreferrer">
            {hostOf(station.href)} <ArrowUpRight size={14} weight="bold" aria-hidden />
          </a>
        )
      )}
    </motion.div>
  );
}

/* ---------- departures board ---------- */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function Flap({ text, go, delay }: { text: string; go: boolean; delay: number }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(text.toUpperCase());
  useEffect(() => {
    const target = text.toUpperCase();
    if (!go || reduced) {
      setShown(target);
      return;
    }
    let frame = 0;
    const total = 16 + target.length;
    let id = 0;
    const start = window.setTimeout(() => {
      id = window.setInterval(() => {
        frame += 1;
        setShown(
          target
            .split("")
            .map((ch, i) => (ch === " " || frame > 8 + i ? ch : GLYPHS[(frame * 7 + i * 13) % GLYPHS.length]))
            .join(""),
        );
        if (frame >= total) window.clearInterval(id);
      }, 45);
    }, delay);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, [go, text, delay, reduced]);
  return (
    <span className="ln-flap" aria-label={text}>
      {shown.split("").map((ch, i) => (
        <span key={i} aria-hidden>
          {ch}
        </span>
      ))}
    </span>
  );
}

const BOARD: { line: LineId; work: (typeof WORK)[number] }[] = [
  { line: "build", work: WORK[0] },
  { line: "build", work: WORK[1] },
  { line: "play", work: WORK[2] },
  { line: "play", work: WORK[3] },
];

function Departures() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.4 });
  return (
    <div className="ln-board" ref={ref}>
      <div className="ln-board-head" aria-hidden>
        <span>Line</span>
        <span>Destination</span>
        <span>Calling at</span>
        <span>Status</span>
      </div>
      <ul>
        {BOARD.map(({ line, work }, i) => (
          <li key={work.name}>
            <Badge line={line} />
            <div className="ln-dest">
              <Flap text={work.name} go={seen} delay={i * 180} />
              <span>{work.tagline}</span>
            </div>
            <span className="ln-via">{work.tech.join(" / ")}</span>
            <a href={work.href} target="_blank" rel="noreferrer" className={work.live ? "is-live" : ""}>
              {work.live ? "Live" : "On GitHub"} <ArrowUpRight size={13} weight="bold" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- page ---------- */

export function App() {
  const reduced = useReducedMotion() ?? false;
  const [selected, setSelected] = useState<string | null>(null);
  const [line, setLine] = useState<LineId>("listen");
  const current = LINES[line];
  const frame = useFrame();

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => event.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="ln-nav">
        <a className="ln-logo" href="/explorations/line/">
          <span aria-hidden>G</span>gabcat lines
        </a>
        <nav aria-label="Sections">
          <a href="#map">Map</a>
          <a href="#lines">Lines</a>
          <a href="#departures">Departures</a>
        </nav>
        <a className="ln-btn is-small" href={CONTACT_HREF}>
          Get in touch
        </a>
      </header>

      <main>
        <section className="ln-hero" id="map" aria-labelledby="ln-title">
          <div className="ln-hero-copy">
            <motion.h1
              id="ln-title"
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80, damping: 18 }}
            >
              Naga City to the internet.
            </motion.h1>
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.1 }}
            >
              Four lines, one developer. Tap any station to see what happened there.
            </motion.p>
          </div>

          <ul className="ln-legend" aria-label="Lines">
            {LINE_ORDER.map((id) => (
              <li key={id}>
                <Badge line={id} size="sm" />
                <span>{LINES[id].name}</span>
                <small>{LINES[id].years}</small>
              </li>
            ))}
          </ul>

          <div className="ln-map-scroll">
            <div className="ln-map-wrap">
              <NetworkMap selected={selected} onSelect={setSelected} reduced={reduced} frame={frame} />
              <AnimatePresence>
                {selected && (
                  <StationCard key={selected} station={STATION[selected]} frame={frame} onClose={() => setSelected(null)} />
                )}
              </AnimatePresence>
            </div>
          </div>
          <p className="ln-note">
            <span className="ln-drag">Drag the map sideways to ride the whole network. </span>
            Map not to scale.
          </p>
        </section>

        <section className="ln-lines" id="lines" aria-labelledby="ln-lines-title">
          <h2 id="ln-lines-title">Pick a line.</h2>
          <div className="ln-tabs" role="tablist" aria-label="Lines">
            {LINE_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={line === id}
                aria-controls="ln-panel"
                className={line === id ? "is-on" : ""}
                style={{ "--c": color(id) } as CSSProperties}
                onClick={() => setLine(id)}
              >
                <Badge line={id} size="lg" />
                <span>
                  <b>{LINES[id].name}</b>
                  <small>{LINES[id].years}</small>
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={line}
              id="ln-panel"
              role="tabpanel"
              className="ln-panel"
              style={{ "--c": color(line) } as CSSProperties}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -8, transition: { duration: 0.12 } }}
              transition={{ type: "spring", stiffness: 160, damping: 22 }}
            >
              <div className="ln-panel-copy">
                <h3>{current.title}</h3>
                <p>{current.copy}</p>
                {line === "listen" && <p className="ln-alert">Service ended April 2025. Passengers for building, change at ThePILLARS.</p>}
              </div>
              <ol className="ln-strip">
                {current.stops.map((id) => {
                  const s = STATION[id];
                  const transfers = s.lines.filter((l) => l !== line);
                  return (
                    <li key={id} className={`${s.terminal ? "is-terminal" : ""} ${transfers.length ? "is-x" : ""}`}>
                      <div className="ln-strip-name">
                        <b>{s.name}</b>
                        <span>{s.sub}</span>
                        {transfers.length > 0 && (
                          <span className="ln-change">
                            Change for {transfers.map((l) => <Badge key={l} line={l} size="sm" />)}
                          </span>
                        )}
                      </div>
                      <p>{s.body}</p>
                    </li>
                  );
                })}
              </ol>
            </motion.div>
          </AnimatePresence>
        </section>

        <section className="ln-departures" id="departures" aria-labelledby="ln-dep-title">
          <h2 id="ln-dep-title">Departures.</h2>
          <p>Things I built that people ride every day.</p>
          <Departures />
        </section>

        <section className="ln-terminus" aria-labelledby="ln-end-title">
          <svg className="ln-converge" viewBox="0 0 1200 220" preserveAspectRatio="none" aria-hidden>
            <path d="M0 60 H700 L760 120 H1140" stroke="var(--build)" />
            <path d="M0 120 H1140" stroke="var(--ship)" />
            <path d="M0 180 H700 L760 120 H1140" stroke="var(--play)" />
          </svg>
          <div className="ln-terminus-cap" aria-hidden />
          <div className="ln-terminus-copy">
            <h2 id="ln-end-title">Next stop: your team.</h2>
            <p>Projects, roles, collaborations. Tell me where we're going.</p>
            <div className="ln-terminus-actions">
              <a className="ln-btn" href={CONTACT_HREF}>
                Get in touch <ArrowRight size={16} weight="bold" aria-hidden />
              </a>
              <a className="ln-mail" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="ln-foot">
        <span>Gabriel Catimbang. Developer &amp; DevOps Engineer.</span>
        <span className="ln-foot-links">
          <a href={GITHUB} target="_blank" rel="noreferrer" aria-label="GitHub">
            <GithubLogo size={18} weight="bold" />
          </a>
          <a href={LINKEDIN} target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <LinkedinLogo size={18} weight="bold" />
          </a>
        </span>
      </footer>
      <Switcher current="line" />
    </>
  );
}
