import { motion, useReducedMotion } from "motion/react";
import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUpRight, Asterisk, GithubLogo, LinkedinLogo, Scissors } from "@phosphor-icons/react";
import { Switcher } from "../shared/Switcher";
import {
  CURRENTLY,
  EMAIL,
  GITHUB,
  HALFTONE,
  LINKEDIN,
  MARQUEE_ITEMS,
  ROLES_NEWEST,
  TOOLBOX,
  TROPHIES,
  WORK,
  fmtMonth,
  hostOf,
} from "../shared/content";

const SPRING = { type: "spring" as const, stiffness: 260, damping: 18 };

/** Slapped onto the page: drops in slightly too big and too crooked, then settles. */
function Slap({
  children,
  className,
  tilt = 0,
  delay = 0,
  style,
}: {
  children: ReactNode;
  className?: string;
  tilt?: number;
  delay?: number;
  style?: CSSProperties;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={{ ...style, rotate: tilt }}
      initial={reduced ? false : { opacity: 0, scale: 1.18, rotate: tilt * 3 + 6 }}
      whileInView={{ opacity: 1, scale: 1, rotate: tilt }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ ...SPRING, delay }}
    >
      {children}
    </motion.div>
  );
}

const TOPICS = ["A project", "A role", "A collaboration", "Something else"] as const;

const STICKERS = [
  { shape: "burst", tone: "riso" },
  { shape: "circle", tone: "ink" },
  { shape: "square", tone: "paper" },
  { shape: "pill", tone: "ink" },
  { shape: "burst", tone: "ink" },
  { shape: "circle", tone: "riso" },
  { shape: "ticket", tone: "paper" },
] as const;

const TILTS = [-3, 2.5, -1.5, 3];

export function App() {
  const reduced = useReducedMotion() ?? false;
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("A project");
  const [note, setNote] = useState("");

  const send = (event: FormEvent) => {
    event.preventDefault();
    const subject = encodeURIComponent(`${topic}, via Issue 01`);
    const body = encodeURIComponent(note.trim());
    window.location.href = `mailto:${EMAIL}?subject=${subject}${body ? `&body=${body}` : ""}`;
  };

  return (
    <>
      <div className="zn-grain" aria-hidden />
      <main className="zn">
        {/* ---------- cover ---------- */}
        <section className="zn-cover" aria-labelledby="zn-title">
          <div className="zn-mast">
            <p className="zn-issue">
              <span>Issue 01</span>
              <span>2026</span>
            </p>
            <p className="zn-masthead" aria-label="gabcat">
              {"GABCAT".split("").map((ch, i) => (
                <motion.span
                  key={i}
                  initial={reduced ? false : { y: -60, rotate: i % 2 ? 8 : -8, opacity: 0 }}
                  animate={{ y: 0, rotate: 0, opacity: 1 }}
                  transition={{ ...SPRING, delay: 0.05 * i }}
                  aria-hidden
                >
                  {ch}
                </motion.span>
              ))}
            </p>
          </div>

          <div className="zn-cover-body">
            <div className="zn-cover-copy">
              <h1 id="zn-title">From support chat to server room.</h1>
              <p>
                Gabriel Catimbang builds websites people actually use, then keeps
                them running. A developer's zine from Naga City.
              </p>
              <div className="zn-cover-actions">
                <a className="zn-btn" href="#feature">
                  Read the issue <ArrowDown size={18} weight="bold" aria-hidden />
                </a>
              </div>
            </div>

            <motion.figure
              className="zn-photo"
              initial={reduced ? false : { opacity: 0, y: 40, rotate: 6 }}
              animate={{ opacity: 1, y: 0, rotate: 2 }}
              transition={{ ...SPRING, delay: 0.35 }}
            >
              <img src={HALFTONE} alt="Halftone portrait of Gabriel Catimbang" width={800} height={1067} />
            </motion.figure>

            <motion.a
              className="zn-sticker-cta"
              href="#coupon"
              initial={reduced ? false : { opacity: 0, scale: 1.6, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: -12 }}
              transition={{ ...SPRING, delay: 0.75 }}
            >
              Get in touch
            </motion.a>
          </div>
        </section>

        {/* ---------- feature ---------- */}
        <section className="zn-feature" id="feature" aria-labelledby="zn-feature-title">
          <Slap className="zn-pull" tilt={-1.5}>
            <p>
              <mark>Listening closely</mark> mattered more than having the fastest answer.
            </p>
          </Slap>

          <article className="zn-article">
            <h2 id="zn-feature-title">I used to answer chats for a living.</h2>
            <div className="zn-columns">
              <p className="zn-drop">
                Before I wrote code, I spent three years on the other side of a support
                chat. At Bell Canada, every conversation started with someone who
                needed something to work.
              </p>
              <p>
                That stayed with me. Eventually I wanted to do more than help people
                work around a problem. I wanted to build the thing that solved it.
              </p>
              <p>
                So I joined ThePILLARS Publication as a frontend apprentice, and six
                months later I was shipping full-stack. Now I'm the one they call so
                the site never goes down.
              </p>
              <p>
                These days I keep production boring at Detken, lead tech at CS Guild,
                and chase hackathons on weekends. Seven podiums so far.
              </p>
            </div>
          </article>

          <aside className="zn-sidebar" aria-label="Right now">
            <p className="zn-sidebar-title">Right now</p>
            <ul>
              {CURRENTLY.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </aside>
        </section>

        {/* ---------- the work ---------- */}
        <section className="zn-work" aria-labelledby="zn-work-title">
          <h2 id="zn-work-title" className="zn-section-title">
            The work<span>, pasted in.</span>
          </h2>
          <div className="zn-cuttings">
            {WORK.map((w, i) => (
              <Slap key={w.name} className={`zn-cutting c-${i}`} tilt={TILTS[i]} delay={i * 0.06}>
                <span className="zn-tape" aria-hidden />
                <span className="zn-num" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{w.name}</h3>
                <p className="zn-tagline">{w.tagline}</p>
                <p>{w.story}</p>
                <ul className="zn-stamps">
                  {w.tech.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                  {w.live && <li className="is-live">Live</li>}
                </ul>
                <a href={w.href} target="_blank" rel="noreferrer">
                  {w.live ? hostOf(w.href) : "Source on GitHub"} <ArrowUpRight size={16} weight="bold" aria-hidden />
                </a>
              </Slap>
            ))}
          </div>
        </section>

        {/* ---------- tape ---------- */}
        <div className="zn-tapeband" aria-hidden>
          <div className={`zn-tapeband-track ${reduced ? "is-still" : ""}`}>
            {[0, 1].map((copy) => (
              <span key={copy}>
                {MARQUEE_ITEMS.map((item) => (
                  <span key={item}>
                    {item}
                    <Asterisk size={28} weight="bold" />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* ---------- stickers ---------- */}
        <section className="zn-stickers" aria-labelledby="zn-stickers-title">
          <h2 id="zn-stickers-title" className="zn-section-title">
            Peel-off trophies.
          </h2>
          <ul className="zn-sheet">
            {TROPHIES.map((t, i) => {
              const s = STICKERS[i];
              return (
                <li key={t.event} className={`zn-stk is-${s.shape} tone-${s.tone} s-${i}`}>
                  <Slap tilt={(i % 3) * 4 - 4} delay={i * 0.07}>
                    <div className="zn-stk-face">
                      <b>{t.place}</b>
                      <span>{t.event}</span>
                      <small>{t.year}</small>
                    </div>
                  </Slap>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ---------- time card ---------- */}
        <section className="zn-timecard-wrap" aria-labelledby="zn-time-title">
          <h2 id="zn-time-title" className="zn-section-title">
            Time card.
          </h2>
          <Slap className="zn-timecard" tilt={-1}>
            <div className="zn-tc-head">
              <span>Name: Gabriel Catimbang</span>
              <span>Dept: Build &amp; Ship</span>
            </div>
            <div className="zn-tc-cols" aria-hidden>
              <span>Employer and role</span>
              <span>In</span>
              <span>Out</span>
            </div>
            <ol>
              {ROLES_NEWEST.map((r) => (
                <li key={r.id}>
                  <div>
                    <b>{r.company}</b>
                    <span>{r.role}</span>
                  </div>
                  <time className="zn-in">{fmtMonth(r.start)}</time>
                  {r.end ? <time className="zn-out">{fmtMonth(r.end)}</time> : <span className="zn-still">Still in</span>}
                </li>
              ))}
            </ol>
          </Slap>
        </section>

        {/* ---------- label maker ---------- */}
        <section className="zn-labels" aria-labelledby="zn-labels-title">
          <h2 id="zn-labels-title" className="zn-section-title">
            Label maker.
          </h2>
          <div className="zn-label-groups">
            {TOOLBOX.map((g, gi) => (
              <div key={g.group}>
                <h3>{g.group}</h3>
                <ul>
                  {g.items.map((item, i) => (
                    <li key={item} className={gi === 1 ? "is-riso" : ""} style={{ rotate: `${((i * 37 + gi * 11) % 5) - 2}deg` }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- back cover ---------- */}
        <section className="zn-back" id="coupon" aria-labelledby="zn-coupon-title">
          <form className="zn-coupon" onSubmit={send}>
            <Scissors className="zn-scissors" size={30} weight="fill" aria-hidden />
            <h2 id="zn-coupon-title">Clip and send.</h2>
            <p>Yes! I'd like to work with Gab on:</p>
            <fieldset>
              <legend className="zn-sr">Topic</legend>
              {TOPICS.map((t) => (
                <label key={t} className="zn-check">
                  <input type="radio" name="topic" value={t} checked={topic === t} onChange={() => setTopic(t)} />
                  <span>{t}</span>
                </label>
              ))}
            </fieldset>
            <label className="zn-field" htmlFor="zn-note">
              Tell me a little about it
            </label>
            <textarea
              id="zn-note"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What are we building?"
            />
            <p className="zn-help">This opens your email app with everything filled in.</p>
            <button type="submit" className="zn-btn is-riso">
              Get in touch <ArrowUpRight size={18} weight="bold" aria-hidden />
            </button>
          </form>

          <div className="zn-colophon">
            <p className="zn-colophon-mast">GABCAT</p>
            <p>
              Issue 01. Printed in two inks, orange and black, in Naga City,
              Philippines.
            </p>
            <p>
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            </p>
            <p className="zn-social">
              <a href={GITHUB} target="_blank" rel="noreferrer">
                <GithubLogo size={20} weight="bold" aria-hidden /> GitHub
              </a>
              <a href={LINKEDIN} target="_blank" rel="noreferrer">
                <LinkedinLogo size={20} weight="bold" aria-hidden /> LinkedIn
              </a>
            </p>
          </div>
        </section>
      </main>
      <Switcher current="zine" />
    </>
  );
}
