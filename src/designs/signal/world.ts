import { useEffect } from "react";
import { FIGURE, only, signal, type World } from "./scene/stage";

/**
 * Shows a project's world on a page that opens with a title: the planet sits
 * beside the title (above it on phones) and scrolls away with it, so the
 * particles never sit behind the copy you are reading.
 */
export function useWorld(world: World) {
  const { seed, bands, rings, moons } = world;
  useEffect(() => {
    let raf = 0;
    const show = () => {
      raf = 0;
      signal.show({ ...only(FIGURE.world), world: { seed, bands, rings, moons }, lift: window.scrollY });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(show);
    };
    show();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [seed, bands, rings, moons]);

  useEffect(() => () => signal.focus(null), []);
}

/** A project's world: a belt for each thing built, a ringlet for each tool, a moon for each result. */
export const worldOf = (work: { slug: string; built: readonly string[]; tech: readonly string[]; results: readonly string[] }): World => ({
  seed: work.slug,
  bands: work.built.length,
  rings: work.tech.length,
  moons: work.results.length,
});
