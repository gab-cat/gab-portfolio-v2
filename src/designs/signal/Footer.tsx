import { ArrowRight, ArrowUp, ArrowUpRight } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "../../lib/router";
import { scrollToTop } from "../../lib/scroll";
import { EMAIL, SOCIALS } from "./content";
import { signal, smoothstep } from "./scene/stage";

/**
 * Every page ends at sea. As the footer comes up, whatever the page was
 * showing settles into the water off Naga City, under the sky as it is there
 * right now: the sun crossing from six to six, or the moon in tonight's phase.
 * The footer only says where its horizon and sky are; the field draws them.
 */
export function Footer() {
  const foot = useRef<HTMLElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const horizon = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = foot.current!;
    let raf = 0;
    let near = false;
    const away = () => signal.ending({ amount: 0, horizon: 0, sky: 0, bottom: 0 });
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const box = el.getBoundingClientRect();
      const seen = (vh - box.top) / Math.min(box.height, vh);
      signal.ending({
        amount: smoothstep(0.15, 0.7, seen),
        horizon: horizon.current!.getBoundingClientRect().top,
        sky: top.current!.getBoundingClientRect().bottom + 24,
        bottom: box.bottom,
      });
      if (near) raf = requestAnimationFrame(update);
    };
    // Measured every frame only while the footer is close; the rest of the time it costs nothing.
    const watch = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        if (near && !raf) raf = requestAnimationFrame(update);
        if (!near) away();
      },
      { rootMargin: "240px 0px" },
    );
    watch.observe(el);
    return () => {
      watch.disconnect();
      cancelAnimationFrame(raf);
      away();
    };
  }, []);

  return (
    <footer className="sg-foot" ref={foot}>
      <div className="sg-foot-top" ref={top}>
        <div>
          <p className="sg-foot-line">From Naga City, open to your next what if.</p>
          <LocalTime />
        </div>
        <nav className="sg-foot-links" aria-label="Elsewhere">
          <Link href="/contact">
            Write to me <ArrowRight size={15} weight="bold" aria-hidden />
          </Link>
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          {SOCIALS.map((social) => (
            <a key={social.label} href={social.href} target="_blank" rel="noreferrer noopener">
              {social.label} <ArrowUpRight size={15} weight="bold" aria-hidden />
            </a>
          ))}
        </nav>
      </div>
      <div className="sg-foot-sea" ref={horizon} aria-hidden="true" />
      <div className="sg-foot-row">
        <span>© 2026 Gabriel Catimbang</span>
        <button type="button" onClick={scrollToTop}>
          Back to top <ArrowUp size={14} weight="bold" aria-hidden />
        </button>
      </div>
    </footer>
  );
}

const hours = (n: number) => `${Math.abs(n)} hour${Math.abs(n) === 1 ? "" : "s"}`;

/**
 * The time in Naga City and how far it is from the visitor's own clock, so
 * someone abroad knows when a reply can come; the sky over the sea below
 * shows the same hour. Filled in after hydration: the prerendered page says
 * where, not when.
 */
function LocalTime() {
  const [now, setNow] = useState<{ time: string; gap: string } | null>(null);
  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" });
    let timer = 0;
    const tick = () => {
      const date = new Date();
      // Manila is UTC+8 all year.
      const ahead = (480 + date.getTimezoneOffset()) / 60;
      setNow({
        time: format.format(date).toLowerCase(),
        gap: ahead === 0 ? "the same time as you" : `${hours(ahead)} ${ahead > 0 ? "ahead of" : "behind"} you`,
      });
      timer = window.setTimeout(tick, 60_000 - (date.getTime() % 60_000) + 50);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <p className="sg-foot-clock">
      {now ? (
        <>
          It’s <time>{now.time}</time> in Naga City, {now.gap}.
        </>
      ) : (
        "Naga City, Philippines."
      )}
    </p>
  );
}
