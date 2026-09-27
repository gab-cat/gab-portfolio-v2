import {
  motion,
  useInView,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, GithubLogo, Leaf, LinkedinLogo } from "@phosphor-icons/react";
import { Switcher } from "../shared/Switcher";
import {
  CONTACT_HREF,
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

/* ---------- screenplay ---------- */

type Line =
  | { t: "action"; text: string }
  | { t: "char"; name: string; paren?: string; text: string }
  | { t: "trans"; text: string };

type Scene = { slug: string; year: string; place: string; lines: Line[] };

const SCENES: Scene[] = [
  {
    slug: "INT. SUPPORT CHAT, BELL CANADA - NIGHT",
    year: "2022",
    place: "Quantrics, for Bell Canada",
    lines: [
      { t: "action", text: "A chat window blinks. Another customer, another thing that won't work." },
      { t: "action", text: "GAB, headset on, reads the whole message before typing a single word." },
      { t: "char", name: "CUSTOMER (V.O.)", text: "Nothing works, and nobody is listening." },
      { t: "char", name: "GAB", text: "I'm listening. Walk me through it." },
      { t: "action", text: "Three years of this. Four All-Star awards. And one thought that won't leave." },
      { t: "char", name: "GAB", paren: "to no one", text: "What if I built the thing that fixed it?" },
      { t: "trans", text: "CUT TO:" },
    ],
  },
  {
    slug: "INT. THEPILLARS NEWSROOM - DAY",
    year: "2024",
    place: "ThePILLARS Publication",
    lines: [
      { t: "action", text: "A student newsroom on deadline. GAB joins as a frontend apprentice and learns fast." },
      { t: "action", text: "Six months later: Vue, Nuxt, Express. Full-stack, and shipping." },
      { t: "char", name: "EDITOR (O.S.)", text: "Is the site down again?" },
      { t: "char", name: "GAB", text: "Not anymore. Not tomorrow either." },
      { t: "action", text: "GAB becomes the webmaster. The site stops going down." },
      { t: "trans", text: "CUT TO:" },
    ],
  },
  {
    slug: "INT. SERVER ROOM, DETKEN DEVELOPMENT - 3 A.M.",
    year: "2025",
    place: "Detken Development",
    lines: [
      { t: "action", text: "Racks hum. Production has just moved off Vercel, onto servers the team controls." },
      { t: "action", text: "A pipeline runs on its own. Test, build, deploy. Green across the board." },
      { t: "char", name: "GAB", paren: "to the coffee", text: "Launch day should feel like any other day." },
      { t: "action", text: "It does." },
      { t: "trans", text: "SMASH CUT TO:" },
    ],
  },
  {
    slug: "EXT. HACKATHON STAGE - NIGHT",
    year: "2024 - 2025",
    place: "Seven podiums",
    lines: [
      { t: "action", text: "Stage lights. A packed hall. Laptops still warm." },
      { t: "char", name: "HOST", text: "And this year's champion is..." },
      { t: "action", text: "Seven podiums in two years. A national stage for Bicol. A regional CTF title. Yes, it counts." },
      { t: "trans", text: "FADE OUT." },
    ],
  },
];

function ScriptLine({ line }: { line: Line }) {
  if (line.t === "action") return <p className="fm-action">{line.text}</p>;
  if (line.t === "trans") return <p className="fm-trans">{line.text}</p>;
  return (
    <div className="fm-dialogue">
      <p className="fm-char">{line.name}</p>
      {line.paren && <p className="fm-paren">({line.paren})</p>}
      <p className="fm-speech">{line.text}</p>
    </div>
  );
}

function Page({ scene, index, onActive }: { scene: Scene; index: number; onActive: (i: number) => void }) {
  const ref = useRef<HTMLElement>(null);
  const active = useInView(ref, { margin: "-45% 0px -45% 0px" });
  useEffect(() => {
    if (active) onActive(index);
  }, [active, index, onActive]);
  return (
    <article
      ref={ref}
      className="fm-page"
      style={{ "--i": index, "--tilt": `${index % 2 ? 0.5 : -0.5}deg` } as CSSProperties}
      aria-label={`Scene ${index + 1}: ${scene.slug}`}
    >
      <span className="fm-pageno">{index + 1}.</span>
      <h3 className="fm-slug">{scene.slug}</h3>
      {scene.lines.map((line, i) => (
        <ScriptLine key={i} line={line} />
      ))}
    </article>
  );
}

/* ---------- laurels, composed from leaf glyphs ---------- */

function Branch({ side, leaves = 11 }: { side: "l" | "r"; leaves?: number }) {
  return (
    <span className={`fm-branch is-${side}`} aria-hidden>
      {Array.from({ length: leaves }, (_, i) => {
        const t = i / (leaves - 1);
        // Sweep up the left side of a circle, bottom (110deg) to top (238deg), in screen coordinates.
        const a = 110 + t * 128;
        const rad = (a * Math.PI) / 180;
        return (
          <span
            key={i}
            style={{
              left: `${50 + Math.cos(rad) * 46}%`,
              top: `${50 + Math.sin(rad) * 46}%`,
              rotate: `${a + 120}deg`,
              scale: `${1.08 - t * 0.42}`,
            } as CSSProperties}
          >
            <Leaf size={24} weight="fill" />
          </span>
        );
      })}
    </span>
  );
}

function Laurel({ place, event, year, big }: { place: string; event: string; year: string; big?: boolean }) {
  return (
    <div className={`fm-laurel ${big ? "is-big" : ""}`}>
      <Branch side="l" />
      <Branch side="r" />
      <div className="fm-laurel-text">
        <small>{place}</small>
        <b>{event}</b>
        <small>{year}</small>
      </div>
    </div>
  );
}

/* ---------- now showing: a pinned horizontal reel ---------- */

const GENRES = ["E-commerce", "Community", "Strategy", "Fortune-telling"];

function Poster({ w, i }: { w: (typeof WORK)[number]; i: number }) {
  return (
    <article className="fm-frame">
      <p className="fm-frame-top">
        <span>Now showing</span>
        <span>Reel {i + 1}</span>
      </p>
      <h3>{w.name}</h3>
      <p className="fm-frame-tag">{w.tagline}</p>
      <dl>
        <div>
          <dt>Genre</dt>
          <dd>{GENRES[i]}</dd>
        </div>
        <div>
          <dt>Starring</dt>
          <dd>{w.tech.join(", ")}</dd>
        </div>
      </dl>
      <p className="fm-frame-story">{w.story}</p>
      <a href={w.href} target="_blank" rel="noreferrer">
        {w.live ? hostOf(w.href) : "View on GitHub"} <ArrowUpRight size={16} weight="bold" aria-hidden />
      </a>
    </article>
  );
}

function Reel({ pinned }: { pinned: boolean }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const dist = useRef(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, (v) => -v * dist.current);

  useLayoutEffect(() => {
    if (!pinned || !track.current) return;
    const measure = () => {
      const d = Math.max(0, track.current!.scrollWidth - window.innerWidth);
      dist.current = d;
      setDistance(d);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [pinned]);

  const frames: ReactNode[] = [
    <div key="title" className="fm-reel-title">
      <h2 id="fm-films">Now showing.</h2>
      <p>Four things I built, each still running somewhere.</p>
    </div>,
    ...WORK.map((w, i) => <Poster key={w.name} w={w} i={i} />),
    <article key="soon" className="fm-frame is-soon">
      <p className="fm-frame-top">
        <span>Coming soon</span>
      </p>
      <h3>Your project</h3>
      <p className="fm-frame-tag">In development. Casting now.</p>
      <a className="fm-btn" href={CONTACT_HREF}>
        Get in touch <ArrowRight size={18} weight="bold" aria-hidden />
      </a>
    </article>,
  ];

  if (!pinned) {
    return (
      <section className="fm-reel is-free" id="films" aria-labelledby="fm-films">
        <div className="fm-reel-track">{frames}</div>
      </section>
    );
  }

  return (
    <section
      ref={section}
      className="fm-reel"
      id="films"
      aria-labelledby="fm-films"
      style={{ height: `calc(100vh + ${distance}px)` }}
    >
      <div className="fm-reel-stick">
        <motion.div ref={track} className="fm-reel-track" style={{ x }}>
          {frames}
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- end credits: a scroll-scrubbed roll ---------- */

function CreditsBody() {
  return (
    <div className="fm-credits-body">
      <p className="fm-credits-lead">
        A Gabcat Production
        <b>IT STARTS WITH A WHAT IF</b>
      </p>

      <h3>Cast</h3>
      <dl>
        <div>
          <dt>Gab</dt>
          <dd>{NAME}</dd>
        </div>
      </dl>

      <h3>Roles</h3>
      <dl>
        {ROLES_NEWEST.map((r) => (
          <div key={r.id}>
            <dt>{r.role}</dt>
            <dd>
              {r.company}
              <span>
                {fmtMonth(r.start)} - {r.end ? fmtMonth(r.end) : "now"}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <h3>Equipment</h3>
      <dl>
        {TOOLBOX.map((g) => (
          <div key={g.group}>
            <dt>{g.group}</dt>
            <dd>
              {g.items.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </dd>
          </div>
        ))}
      </dl>

      <h3>Special thanks</h3>
      <p className="fm-credits-list">
        ThePILLARS Publication
        <br />
        CS Guild
        <br />
        Ateneo de Naga University
        <br />
        Everyone who ever waited in the support queue
      </p>

      <p className="fm-credits-end">
        Filmed on location in Naga City, Philippines.
        <br />
        No servers were harmed in the making of this film.
      </p>
    </div>
  );
}

function Credits({ pinned }: { pinned: boolean }) {
  const section = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const translate = useRoll(y, height);

  useLayoutEffect(() => {
    if (!pinned || !body.current) return;
    const measure = () => setHeight(body.current!.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(body.current);
    return () => ro.disconnect();
  }, [pinned]);

  if (!pinned) {
    return (
      <section className="fm-credits is-free" id="credits" aria-label="End credits">
        <CreditsBody />
      </section>
    );
  }

  return (
    <section ref={section} className="fm-credits" id="credits" aria-label="End credits" style={{ height: `calc(200vh + ${height}px)` }}>
      <div className="fm-credits-stick">
        <motion.div ref={body} style={{ transform: translate }}>
          <CreditsBody />
        </motion.div>
      </div>
    </section>
  );
}

/** From just below the frame to fully rolled past the top. */
function useRoll(progress: MotionValue<number>, height: number) {
  const px = useTransform(progress, (v) => (1 - v) * (typeof window === "undefined" ? 800 : window.innerHeight) - v * height);
  return useMotionTemplate`translate3d(0, ${px}px, 0)`;
}

/* ---------- page ---------- */

function useWide() {
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 900px)").matches);
  useEffect(() => {
    const q = window.matchMedia("(min-width: 900px)");
    const on = () => setWide(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return wide;
}

export function App() {
  const reduced = useReducedMotion() ?? false;
  const wide = useWide();
  const pinned = wide && !reduced;
  const [scene, setScene] = useState(0);
  const hero = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: hero, offset: ["start start", "end start"] });
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const photoY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const title = ["It starts", "with a", "what if."];

  return (
    <>
      <div className={`fm-grain ${reduced ? "is-still" : ""}`} aria-hidden />
      <header className="fm-nav">
        <a className="fm-logo" href="/explorations/film/">
          Gabcat
        </a>
        <nav aria-label="Sections">
          <a href="#script">Script</a>
          <a href="#festival">Festival</a>
          <a href="#films">Films</a>
          <a href="#credits">Credits</a>
        </nav>
        <a className="fm-btn is-small" href={CONTACT_HREF}>
          Get in touch
        </a>
      </header>

      <main>
        <section className="fm-hero" ref={hero} aria-labelledby="fm-title">
          <div className="fm-hero-copy">
            <motion.p
              className="fm-presents"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.2 }}
            >
              A Gabcat Production
            </motion.p>
            <h1 id="fm-title" aria-label="It starts with a what if.">
              {title.map((line, i) => (
                <motion.span
                  key={line}
                  aria-hidden
                  initial={reduced ? false : { opacity: 0, letterSpacing: "0.32em" }}
                  animate={{ opacity: 1, letterSpacing: "0em" }}
                  transition={{ duration: 1.6, delay: 0.5 + i * 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  {line}
                </motion.span>
              ))}
            </h1>
            <motion.p
              className="fm-logline"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.4 }}
            >
              A support agent spends three years listening, then decides to build the
              fix instead.
            </motion.p>
            <motion.div
              className="fm-hero-actions"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.6 }}
            >
              <a className="fm-btn" href="#script">
                Read the script <ArrowDown size={18} weight="bold" aria-hidden />
              </a>
              <a className="fm-text-link" href={CONTACT_HREF}>
                Get in touch
              </a>
            </motion.div>
          </div>

          <motion.figure
            className="fm-still"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2.2, ease: "easeOut" }}
          >
            <motion.img
              src={PORTRAIT}
              alt={`${NAME} under a single spotlight`}
              width={900}
              height={1200}
              style={reduced ? undefined : { scale: photoScale, y: photoY }}
            />
            <span className="fm-spot" aria-hidden />
          </motion.figure>
        </section>

        <section className="fm-billing" aria-label="Billing block">
          <p>
            <small>Gabcat Productions presents</small> a Naga City story <small>starring</small> Gabriel Catimbang{" "}
            <small>in</small> It starts with a what if <small>with</small> ThePILLARS Publication, Detken Development,
            Old.St Labs <small>and</small> CS Guild <small>featuring</small> Next.js, NestJS, PostgreSQL, Docker{" "}
            <small>and</small> Redis <small>written and directed by</small> Gabriel Catimbang
          </p>
        </section>

        <section className="fm-script" id="script" aria-labelledby="fm-script-title">
          <div className="fm-slate">
            <h2 id="fm-script-title">The script.</h2>
            <div className="fm-slate-card" aria-live="polite">
              <span>Scene</span>
              <motion.b key={scene} initial={reduced ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {scene + 1}
              </motion.b>
              <span className="fm-slate-meta">
                {SCENES[scene].place}
                <br />
                {SCENES[scene].year}
              </span>
            </div>
          </div>
          <div className="fm-pages">
            {SCENES.map((s, i) => (
              <Page key={s.slug} scene={s} index={i} onActive={setScene} />
            ))}
          </div>
        </section>

        <section className="fm-festival" id="festival" aria-labelledby="fm-festival-title">
          <h2 id="fm-festival-title">Official selection.</h2>
          <p>Hackathons, capture-the-flag, and the support floor.</p>
          <div className="fm-laurels">
            {TROPHIES.map((t, i) => (
              <motion.div
                key={t.event}
                className={`fm-laurel-cell l-${i}`}
                initial={reduced ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.9, delay: (i % 5) * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <Laurel place={t.place} event={t.event} year={t.year} big={t.place === "Champion"} />
              </motion.div>
            ))}
          </div>
        </section>

        <Reel pinned={pinned} />
        <Credits pinned={pinned} />

        <section className="fm-post" aria-labelledby="fm-post-title">
          <p className="fm-post-label">Post-credits scene</p>
          <div className="fm-page is-post">
            <h2 id="fm-post-title" className="fm-slug">
              INT. YOUR TEAM - SOON
            </h2>
            <p className="fm-action">GAB walks in, laptop already open.</p>
            <div className="fm-dialogue">
              <p className="fm-char">GAB</p>
              <p className="fm-speech">So. What are we building?</p>
            </div>
            <div className="fm-post-actions">
              <a className="fm-btn" href={CONTACT_HREF}>
                Get in touch <ArrowRight size={18} weight="bold" aria-hidden />
              </a>
              <a className="fm-mail" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="fm-foot">
        <span>A Gabcat Production. {new Date().getFullYear()}.</span>
        <span className="fm-foot-links">
          <a href={GITHUB} target="_blank" rel="noreferrer" aria-label="GitHub">
            <GithubLogo size={20} weight="bold" />
          </a>
          <a href={LINKEDIN} target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <LinkedinLogo size={20} weight="bold" />
          </a>
        </span>
      </footer>
      <Switcher current="film" />
    </>
  );
}
