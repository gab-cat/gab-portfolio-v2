import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { JOURNEY } from "../data";
import { Reveal } from "./Reveal";
import { Sculpture } from "./Sculpture";

const CHAPTERS = [
  { verb: "Listen.", lesson: "People before pixels.", detail: "The human side of the screen", glyph: "↔" },
  { verb: "Learn.", lesson: "From apprentice to shipping.", detail: "The first leap into code", glyph: "↗" },
  { verb: "Play.", lesson: "Make the idea move.", detail: "A different kind of engine", glyph: "✳" },
  { verb: "Own.", lesson: "The launch is just the start.", detail: "Taking care of what we build", glyph: "◎" },
  { verb: "Scale.", lesson: "Build what holds it all up.", detail: "Behind the scenes. Under the hood.", glyph: "⌘" },
  { verb: "Ship.", lesson: "Better, together.", detail: "Finding rhythm with a team", glyph: "→" },
];

function CareerCard({ index }: { index: number }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 15%"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [index % 2 ? 5 : -5, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [.9, 1]);
  const job = JOURNEY[index];
  const chapter = CHAPTERS[index];
  return (
    <motion.article ref={ref} id={`career-${index}`} className={`career-panel career-panel-${index}`} style={{ rotate: reduced ? 0 : rotate, scale: reduced ? 1 : scale, top: `calc(100px + ${index * 9}px)` }}>
      <div className="career-panel-top"><span>{job.period}</span><span>{job.period.includes("now") ? "Currently building" : chapter.detail}</span></div>
      <div className="career-panel-art" aria-hidden="true"><span>{chapter.glyph}</span><i /><i /></div>
      <p className="career-panel-verb">{chapter.verb}</p>
      <div className="career-panel-bottom">
        <p className="career-panel-lesson">{chapter.lesson}</p>
        <h3>{job.role}</h3>
        <p className="career-panel-company">{job.company}</p>
        <p className="career-panel-copy">{job.blurb}</p>
      </div>
      <span className="career-panel-index" aria-label={`Chapter ${index + 1} of ${JOURNEY.length}`}>0{index + 1}<span> / 0{JOURNEY.length}</span></span>
    </motion.article>
  );
}

export function Journey() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const wordY = useTransform(scrollYProgress, value => `${-Math.min(5, Math.floor(value * 6)) * 100 / 6}%`);
  return (
    <>
    <section ref={ref} id="journey" className="experience-theater">
      <div className="studio-container experience-stage">
        <div className="experience-director">
          <Reveal><p className="chapter-label">Experience is a verb.</p><h2>You don’t<br />learn it by<br /><em>standing still.</em></h2>
          <p className="chapter-copy">From listening to people to building what they need. Every role added another way to make things work.</p></Reveal>
          <div className="experience-word-window" aria-hidden="true"><motion.div style={{ y: reduced ? "0%" : wordY }}>{CHAPTERS.map(c => <span key={c.verb}>{c.verb}</span>)}</motion.div></div>
          <Sculpture chapter="building" className="experience-object" />
          <p className="experience-scroll-hint">Keep going <span aria-hidden="true">↓</span> There’s a little more to the story.</p>
        </div>
        <div className="career-deck">{JOURNEY.map((job, index) => <CareerCard key={job.company + job.period} index={index} />)}</div>
      </div>
    </section>
      <section className="experience-exit studio-container" aria-label="What experience leads to">
        <Reveal><p>All of that leads to one thing.</p><h2>Things that <em>actually work.</em> <span aria-hidden="true">↓</span></h2></Reveal>
      </section>
    </>
  );
}
