import { useState } from "react";
import { EMAIL, SOCIALS } from "../data";
import { scrollToTop } from "../lib/lenis";
import { Magnetic } from "./Magnetic";
import { Reveal } from "./Reveal";

export function Hello() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the mailto button still works
    }
  };

  return (
    <section id="hello" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "var(--glow)" }}
      />

      <div className="relative mx-auto max-w-6xl px-5 pt-28 sm:px-8 md:pt-40">
        <div className="text-center">
          <Reveal>
            <p className="mb-6 font-mono text-xs tracking-[0.25em] text-flame uppercase">
              06 · say hello
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="font-display mx-auto max-w-4xl text-5xl leading-[1.03] font-bold tracking-tight text-balance md:text-7xl">
              Got an idea? A job?{" "}
              <em className="font-serif text-[1.1em] text-flame">
                A really good meme?
              </em>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-md text-lg text-fog">
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
                className="rounded-full border border-line px-6 py-4 font-mono text-sm transition-colors duration-300 hover:border-flame hover:text-flame"
              >
                {copied ? "copied ✓" : "copy email"}
              </button>
            </div>
          </Reveal>

          <Reveal delay={0.32}>
            <div className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group font-mono text-sm text-fog transition-colors duration-300 hover:text-flame"
                >
                  {social.label}{" "}
                  <span className="text-flame">{social.handle}</span>
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5">
                    {" "}
                    ↗
                  </span>
                </a>
              ))}
            </div>
          </Reveal>
        </div>

        {/* footer */}
        <footer className="mt-24 flex flex-col items-center justify-between gap-4 border-t border-line py-8 sm:flex-row">
          <p className="font-mono text-xs text-fog">
            © 2026 Gabriel Catimbang · Naga City, PH
          </p>
          <p className="font-mono text-xs text-fog">
            orange & black, always<span className="text-flame">.</span> built
            with React + a lot of coffee
          </p>
          <button
            onClick={scrollToTop}
            className="font-mono text-xs text-fog transition-colors duration-300 hover:text-flame"
          >
            back to top ↑
          </button>
        </footer>
      </div>
    </section>
  );
}
