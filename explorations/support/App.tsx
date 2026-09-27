import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowCounterClockwise,
  ArrowUpRight,
  Check,
  Copy,
  EnvelopeSimple,
  GithubLogo,
  GraduationCap,
  HardDrives,
  LinkedinLogo,
  Newspaper,
  PaperPlaneRight,
  Trophy,
  UsersThree,
} from "@phosphor-icons/react";
import { Switcher } from "../shared/Switcher";
import {
  CONTACT_HREF,
  CURRENTLY,
  EMAIL,
  GITHUB,
  LINKEDIN,
  NAME,
  PORTRAIT,
  ROLES_NEWEST,
  TOOLBOX,
  TROPHIES,
  WORK,
  fmtMonth,
  hostOf,
} from "../shared/content";

type Topic = "about" | "work" | "journey" | "wins" | "stack" | "contact";
type Card = Topic | "now";
type Step = string | { card: Card };
type Draft = { from: "gab"; text: string } | { from: "gab"; card: Card } | { from: "you"; text: string };
type Msg = Draft & { id: number };

const ORDER: Topic[] = ["about", "work", "journey", "wins", "stack", "contact"];

const CHIP: Record<Topic, string> = {
  about: "Who are you?",
  work: "What have you built?",
  journey: "Where have you worked?",
  wins: "Any wins?",
  stack: "What's your stack?",
  contact: "Can we work together?",
};

const GREETING: Step[] = [
  "Hi, I'm Gab. I build websites people actually use, and I keep them running.",
  "What would you like to know?",
];

const SCRIPT: Record<Topic, Step[]> = {
  about: [
    "I'm Gabriel, but everyone calls me Gab. Developer and DevOps engineer from Naga City, in the Philippines.",
    "Before I wrote code, I spent three years in Bell Canada's support chat. Every conversation started with someone who needed something to work.",
    "Eventually I wanted to do more than help people work around a problem. I wanted to build the thing that solved it. Here's what that looks like right now:",
    { card: "now" },
  ],
  work: [
    "Four I'm proud of. Swipe through them.",
    { card: "work" },
    "If you only open one, make it MerchTrack. 2,750+ students used it in the first week, and the servers held.",
  ],
  journey: [
    "The short version, newest first.",
    { card: "journey" },
    "The support job is still the one I'd point to. It's where I learned to listen before I type.",
  ],
  wins: [
    "Seven hackathon podiums so far, and I'm not done.",
    { card: "wins" },
    "The CTF one is my favourite. Yes, it counts.",
  ],
  stack: [
    "Whatever the problem needs. These are what I reach for first.",
    { card: "stack" },
    "I like my deploys boring: pipelines that test, build and ship on their own, on servers I can still reason about at 3 a.m.",
  ],
  contact: [
    "I'd like that. Projects, roles, collaborations, or something else entirely.",
    { card: "contact" },
    "I read every message myself.",
  ],
};

/** Order matters: "work together" is contact, "worked" is the journey, "work" is projects. */
const INTENTS: [Topic, RegExp][] = [
  ["contact", /hire|contact|e-?mail|reach|talk|together|available|freelance|collab|role|job offer/i],
  ["journey", /worked|experience|career|jobs?\b|company|companies|bell|detken|pillars|resume|cv|intern/i],
  ["wins", /win|won|hackathon|award|trophy|prize|podium|ctf|champion|compet/i],
  ["stack", /stack|tech|tools?|language|framework|docker|aws|next|react|devops|skills?|nest/i],
  ["work", /built|build|projects?|work|portfolio|merch|guild|tarot|general|apps?\b|made/i],
  ["about", /who|about|yourself|story|background|where|from|naga|name/i],
];

const matchTopic = (text: string) => INTENTS.find(([, re]) => re.test(text))?.[0] ?? null;
const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
const typingTime = (step: Step) =>
  typeof step === "string" ? Math.min(1300, Math.max(520, 360 + step.length * 9)) : 760;

export function App() {
  const reduced = useReducedMotion() ?? false;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(true);
  const [asked, setAsked] = useState<Topic[]>([]);
  const [draft, setDraft] = useState("");
  const [anchor, setAnchor] = useState<number | null>(null);
  const run = useRef(0);
  const ids = useRef(0);
  const thread = useRef<HTMLDivElement>(null);

  const push = (msg: Draft) => {
    const id = ++ids.current;
    setMessages((list) => [...list, { ...msg, id }]);
    return id;
  };

  const say = useCallback(
    async (steps: Step[]) => {
      const token = run.current;
      setBusy(true);
      for (const step of steps) {
        setTyping(true);
        await wait(reduced ? 0 : typingTime(step));
        if (token !== run.current) return;
        setTyping(false);
        push(typeof step === "string" ? { from: "gab", text: step } : { from: "gab", card: step.card });
        await wait(reduced ? 0 : 160);
        if (token !== run.current) return;
      }
      setBusy(false);
    },
    [reduced],
  );

  const start = useCallback(() => {
    run.current += 1;
    setMessages([]);
    setAsked([]);
    setAnchor(null);
    setTyping(false);
    void say(GREETING);
  }, [say]);

  useEffect(() => {
    start();
    return () => {
      run.current += 1;
    };
  }, [start]);

  // Park the visitor's question at the top so the answer reads downward.
  useEffect(() => {
    if (anchor === null) return;
    const el = thread.current?.querySelector(`[data-id="${anchor}"]`);
    el?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  }, [anchor, reduced]);

  const ask = (text: string, topic: Topic | null) => {
    if (busy) return;
    const id = push({ from: "you", text });
    setAnchor(id);
    if (!topic) {
      void say([
        "I'm better at listening than guessing. I can tell you about any of these:",
      ]);
      return;
    }
    setAsked((list) => (list.includes(topic) ? list : [...list, topic]));
    void say(SCRIPT[topic]);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    if (/^(hi|hello|hey|yo|kumusta|good (morning|afternoon|evening))\b/i.test(text) && !matchTopic(text)) {
      const id = push({ from: "you", text });
      setAnchor(id);
      void say(["Hello! Ask me anything, or pick one of these."]);
      return;
    }
    ask(text, matchTopic(text));
  };

  const remaining = ORDER.filter((t) => !asked.includes(t));
  const lastYou = [...messages].reverse().find((m) => m.from === "you")?.id;

  return (
    <>
      <div className="sc">
        <aside className="sc-side">
          <a className="sc-brand" href="/explorations/support/">
            gabcat <span>support</span>
          </a>

          <div className="sc-intro">
            <motion.h1
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
            >
              I used to answer the chat. <em>Now I build the fix.</em>
            </motion.h1>
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.08 }}
            >
              Three years in Bell Canada's support chat taught me to listen. Ask me
              about everything I built after.
            </motion.p>
          </div>

          <div className="sc-agent">
            <img src={PORTRAIT} alt={`${NAME}, in a black short-sleeve shirt`} width={900} height={1200} />
            <div>
              <b>{NAME}</b>
              <span>Developer &amp; DevOps Engineer</span>
              <span className="sc-tz">Replies from Naga City, UTC+8</span>
              <div className="sc-links">
                <a href={GITHUB} target="_blank" rel="noreferrer" aria-label="GitHub">
                  <GithubLogo size={18} weight="bold" />
                </a>
                <a href={LINKEDIN} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <LinkedinLogo size={18} weight="bold" />
                </a>
                <a href={`mailto:${EMAIL}`} aria-label="Email">
                  <EnvelopeSimple size={18} weight="bold" />
                </a>
              </div>
            </div>
          </div>
        </aside>

        <section className="sc-panel" aria-label="Chat with Gab">
          <header className="sc-head">
            <img src={PORTRAIT} alt="" className="sc-avatar" />
            <div>
              <b>Gab</b>
              <span>Developer &amp; DevOps Engineer</span>
            </div>
            <button type="button" className="sc-restart" onClick={start}>
              <ArrowCounterClockwise size={15} weight="bold" aria-hidden />
              <span>Start over</span>
            </button>
          </header>

          <div className="sc-thread" ref={thread} aria-live="polite">
            <div className="sc-start">
              <img src={PORTRAIT} alt="" />
              <b>{NAME}</b>
              <span>A scripted Gab, built from real answers. The real one reads every email.</span>
            </div>
            <p className="sc-day">Today</p>
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const prev = messages[i - 1];
                const first = !prev || prev.from !== msg.from;
                return (
                  <motion.div
                    key={msg.id}
                    data-id={msg.id}
                    className={`sc-row is-${msg.from} ${first ? "is-first" : ""}`}
                    initial={reduced ? false : { opacity: 0, y: 14, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  >
                    {msg.from === "gab" && (first ? <img src={PORTRAIT} alt="" className="sc-mini" /> : <span className="sc-mini" />)}
                    {"card" in msg ? (
                      <CardView card={msg.card} />
                    ) : (
                      <p className="sc-bubble">{msg.text}</p>
                    )}
                    {msg.from === "you" && msg.id === lastYou && !busy && <span className="sc-seen">Seen</span>}
                  </motion.div>
                );
              })}
              {typing && (
                <motion.div
                  key="typing"
                  className="sc-row is-gab"
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  <span className="sc-mini" />
                  <p className="sc-bubble sc-typing" aria-label="Gab is typing">
                    <i />
                    <i />
                    <i />
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {!busy && (
              <motion.div
                className="sc-chips"
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
              >
                {remaining.length ? (
                  remaining.map((t) => (
                    <button key={t} type="button" onClick={() => ask(CHIP[t], t)}>
                      {CHIP[t]}
                    </button>
                  ))
                ) : (
                  <button type="button" onClick={start}>
                    <ArrowCounterClockwise size={15} weight="bold" aria-hidden /> Start over
                  </button>
                )}
              </motion.div>
            )}
          </div>

          <form className="sc-compose" onSubmit={submit}>
            <label htmlFor="sc-input" className="sc-sr">
              Message Gab
            </label>
            <input
              id="sc-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about projects, jobs or wins"
              autoComplete="off"
              maxLength={200}
            />
            <button type="submit" disabled={!draft.trim() || busy} aria-label="Send">
              <PaperPlaneRight size={18} weight="fill" />
            </button>
          </form>
        </section>
      </div>
      <Switcher current="support" />
    </>
  );
}

function CardView({ card }: { card: Card }) {
  switch (card) {
    case "now":
      return <NowCard />;
    case "work":
      return <WorkCard />;
    case "journey":
      return <JourneyCard />;
    case "wins":
      return <WinsCard />;
    case "stack":
      return <StackCard />;
    case "contact":
      return <ContactCard />;
    default:
      return null;
  }
}

const NOW_ICONS = [Newspaper, HardDrives, GraduationCap, UsersThree, Trophy];

function NowCard() {
  return (
    <div className="sc-card sc-now">
      <p className="sc-card-title">Right now</p>
      <ul>
        {CURRENTLY.map((line, i) => {
          const Icon = NOW_ICONS[i] ?? Trophy;
          return (
            <li key={line}>
              <Icon size={18} weight="duotone" aria-hidden />
              <span>{line.charAt(0).toUpperCase() + line.slice(1)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function WorkCard() {
  return (
    <div className="sc-work" role="list">
      {WORK.map((w, i) => (
        <article key={w.name} className={`sc-proj tone-${i}`} role="listitem">
          <div className="sc-proj-top">
            <h3>{w.name}</h3>
            <p>{w.tagline}</p>
          </div>
          <div className="sc-proj-body">
            <p>{w.story}</p>
            <ul>
              {w.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <a href={w.href} target="_blank" rel="noreferrer">
              {w.live ? hostOf(w.href) : "View on GitHub"} <ArrowUpRight size={14} weight="bold" aria-hidden />
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}

function JourneyCard() {
  return (
    <div className="sc-card sc-journey">
      <ol>
        {ROLES_NEWEST.map((r) => (
          <li key={r.id}>
            <div>
              <b>{r.role}</b>
              <span>{r.company}</span>
            </div>
            <time>
              {r.end ? `${fmtMonth(r.start)} - ${fmtMonth(r.end)}` : <><em>Now</em> since {fmtMonth(r.start)}</>}
            </time>
          </li>
        ))}
      </ol>
    </div>
  );
}

function WinsCard() {
  return (
    <div className="sc-card sc-wins">
      {TROPHIES.map((t, i) => (
        <div key={t.event} className={i === 0 ? "is-hero" : t.place === "Champion" ? "is-gold" : ""}>
          {i === 0 && <Trophy size={22} weight="duotone" aria-hidden />}
          <b>{t.place}</b>
          <span>{t.event}</span>
          <small>
            {t.year}. {t.detail}
          </small>
        </div>
      ))}
    </div>
  );
}

function StackCard() {
  return (
    <div className="sc-card sc-stack">
      {TOOLBOX.map((g) => (
        <div key={g.group}>
          <p>{g.group}</p>
          <ul>
            {g.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ContactCard() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };
  return (
    <div className="sc-card sc-contact">
      <div className="sc-mail">
        <span>{EMAIL}</span>
        <button type="button" onClick={copy} aria-live="polite">
          {copied ? <Check size={15} weight="bold" aria-hidden /> : <Copy size={15} weight="bold" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <a className="sc-cta" href={CONTACT_HREF}>
        Get in touch <ArrowUpRight size={16} weight="bold" aria-hidden />
      </a>
    </div>
  );
}
