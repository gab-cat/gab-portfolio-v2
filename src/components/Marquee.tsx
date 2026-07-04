export function Marquee({ items }: { items: readonly string[] }) {
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((item) => (
        <span
          key={`${key}-${item}`}
          className="flex items-center font-display text-sm font-bold tracking-[0.18em] whitespace-nowrap uppercase"
        >
          <span className="px-6">{item}</span>
          <span aria-hidden>✦</span>
        </span>
      ))}
    </div>
  );

  return (
    /* A strip of tape slapped across the hero/story seam — overlaps both
       neighbors instead of floating between them. */
    <section aria-hidden className="relative z-10 -mt-12 -mb-2 overflow-x-clip md:-mt-16">
      <div className="rotate-[-1.2deg] scale-x-110 bg-flame py-3.5 text-[#17130d] shadow-[0_16px_50px_-16px_var(--glow),0_6px_24px_rgba(0,0,0,0.18)]">
        <div className="marquee-track flex w-max">
          {row("a")}
          {row("b")}
        </div>
      </div>
    </section>
  );
}
