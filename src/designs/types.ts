import type { ComponentType, ReactNode } from "react";
import type { RouteId } from "../seo";
import type { DesignId } from "./live";

/** What the prerender needs to know about a design to write each page's head. */
export type DesignHead = {
  id: DesignId;
  /** Self-hosted fonts under /public worth preloading on every page: only what the first screen needs. */
  fontPreloads: string[];
  /** Small images the first screen needs before its JavaScript asks for them. */
  imagePreloads?: string[];
  /**
   * Modules (relative to the design folder) each route loads on start. The
   * prerender turns them into modulepreload links so they download with the
   * entry instead of after it.
   */
  routeModules: Record<RouteId, string[]>;
  /** Browser chrome: theme-color metas and the web manifest. */
  theme: { light: string; dark: string; accent: string };
  /** The hero's line for llms-full.txt, so machine readers get the same opening as people. */
  intro: string;
  /** Folder under /public holding og.png, favicon.svg, favicon.ico, apple-touch-icon.png, icon-192.png and icon-512.png (also served as /logo.png). */
  brand: string;
};

/** Wraps every route and survives route changes: nav, canvases, preloaders. */
export type Frame = ComponentType<{ children: ReactNode }>;

/** The client half of a design. Pages load on demand so each route stays its own chunk. */
export type Design = {
  Frame: Frame;
  load: (route: RouteId) => Promise<ComponentType>;
};

/** The prerender half: every page up front, plus the head details. */
export type ServerDesign = {
  Frame: Frame;
  pages: Record<RouteId, ComponentType>;
  head: DesignHead;
};
