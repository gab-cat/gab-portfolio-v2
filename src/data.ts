export const EMAIL = "catimbanggabriel@gmail.com";

export const SOCIALS = [
  { label: "GitHub", handle: "@gab-cat", href: "https://github.com/gab-cat" },
  {
    label: "LinkedIn",
    handle: "in/gabrielcatimbang",
    href: "https://linkedin.com/in/gabrielcatimbang",
  },
  {
    label: "Facebook",
    handle: "Gabriel Catimbang",
    href: "https://www.facebook.com/profile.php?id=61581609587748",
  },
] as const;

export const CURRENTLY = [
  "keeping ThePILLARS alive",
  "shipping infra at Detken",
  "finishing CS at Ateneo",
  "leading tech at CS Guild",
  "eyeing the next hackathon",
] as const;

export const MARQUEE_ITEMS = [
  "websites that don't crash",
  "seven hackathon podiums",
  "pipelines that ship themselves",
  "naga city → the internet",
  "coffee-fueled commits",
  "orange & black, always",
  "servers that sleep so you can too",
] as const;

/** News-wire strip announcing the trophy shelf (04) */
export const WINS_TICKER = [
  "2025 champion · ai.deas for impact",
  "2025 2nd place · sparklabs hackathon",
  "2025 3rd place · inventi asia",
  "2025 top 5 · concati api build labs",
  "2024 champion · regional hack4gov ctf",
  "2024 2nd highest scorer · hack4gov nationals",
  "4× bell all-star",
] as const;

/** Poster-scale band that opens the curtain-call panel (06) */
export const HELLO_MARQUEE = [
  "say hello",
  "let's build something",
  "one email away",
] as const;

export const STATS = [
  { value: 7, suffix: "", label: "hackathon podiums", note: "and counting" },
  {
    value: 2750,
    suffix: "+",
    label: "users in week one",
    note: "MerchTrack launch",
  },
  { value: 4, suffix: "×", label: "Bell All-Star", note: "top 10% performer" },
  { value: 3, suffix: "+", label: "years shipping", note: "code & coffee" },
] as const;

export const JOURNEY = [
  {
    period: "Apr 2025 — now",
    role: "DevOps Engineer",
    company: "Detken Development",
    blurb:
      "Moved production off Vercel onto servers we control, wired up pipelines that deploy themselves, and locked the doors properly.",
  },
  {
    period: "Jun — Sep 2025",
    role: "Software Developer Intern",
    company: "Old.St Labs",
    blurb:
      "Built digital products with a team that ships fast — Next.js in front, NestJS in back.",
  },
  {
    period: "Aug 2024 — now",
    role: "Webmaster",
    company: "ThePILLARS Publication",
    blurb:
      "The person they call so the site never goes down. Deployments, security, and automating the boring parts.",
  },
  {
    period: "Jan — Jul 2024",
    role: "Frontend Apprentice → Web Developer",
    company: "ThePILLARS Publication",
    blurb:
      "Started as an apprentice, shipped full-stack within six months. Vue, Nuxt, Express — learned fast, built faster.",
  },
  {
    period: "Jun — Jul 2024",
    role: "Lead Game Programmer (Intern)",
    company: "ADNU Digital Illustration & Animation",
    blurb:
      "Built core gameplay mechanics in Unreal Engine 4 with C++. Yes, games count as software.",
  },
  {
    period: "May 2022 — Apr 2025",
    role: "eChat Representative",
    company: "Quantrics (Bell Canada)",
    blurb:
      "Three years solving strangers' problems in real time. The best empathy training a developer can get.",
  },
] as const;

export const PROJECTS = [
  {
    index: "01",
    name: "MerchTrack",
    tagline: "University merch, minus the chaos.",
    story:
      "An e-commerce platform for campus merchandise. 2,750+ students used it in the first week — the servers held, and so did I.",
    tech: ["Next.js", "PostgreSQL", "Redis"],
    href: "https://github.com/gab-cat",
  },
  {
    index: "02",
    name: "CS Guild",
    tagline: "A digital home for computer studies students.",
    story:
      "The hub where AdNU's computer studies community gathers — events, projects, and people. I lead the tech behind it as CTO.",
    tech: ["Next.js", "NestJS"],
    href: "https://csguild.tech",
  },
  {
    index: "03",
    name: "Games of the Generals",
    tagline: "The classic Filipino strategy game, now online.",
    story:
      "Real-time multiplayer for the board game every Filipino household argues over. Play your friends from anywhere.",
    tech: ["Convex", "Vite", "Realtime"],
    href: "https://github.com/gab-cat",
  },
  {
    index: "04",
    name: "Your Daily Tarot",
    tagline: "Your cards, read before your coffee.",
    story:
      "A Messenger bot that deals you a daily tarot reading, written by AI with suspiciously good intuition.",
    tech: ["Convex", "Gemini", "Messenger API"],
    href: "https://github.com/gab-cat",
  },
] as const;

export const TROPHIES = [
  {
    year: "2025",
    place: "Champion",
    event: "AI.DEAS for Impact",
    detail: "Represented Bicol on the national stage",
  },
  {
    year: "2025",
    place: "2nd Place",
    event: "SparkLabs Hackathon",
    detail: "VeriPHI — identity verification API",
  },
  {
    year: "2025",
    place: "3rd Place",
    event: "Inventi Asia Hackathon",
    detail: "Blockchain-powered property management",
  },
  {
    year: "2025",
    place: "Top 5",
    event: "Concati API Build Labs",
    detail: "Lendr API",
  },
  {
    year: "2024",
    place: "Champion",
    event: "Regional Hack4Gov CTF",
    detail: "Cybersecurity capture-the-flag",
  },
  {
    year: "2024",
    place: "2nd Highest Scorer",
    event: "Hack4Gov National Finals",
    detail: "Nationwide cybersecurity finals",
  },
  {
    year: "2024",
    place: "4× All-Star",
    event: "Bell Canada · Quantrics",
    detail: "Top 10% performer, four times over",
  },
] as const;

export const TOOLBOX = [
  {
    group: "Building",
    items: ["Next.js", "React", "Vue & Nuxt", "NestJS", "TypeScript"],
  },
  {
    group: "Keeping it alive",
    items: ["Docker", "AWS", "GitHub Actions", "Nginx", "Linux"],
  },
  {
    group: "Remembering things",
    items: ["PostgreSQL", "MongoDB", "Redis", "Convex"],
  },
  {
    group: "Curveballs",
    items: ["Unreal Engine", "C++", "Gemini AI", "CTF forensics"],
  },
] as const;
