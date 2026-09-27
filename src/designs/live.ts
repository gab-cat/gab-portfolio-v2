/**
 * Every design lives in src/designs/<id> and renders the same three routes
 * from the same data (src/data.ts, src/seo.ts). The build imports exactly one
 * of them through the `@design` alias in vite.config.ts, so the others never
 * reach the bundle.
 *
 * To ship a different design, change LIVE_DESIGN.
 * To preview one without shipping it: DESIGN=clay bun run dev
 */
export const DESIGNS = ["signal", "clay"] as const;

export type DesignId = (typeof DESIGNS)[number];

export const LIVE_DESIGN: DesignId = "signal";

export function pickDesign(requested: string | undefined): DesignId {
  if (!requested) return LIVE_DESIGN;
  if ((DESIGNS as readonly string[]).includes(requested)) return requested as DesignId;
  throw new Error(`Unknown DESIGN "${requested}". Pick one of: ${DESIGNS.join(", ")}.`);
}
