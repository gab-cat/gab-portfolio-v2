import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowUpRight,
  Broadcast,
  CaretDown,
  CheckCircle,
  CircleNotch,
  GithubLogo,
  LinkedinLogo,
} from "@phosphor-icons/react";
import { Switcher } from "../shared/Switcher";
import {
  CONTACT_HREF,
  CURRENTLY,
  EMAIL,
  GITHUB,
  LINKEDIN,
  NAME,
  NOW,
  PORTRAIT,
  TROPHIES,
  WORK,
  fmtMonth,
  fromIndex,
  hostOf,
  monthIndex,
  type Month,
} from "../shared/content";

/* ---------- data: every bar is one real month since the first job ---------- */

const FIRST: Month = { y: 2022, m: 5 };
const MONTHS = Array.from(
  { length: monthIndex(NOW) - monthIndex(FIRST) + 1 },
  (_, i) => fromIndex(monthIndex(FIRST) + i),
);
const key = (m: Month) => `${m.y}-${m.m}`;

type System = {
  name: string;
  detail: string;
  since: Month;
  events: Record<string, string>;
};

const SYSTEMS: System[] = [
  {
    name: "Listening",
    detail: "Real-time support for Bell Canada customers",
    since: { y: 2022, m: 5 },
    events: {
      "2022-5": "Joined Quantrics as an eChat Representative for Bell Canada",
      "2025-4": "Handed back the headset. Listening came along to the next job",
    },
  },
  {
    name: "Frontend",
    detail: "Next.js, React, Vue & Nuxt, TypeScript",
    since: { y: 2024, m: 1 },
    events: {
      "2024-1": "Joined ThePILLARS Publication as a frontend apprentice",
      "2025-6": "Old.St Labs internship, Next.js in front",
    },
  },
  {
    name: "Backend & data",
    detail: "NestJS, Express, PostgreSQL, Redis, MongoDB, Convex",
    since: { y: 2024, m: 7 },
    events: {
      "2024-7": "Shipping full-stack at ThePILLARS, six months in",
      "2025-6": "NestJS in back at Old.St Labs",
    },
  },
  {
    name: "Infrastructure",
    detail: "Docker, AWS, Nginx, Linux",
    since: { y: 2024, m: 8 },
    events: {
      "2024-8": "Became ThePILLARS webmaster: deployments and security",
      "2025-4": "Joined Detken and moved production off Vercel",
    },
  },
  {
    name: "Pipelines",
    detail: "GitHub Actions, automated test, build and deploy",
    since: { y: 2025, m: 4 },
    events: {
      "2025-4": "Wired up Detken pipelines that deploy themselves",
    },
  },
  {
    name: "Side quests",
    detail: "Unreal Engine, C++, CTF forensics, Gemini",
    since: { y: 2024, m: 6 },
    events: {
      "2024-6": "Lead game programmer intern at ADNU, Unreal Engine 4",
    },
  },
];

type Update = { label: string; when?: string; text: string };
type Incident = { title: string; state: "Ongoing" | "Resolved" | "Completed"; updates: Update[] };

const HISTORY: { year: string; incidents: Incident[] }[] = [
  {
    year: "2025",
    incidents: [
      {
        title: "Detken production moved off Vercel",
        state: "Ongoing",
        updates: [
          { label: "Update", text: "Production runs on servers we control. Pipelines test, build and deploy on their own, and the doors are locked properly." },
          { label: "Started", when: "Apr 2025", text: "Joined Detken Development as a DevOps Engineer." },
        ],
      },
      {
        title: "Internship at Old.St Labs",
        state: "Completed",
        updates: [
          { label: "Completed", when: "Sep 2025", text: "Shipped digital products end to end with a team that moves fast." },
          { label: "Started", when: "Jun 2025", text: "Software Developer Intern. Next.js in front, NestJS in back." },
        ],
      },
      {
        title: "Root cause found: I wanted to build the fix",
        state: "Resolved",
        updates: [
          { label: "Resolved", when: "Apr 2025", text: "Three years of listening pointed to one fix. Build the thing that solves the problem, instead of explaining the workaround." },
          { label: "Monitoring", text: "Four-time Bell All-Star, in the top 10% of performers." },
          { label: "Investigating", when: "May 2022", text: "Started in Bell Canada's support chat through Quantrics. Every conversation began with someone who needed something to work." },
        ],
      },
    ],
  },
  {
    year: "2024",
    incidents: [
      {
        title: "Keeping ThePILLARS online",
        state: "Ongoing",
        updates: [
          { label: "Update", text: "The person they call so the site never goes down. Deployments, security, and automating the boring parts." },
          { label: "Started", when: "Aug 2024", text: "Took over as webmaster of ThePILLARS Publication." },
        ],
      },
      {
        title: "Gameplay systems in Unreal Engine 4",
        state: "Completed",
        updates: [
          { label: "Completed", when: "Jul 2024", text: "Core mechanics shipped in C++. Yes, games count as software." },
          { label: "Started", when: "Jun 2024", text: "Lead Game Programmer intern at ADNU Digital Illustration & Animation." },
        ],
      },
      {
        title: "Frontend apprentice to full-stack",
        state: "Completed",
        updates: [
          { label: "Completed", when: "Jul 2024", text: "Shipping full-stack six months later, with Vue, Nuxt and Express." },
          { label: "Started", when: "Jan 2024", text: "Joined ThePILLARS Publication as a frontend apprentice." },
        ],
      },
    ],
  },
];

const METRICS = [
  { value: "7", label: "hackathon podiums" },
  { value: "2,750+", label: "MerchTrack users in week one" },
  { value: "4×", label: "Bell All-Star awards" },
  { value: "3+", label: "years shipping" },
];

type Tip = { x: number; y: number; month: Month; state: "off" | "ok" | "up"; text: string; system: string };

/* ---------- page ---------- */

export function App() {
  const reduced = useReducedMotion() ?? false;
  const [ready, setReady] = useState<number>(reduced ? SYSTEMS.length : 0);
  const [tip, setTip] = useState<Tip | null>(null);
  const done = ready >= SYSTEMS.length;

  // A real-looking health check: each system reports in, then the banner flips.
  useEffect(() => {
    if (reduced) {
      setReady(SYSTEMS.length);
      return;
    }
    const timers = SYSTEMS.map((_, i) => window.setTimeout(() => setReady(i + 1), 420 + i * 190));
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  return (
    <>
      <div className="st">
        <header className="st-top">
          <a className="st-logo" href="/explorations/status/">
            <span className="st-mark" aria-hidden>g</span>
            gabcat <span>status</span>
          </a>
          <a className="st-page" href={CONTACT_HREF}>
            <Broadcast size={16} weight="bold" aria-hidden />
            Page Gab
          </a>
        </header>

        <section className="st-hero" aria-labelledby="st-title">
          <div className="st-who">
            <img src={PORTRAIT} alt={NAME} />
            <div>
              <b>{NAME}</b>
              <span>Developer &amp; DevOps Engineer, Naga City, Philippines</span>
            </div>
          </div>

          <div className={`st-banner ${done ? "is-ok" : ""}`}>
            <div className="st-banner-icon" aria-hidden>
              {done ? <CheckCircle size={30} weight="fill" /> : <CircleNotch size={30} weight="bold" className="st-spin" />}
            </div>
            <div>
              <h1 id="st-title" aria-live="polite">
                {done ? "All systems operational" : "Running health checks"}
              </h1>
              <p>
                Gab builds websites people actually use, then keeps them running.
                This page is the proof.
              </p>
            </div>
          </div>
        </section>

        <section className="st-block" aria-labelledby="st-systems">
          <div className="st-block-head">
            <h2 id="st-systems">Systems</h2>
            <span>
              {fmtMonth(FIRST)} to today, one bar per month
            </span>
          </div>
          <div className="st-systems">
            {SYSTEMS.map((s, i) => (
              <SystemRow key={s.name} system={s} ready={i < ready} reduced={reduced} onTip={setTip} />
            ))}
          </div>
          <div className="st-legend" aria-hidden>
            <span><i className="is-ok" /> Operational</span>
            <span><i className="is-up" /> Upgrade shipped</span>
            <span><i className="is-off" /> Not online yet</span>
          </div>
        </section>

        <section className="st-metrics" aria-label="Metrics">
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ type: "spring", stiffness: 120, damping: 20, delay: i * 0.06 }}
            >
              <b>{m.value}</b>
              <span>{m.label}</span>
            </motion.div>
          ))}
        </section>

        <section className="st-block" aria-labelledby="st-services">
          <div className="st-block-head">
            <h2 id="st-services">Services</h2>
            <span>Things I built that people use</span>
          </div>
          <div className="st-services">
            {WORK.map((w) => (
              <details key={w.name}>
                <summary>
                  <span className="st-svc-state">
                    <CheckCircle size={18} weight="fill" aria-hidden />
                    <span className="st-sr">Operational</span>
                  </span>
                  <span className="st-svc-name">
                    <b>{w.name}</b>
                    <span>{w.tagline}</span>
                  </span>
                  <span className="st-svc-stack">{w.tech.join(", ")}</span>
                  <CaretDown size={16} weight="bold" className="st-caret" aria-hidden />
                </summary>
                <div className="st-svc-body">
                  <p>{w.story}</p>
                  <a href={w.href} target="_blank" rel="noreferrer">
                    {w.live ? hostOf(w.href) : "Source on GitHub"} <ArrowUpRight size={14} weight="bold" aria-hidden />
                  </a>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="st-block" aria-labelledby="st-history">
          <div className="st-block-head">
            <h2 id="st-history">Incident history</h2>
            <span>Every job, written up like an outage report</span>
          </div>
          {HISTORY.map((group) => (
            <div key={group.year} className="st-year">
              <h3>{group.year}</h3>
              <div className="st-incidents">
                {group.incidents.map((inc) => (
                  <article key={inc.title} className="st-incident">
                    <header>
                      <h4>{inc.title}</h4>
                      <span className={`st-state is-${inc.state.toLowerCase()}`}>{inc.state}</span>
                    </header>
                    <ol>
                      {inc.updates.map((u) => (
                        <li key={u.label + u.text}>
                          <p>
                            <b>{u.label}.</b> {u.text}
                          </p>
                          {u.when && <time>{u.when}</time>}
                        </li>
                      ))}
                    </ol>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="st-block" aria-labelledby="st-wins">
          <div className="st-block-head">
            <h2 id="st-wins">Recognition</h2>
            <span>Hackathons, CTFs and the support floor</span>
          </div>
          <div className="st-wins">
            {(["2025", "2024"] as const).map((year) => (
              <div key={year}>
                <h3>{year}</h3>
                <ul>
                  {TROPHIES.filter((t) => t.year === year).map((t) => (
                    <li key={t.event}>
                      <span className={t.place === "Champion" ? "is-gold" : ""}>{t.place}</span>
                      <b>{t.event}</b>
                      <small>{t.detail}</small>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="st-oncall" aria-labelledby="st-contact">
          <div>
            <h2 id="st-contact">Need something built, or kept alive?</h2>
            <p>
              Right now I'm {CURRENTLY[1]}, {CURRENTLY[0]}, and {CURRENTLY[2]}. There's room for one more
              good problem.
            </p>
          </div>
          <div className="st-oncall-actions">
            <a className="st-page is-big" href={CONTACT_HREF}>
              <Broadcast size={18} weight="bold" aria-hidden />
              Page Gab
            </a>
            <a className="st-mail" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
          </div>
        </section>

        <footer className="st-foot">
          <span>gabcat status. Naga City, Philippines (UTC+8)</span>
          <span className="st-foot-links">
            <a href={GITHUB} target="_blank" rel="noreferrer" aria-label="GitHub">
              <GithubLogo size={18} weight="bold" />
            </a>
            <a href={LINKEDIN} target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <LinkedinLogo size={18} weight="bold" />
            </a>
          </span>
        </footer>
      </div>

      {tip && (
        <div className="st-tip" style={{ left: tip.x, top: tip.y }} role="tooltip">
          <b>{fmtMonth(tip.month)}</b>
          <span className={`st-tip-state is-${tip.state}`}>
            {tip.system}: {tip.state === "off" ? "not online yet" : tip.state === "up" ? "upgrade shipped" : "operational"}
          </span>
          {tip.text && <p>{tip.text}</p>}
        </div>
      )}
      <Switcher current="status" />
    </>
  );
}

function SystemRow({
  system,
  ready,
  reduced,
  onTip,
}: {
  system: System;
  ready: boolean;
  reduced: boolean;
  onTip: (tip: Tip | null) => void;
}) {
  const bars = useMemo(
    () =>
      MONTHS.map((m) => {
        const event = system.events[key(m)];
        const state: Tip["state"] = monthIndex(m) < monthIndex(system.since) ? "off" : event ? "up" : "ok";
        return { m, state, text: event ?? "" };
      }),
    [system],
  );

  const show = (event: ReactPointerEvent<HTMLSpanElement>, i: number) => {
    const box = event.currentTarget.getBoundingClientRect();
    const bar = bars[i];
    onTip({
      x: Math.min(Math.max(box.left + box.width / 2, 130), window.innerWidth - 130),
      y: box.top,
      month: bar.m,
      state: bar.state,
      text: bar.text,
      system: system.name,
    });
  };

  const upgrades = bars.filter((b) => b.state === "up").length;

  return (
    <div className={`st-sys ${ready ? "is-ready" : ""}`}>
      <div className="st-sys-head">
        <div>
          <b>{system.name}</b>
          <span>{system.detail}</span>
        </div>
        <span className="st-sys-state" aria-live="polite">
          {ready ? (
            <>
              <CheckCircle size={16} weight="fill" aria-hidden /> Operational
            </>
          ) : (
            "Checking"
          )}
        </span>
      </div>
      <div
        className="st-bars"
        role="img"
        aria-label={`${system.name}: online since ${fmtMonth(system.since)}, ${upgrades} upgrade${upgrades === 1 ? "" : "s"} shipped.`}
        onPointerLeave={() => onTip(null)}
      >
        {bars.map((b, i) => (
          <span
            key={key(b.m)}
            className={`is-${b.state}`}
            style={{ transitionDelay: reduced ? "0ms" : `${i * 9}ms` }}
            onPointerEnter={(e) => show(e, i)}
            onPointerDown={(e) => show(e, i)}
          />
        ))}
      </div>
      <div className="st-axis" aria-hidden>
        <span>{fmtMonth(FIRST)}</span>
        <span>Since {fmtMonth(system.since)}</span>
        <span>Today</span>
      </div>
    </div>
  );
}
