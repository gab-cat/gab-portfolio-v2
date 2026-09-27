/**
 * One set of facts for every direction. Everything comes from src/data.ts;
 * this file only adds structure (real month ranges, line assignments) and
 * strips the em-dashes the live copy still uses.
 */
import {
  CRAFT,
  CURRENTLY,
  EMAIL,
  MARQUEE_ITEMS,
  PROJECTS,
  SOCIALS,
  TOOLBOX,
  TROPHIES as RAW_TROPHIES,
} from "../../src/data";

export { CRAFT, CURRENTLY, EMAIL, MARQUEE_ITEMS, SOCIALS, TOOLBOX };

export const NAME = "Gabriel Catimbang";
export const PORTRAIT = "/portraits/gab-editorial.webp";
export const HALFTONE = "/portraits/gab-halftone.webp";
export const CONTACT_HREF = "/contact";
export const GITHUB = SOCIALS[0].href;
export const LINKEDIN = SOCIALS[1].href;

/** "Vue, Nuxt, Express — learned fast" reads as two sentences once the dash goes. */
export function clean(text: string) {
  return text
    .replace(/\s*—\s*/g, ". ")
    .replace(/\. ([a-z])/g, (_, c: string) => `. ${c.toUpperCase()}`);
}

export const TROPHIES = RAW_TROPHIES.map((t) => ({ ...t, detail: t.detail.replace(/\s*—\s*/g, ", ") }));

export type Month = { y: number; m: number };

const today = new Date();
export const NOW: Month = { y: today.getFullYear(), m: today.getMonth() + 1 };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const monthIndex = (m: Month) => m.y * 12 + (m.m - 1);
export const fromIndex = (i: number): Month => ({ y: Math.floor(i / 12), m: (i % 12) + 1 });
export const fmtMonth = (m: Month | null) => (m ? `${MONTHS[m.m - 1]} ${m.y}` : "Now");
export const fmtRange = (a: Month, b: Month | null) => `${fmtMonth(a)} - ${fmtMonth(b)}`;

export type Track = "listen" | "build" | "ship" | "play";

export type Role = {
  id: string;
  role: string;
  company: string;
  start: Month;
  end: Month | null;
  blurb: string;
  track: Track;
};

/** The journey, oldest first, with real month ranges. */
export const ROLES: Role[] = [
  {
    id: "bell",
    role: "eChat Representative",
    company: "Quantrics (Bell Canada)",
    start: { y: 2022, m: 5 },
    end: { y: 2025, m: 4 },
    blurb: "Three years solving strangers' problems in real time. The best empathy training a developer can get.",
    track: "listen",
  },
  {
    id: "pillars-dev",
    role: "Frontend Apprentice, then Web Developer",
    company: "ThePILLARS Publication",
    start: { y: 2024, m: 1 },
    end: { y: 2024, m: 7 },
    blurb: "Started as an apprentice and shipped full-stack within six months. Vue, Nuxt, Express. Learned fast, built faster.",
    track: "build",
  },
  {
    id: "adnu",
    role: "Lead Game Programmer (Intern)",
    company: "ADNU Digital Illustration & Animation",
    start: { y: 2024, m: 6 },
    end: { y: 2024, m: 7 },
    blurb: "Built core gameplay mechanics in Unreal Engine 4 with C++. Yes, games count as software.",
    track: "play",
  },
  {
    id: "pillars-web",
    role: "Webmaster",
    company: "ThePILLARS Publication",
    start: { y: 2024, m: 8 },
    end: null,
    blurb: "The person they call so the site never goes down. Deployments, security, and automating the boring parts.",
    track: "ship",
  },
  {
    id: "detken",
    role: "DevOps Engineer",
    company: "Detken Development",
    start: { y: 2025, m: 4 },
    end: null,
    blurb: "Moved production off Vercel onto servers we control, wired up pipelines that deploy themselves, and locked the doors properly.",
    track: "ship",
  },
  {
    id: "oldst",
    role: "Software Developer Intern",
    company: "Old.St Labs",
    start: { y: 2025, m: 6 },
    end: { y: 2025, m: 9 },
    blurb: "Built digital products with a team that ships fast. Next.js in front, NestJS in back.",
    track: "build",
  },
];

export const ROLES_NEWEST = [...ROLES].sort((a, b) => monthIndex(b.start) - monthIndex(a.start));

export type Work = {
  name: string;
  tagline: string;
  story: string;
  tech: readonly string[];
  href: string;
  live: boolean;
};

export const WORK: Work[] = PROJECTS.map((p) => ({
  name: p.name,
  tagline: p.tagline,
  story: clean(p.story),
  tech: p.tech,
  href: p.href,
  live: !p.href.includes("github.com"),
}));

export const hostOf = (href: string) => new URL(href).host.replace(/^www\./, "");
