import { useRef, type CSSProperties } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionStyle } from "motion/react";
import { JOURNEY } from "../data";
import { Reveal } from "./Reveal";
import { Sculpture } from "./Sculpture";

/* Each role is a clay block; the card and its block in the tower share a colour. */
const CHAPTERS = [
  { verb: "Listen.", lesson: "People before pixels.", detail: "The human side of the screen", color: "#bcd3a2", ink: "#23331c" },
  { verb: "Learn.", lesson: "From apprentice to shipping.", detail: "The first leap into code", color: "#cfc0f4", ink: "#2d2150" },
  { verb: "Play.", lesson: "Make the idea move.", detail: "A different kind of engine", color: "#f5b7a8", ink: "#4a1d14" },
  { verb: "Own.", lesson: "The launch is just the start.", detail: "Taking care of what we build", color: "#f6cf5f", ink: "#3d2c05" },
  { verb: "Scale.", lesson: "Build what holds it all up.", detail: "Behind the scenes. Under the hood.", color: "#a3c7ea", ink: "#132a42" },
  { verb: "Ship.", lesson: "Better, together.", detail: "Finding rhythm with a team", color: "#dbe98a", ink: "#2c330b" },
];

function CareerCard({ index }: { index: number }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 20%"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [index % 2 ? 6 : -6, index % 2 ? 1.2 : -1.2]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const job = JOURNEY[index];
  const chapter = CHAPTERS[index];
  const current = job.period.includes("now");
  return (
    <motion.article
      ref={ref}
      id={`career-${index}`}
      className="career-card"
      style={{
        rotate: reduced ? 0 : rotate,
        scale: reduced ? 1 : scale,
        top: `calc(110px + ${index * 12}px)`,
        "--tone": chapter.color,
        "--tone-ink": chapter.ink,
      } as MotionStyle}
    >
      <div className="career-card-top">
        <span className="career-chip">{job.period}</span>
        <span className={`career-chip ${current ? "is-now" : ""}`}>
          {current ? "● Currently building" : chapter.detail}
        </span>
      </div>
      <p className="career-card-verb" aria-hidden="true">{chapter.verb}</p>
      <div className="career-card-bottom">
        <p className="career-card-lesson">{chapter.lesson}</p>
        <h3>{job.role}</h3>
        <p className="career-card-company">{job.company}</p>
        <p className="career-card-copy">{job.blurb}</p>
      </div>
      <span className="career-card-index" aria-label={`Role ${index + 1} of ${JOURNEY.length}`}>
        0{index + 1}
        <small>/0{JOURNEY.length}</small>
      </span>
    </motion.article>
  );
}

export function Journey() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const wordY = useTransform(scrollYProgress, (value) => `${(-Math.min(5, Math.floor(value * 6)) * 100) / 6}%`);
  return (
    <>
      <section ref={ref} id="journey" className="journey-tray">
        <div className="clay-container journey-stage">
          <div className="journey-director">
            <Reveal>
              <p className="chapter-label" style={{ "--chip": "var(--butter)" } as CSSProperties}>
                Chapter two · Experience is a verb
              </p>
              <h2 className="chapter-title">
                You don’t learn it by <em>standing still.</em>
              </h2>
              <p className="chapter-copy">
                From listening to people to building what they need. Every role
                added another block to the stack.
              </p>
            </Reveal>
            <div className="journey-object">
              <Sculpture chapter="building" track="journey" />
              <div className="journey-word" aria-hidden="true">
                <motion.div style={{ y: reduced ? "0%" : wordY }}>
                  {CHAPTERS.map((c) => (
                    <span key={c.verb}>{c.verb}</span>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
          <div className="career-deck">
            {JOURNEY.map((job, index) => (
              <CareerCard key={job.company + job.period} index={index} />
            ))}
          </div>
        </div>
      </section>
      <section className="journey-exit clay-container" aria-label="What experience leads to">
        <Reveal>
          <p>All of that leads to one thing.</p>
          <h2>
            Things that <em>actually work.</em>
          </h2>
          <span className="journey-exit-arrow" aria-hidden="true">↓</span>
        </Reveal>
      </section>
    </>
  );
}
