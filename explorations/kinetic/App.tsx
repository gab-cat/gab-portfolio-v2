import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ArrowUpRight, Asterisk, Check, Copy, GithubLogo, LinkedinLogo } from "@phosphor-icons/react";
import { Magnetic } from "../shared/Magnetic";
import { Switcher } from "../shared/Switcher";
import { useLoaderCount, useSmoothScroll } from "../shared/motion";
import { CONTACT_HREF, EMAIL, GITHUB, LINKEDIN, NOW, ROLES, TROPHIES, WORK, hostOf } from "../shared/content";

const EASE = [0.76, 0, 0.24, 1] as const;

/* ---------- letters that answer the cursor ---------- */

/**
 * Every [data-k] letter inside `root` swells toward the pointer: wider and
 * heavier the closer it is. Without a pointer, a slow wave runs through them.
 */
function useKinetic(root: RefObject<HTMLElement | null>, { base = 62, reach = 280 } = {}) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const letters = [...el.querySelectorAll<HTMLElement>("[data-k]")];
    const state = letters.map(() => ({ w: base, g: 380 }));
    let px = -1e4;
    let py = -1e4;
    let lastMove = 0;
    const move = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      lastMove = performance.now();
    };
    window.addEventListener("pointermove", move, { passive: true });
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const rects = letters.map((l) => l.getBoundingClientRect());
      const idle = now - lastMove > 2400;
      rects.forEach((r, i) => {
        let inf: number;
        if (idle) {
          inf = 0.5 + 0.5 * Math.sin(now / 700 - i * 0.55);
          inf = inf * inf * 0.7;
        } else {
          const d = Math.hypot(r.left + r.width / 2 - px, r.top + r.height / 2 - py);
          inf = Math.exp(-((d / reach) ** 2));
        }
        const s = state[i];
        s.w += (base + (151 - base) * inf - s.w) * 0.14;
        s.g += (260 + 740 * inf - s.g) * 0.14;
      });
      letters.forEach((l, i) => {
        l.style.fontVariationSettings = `"wdth" ${state[i].w.toFixed(1)}, "wght" ${state[i].g.toFixed(0)}`;
      });
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
  }, [root, base, reach, reduced]);
}

function Letters({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span key={i} data-k aria-hidden>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

/* ---------- manifesto: words light up as you read ---------- */

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span style={{ opacity }} className="kn-word">
      {word}{" "}
    </motion.span>
  );
}

function Manifesto({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className="kn-manifesto">
      {words.map((w, i) => (
        <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
      ))}
    </p>
  );
}

/* ---------- a marquee that follows the scroll's direction and speed ---------- */

function VelocityMarquee({ items }: { items: string[] }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const factor = useTransform(velocity, [-1500, 0, 1500], [-5, 0, 5], { clamp: false });
  const dir = useRef(1);
  const track = useRef<HTMLDivElement>(null);
  useAnimationFrame((_, delta) => {
    if (reduced || !track.current) return;
    const f = factor.get();
    if (f < 0) dir.current = -1;
    else if (f > 0) dir.current = 1;
    const half = track.current.scrollWidth / 2;
    let next = x.get() - dir.current * (60 + Math.abs(f) * 90) * (delta / 1000);
    if (next <= -half) next += half;
    if (next > 0) next -= half;
    x.set(next);
  });
  const skew = useTransform(factor, [-5, 5], [8, -8]);
  return (
    <div className="kn-marquee" aria-hidden>
      <motion.div ref={track} className="kn-marquee-track" style={{ x, skewX: skew }}>
        {[0, 1].map((copy) =>
          items.map((item) => (
            <span key={`${copy}-${item}`}>
              {item}
              <Asterisk weight="bold" />
            </span>
          )),
        )}
      </motion.div>
    </div>
  );
}

/* ---------- generative covers for the work previews ---------- */

function cover(name: string, index: number) {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 440;
  const ctx = c.getContext("2d")!;
  const dark = index % 2 === 0;
  ctx.fillStyle = dark ? "#0d0d0d" : "#ff5a1f";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = dark ? "#ff5a1f" : "#0d0d0d";
  ctx.lineWidth = 3;
  for (let i = -20; i < 40; i++) {
    ctx.globalAlpha = 0.18 + ((i * 7) % 5) * 0.05;
    ctx.beginPath();
    ctx.moveTo(i * 28, 0);
    ctx.lineTo(i * 28 - 300 + index * 60, c.height);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = dark ? "#ff5a1f" : "#0d0d0d";
  ctx.font = `1000 420px "Roboto Flex Variable"`;
  (ctx as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = "ultra-expanded";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(name[0], 26, 400);
  ctx.font = `600 30px "Roboto Flex Variable"`;
  ctx.fillText(name.toUpperCase(), 32, 60);
  return c.toDataURL("image/webp", 0.85);
}

function WorkList() {
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  const [covers, setCovers] = useState<string[]>([]);
  useEffect(() => {
    document.fonts.ready.then(() => setCovers(WORK.map((w, i) => cover(w.name, i))));
  }, []);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 180, damping: 22, mass: 0.6 });
  const y = useSpring(my, { stiffness: 180, damping: 22, mass: 0.6 });
  const vx = useVelocity(x);
  const rotate = useTransform(vx, [-2000, 2000], [-14, 14]);

  return (
    <div
      className="kn-work"
      onPointerMove={(e) => {
        mx.set(e.clientX);
        my.set(e.clientY);
      }}
      onPointerLeave={() => setHover(null)}
    >
      {WORK.map((w, i) => (
        <a
          key={w.name}
          className={`kn-row ${hover === i ? "is-on" : ""}`}
          href={w.href}
          target="_blank"
          rel="noreferrer"
          onPointerEnter={() => setHover(i)}
          onFocus={() => setHover(i)}
          onBlur={() => setHover(null)}
        >
          <span className="kn-row-name">{w.name}</span>
          <span className="kn-row-meta">
            <span>{w.tagline}</span>
            <small>{w.tech.join(" / ")}</small>
          </span>
          <span className="kn-row-go">
            {w.live ? hostOf(w.href) : "GitHub"}
            <ArrowUpRight weight="bold" aria-hidden />
          </span>
        </a>
      ))}
      {!reduced && (
        <motion.div className="kn-preview" style={{ x, y, rotate }} aria-hidden>
          <AnimatePresence>
            {hover !== null && covers[hover] && (
              <motion.img
                key={hover}
                src={covers[hover]}
                alt=""
                initial={{ clipPath: "inset(100% 0 0 0)", scale: 1.2 }}
                animate={{ clipPath: "inset(0% 0 0 0)", scale: 1 }}
                exit={{ clipPath: "inset(0 0 100% 0)", transition: { duration: 0.35, ease: EASE } }}
                transition={{ duration: 0.55, ease: EASE }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

/* ---------- journey: a pinned horizontal run ---------- */

function Journey() {
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const stretch = useTransform(scrollYProgress, [0, 0.5, 1], [40, 151, 40]);
  const years = useTransform(stretch, (v) => `"wdth" ${v.toFixed(0)}, "wght" 900`);

  useLayoutEffect(() => {
    if (reduced || !track.current) return;
    const measure = () => setDistance(Math.max(0, track.current!.scrollWidth - window.innerWidth));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [reduced]);

  const roles = [...ROLES].sort((a, b) => a.start.y * 12 + a.start.m - (b.start.y * 12 + b.start.m));
  return (
    <section
      ref={section}
      className={`kn-journey ${reduced ? "is-still" : ""}`}
      style={reduced ? undefined : { height: `calc(100vh + ${distance}px)` }}
      aria-labelledby="kn-journey-title"
    >
      <div className="kn-journey-stick">
        <motion.div ref={track} className="kn-journey-track" style={reduced ? undefined : { x }}>
          <div className="kn-journey-title">
            <h2 id="kn-journey-title">
              <motion.span style={{ fontVariationSettings: years }}>2022</motion.span>
              <motion.span style={{ fontVariationSettings: years }}>{NOW.y}</motion.span>
            </h2>
            <p>Six roles, one direction. Listen first, then build the thing.</p>
          </div>
          {roles.map((r) => (
            <article key={r.id} className="kn-card">
              <span className="kn-card-year">{r.start.y}</span>
              <h3>{r.role}</h3>
              <p className="kn-card-co">{r.company}</p>
              <p>{r.blurb}</p>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- numbers that count up and stretch ---------- */

function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? value : 0);
  const [done, setDone] = useState(!!reduced);
  useEffect(() => {
    if (reduced || !ref.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 1400);
        setN(Math.round(value * (1 - Math.pow(1 - t, 4))));
        if (t < 1) requestAnimationFrame(step);
        else setDone(true);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [value, reduced]);
  return (
    <div ref={ref} className={`kn-stat ${done ? "is-done" : ""}`}>
      <b>
        {n.toLocaleString("en-US")}
        {suffix}
      </b>
      <span>{label}</span>
    </div>
  );
}

/* ---------- page ---------- */

export function App() {
  useSmoothScroll({ lerp: 0.09 });
  const reduced = useReducedMotion() ?? false;
  const hero = useRef<HTMLElement>(null);
  const outro = useRef<HTMLElement>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const { count, done } = useLoaderCount(fontsReady, 1700);
  const [copied, setCopied] = useState(false);
  useKinetic(hero);
  useKinetic(outro, { base: 70, reach: 320 });

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  // the work section wipes in from its centre as a colour-flipped block
  const workRef = useRef<HTMLElement>(null);
  const { scrollYProgress: workIn } = useScroll({ target: workRef, offset: ["start end", "start 0.2"] });
  const radius = useTransform(workIn, [0, 1], [0, 150]);
  const clip = useTransform(radius, (r) => `circle(${r}% at 50% 50%)`);

  const manifesto = useMemo(
    () =>
      "Before I wrote code I spent three years in a support chat, listening. Now I build the fix: fast pages, boring deploys, and servers that sleep so you can too. Seven hackathon podiums say I like doing it under pressure.",
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };

  return (
    <>
      <AnimatePresence>
        {!done && (
          <motion.div
            className="kn-loader"
            exit={reduced ? undefined : { clipPath: "inset(0 0 100% 0)", transition: { duration: 1, ease: EASE } }}
          >
            <span className="kn-loader-count" style={{ fontVariationSettings: `"wdth" ${25 + count * 1.26}, "wght" ${200 + count * 8}` }}>
              {count}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="kn-nav">
        <a href="#top">Gabriel Catimbang</a>
        <nav aria-label="Sections">
          <a href="#work">Work</a>
          <a href="#journey">Journey</a>
          <a href="#wins">Wins</a>
        </nav>
        <a href={CONTACT_HREF} className="kn-nav-cta">
          Get in touch
        </a>
      </header>

      <main>
        <section ref={hero} id="top" className="kn-hero" aria-labelledby="kn-title">
          <h1 id="kn-title" className="kn-name">
            {["GABRIEL", "CATIMBANG"].map((line, li) => (
              <span key={line} className="kn-line">
                <motion.span
                  className="kn-line-inner"
                  initial={reduced ? false : { y: "105%" }}
                  animate={done ? { y: "0%" } : undefined}
                  transition={{ duration: 1.2, delay: 0.1 + li * 0.12, ease: EASE }}
                >
                  <Letters text={line} />
                </motion.span>
              </span>
            ))}
          </h1>
          <div className="kn-hero-foot">
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={done ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 1, delay: 0.5, ease: EASE }}
            >
              Developer and DevOps engineer from Naga City. I build websites people actually use,
              then keep them running.
            </motion.p>
            <Magnetic>
              <a className="kn-pill" href="#work">
                See the work
              </a>
            </Magnetic>
          </div>
        </section>

        <section className="kn-about" aria-label="About">
          <Manifesto text={manifesto} />
        </section>

        <VelocityMarquee items={["Listen", "Build", "Ship", "Play"]} />

        <motion.section
          ref={workRef}
          id="work"
          className="kn-flip"
          style={reduced ? undefined : { clipPath: clip }}
          aria-labelledby="kn-work-title"
        >
          <h2 id="kn-work-title" className="kn-h2">
            Things I've built
          </h2>
          <WorkList />
        </motion.section>

        <div id="journey">
          <Journey />
        </div>

        <section className="kn-stats" aria-label="Numbers">
          <Stat value={7} suffix="" label="hackathon podiums" />
          <Stat value={2750} suffix="+" label="MerchTrack users in week one" />
          <Stat value={4} suffix="×" label="Bell All-Star" />
          <Stat value={3} suffix="+" label="years shipping" />
        </section>

        <section id="wins" className="kn-wins" aria-labelledby="kn-wins-title">
          <h2 id="kn-wins-title" className="kn-h2">
            On the podium
          </h2>
          <ul>
            {TROPHIES.map((t) => (
              <li key={t.event} tabIndex={0}>
                <span className="kn-win-place">{t.place}</span>
                <span className="kn-win-event">{t.event}</span>
                <span className="kn-win-year">{t.year}</span>
                <span className="kn-win-detail">{t.detail}</span>
              </li>
            ))}
          </ul>
        </section>

        <section ref={outro} className="kn-outro" aria-labelledby="kn-outro-title">
          <h2 id="kn-outro-title" className="kn-name is-outro">
            <Letters text="LET'S" />
            <Letters text="TALK" />
          </h2>
          <div className="kn-outro-actions">
            <Magnetic strength={0.35}>
              <a className="kn-pill is-big" href={CONTACT_HREF}>
                Get in touch
              </a>
            </Magnetic>
            <button type="button" className="kn-copy" onClick={copy}>
              {EMAIL}
              {copied ? <Check weight="bold" aria-hidden /> : <Copy weight="bold" aria-hidden />}
              <span className="kn-sr" aria-live="polite">
                {copied ? "Copied" : ""}
              </span>
            </button>
          </div>
          <footer className="kn-foot">
            <span>Naga City, Philippines</span>
            <span className="kn-foot-links">
              <a href={GITHUB} target="_blank" rel="noreferrer">
                <GithubLogo weight="bold" aria-hidden /> GitHub
              </a>
              <a href={LINKEDIN} target="_blank" rel="noreferrer">
                <LinkedinLogo weight="bold" aria-hidden /> LinkedIn
              </a>
            </span>
          </footer>
        </section>
      </main>
      <Switcher current="kinetic" />
    </>
  );
}
