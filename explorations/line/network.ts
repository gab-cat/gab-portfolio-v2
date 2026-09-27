/**
 * The network, drawn on a 1200 x 640 schematic. Every station is a real fact
 * from the portfolio; the geometry is hand-placed on a 45 degree grid so the
 * map reads like a real transit diagram.
 */
import { TROPHIES, WORK, clean } from "../shared/content";

export type LineId = "listen" | "build" | "ship" | "play";
export type Label = "above" | "below" | "above-left";

export type Station = {
  id: string;
  name: string;
  sub: string;
  x: number;
  y: number;
  label: Label;
  lines: LineId[];
  body: string;
  href?: string;
  terminal?: boolean;
};

export const W = 1200;
export const H = 640;

export const LINES: Record<
  LineId,
  {
    name: string;
    letter: string;
    years: string;
    path: string;
    extension?: string;
    title: string;
    copy: string;
    stops: string[];
  }
> = {
  listen: {
    name: "Listen Line",
    letter: "L",
    years: "2022 - 2025",
    path: "M80 440 H800",
    title: "First, I learned to listen.",
    copy: "Three years in Bell Canada's support chat. Every conversation started with someone who needed something to work, and listening closely mattered more than the fastest answer.",
    stops: ["naga", "bell", "allstar", "pillars", "detken"],
  },
  build: {
    name: "Build Line",
    letter: "B",
    years: "2024 - now",
    path: "M470 440 L590 320 H970",
    extension: "M970 320 H1040 L1120 400 H1150",
    title: "It starts on a screen. It has to feel right.",
    copy: "I build the part people actually touch, front to back. Fast pages, calm interfaces, and code the next person can read without calling me.",
    stops: ["pillars", "fullstack", "merchtrack", "csguild", "oldst", "team"],
  },
  ship: {
    name: "Ship Line",
    letter: "S",
    years: "2024 - now",
    path: "M470 440 L530 500 H740 L800 440 H1000",
    extension: "M1000 440 H1150",
    title: "Launch day should feel like any other day.",
    copy: "I like my deploys boring. So I wire up pipelines that test, build and ship on their own, on servers I can still reason about at 3 a.m.",
    stops: ["pillars", "webmaster", "detken", "offvercel", "pipelines", "team"],
  },
  play: {
    name: "Play Line",
    letter: "P",
    years: "2024 - now",
    path: "M80 440 L200 560 H950",
    extension: "M950 560 H980 L1020 520 H1150",
    title: "And sometimes, I just play.",
    copy: "Game engines, AI, capture-the-flag forensics. The weekend detours are where most of my favourite what ifs come from.",
    stops: ["naga", "unreal", "hack4gov", "aideas", "sparklabs", "inventi", "concati", "gotg", "tarot", "team"],
  },
};

export const LINE_ORDER: LineId[] = ["listen", "build", "ship", "play"];
/** Lines still in service; the Listen line ended in April 2025. */
export const RUNNING: LineId[] = ["build", "ship", "play"];

const trophy = (event: string) => TROPHIES.find((t) => t.event === event)!;
const work = (name: string) => WORK.find((w) => w.name === name)!;

export const STATIONS: Station[] = [
  { id: "naga", name: "Naga City", sub: "Home", x: 80, y: 440, label: "above", lines: ["listen", "play"], body: "Camarines Sur, Philippines. Where every line starts, and where I'm finishing CS at Ateneo." },
  { id: "bell", name: "Bell Canada", sub: "May 2022", x: 200, y: 440, label: "below", lines: ["listen"], body: "eChat Representative at Quantrics, for Bell Canada. Three years solving strangers' problems in real time." },
  { id: "allstar", name: "4× All-Star", sub: "Top 10%", x: 320, y: 440, label: "above", lines: ["listen"], body: "Four-time Bell All-Star, in the top 10% of performers. The best empathy training a developer can get." },
  { id: "pillars", name: "ThePILLARS", sub: "Jan 2024", x: 470, y: 440, label: "above-left", lines: ["listen", "build", "ship"], body: "ThePILLARS Publication. Joined as a frontend apprentice in January 2024 and became webmaster that August. Change here for the Build and Ship lines." },
  { id: "detken", name: "Detken", sub: "Apr 2025", x: 800, y: 440, label: "above", lines: ["listen", "ship"], body: "DevOps Engineer at Detken Development since April 2025. The Listen line ends here, the same month the support job did." },
  { id: "webmaster", name: "Webmaster", sub: "Aug 2024", x: 635, y: 500, label: "above", lines: ["ship"], body: "The person ThePILLARS calls so the site never goes down. Deployments, security, and automating the boring parts." },
  { id: "offvercel", name: "Off Vercel", sub: "2025", x: 900, y: 440, label: "below", lines: ["ship"], body: "Moved Detken's production off Vercel onto servers we control, and locked the doors properly." },
  { id: "pipelines", name: "Pipelines", sub: "Self-deploying", x: 1000, y: 440, label: "above", lines: ["ship"], body: "Pipelines that test, build and deploy on their own. Launch day should feel like any other day." },
  { id: "fullstack", name: "Full-stack", sub: "Jul 2024", x: 640, y: 320, label: "above", lines: ["build"], body: "Shipping full-stack at ThePILLARS six months after starting as an apprentice. Vue, Nuxt, Express." },
  { id: "merchtrack", name: "MerchTrack", sub: "2,750+ users", x: 750, y: 320, label: "below", lines: ["build"], body: `${work("MerchTrack").tagline} ${work("MerchTrack").story}`, href: work("MerchTrack").href },
  { id: "csguild", name: "CS Guild", sub: "CTO", x: 860, y: 320, label: "above", lines: ["build"], body: work("CS Guild").story, href: work("CS Guild").href },
  { id: "oldst", name: "Old.St Labs", sub: "Jun 2025", x: 970, y: 320, label: "below", lines: ["build"], body: "Software Developer Intern at Old.St Labs. Built digital products with a team that ships fast. Next.js in front, NestJS in back." },
  { id: "unreal", name: "Unreal Engine", sub: "Jun 2024", x: 250, y: 560, label: "below", lines: ["play"], body: clean("Lead Game Programmer intern at ADNU Digital Illustration & Animation. Core gameplay mechanics in Unreal Engine 4 with C++. Yes, games count as software.") },
  { id: "hack4gov", name: "Hack4Gov", sub: "CTF champion", x: 350, y: 560, label: "above", lines: ["play"], body: `Regional Hack4Gov CTF champion in 2024, then ${trophy("Hack4Gov National Finals").place.toLowerCase()} at the national finals.` },
  { id: "aideas", name: "AI.DEAS", sub: "Champion 2025", x: 450, y: 560, label: "below", lines: ["play"], body: `Champion, AI.DEAS for Impact 2025. ${trophy("AI.DEAS for Impact").detail}.` },
  { id: "sparklabs", name: "SparkLabs", sub: "2nd, 2025", x: 550, y: 560, label: "above", lines: ["play"], body: `2nd place at the SparkLabs Hackathon 2025 with ${trophy("SparkLabs Hackathon").detail}.` },
  { id: "inventi", name: "Inventi Asia", sub: "3rd, 2025", x: 650, y: 560, label: "below", lines: ["play"], body: `3rd place at the Inventi Asia Hackathon 2025. ${trophy("Inventi Asia Hackathon").detail}.` },
  { id: "concati", name: "Concati", sub: "Top 5, 2025", x: 750, y: 560, label: "above", lines: ["play"], body: `Top 5 at Concati API Build Labs 2025 with ${trophy("Concati API Build Labs").detail}.` },
  { id: "gotg", name: "Games of the Generals", sub: "Realtime", x: 850, y: 560, label: "below", lines: ["play"], body: `${work("Games of the Generals").tagline} ${work("Games of the Generals").story}`, href: work("Games of the Generals").href },
  { id: "tarot", name: "Daily Tarot", sub: "Messenger bot", x: 950, y: 560, label: "above", lines: ["play"], body: work("Your Daily Tarot").story, href: work("Your Daily Tarot").href },
  { id: "team", name: "Your team", sub: "Next stop", x: 1150, y: 460, label: "above", lines: ["build", "ship", "play"], body: "Every line still running ends here. Projects, roles, collaborations: tell me where we're going.", terminal: true },
];

export const STATION = Object.fromEntries(STATIONS.map((s) => [s.id, s])) as Record<string, Station>;
