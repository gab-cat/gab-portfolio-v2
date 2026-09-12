import { useEffect, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import type { RouteId } from "../seo";
import { Footer } from "./Footer";
import { Nav } from "./Nav";
import { ScrollProgress } from "./ScrollProgress";

const SKIP: Record<RouteId, string> = {
  home: "#work",
  contact: "#contact-title",
  notFound: "#missing-title",
};

export function AppShell({
  route,
  children,
}: {
  route: RouteId;
  children: ReactNode;
}) {
  useEffect(() => {
    if (route !== "home") return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    void import("../lib/lenis").then(({ initLenis }) => {
      const cleanup = initLenis();
      if (cancelled) {
        cleanup?.();
        return;
      }
      stop = cleanup;
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [route]);
  return (
    <MotionConfig reducedMotion="user">
      <a href={SKIP[route]} className="skip-link">
        Skip to content
      </a>
      <ScrollProgress />
      <Nav contact={route === "contact"} />
      {children}
      <div className={route === "contact" ? "contact-route" : undefined}>
        <Footer />
      </div>
    </MotionConfig>
  );
}
