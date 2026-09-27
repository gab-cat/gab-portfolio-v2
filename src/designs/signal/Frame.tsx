import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "../../lib/router";
import { Footer } from "./Footer";
import { Nav } from "./Nav";
import { useBootFlag } from "./reveal";
import { attach, type FieldController } from "./scene/stage";
import { Tuner } from "./Tuner";

// Start fetching the particle field alongside the app itself rather than after hydration.
const fieldModule = typeof window === "undefined" ? null : import("./scene/field");

/**
 * Everything that outlives a route change: the particle field, the grain,
 * the nav and the footer. Route changes morph the particles instead of
 * rebuilding them.
 */
export function Frame({ children }: { children: ReactNode }) {
  const { route } = useRouter();
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [flat, setFlat] = useState(false);
  const [mounted, setMounted] = useState(false);
  useBootFlag();

  useEffect(() => {
    setMounted(true);
    let cancelled = false;
    let field: FieldController | null = null;
    let detach: (() => void) | undefined;
    fieldModule!
      .then(({ createField }) => createField(host.current!, () => !cancelled && setReady(true)))
      .then((controller) => {
        if (!controller) {
          if (!cancelled) setFlat(true);
          return;
        }
        if (cancelled) return controller.dispose();
        field = controller;
        detach = attach(controller);
      })
      .catch(() => !cancelled && setFlat(true));
    return () => {
      cancelled = true;
      detach?.();
      field?.dispose();
    };
  }, []);

  return (
    <>
      <a className="sg-skip" href="#main">
        Skip to content
      </a>
      <div ref={host} className={`sg-canvas${ready ? " is-ready" : ""}`} aria-hidden="true" />
      {/* Without WebGL the home page gets a still of the black hole; the stylesheet picks it per theme. */}
      {flat && route === "home" && <div className="sg-flat" aria-hidden="true" />}
      <div className="sg-grain" aria-hidden="true" />
      {mounted && <Tuner ready={ready} failed={flat} />}
      <Nav />
      {children}
      <Footer />
    </>
  );
}
