/**
 * Every fact comes from src/data.ts. This file only reshapes it for Signal:
 * newest roles first, one line per craft, and no em-dashes (the shared copy
 * still uses them; this design doesn't).
 */
import { CRAFT, EMAIL, JOURNEY, PROJECTS, SOCIALS, TOOLBOX, TROPHIES as RAW_TROPHIES } from "../../data";

export { EMAIL, SOCIALS };

export const HALFTONE = "/portraits/gab-halftone.webp";
/** A small copy of the portrait for the particle field to sample; it only reads a 165 by 220 grid. */
export const FIELD_PORTRAIT = "/portraits/gab-signal.webp";

/** "Vue, Nuxt, Express — learned fast" reads as two sentences once the dash goes. */
export function clean(text: string) {
  return text.replace(/\s*—\s*/g, ". ").replace(/\. ([a-z])/g, (_, c: string) => `. ${c.toUpperCase()}`);
}

/** "May 2022 — Apr 2025" becomes a proper range. */
const range = (text: string) => text.replace(/\s*—\s*/g, " – ");

export type Role = { period: string; role: string; company: string; blurb: string; current: boolean };

/** Current roles first, then the rest, newest start first. */
export const ROLES: Role[] = [...JOURNEY]
  .reverse()
  .map((job) => ({
    period: range(job.period),
    role: job.role.replace(" → ", " to "),
    company: job.company,
    blurb: clean(job.blurb),
    current: /now$/i.test(job.period),
  }))
  .sort((a, b) => Number(b.current) - Number(a.current));

export const CRAFTS = CRAFT.map((craft, i) => ({
  tag: craft.tag,
  title: craft.title.join(" "),
  copy: clean(craft.copy),
  tools: TOOLBOX[i]?.items ?? [],
}));

export const TROPHIES = RAW_TROPHIES.map((trophy) => ({ ...trophy, detail: trophy.detail.replace(/\s*—\s*/g, ", ") }));

export const WORK = PROJECTS.map((project) => ({
  name: project.name,
  tagline: project.tagline,
  story: clean(project.story),
  tech: project.tech,
  href: project.href,
  live: !project.href.includes("github.com"),
}));

export const hostOf = (href: string) => new URL(href).host.replace(/^www\./, "");
