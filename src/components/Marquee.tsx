/*
  One moving band, three costumes:
  - "tape"   — the flame strip at the hero/story seam, tilted 1.2° to match
               the hero's clipped bottom edge (its centerline sits exactly on
               that edge, so hero bg meets the tape's top and paper meets its
               bottom — no wedges).
  - "ticker" — a quiet bordered news-wire strip, mono type, drifting the
               other way. Used to announce the trophy shelf.
  - "giant"  — poster-scale hollow letters on terminal-dark, the hem of the
               curtain-call panel that closes the site.
*/

type Variant = "tape" | "ticker" | "giant";

export function Marquee({
  items,
  variant = "tape",
}: {
  items: readonly string[];
  variant?: Variant;
}) {
  const row = (key: string, item: (text: string) => React.ReactNode) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((text) => (
        <span key={`${key}-${text}`} className="flex items-center whitespace-nowrap">
          {item(text)}
        </span>
      ))}
    </div>
  );

  if (variant === "ticker") {
    return (
      <section aria-hidden className="overflow-x-clip border-y border-line">
        <div
          className="marquee-track marquee-rev flex w-max py-3"
          style={{ animationDuration: "52s" }}
        >
          {["a", "b"].map((key) =>
            row(key, (text) => (
              <>
                <span className="px-8 font-mono text-xs tracking-[0.22em] text-fog uppercase">
                  {text}
                </span>
                <span aria-hidden className="text-xs text-flame">
                  ✦
                </span>
              </>
            )),
          )}
        </div>
      </section>
    );
  }

  if (variant === "giant") {
    return (
      <section
        aria-hidden
        className="relative z-10 -mb-[calc(1.05vw+34px)] overflow-x-clip"
      >
        <div className="rotate-[-1.2deg] scale-x-110 bg-[#0e0c09] py-4 shadow-[0_-16px_50px_-16px_var(--glow)] md:py-5">
          <div
            className="marquee-track flex w-max items-center"
            style={{ animationDuration: "70s" }}
          >
            {["a", "b"].map((key) =>
              row(key, (text) => (
                <>
                  <span
                    className="px-10 font-display text-5xl font-bold tracking-tight uppercase md:text-7xl"
                    style={{
                      WebkitTextStroke: "2px rgba(236,229,214,0.38)",
                      color: "transparent",
                    }}
                  >
                    {text}
                  </span>
                  <span aria-hidden className="text-2xl text-flame/70 md:text-3xl">
                    ✦
                  </span>
                </>
              )),
            )}
          </div>
        </div>
      </section>
    );
  }

  // "tape" — centerline pinned to the hero's slanted bottom edge
  return (
    <section
      aria-hidden
      className="relative z-10 -mt-[calc(1.05vw+22px)] -mb-2 overflow-x-clip"
    >
      <div className="rotate-[-1.2deg] scale-x-110 bg-flame py-3.5 text-[#17130d] shadow-[0_16px_50px_-16px_var(--glow),0_6px_24px_rgba(0,0,0,0.18)]">
        <div className="marquee-track flex w-max">
          {["a", "b"].map((key) =>
            row(key, (text) => (
              <>
                <span className="px-6 font-display text-sm font-bold tracking-[0.18em] uppercase">
                  {text}
                </span>
                <span aria-hidden>✦</span>
              </>
            )),
          )}
        </div>
      </div>
    </section>
  );
}
