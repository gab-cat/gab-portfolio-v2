/**
 * Every fact comes from src/data.ts. This file only reshapes it for Signal:
 * newest roles first, one line per craft, and no em-dashes (the shared copy
 * still uses them; this design doesn't).
 */
import {
  CERTIFICATIONS,
  COMMUNITY,
  CRAFT,
  EDUCATION,
  EMAIL,
  FEATURED_PROJECTS,
  JOURNEY,
  PROJECT_KINDS,
  PROJECTS,
  SOCIALS,
  TOOLBOX,
  TROPHIES as RAW_TROPHIES,
  thumbOf,
  type Project,
  type ProjectKind,
} from "../../data";
import { projectPath } from "../../seo";

export { EMAIL, SOCIALS, PROJECT_KINDS, type ProjectKind };

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

const NUMBERS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];

/** "Thirteen" for 13, the digits past twenty. */
export const spell = (n: number) => NUMBERS[n] ?? String(n);

/** "2024 and 2025", "2023, 2024 and 2025". */
const and = (items: readonly string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);

/** One project's kind, for its row and its page. */
export const KIND_ONE: Record<ProjectKind, string> = {
  client: "Client work",
  product: "Product",
  hackathon: "Hackathon",
  game: "Game",
  tool: "Tool",
  school: "School project",
};

export type Work = {
  slug: string;
  path: string;
  name: string;
  year: string;
  kind: ProjectKind;
  kindLabel: string;
  role: string;
  tagline: string;
  story: string;
  built: string[];
  results: string[];
  tech: readonly string[];
  links: { label: string; href: string; host: string }[];
  status?: string;
  /** What kind of client, for codenamed work. */
  confidential?: string;
  image?: string;
  /** The 320px copy of the screenshot, for list rows on phones. */
  thumb?: string;
};

export const hostOf = (href: string) => new URL(href).host.replace(/^www\./, "");

function toWork(project: Project): Work {
  const links = [
    project.links.live && { label: hostOf(project.links.live) === "facebook.com" ? "Messenger" : "Live", href: project.links.live },
    project.links.repo && { label: "Code", href: project.links.repo },
    project.links.post && { label: "Post", href: project.links.post },
  ]
    .filter((link): link is { label: string; href: string } => Boolean(link))
    .map((link) => ({ ...link, host: hostOf(link.href) }));
  return {
    slug: project.slug,
    path: projectPath(project),
    name: project.name,
    year: range(project.year),
    kind: project.kind,
    kindLabel: KIND_ONE[project.kind],
    role: clean(project.role),
    tagline: clean(project.tagline),
    story: clean(project.story),
    built: project.built.map(clean),
    results: (project.results ?? []).map(clean),
    tech: project.tech,
    links,
    status: project.status && clean(project.status),
    confidential: project.confidential,
    image: project.image,
    thumb: project.image && thumbOf(project.image),
  };
}

/** "2025 – 2026" sorts by the year it ran to. */
const until = (project: Project) => Number(project.year.slice(-4));
const newestFirst = (list: readonly Project[]) => [...list].sort((a, b) => until(b) - until(a));

/** Every project, newest first (ties keep the data's order). */
export const ALL_WORK = newestFirst(PROJECTS).map(toWork);
/** The home page's Work chapter. */
export const WORK = newestFirst(FEATURED_PROJECTS).map(toWork);

/** The years the awards came in, read from the data so the heading stays true: "2024 and 2025". */
export const AWARD_YEARS = and([...new Set(TROPHIES.map((trophy) => trophy.year))].sort());

/** Kinds that have at least one project, in the order PROJECT_KINDS lists them. */
export const WORK_KINDS = (Object.keys(PROJECT_KINDS) as ProjectKind[]).filter((kind) =>
  ALL_WORK.some((work) => work.kind === kind),
);

export const SCHOOL = EDUCATION.map((school) => ({ ...school, period: range(school.period) }));
export const CIRCLES = COMMUNITY.map((item) => ({ ...item, period: range(item.period) }));
export { CERTIFICATIONS };
