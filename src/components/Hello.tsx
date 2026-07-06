import { useRef, useState } from "react";
import { EMAIL, SOCIALS } from "../data";
import { scrollToTop } from "../lib/lenis";
import { Magnetic } from "./Magnetic";
import { Reveal } from "./Reveal";

/*
  06 · SAY HELLO — "the curtain call"
  The site opens inside a terminal, so it ends inside one too: a full-bleed
  panel in fixed terminal-dark (whatever the theme), with a flame spotlight
  that follows the cursor like a stage light.
*/

export function Hello() {
  const [copied, setCopied] = useState(false);
  const spotRef = useRef<HTMLDivElement>(null);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the mailto button still works
    }
  };

  const moveSpot = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    spotRef.current?.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    spotRef.current?.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  return (
    <section
      id="hello"
      onPointerMove={moveSpot}
      className="relative overflow-hidden bg-[#0e0c09] pt-[calc(1.05vw+34px)] text-[#ece5d6]"
    >
      {/* faint drifting plus-marks, tying back to the hero */}
      <div
        aria-hidden
        className="bg-plus plus-drift pointer-events-none absolute inset-0 opacity-25"
      />
      {/* cursor-following stage light */}
      <div ref={spotRef} aria-hidden className="spotlight pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-6xl px-5 pt-28 sm:px-8 md:pt-40">
        <div className="text-center">
          <Reveal>
            <p className="mb-6 font-mono text-xs tracking-[0.25em] text-flame uppercase">
              06 · say hello
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="font-display mx-auto max-w-4xl text-5xl leading-[1.03] font-bold tracking-tight text-balance md:text-7xl lg:text-8xl">
              Got an idea? A job?{" "}
              <em className="font-serif text-[1.1em] text-flame">
                A really good meme?
              </em>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-7 max-w-md text-lg text-[#9b9384]">
              My inbox is open — and I actually reply.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <Magnetic>
                <a
                  href={`mailto:${EMAIL}?subject=Let's build something`}
                  className="inline-block rounded-full bg-flame px-8 py-4 font-display text-base font-bold tracking-wide text-white transition-transform duration-300 hover:scale-[1.04] active:scale-95"
                >
                  {EMAIL} →
                </a>
              </Magnetic>
              <button
                onClick={copyEmail}
                className="rounded-full border border-white/15 px-6 py-4 font-mono text-sm transition-colors duration-300 hover:border-flame hover:text-flame"
              >
                {copied ? "copied ✓" : "copy email"}
              </button>
            </div>
          </Reveal>

          <Reveal delay={0.32}>
            <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-2xl border border-white/10 bg-white/3 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-flame/50"
                >
                  <p className="flex items-center justify-between font-display text-lg font-bold tracking-tight">
                    {social.label}
                    <span
                      aria-hidden
                      className="text-[#9b9384] transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-flame"
                    >
                      ↗
                    </span>
                  </p>
                  <p className="mt-1 truncate font-mono text-sm text-flame/90">
                    {social.handle}
                  </p>
                </a>
              ))}
            </div>
          </Reveal>
        </div>

        {/* footer */}
        <footer className="mt-24 flex flex-col items-center justify-between gap-4 border-t border-white/10 py-8 sm:flex-row">
          <p className="font-mono text-xs text-[#9b9384]">
            © 2026 Gabriel Catimbang · Naga City, PH
          </p>
          <p className="font-mono text-xs text-[#9b9384]">
            <span className="text-flame">gab@gabcat.dev:~$</span> logout — thanks
            for scrolling
          </p>
          <button
            onClick={scrollToTop}
            className="font-mono text-xs text-[#9b9384] transition-colors duration-300 hover:text-flame"
          >
            back to top ↑
          </button>
        </footer>
      </div>
    </section>
  );
}
