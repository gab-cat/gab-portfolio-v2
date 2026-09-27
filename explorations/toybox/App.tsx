import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Broom,
  HandWaving,
  Lightning,
  Package,
  Smiley,
  Trophy,
  Wrench,
} from "@phosphor-icons/react";
import { Switcher } from "../shared/Switcher";
import { CONTACT_HREF, CURRENTLY, EMAIL, GITHUB, LINKEDIN, TOOLBOX, TROPHIES, WORK, hostOf } from "../shared/content";
import { TOY_COLORS, type ToySpec, type ToyboxController } from "./scene";

type Tab = "me" | "work" | "wins" | "stack" | "hello";

const TABS: { id: Tab; label: string; icon: ReactNode; color: string }[] = [
  { id: "me", label: "Me", icon: <Smiley weight="fill" />, color: TOY_COLORS[0] },
  { id: "work", label: "Work", icon: <Package weight="fill" />, color: TOY_COLORS[1] },
  { id: "wins", label: "Wins", icon: <Trophy weight="fill" />, color: TOY_COLORS[2] },
  { id: "stack", label: "Stack", icon: <Wrench weight="fill" />, color: TOY_COLORS[3] },
  { id: "hello", label: "Hello", icon: <HandWaving weight="fill" />, color: TOY_COLORS[4] },
];

const RANK: Record<string, string> = {
  Champion: "1",
  "2nd Place": "2",
  "3rd Place": "3",
  "Top 5": "5",
  "2nd Highest Scorer": "2",
  "4× All-Star": "4×",
};
const MEDAL = (place: string) => (place === "Champion" ? "#ffc21a" : place.startsWith("2nd") ? "#c7ccd6" : place.startsWith("3rd") ? "#d9894a" : "#ff5a1f");

const TOYS: Record<Tab, ToySpec[]> = {
  me: "GABCAT".split("").map((ch, i) => ({ kind: "letter", id: `letter-${i}`, label: ch, color: TOY_COLORS[i % TOY_COLORS.length] })),
  work: WORK.map((w, i) => ({ kind: "crate", id: `crate-${i}`, label: w.name, color: TOY_COLORS[(i + 1) % TOY_COLORS.length] })),
  wins: TROPHIES.map((t, i) => ({ kind: "trophy", id: `trophy-${i}`, label: t.event, color: MEDAL(t.place), rank: RANK[t.place] ?? "★" })),
  stack: TOOLBOX.flatMap((g, gi) => g.items.map((item) => ({ kind: "pill" as const, id: `pill-${item}`, label: item, color: TOY_COLORS[gi % TOY_COLORS.length] }))),
  hello: [{ kind: "ball", id: "ball", label: "HI!", color: TOY_COLORS[0] }],
};

export function App() {
  const reduced = useReducedMotion() ?? false;
  const host = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const ctl = useRef<ToyboxController | null>(null);
  const dropped = useRef(new Set<Tab>());
  const [tab, setTab] = useState<Tab>("me");
  const [picked, setPicked] = useState<string | null>(null);
  const [flat, setFlat] = useState(false);

  const open = useCallback((next: Tab, drop = true) => {
    setTab(next);
    setPicked(null);
    if (!drop || !ctl.current) return;
    // each tab drops its toys once; press it again for more
    ctl.current.drop(TOYS[next], next === "stack" ? 70 : 140);
    dropped.current.add(next);
  }, []);

  useEffect(() => {
    let dead = false;
    Promise.all([import("./scene"), document.fonts.ready]).then(([{ createToybox }]) => {
      if (dead) return;
      const c = createToybox(host.current!);
      if (!c) {
        setFlat(true);
        return;
      }
      ctl.current = c;
      c.onPick((id) => {
        setPicked(id);
        const t = (Object.keys(TOYS) as Tab[]).find((k) => TOYS[k].some((s) => s.id === id));
        if (t) setTab(t);
        if (id === "ball") window.setTimeout(() => (window.location.href = CONTACT_HREF), 650);
      });
      c.drop(TOYS.me, 180);
      dropped.current.add("me");
    });
    return () => {
      dead = true;
      ctl.current?.dispose();
      ctl.current = null;
    };
  }, []);

  // keep toys out from under the panel on wide screens
  useEffect(() => {
    const sync = () => {
      const wide = window.innerWidth > 900;
      const w = panelRef.current?.getBoundingClientRect().width ?? 0;
      ctl.current?.setRightInset(wide ? w + 40 : 0);
    };
    sync();
    const t = window.setTimeout(sync, 600);
    window.addEventListener("resize", sync);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", sync);
    };
  }, [flat]);

  const detail = useMemo(() => {
    if (!picked) return null;
    const [kind, key] = [picked.split("-")[0], picked.slice(picked.indexOf("-") + 1)];
    if (kind === "crate") {
      const w = WORK[Number(key)];
      return (
        <>
          <p className="tb-eyebrow">Project</p>
          <h2>{w.name}</h2>
          <p className="tb-lede">{w.tagline}</p>
          <p>{w.story}</p>
          <ul className="tb-chips">
            {w.tech.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <a className="tb-link" href={w.href} target="_blank" rel="noreferrer">
            {w.live ? hostOf(w.href) : "View on GitHub"} <ArrowUpRight weight="bold" />
          </a>
        </>
      );
    }
    if (kind === "trophy") {
      const t = TROPHIES[Number(key)];
      return (
        <>
          <p className="tb-eyebrow">
            {t.place}, {t.year}
          </p>
          <h2>{t.event}</h2>
          <p className="tb-lede">{t.detail}.</p>
        </>
      );
    }
    if (kind === "pill") {
      const group = TOOLBOX.find((g) => (g.items as readonly string[]).includes(key));
      return (
        <>
          <p className="tb-eyebrow">{group?.group}</p>
          <h2>{key}</h2>
          <p className="tb-lede">
            One of the tools I reach for when it's time for {group?.group.toLowerCase()}. The rest of that
            shelf:
          </p>
          <ul className="tb-chips">
            {group?.items.filter((i) => i !== key).map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </>
      );
    }
    return null;
  }, [picked]);

  const content: Record<Tab, ReactNode> = {
    me: (
      <>
        <p className="tb-eyebrow">Hi, I'm Gab</p>
        <h2>Developer, DevOps engineer, professional tinkerer.</h2>
        <p className="tb-lede">
          I build websites people actually use and keep them running, from Naga City in the Philippines.
          Everything here is a toy. Grab it, throw it, click it.
        </p>
        <ul className="tb-now">
          {CURRENTLY.slice(0, 4).map((c) => (
            <li key={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</li>
          ))}
        </ul>
      </>
    ),
    work: (
      <>
        <p className="tb-eyebrow">Four crates just landed</p>
        <h2>Things people use.</h2>
        <ul className="tb-list">
          {WORK.map((w, i) => (
            <li key={w.name}>
              <button type="button" onClick={() => setPicked(`crate-${i}`)}>
                <b>{w.name}</b>
                <span>{w.tagline}</span>
              </button>
            </li>
          ))}
        </ul>
      </>
    ),
    wins: (
      <>
        <p className="tb-eyebrow">Seven trophies, real ones</p>
        <h2>Podiums, mostly on weekends.</h2>
        <ul className="tb-list">
          {TROPHIES.map((t, i) => (
            <li key={t.event}>
              <button type="button" onClick={() => setPicked(`trophy-${i}`)}>
                <b>{t.event}</b>
                <span>
                  {t.place}, {t.year}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </>
    ),
    stack: (
      <>
        <p className="tb-eyebrow">The toolbox, tipped out</p>
        <h2>What I build with.</h2>
        {TOOLBOX.map((g) => (
          <div key={g.group} className="tb-group">
            <b>{g.group}</b>
            <span>{g.items.join(", ")}</span>
          </div>
        ))}
      </>
    ),
    hello: (
      <>
        <p className="tb-eyebrow">Let's play together</p>
        <h2>Got a project, a role, or a what if?</h2>
        <p className="tb-lede">Click the big orange ball, or use the button. Either way, I read every message.</p>
        <a className="tb-cta" href={CONTACT_HREF}>
          Get in touch
        </a>
        <p className="tb-meta">
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <br />
          <a href={GITHUB} target="_blank" rel="noreferrer">
            GitHub
          </a>{" "}
          ·{" "}
          <a href={LINKEDIN} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        </p>
      </>
    ),
  };

  return (
    <>
      <div ref={host} className="tb-canvas" aria-hidden />
      {flat && <p className="tb-flat">This playground needs WebGL. Everything is still in the panel.</p>}

      <header className="tb-top">
        <a className="tb-brand" href="/explorations/toybox/">
          gab's <span>toybox</span>
        </a>
        <div className="tb-tools">
          <button type="button" onClick={() => ctl.current?.shake()}>
            <Lightning weight="fill" aria-hidden /> Shake
          </button>
          <button
            type="button"
            onClick={() => {
              ctl.current?.clear();
              dropped.current.clear();
            }}
          >
            <Broom weight="fill" aria-hidden /> Tidy up
          </button>
        </div>
      </header>

      <aside ref={panelRef} className="tb-panel" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div
            key={picked ?? tab}
            initial={reduced ? false : { opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: -8, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            {picked && detail ? (
              <>
                <button type="button" className="tb-back" onClick={() => setPicked(null)}>
                  <ArrowLeft weight="bold" aria-hidden /> Back
                </button>
                {detail}
              </>
            ) : (
              content[tab]
            )}
          </motion.div>
        </AnimatePresence>
      </aside>

      <nav className="tb-tabs" aria-label="Toy chests">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "is-on" : ""}
            style={{ "--c": t.color } as CSSProperties}
            aria-pressed={tab === t.id}
            onClick={() => open(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
      <Switcher current="toybox" />
    </>
  );
}
