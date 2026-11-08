/**
 * Every fact on gabcat.dev lives here. Signal, clay, the JSON-LD and the llms
 * files all read from this file, so change a fact here and nowhere else.
 * Sources of truth outside the site: the CV (Google Doc "CV_2026") and
 * LinkedIn (in/gabrielcatimbang). Client and employer projects appear under a
 * codename with `confidential` set: no client names, links or data, and their
 * screenshots in public/work are redacted (names, logos and people blurred).
 */
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

/** Oldest first by start date; the designs sort them for display. A role is current when its period ends in "now". */
export const JOURNEY = [
  {
    period: "May 2022 — Apr 2025",
    role: "eChat Representative",
    company: "Quantrics (Bell Canada)",
    blurb:
      "Three years solving strangers' problems in real time. The best empathy training a developer can get.",
  },
  {
    period: "Jan — Jul 2024",
    role: "Frontend Apprentice → Web Developer",
    company: "ThePILLARS Publication",
    blurb:
      "Started as an apprentice, shipped full-stack within six months. Vue, Nuxt, Express — learned fast, built faster.",
  },
  {
    period: "Apr 2024 — Mar 2026",
    role: "Solutions Architect",
    company: "Merchkins",
    blurb:
      "Designed and ran the platform behind MerchTrack, later Merchkins: 2,750 people in its first week, Docker on AWS Lightsail behind CloudFront, and pipelines that ship on their own.",
  },
  {
    period: "Jun — Jul 2024",
    role: "Lead Game Programmer (Intern)",
    company: "ADNU Digital Illustration & Animation",
    blurb:
      "Built core gameplay mechanics in Unreal Engine 4 with C++. Yes, games count as software.",
  },
  {
    period: "Aug 2024 — Jun 2025",
    role: "Webmaster",
    company: "ThePILLARS Publication",
    blurb:
      "The person they call so the site never goes down. Deployments, security, and automating the boring parts.",
  },
  {
    period: "Apr 2025 — now",
    role: "DevOps Engineer",
    company: "Detken Development",
    blurb:
      "Moved production off Vercel onto servers we control and cut hosting costs by up to 70%. Hardened the Linux boxes, added monitoring, and wired up pipelines that test and deploy themselves.",
  },
  {
    period: "Jun 2025 — Jun 2026",
    role: "Senior Webmaster",
    company: "ThePILLARS Publication",
    blurb:
      "Owned the publication's web architecture and infrastructure decisions, and picked the stack for the long run.",
  },
  {
    period: "Jun — Sep 2025",
    role: "Software Developer Intern",
    company: "Old.St Labs",
    blurb:
      "Built an internal app for the company with Next.js and Convex.",
  },
] as const;

export type ProjectKind = "client" | "product" | "hackathon" | "school" | "tool" | "game";

export const PROJECT_KINDS: Record<ProjectKind, string> = {
  client: "Client work",
  product: "Products",
  hackathon: "Hackathons",
  game: "Games",
  tool: "Tools",
  school: "School",
};

export type Project = {
  /** The URL is /work/<slug>. */
  slug: string;
  name: string;
  year: string;
  kind: ProjectKind;
  /** What Gab did, and with whom. */
  role: string;
  /** One line, shown in lists. */
  tagline: string;
  /** Two sentences, shown on the home page and as the page's description. */
  story: string;
  /** What Gab built, one point each. */
  built: readonly string[];
  /** Outcomes worth a number or a name: users, awards, scale. */
  results?: readonly string[];
  tech: readonly string[];
  links: { live?: string; repo?: string; post?: string };
  /** Anything a visitor should know before clicking (a paused server, a private repo). */
  status?: string;
  /** Shown in the home page's Work chapter. */
  featured?: boolean;
  /** Client or employer work under a codename. Says what kind of client it was, never who. */
  confidential?: string;
  /** A 1280x800 screenshot in public/work. Client shots are redacted before they get here. */
  image?: string;
};

/** Newest first within each year. Every entry gets its own page at /work/<slug>. */
export const PROJECTS: readonly Project[] = [
  {
    slug: "project-relay",
    name: "Project Relay",
    year: "2026",
    kind: "client",
    confidential: "A remote-staffing agency",
    role: "Sole engineer, from the first commit to production",
    tagline: "An applicant tracking system that screens every applicant.",
    story:
      "A recruiting platform for a remote-staffing agency: public apply links, AI screening of every applicant, a live pipeline board and a portal for the agency's own clients. I was the only engineer, end to end.",
    built: [
      "Public apply links, with AI screening of every applicant's resume and intro video against a score bar, using OpenAI and Gemini.",
      "A live, multiplayer pipeline board from applied to placed, with interviews, assessments and offers.",
      "A client portal where the agency's customers review shortlists and give feedback.",
      "A data model of 145 tables on Convex, with background workflows, migrations and transactional email.",
      "A backfill and sync of the agency's history from its old tools, and a talent-pool search rebuilt so filters stay fast at that size.",
      "An in-app assistant that answers questions about the pipeline.",
      "Media on AWS S3 and CloudFront, error tracking in Sentry, analytics in PostHog, and end-to-end tests in Playwright.",
    ],
    results: ["About 280,000 applications in the system", "1,201 commits from April to November 2026, all mine"],
    tech: ["React", "Vite", "Convex", "OpenAI", "Gemini", "AWS", "Sentry", "Playwright"],
    links: {},
    image: "/work/project-relay.webp",
    featured: true,
  },
  {
    slug: "project-pulse",
    name: "Project Pulse",
    year: "2026",
    kind: "client",
    confidential: "A SaaS startup",
    role: "Led product development and shipped features end to end",
    tagline: "Async standups in thirty seconds.",
    story:
      "A team app that replaces the daily standup: everyone posts what they did, what's next and what's blocking them, and managers read it before their first coffee. I led product development and shipped it end to end.",
    built: [
      "Updates, a team feed, goals and blockers, with reports over any date range.",
      "A daily AI briefing for managers, written with OpenAI.",
      "Voice-note asks, presence, and a live demo anyone can try without signing up.",
      "Billing and trials on Stripe, sign-in on WorkOS, and an operations console for the team.",
      "Deploys on Cloudflare Workers with files on R2, and product analytics in PostHog.",
    ],
    results: ["221 commits from March to November 2026"],
    tech: ["TanStack Start", "Convex", "Cloudflare Workers", "Stripe", "WorkOS", "OpenAI", "PostHog"],
    links: {},
    image: "/work/project-pulse.webp",
    featured: true,
  },
  {
    slug: "project-meridian",
    name: "Project Meridian",
    year: "2026",
    kind: "client",
    confidential: "A US property-data company",
    role: "Engineer on data pipelines, portals and security testing",
    tagline: "Property disclosure data for California real estate.",
    story:
      "A geocoding and property-disclosure platform for California homes. I built tax-data scrapers, worked on the customer site and portals, validated the cost and property models, and ran security testing on the infrastructure.",
    built: [
      "Special-tax and county tax-bill scrapers across California counties, synced into the production database on AWS RDS.",
      "Parts of the public site and customer portal: report ordering, Stripe checkout, a shared-report viewer and QR-coded public reports.",
      "Order emails and a public report API in the FastAPI admin console.",
      "A validation of the construction-cost engine against 5,466 Southern California homes.",
      "A machine-learning model that predicts a property's size and stories, tested on 168 held-out counties.",
      "Vulnerability assessments, penetration testing and automated infrastructure checks.",
      "An EPA site layer and residential filtering on the hazard-analysis map.",
    ],
    tech: ["Python", "FastAPI", "Docker", "AWS", "PostGIS", "React", "Next.js", "Stripe"],
    links: {},
    image: "/work/project-meridian.webp",
  },
  {
    slug: "project-lineup",
    name: "Project Lineup",
    year: "2026",
    kind: "client",
    confidential: "A remote-staffing agency",
    role: "Sole engineer",
    tagline: "A marketplace of pre-vetted remote candidates.",
    story:
      "A public marketplace where companies browse pre-vetted remote candidates, watch a short intro video and request an interview. Candidates arrive from Project Relay through a signed API.",
    built: [
      "Privacy-safe public profiles with shareable links and generated social images.",
      "Resume parsing with OCR and structured AI output.",
      "AI checks on the quality of each intro video's photo and framing, with ffmpeg.",
      "Private spaces for individual clients, each with its own shortlist and links.",
      "Lead capture and a sales portal for the agency's team.",
    ],
    tech: ["TanStack Start", "Cloudflare", "Convex", "Clerk", "AWS S3", "ffmpeg"],
    links: {},
    image: "/work/project-lineup.webp",
  },
  {
    slug: "project-outreach",
    name: "Project Outreach",
    year: "2026",
    kind: "client",
    confidential: "A remote-staffing agency",
    role: "Sole engineer",
    tagline: "An AI agent that finds employers and books interviews.",
    story:
      "An outbound engine that finds companies hiring for roles the agency can fill, emails each one a single vetted candidate, then lets an AI agent answer the replies and book the interview.",
    built: [
      "A daily job search, with company enrichment and email verification.",
      "Matching against the candidate pool in Project Relay, with a person approving each send.",
      "Paced sending through the Gmail API across rotating mailboxes.",
      "One model classifies each reply, another drafts the answer with calendar tools, and a guard checks it before it goes.",
      "Google Calendar invites with Meet links, and a follow-up after each interview.",
    ],
    tech: ["TanStack Start", "Convex", "Clerk", "AI SDK", "Gmail API", "Google Calendar"],
    links: {},
  },
  {
    slug: "project-beacon",
    name: "Project Beacon",
    year: "2026",
    kind: "client",
    confidential: "A remote-staffing agency",
    role: "Redesign and rebuild",
    tagline: "A marketing site for a remote-hiring agency.",
    story:
      "The agency's public site, redesigned and rebuilt from the ground up, then deployed and cut over to the live domain.",
    built: [
      "A new design and build in TanStack Start, with a Three.js scene.",
      "Pages for clients and for candidates, each leading to its own sign-up.",
      "The deployment and the switch-over to the agency's live domain.",
    ],
    tech: ["TanStack Start", "Three.js", "Supabase"],
    links: {},
    image: "/work/project-beacon.webp",
  },
  {
    slug: "project-thread",
    name: "Project Thread",
    year: "2026",
    kind: "client",
    confidential: "An international children's clothing brand",
    role: "Store build and launch",
    tagline: "A Shopify store for a children's clothing brand.",
    story:
      "A Shopify store built from the brand's price sheet: the full catalogue, sizes and stock, policies and launch content, ready to open.",
    built: [
      "A catalogue import from the brand's price sheet: 84 products and 356 size variants.",
      "Stock levels applied across every product and size.",
      "Theme setup, store policies and product copy.",
      "Short launch videos for social.",
    ],
    tech: ["Shopify", "CSV imports", "Theme customization"],
    links: {},
  },
  {
    slug: "project-tollgate",
    name: "Project Tollgate",
    year: "2026",
    kind: "client",
    confidential: "A Philippine college",
    role: "Sole engineer, prototype",
    tagline: "A self-service payment kiosk for a college.",
    story:
      "A kiosk where students tap their ID, see what they owe and pay tuition, fees and bookstore items by QR, or print a cash slip the cashier scans.",
    built: [
      "Student sign-in by RFID card or student number, with server-side lockout.",
      "QR Ph payments through PayMongo, and cash slips the cashier scans to confirm.",
      "A thermal-printer service on a Raspberry Pi for receipts.",
      "A staff portal, print views, and a unit-tested ledger for installments and limits.",
      "End-to-end tests in Playwright.",
    ],
    tech: ["TanStack Start", "Convex", "Clerk", "PayMongo", "Raspberry Pi", "Playwright"],
    links: {},
    status: "A working prototype.",
    image: "/work/project-tollgate.webp",
  },
  {
    slug: "project-bulletin",
    name: "Project Bulletin",
    year: "2026",
    kind: "client",
    confidential: "A regional news outlet",
    role: "Back end and mobile app",
    tagline: "A real-time news app with AI summaries.",
    story:
      "A news app for a regional outlet: stories arrive in real time, each with a short AI summary, on a mobile app readers install.",
    built: [
      "A FastAPI back end with layered services and media storage in GridFS.",
      "Story summaries written by Gemini.",
      "The Expo and React Native app readers use.",
    ],
    tech: ["FastAPI", "MongoDB", "Gemini", "Expo", "React Native"],
    links: {},
  },
  {
    slug: "project-keystone",
    name: "Project Keystone",
    year: "2025 – 2026",
    kind: "client",
    confidential: "A creator-content platform",
    role: "DevOps engineer",
    tagline: "Production moved off Vercel, for up to 70% less.",
    story:
      "The production infrastructure for a creator-content platform: moved from Vercel to servers we control, hardened, monitored, and deployed by pipelines with a way back.",
    built: [
      "The migration from Vercel to a self-hosted VPS, with testing and rollback plans so the switch had almost no downtime.",
      "GitHub Actions workflows for production deploys and one-step rollbacks.",
      "Linux hardening, access controls, package updates and uptime monitoring.",
      "Logging for first loads and errors in production.",
    ],
    results: ["Hosting costs cut by up to 70%"],
    tech: ["Linux", "Nginx", "Docker", "GitHub Actions", "Monitoring"],
    links: {},
  },
  {
    slug: "merchtrack",
    name: "MerchTrack",
    year: "2025",
    kind: "product",
    role: "Solutions architect, led a team of five",
    tagline: "University merch, minus the chaos.",
    story:
      "An online store where student organizations sell their merch, take payments and hand out orders. It launched on March 25, 2025 and had about 2,750 people in its first week. The servers held, and so did I.",
    built: [
      "The storefront, checkout and order tracking in Next.js, with Prisma on PostgreSQL and Redis.",
      "Tools for organizations to track orders, payments and fulfillment in one place.",
      "Docker on AWS Lightsail behind CloudFront, with GitHub Actions pipelines that test and deploy every change.",
      "Sentry error tracking that caught checkout validation errors in production.",
      "A companion mobile app in Expo and React Native.",
      "The multi-tenant rebuild, Merchkins, on Next.js 16, Convex and Clerk, so any organization can open its own store.",
    ],
    results: ["About 2,750 unique users in the first week", "202 commits across the main repo"],
    tech: ["Next.js", "PostgreSQL", "Prisma", "Redis", "Docker", "AWS", "Sentry", "Expo"],
    links: { repo: "https://github.com/gab-cat/merchtrack" },
    status: "The store is offline while it moves to the Merchkins name. The code is public.",
    featured: true,
  },
  {
    slug: "games-of-the-generals",
    name: "Games of the Generals",
    year: "2025 – 2026",
    kind: "game",
    role: "Solo",
    tagline: "The classic Filipino strategy game, now online.",
    story:
      "Real-time multiplayer for the board game every Filipino household argues over. Play friends from anywhere, or a computer opponent when nobody is around.",
    built: [
      "Real-time matches on Convex, so every move lands on both boards at once.",
      "Computer opponents, spectating, tournaments, achievements and in-game chat.",
      "Sign-in with Convex Auth and email through Resend.",
      "An installable app (PWA) built with React 19, Vite and TanStack Router.",
    ],
    results: ["Top 6 finalist, DOST Esports Game Dev Challenge 2.0", "205 commits, all solo"],
    tech: ["React", "Vite", "TanStack Router", "Convex", "Resend", "PWA"],
    links: {
      live: "https://www.generalsonline.app",
      repo: "https://github.com/gab-cat/games-of-the-generals",
    },
    status: "The live game is paused because hosting costs more than it earns. The code is open source.",
    image: "/work/games-of-the-generals.webp",
    featured: true,
  },
  {
    slug: "stormwatch",
    name: "Stormwatch",
    year: "2025",
    kind: "hackathon",
    role: "Led cloud architecture and system development, team project",
    tagline: "Flood warnings for Naga City, before the water rises.",
    story:
      "A flood monitoring and prediction dashboard for Naga City, built for severe weather. It won AI.DEAS for Impact 2025 and a ₱100,000 seed grant.",
    built: [
      "The flood monitoring dashboard in React and Vite, with live data on Convex.",
      "City maps on Leaflet, with Clerk sign-in.",
      "The cloud architecture behind the prototype that went through every judging round.",
    ],
    results: [
      "Champion, AI.DEAS for Impact 2025, representing Bicol at the national Philippine Startup Challenge",
      "1st runner-up, Idea2Startup+ Bloomberg Challenge, with a ₱100,000 seed grant",
      "3rd runner-up, Philippine Startup Challenge X, Region V",
    ],
    tech: ["React", "Vite", "Convex", "Clerk", "Leaflet"],
    links: {
      live: "https://stormwatch.app",
      repo: "https://github.com/gab-cat/stormwatch-dashboard",
    },
    featured: true,
  },
  {
    slug: "project-bedrock",
    name: "Project Bedrock",
    year: "2026",
    kind: "product",
    role: "Solo",
    tagline: "Property due diligence for Naga City in 30 seconds.",
    story:
      "Drop a pin anywhere in Naga City and get a property report: flood, earthquake and landslide risk, terrain, access and an AI-written summary, ready as a PDF.",
    built: [
      "A spatial database on PostgreSQL and PostGIS, hosted on AWS Lightsail and queried through Prisma.",
      "Data pipelines that pull UP NOAH 10 m LiDAR flood depths, PHIVOLCS fault lines, USGS earthquakes since 1970 and OpenStreetMap.",
      "A map on MapLibre where the pin and the report stay in step.",
      "A summary written by Gemini 2.5 Flash, and a downloadable PDF report.",
      "A free snapshot for everyone, with the full report behind Clerk sign-in.",
    ],
    tech: ["TanStack Start", "PostGIS", "Prisma", "AWS Lightsail", "MapLibre", "Gemini", "Clerk"],
    links: { live: "https://project-bedrock-wheat.vercel.app" },
    status: "The code is private.",
    image: "/work/project-bedrock.webp",
    featured: true,
  },
  {
    slug: "cs-guild",
    name: "CS Guild",
    year: "2025",
    kind: "school",
    role: "Chief technology officer, built the platform",
    tagline: "A digital home for computer studies students.",
    story:
      "The hub where Ateneo de Naga's computer studies community gathers: events, projects, articles and an apprenticeship program. I led the tech behind it as CTO.",
    built: [
      "The web app in Next.js 15 with Tailwind, TanStack Query and Zustand.",
      "A NestJS API on PostgreSQL with Prisma, CQRS, Socket.IO and Google sign-in.",
      "Event sign-ups, project sharing, a publishing space for student articles and an apprenticeship application portal.",
      "RFID check-in for the guild's facility.",
    ],
    tech: ["Next.js", "NestJS", "PostgreSQL", "Prisma", "Socket.IO", "Docker"],
    links: {
      repo: "https://github.com/gab-cat/csguild-client",
    },
    status: "csguild.tech is offline since the term ended. The code is public.",
  },
  {
    slug: "your-daily-tarot",
    name: "Your Daily Tarot",
    year: "2025",
    kind: "product",
    role: "Solo, built in a day",
    tagline: "Your cards, read before your coffee.",
    story:
      "A Messenger bot that deals you a daily tarot reading. Friends kept asking me for readings, so I built one that answers at any hour.",
    built: [
      "A Facebook page with a Messenger bot that deals cards and answers questions.",
      "Readings written by Gemini, with the conversation kept on Convex.",
      "Mock payments through Xendit to try out paid readings.",
    ],
    tech: ["Convex", "Gemini", "Messenger API", "Xendit", "Bun"],
    links: {
      live: "https://www.facebook.com/profile.php?id=61581609587748",
      repo: "https://github.com/gab-cat/tarot-bot",
    },
    image: "/work/your-daily-tarot.webp",
  },
  {
    slug: "neon-district",
    name: "Neon District",
    year: "2026",
    kind: "game",
    role: "Solo",
    tagline: "Run a nightclub in your browser.",
    story:
      "An isometric club-management game: build the floor, spin DJ sets, keep the bar stocked and the crowd dancing. It runs offline with original art and a soundtrack.",
    built: [
      "An isometric builder on PixiJS 8 with 108 items that rotate, move and sell back.",
      "Guests who pay, drink, dance, book tables and start fights, plus staff you hire.",
      "70 levels, 22 achievement families and a city map with 18 plots.",
      "A music system on Tone.js that mixes 28 recorded tracks across 7 genres.",
    ],
    tech: ["PixiJS", "React", "Zustand", "Tone.js", "Vitest", "Playwright"],
    links: {},
    status: "Private for now.",
  },
  {
    slug: "voice-notes",
    name: "Voice Notes",
    year: "2026",
    kind: "tool",
    role: "Solo",
    tagline: "WhatsApp voice notes, read instead of played.",
    story:
      "A small floating macOS window that transcribes a WhatsApp voice note within two seconds of downloading it, then gives you a summary, a to-do list and a reply draft.",
    built: [
      "A menu-bar app on Electrobun and Bun that watches Downloads for new voice notes.",
      "Transcripts with an English translation when the note isn't in English.",
      "A summary, a to-do list and a chat about the note, with one-click reply drafts.",
    ],
    tech: ["Electrobun", "Bun", "React", "Vite", "Tailwind"],
    links: {
      live: "https://gab-cat.github.io/voice-notes/",
      repo: "https://github.com/gab-cat/voice-notes",
    },
    image: "/work/voice-notes.webp",
  },
  {
    slug: "focus-timer",
    name: "Focus Timer",
    year: "2026",
    kind: "tool",
    role: "Solo",
    tagline: "Keeps your Mac awake while you work.",
    story:
      "A compact macOS app that keeps the computer awake during focused work, long tasks, calls and presentations, and shows where the hours went.",
    built: [
      "A desktop window on Electrobun with a session timer and activity status.",
      "Keep-awake through caffeinate, with an option to block sleep even with the lid closed and a safe restore after a crash.",
      "An insights view with a heatmap of focus sessions.",
    ],
    tech: ["Electrobun", "Bun", "React", "Vite", "Tailwind"],
    links: {
      live: "https://gab-cat.github.io/focus-timer/",
      repo: "https://github.com/gab-cat/focus-timer",
    },
    image: "/work/focus-timer.webp",
  },
  {
    slug: "frontier-analytics",
    name: "FrontierAnalytics",
    year: "2026",
    kind: "product",
    role: "Solo",
    tagline: "Climate risk and property data for the Philippines.",
    story:
      "The home for my climate and property work in the Philippines, starting with Naga City. The landing page is a procedural 3D world drawn in the browser, with no downloaded models.",
    built: [
      "A procedural 3D landing world in React Three Fiber.",
      "TanStack Start for the site, prerendered for speed.",
    ],
    tech: ["TanStack Start", "React Three Fiber", "Three.js"],
    links: { live: "https://frontieranalytics.dev" },
    status: "The code is private.",
    image: "/work/frontier-analytics.webp",
  },
  {
    slug: "margin",
    name: "Margin",
    year: "2026",
    kind: "tool",
    role: "Solo",
    tagline: "Turn your readings into flashcards and quizzes.",
    story:
      "A study tool that takes your PDFs, breaks them into knowledge cards and writes quizzes from them, then shows what you still miss.",
    built: [
      "Notebooks of source PDFs, preprocessed into knowledge cards.",
      "Quiz generation with the Anthropic SDK, tuned to spend as few tokens as possible.",
      "Results and analytics per notebook.",
    ],
    tech: ["TanStack Start", "Convex", "Clerk", "Anthropic"],
    links: {},
    status: "Private while I rework it.",
  },
  {
    slug: "zenith",
    name: "Zenith",
    year: "2025",
    kind: "hackathon",
    role: "Team project",
    tagline: "A fitness tracker that kids and parents share.",
    story:
      "An AI fitness tracker where you log meals and activity by chat or photo. When the hackathon's twist asked us to design for kids, we made the parent log the data, so tracking becomes a conversation.",
    built: [
      "A mobile app in Expo and React Native with Clerk sign-in and Convex.",
      "Meal and activity logging from chat and photos, read by Gemini.",
      "A daily activity timeline for parent and child.",
    ],
    results: ["Most Adaptive Award, Cold Start Hackathon 2025 by Old.St Labs"],
    tech: ["Expo", "React Native", "Convex", "Clerk", "Gemini"],
    links: { repo: "https://github.com/gab-cat/cold-start" },
  },
  {
    slug: "veriphi",
    name: "VeriPHI",
    year: "2025",
    kind: "hackathon",
    role: "Team of three",
    tagline: "An API that checks a business is real.",
    story:
      "An API that checks whether a business is who it says it is, using what the web knows about it. It took 2nd place at the SparkLabs Hackathon.",
    built: [
      "The verification flow on Convex, with Gemini reading the evidence.",
      "Web research through Browserbase and Firecrawl.",
      "A React and Vite front end to run and review checks.",
    ],
    results: ["2nd place, SparkLabs Hackathon Challenge 2025"],
    tech: ["Convex", "Gemini", "Browserbase", "Firecrawl", "React", "Vite"],
    links: { live: "https://veriphi.vercel.app" },
    status: "The code is private.",
    image: "/work/veriphi.webp",
  },
  {
    slug: "lendr-api",
    name: "Lendr API",
    year: "2025",
    kind: "hackathon",
    role: "Team project, API design",
    tagline: "Smart-contract lending behind a plain API.",
    story:
      "An API that hides smart contracts and wallets behind ordinary endpoints, so business systems can use them without blockchain code. It reached the Top 5 at Concati API Build Labs in Cebu.",
    built: [
      "The API design that wraps wallet and smart-contract calls in plain requests, for use inside existing business systems.",
    ],
    results: ["Top 5 finalist, Concati API Build Labs 2025 (917 Ventures)"],
    tech: ["REST API", "Smart contracts", "Wallets"],
    links: {},
  },
  {
    slug: "smart-property",
    name: "Smart property manager",
    year: "2025",
    kind: "hackathon",
    role: "Team of two",
    tagline: "Property management on smart contracts.",
    story:
      "A property management system driven by smart contracts, built for a smarter-cities theme. It placed 3rd of 54 teams at the Inventi Asia Hackathon.",
    built: [
      "A Next.js and Convex web app with Clerk sign-in.",
      "The smart-contract design behind the property records.",
      "Native mobile clients with push notifications.",
    ],
    results: ["3rd place of 54 teams, Inventi Asia Hackathon Challenge 2025"],
    tech: ["Next.js", "Convex", "Clerk", "Smart contracts", "Kotlin", "Swift"],
    links: { live: "https://inventi-hackathon.vercel.app" },
    status: "The code is private.",
  },
  {
    slug: "prits",
    name: "PRITS",
    year: "2024",
    kind: "school",
    role: "Back end and mobile app, team project",
    tagline: "Nursing charts written while the nurse talks.",
    story:
      "The Patient Rounds Innovation and Transcription System: a mobile app that turns a nurse's speech and handwriting into typed charts during patient rounds.",
    built: [
      "An Express API on MongoDB with Mongoose, Socket.IO for live updates and email through Nodemailer.",
      "The Expo and React Native app that nurses use on rounds.",
      "Speech-to-text and handwriting-to-text in the charting flow.",
    ],
    tech: ["Express", "MongoDB", "Socket.IO", "Expo", "React Native"],
    links: {},
    status: "A school project; the code is private.",
  },
  {
    slug: "gabcat-dev",
    name: "gabcat.dev",
    year: "2026",
    kind: "product",
    role: "Solo",
    tagline: "This site.",
    story:
      "A portfolio drawn by one particle field that re-forms for every chapter. Raw WebGL2, prerendered pages and a contact form that survives its own database going down.",
    built: [
      "A WebGL2 particle field with nine figures, from a black hole to a radar sweep, in about 8 kB of drawing code.",
      "Prerendered pages with structured data and llms.txt, scoring 97 or more on mobile Lighthouse.",
      "A contact function on Vercel with rate limits that fall back to memory when Redis is away.",
    ],
    tech: ["React", "Vite", "WebGL2", "Vercel", "Redis"],
    links: { live: "https://gabcat.dev", repo: "https://github.com/gab-cat/gab-portfolio-v2" },
  },
];

/** The main link for a project: where it runs, else its code, else a post about it. */
export function primaryLink(project: Project): string | undefined {
  return project.links.live ?? project.links.repo ?? project.links.post;
}

export const FEATURED_PROJECTS = PROJECTS.filter((project) => project.featured);

/** Honors and awards, newest first. */
export const TROPHIES = [
  {
    year: "2025",
    place: "2nd highest scorer",
    event: "Hack4Gov National Finals",
    detail: "Nationwide cybersecurity finals, DICT CERT-PH",
  },
  {
    year: "2025",
    place: "1st runner-up",
    event: "Hack4Gov CTF, Region V",
    detail: "Team OJO Gang; 2nd runner-up individually",
  },
  {
    year: "2025",
    place: "3rd runner-up",
    event: "Philippine Startup Challenge X, Region V",
    detail: "Stormwatch, flood warnings for Naga City",
  },
  {
    year: "2025",
    place: "Most Adaptive",
    event: "Cold Start Hackathon",
    detail: "Zenith, a fitness tracker for parents and kids",
  },
  {
    year: "2025",
    place: "Top 6",
    event: "DOST Esports Game Dev Challenge 2.0",
    detail: "Games of the Generals, national finals",
  },
  {
    year: "2025",
    place: "2nd place",
    event: "SparkLabs Hackathon",
    detail: "VeriPHI, a business verification API",
  },
  {
    year: "2025",
    place: "Top 5",
    event: "Concati API Build Labs",
    detail: "Lendr API, smart contracts behind plain endpoints",
  },
  {
    year: "2025",
    place: "3rd place",
    event: "Inventi Asia Hackathon",
    detail: "Smart-contract property management, of 54 teams",
  },
  {
    year: "2025",
    place: "Champion",
    event: "AI.DEAS for Impact",
    detail: "Stormwatch; represented Bicol on the national stage",
  },
  {
    year: "2025",
    place: "1st runner-up",
    event: "Idea2Startup+ Bloomberg Challenge",
    detail: "Stormwatch; a ₱100,000 seed grant",
  },
  {
    year: "2025",
    place: "5th place",
    event: "SEEN 2025 CTF",
    detail: "Of 30+ teams, GDG on Campus PUP",
  },
  {
    year: "2024",
    place: "Champion",
    event: "Regional HackForGov CTF",
    detail: "Region V cybersecurity capture-the-flag",
  },
  {
    year: "2024",
    place: "4× All-Star",
    event: "Bell Canada · Quantrics",
    detail: "Top 10% performer, four periods running (2022 – 2024)",
  },
] as const;

/** Each group pairs with the CRAFT card at the same index. Skills from client work count here even though those projects stay private. */
export const TOOLBOX = [
  {
    group: "Building",
    items: [
      "TypeScript",
      "React",
      "Next.js",
      "TanStack Start",
      "Vue & Nuxt",
      "NestJS",
      "Expo & React Native",
      "Shopify storefronts",
      "macOS apps (Electrobun)",
    ],
  },
  {
    group: "Keeping it alive",
    items: [
      "Docker",
      "Linux & Nginx",
      "AWS",
      "Cloudflare",
      "Vercel",
      "GitHub Actions",
      "Sentry",
      "Security testing",
    ],
  },
  {
    group: "Remembering things",
    items: ["PostgreSQL & PostGIS", "Convex", "Prisma", "MongoDB", "Redis", "S3"],
  },
  {
    group: "Curveballs",
    items: [
      "AI (OpenAI, Gemini, Claude)",
      "Maps & GIS",
      "Payments (Stripe, PayMongo)",
      "Unreal Engine & C++",
      "CTF forensics",
    ],
  },
] as const;

/** What I do: the four cards under the Story, one per part of the job. */
export const CRAFT = [
  {
    tag: "Build",
    title: ["It starts on a screen.", "It has to feel right."],
    copy: "I build the part people actually touch, front to back. Fast pages, calm interfaces, and code the next person can read without calling me.",
    proof: ["MerchTrack", "had 2,750+ students in week one. The servers held, and so did I."],
  },
  {
    tag: "Ship",
    title: ["Launch day should feel", "like any other day."],
    copy: "I like my deploys boring. So I wire up pipelines that test, build and ship on their own, on servers I can still reason about at 3 a.m.",
    proof: ["Detken", "moved production off Vercel onto servers we control, for up to 70% less."],
  },
  {
    tag: "Store",
    title: ["Every app is", "a memory, really."],
    copy: "Somewhere, it has to remember who you are and what you did. I pick the right place to keep it, and shape it so it still makes sense a year from now.",
    proof: ["Games of the Generals", "keeps every move in sync, for every player."],
  },
  {
    tag: "Play",
    title: ["And sometimes,", "I just play."],
    copy: "Game engines, AI, capture-the-flag forensics. The weekend detours are where most of my favourite what ifs come from.",
    proof: ["Hack4Gov", "2nd highest scorer at the 2025 national finals. Yes, it counts."],
  },
] as const;

export const EDUCATION = [
  {
    school: "Ateneo de Naga University",
    degree: "BS Computer Science, cum laude",
    period: "Aug 2022 — May 2026",
    detail: "Bronze Achievement Award. Metrobank Foundation ACCESS 4 scholar for all four years.",
  },
] as const;

/** Leadership, volunteering and talks. */
export const COMMUNITY = [
  {
    period: "2026",
    role: "Speaker",
    org: "NICE Talks, Episode 1",
    detail: "On opening the terminal before you feel ready.",
  },
  {
    period: "Jun — Dec 2025",
    role: "Chief Technology Officer",
    org: "CS Guild, Ateneo de Naga",
    detail: "Ran the guild's tech and its apprenticeship program, and built its platform.",
  },
  {
    period: "Aug — Oct 2025",
    role: "Organizing committee",
    org: "BYTE 2025, Ateneo ICT Center",
    detail: "One of Bicol's largest tech expos, with 450+ attendees.",
  },
] as const;

export const CERTIFICATIONS = [
  { name: "GitHub Foundations", issuer: "GitHub", year: "2024" },
  { name: "MongoDB Node.js Developer Path", issuer: "MongoDB", year: "2024" },
  { name: "Master Nuxt 3, Full-Stack Complete Guide", issuer: "Udemy", year: "2024" },
  { name: "Unreal Engine 5: Soulslike Melee Combat System", issuer: "Udemy", year: "2024" },
  { name: "Docker for the Absolute Beginner", issuer: "Udemy", year: "2024" },
] as const;
