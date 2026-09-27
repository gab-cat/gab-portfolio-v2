import {
  CRAFT,
  EMAIL,
  JOURNEY,
  PROJECTS,
  SOCIALS,
  TOOLBOX,
  TROPHIES,
} from "./data";
import type { DesignHead } from "./designs/types";

export const SITE_ORIGIN = "https://gabcat.dev";
export const SITE_NAME = "gabcat.dev";
export const PERSON_NAME = "Gabriel Angelo Catimbang";
export const PERSON_SHORT = "Gabriel Catimbang";
export const PERSON_NICK = "Gab Catimbang";
export const PERSON_IMAGE_PATH = "/portraits/gab-editorial.webp";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export type RouteId = "home" | "contact" | "notFound";

export type RouteSeo = {
  id: RouteId;
  path: string;
  canonical: string;
  title: string;
  description: string;
  ogType: "profile" | "website";
  index: boolean;
};

export const ROUTES: Record<RouteId, RouteSeo> = {
  home: {
    id: "home",
    path: "/",
    canonical: `${SITE_ORIGIN}/`,
    title: "Gabriel Catimbang — I build things for the internet",
    description:
      "Gabriel 'Gab' Catimbang — developer & DevOps engineer from Naga City, Philippines. I build websites people actually use, keep them alive, and win hackathons for fun.",
    ogType: "profile",
    index: true,
  },
  contact: {
    id: "contact",
    path: "/contact",
    canonical: `${SITE_ORIGIN}/contact`,
    title: "Contact Gabriel Catimbang — Start a conversation",
    description:
      "Have a project, role, or idea in mind? Send Gabriel Catimbang a note. Developer and DevOps engineer based in Naga City, Philippines.",
    ogType: "website",
    index: true,
  },
  notFound: {
    id: "notFound",
    path: "/404",
    canonical: `${SITE_ORIGIN}/404`,
    title: "Page not found — gabcat.dev",
    description: "That page isn’t on gabcat.dev. Head home or send a note instead.",
    ogType: "website",
    index: false,
  },
};

export const INDEXABLE_ROUTES: RouteId[] = ["home", "contact"];

export function normalizePath(path: string): string {
  if (!path || path === "/") return "/";
  const trimmed = path.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export function routeFromPath(path: string): RouteId {
  const clean = normalizePath(path);
  if (clean === "/") return "home";
  if (clean === "/contact") return "contact";
  return "notFound";
}

const ID = {
  person: `${SITE_ORIGIN}/#gab`,
  org: `${SITE_ORIGIN}/#org`,
  site: `${SITE_ORIGIN}/#site`,
  work: `${SITE_ORIGIN}/#work`,
};

/** Served at the root by every design (the prerender copies it from the design's brand folder). */
export const LOGO_PATH = "/logo.png";

function personNode() {
  return {
    "@type": "Person",
    "@id": ID.person,
    name: PERSON_NAME,
    givenName: "Gabriel",
    familyName: "Catimbang",
    alternateName: [PERSON_NICK, PERSON_SHORT],
    url: `${SITE_ORIGIN}/`,
    image: {
      "@type": "ImageObject",
      "@id": `${SITE_ORIGIN}${PERSON_IMAGE_PATH}`,
      url: `${SITE_ORIGIN}${PERSON_IMAGE_PATH}`,
      width: 900,
      height: 1200,
    },
    email: `mailto:${EMAIL}`,
    jobTitle: ["DevOps Engineer", "Full-Stack Developer"],
    description: ROUTES.home.description,
    worksFor: [
      { "@type": "Organization", name: "Detken Development" },
      { "@type": "Organization", name: "ThePILLARS Publication" },
    ],
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Ateneo de Naga University",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Naga City",
      addressRegion: "Camarines Sur",
      addressCountry: "PH",
    },
    knowsAbout: [
      "DevOps",
      "Full-Stack Web Development",
      "Cloud Infrastructure",
      "CI/CD",
      "Cybersecurity",
      "React",
      "Next.js",
      "Docker",
      "AWS",
    ],
    award: TROPHIES.map(
      (trophy) => `${trophy.place}, ${trophy.event} ${trophy.year}`,
    ),
    sameAs: SOCIALS.map((social) => social.href),
  };
}

/** The personal brand behind gabcat.dev: logo, contact point and profiles for knowledge panels. */
function organizationNode() {
  return {
    "@type": "Organization",
    "@id": ID.org,
    name: SITE_NAME,
    alternateName: "gabcat",
    url: `${SITE_ORIGIN}/`,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_ORIGIN}${LOGO_PATH}`,
      width: 512,
      height: 512,
    },
    description: `The portfolio and studio name of ${PERSON_SHORT}, a developer and DevOps engineer in Naga City, Philippines.`,
    founder: { "@id": ID.person },
    email: EMAIL,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Naga City",
      addressRegion: "Camarines Sur",
      addressCountry: "PH",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "project inquiries",
      email: EMAIL,
      url: ROUTES.contact.canonical,
    },
    sameAs: SOCIALS.map((social) => social.href),
  };
}

function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": ID.site,
    url: `${SITE_ORIGIN}/`,
    name: SITE_NAME,
    alternateName: PERSON_SHORT,
    description: `Portfolio of ${PERSON_SHORT}, developer and DevOps engineer.`,
    publisher: { "@id": ID.org },
    author: { "@id": ID.person },
    inLanguage: "en",
  };
}

/** Selected work as creative works credited to Gabriel. */
function workNode() {
  return {
    "@type": "ItemList",
    "@id": ID.work,
    name: "Selected work",
    itemListElement: PROJECTS.map((project, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "CreativeWork",
        name: project.name,
        headline: project.tagline,
        description: project.story.replace(/\s*—\s*/g, ". ").replace(/\. ([a-z])/g, (_, c: string) => `. ${c.toUpperCase()}`),
        url: project.href,
        keywords: project.tech.join(", "),
        creator: { "@id": ID.person },
      },
    })),
  };
}

function breadcrumbs(...trail: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/** `modified` (YYYY-MM-DD) comes from the prerender; client-side route changes leave it out. */
export function jsonLdFor(route: RouteId, { modified }: { modified?: string } = {}): Record<string, unknown> {
  const person = personNode();
  const organization = organizationNode();
  const website = websiteNode();
  const dates = modified ? { dateModified: modified } : {};
  if (route === "home") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        person,
        organization,
        website,
        workNode(),
        {
          "@type": "ProfilePage",
          "@id": `${SITE_ORIGIN}/#page`,
          url: `${SITE_ORIGIN}/`,
          name: ROUTES.home.title,
          description: ROUTES.home.description,
          isPartOf: { "@id": ID.site },
          about: { "@id": ID.person },
          mainEntity: { "@id": ID.person },
          hasPart: { "@id": ID.work },
          primaryImageOfPage: { "@id": `${SITE_ORIGIN}${PERSON_IMAGE_PATH}` },
          inLanguage: "en",
          ...dates,
        },
      ],
    };
  }
  if (route === "contact") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        person,
        organization,
        website,
        {
          "@type": "ContactPage",
          "@id": `${SITE_ORIGIN}/contact#page`,
          url: ROUTES.contact.canonical,
          name: ROUTES.contact.title,
          description: ROUTES.contact.description,
          isPartOf: { "@id": ID.site },
          about: { "@id": ID.org },
          mainEntity: { "@id": ID.person },
          breadcrumb: breadcrumbs(
            { name: "Home", url: `${SITE_ORIGIN}/` },
            { name: "Contact", url: ROUTES.contact.canonical },
          ),
          inLanguage: "en",
          ...dates,
        },
      ],
    };
  }
  return {
    "@context": "https://schema.org",
    "@graph": [
      website,
      {
        "@type": "WebPage",
        "@id": `${SITE_ORIGIN}/404#page`,
        url: ROUTES.notFound.canonical,
        name: ROUTES.notFound.title,
        isPartOf: { "@id": ID.site },
        inLanguage: "en",
      },
    ],
  };
}

/** Every page's head. Fonts, colours and icons come from the design being built. */
export function headMarkup(route: RouteId, design: DesignHead, { modified }: { modified?: string } = {}): string {
  const seo = ROUTES[route];
  const { brand, theme } = design;
  const image = `${SITE_ORIGIN}${brand}/og.png`;
  const robots = seo.index
    ? "index, follow, max-image-preview:large"
    : "noindex, nofollow";
  const profileTags =
    route === "home"
      ? `<meta property="profile:first_name" content="Gabriel" />
    <meta property="profile:last_name" content="Catimbang" />`
      : "";
  const preloads = [
    ...design.fontPreloads.map(
      (href) => `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin />`,
    ),
    ...(design.imagePreloads ?? []).map((href) => `<link rel="preload" href="${href}" as="image" />`),
  ].join("\n    ");
  const json = JSON.stringify(jsonLdFor(route, { modified })).replaceAll("<", "\\u003c");
  return `
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeHtml(seo.description)}" />
    <meta name="author" content="${PERSON_NAME}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${seo.canonical}" />
    <link rel="alternate" type="text/plain" href="${SITE_ORIGIN}/llms.txt" title="LLM index" />

    <meta name="theme-color" content="${theme.light}" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="${theme.dark}" media="(prefers-color-scheme: dark)" />

    <meta property="og:type" content="${seo.ogType}" />
    <meta property="og:url" content="${seo.canonical}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:locale" content="en_PH" />
    <meta property="og:title" content="${escapeHtml(seo.title)}" />
    <meta property="og:description" content="${escapeHtml(seo.description)}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />
    <meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />
    <meta property="og:image:alt" content="gabcat.dev — ${PERSON_SHORT}" />
    ${profileTags}

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(seo.title)}" />
    <meta name="twitter:description" content="${escapeHtml(seo.description)}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="gabcat.dev — ${PERSON_SHORT}" />

    <link rel="icon" href="${brand}/favicon.ico" sizes="48x48" />
    <link rel="icon" type="image/svg+xml" href="${brand}/favicon.svg" />
    <link rel="apple-touch-icon" href="${brand}/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    ${preloads}

    <script type="application/ld+json">${json}</script>
  `.trim();
}

export function robotsTxt(): string {
  return `# gabcat.dev — allow search and AI crawlers
User-agent: *
Allow: /

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;
}

export function sitemapXml(lastmod?: string): string {
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
  const urls = INDEXABLE_ROUTES.map((id) => {
    const seo = ROUTES[id];
    const priority = id === "home" ? "1.0" : "0.8";
    return `  <url>
    <loc>${seo.canonical}</loc>${lastmodTag}
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function llmsTxt(): string {
  return `# ${PERSON_SHORT}

> Developer and DevOps engineer from Naga City, Philippines. I build websites people actually use, keep them alive, and win hackathons for fun.

The canonical site is ${SITE_ORIGIN}/. Prefer these files over scraping rendered chrome.

## Pages

- [Home](${SITE_ORIGIN}/): Narrative portfolio — story, what I do, experience, selected work, recognition.
- [Contact](${ROUTES.contact.canonical}): Start a conversation about a project, role, or collaboration.
- [Full text](${SITE_ORIGIN}/llms-full.txt): Complete page copy in one file.

## Identity

- Name: ${PERSON_NAME}
- Also: ${PERSON_NICK}
- Email: ${EMAIL}
- Location: Naga City, Philippines
- Roles: DevOps Engineer, Full-Stack Developer
- GitHub: ${SOCIALS[0]?.href}
- LinkedIn: ${SOCIALS[1]?.href}

## Optional

- [Sitemap](${SITE_ORIGIN}/sitemap.xml)
`;
}

export function llmsFullTxt(intro: string): string {
  const work = PROJECTS.map(
    (project) =>
      `### ${project.name}\n${project.tagline}\n${project.story}\nTech: ${project.tech.join(", ")}\nLink: ${project.href}`,
  ).join("\n\n");
  const jobs = JOURNEY.map(
    (job) =>
      `### ${job.role} — ${job.company}\n${job.period}\n${job.blurb}`,
  ).join("\n\n");
  const wins = TROPHIES.map(
    (trophy) => `- ${trophy.year} · ${trophy.place} · ${trophy.event} — ${trophy.detail}`,
  ).join("\n");
  const tools = TOOLBOX.map(
    (group) => `- ${group.group}: ${group.items.join(", ")}`,
  ).join("\n");
  const craft = CRAFT.map(
    (card, i) =>
      `### ${card.tag} — ${card.title.join(" ")}\n${card.copy}\nTools: ${TOOLBOX[i]?.items.join(", ")}\n${card.proof.join(" ")}`,
  ).join("\n\n");
  return `# ${PERSON_SHORT}

${ROUTES.home.description}

Canonical: ${SITE_ORIGIN}/
Contact: ${ROUTES.contact.canonical}
Email: ${EMAIL}

## Intro

${intro}

## About

Before writing code, Gabriel spent three years on the other side of a support chat at Bell Canada. That listening habit now sits behind full-stack products and the infrastructure that keeps them running.

## What I do

These days, I build it. And keep it alive. Four parts of the job, one habit behind all of them: listen first, then make it work.

${craft}

## Toolbox

${tools}

## Experience

${jobs}

## Selected work

${work}

## Recognition

${wins}

## Contact

${ROUTES.contact.description}
`;
}

export function webManifest({ brand, theme }: DesignHead): string {
  return `${JSON.stringify(
    {
      name: PERSON_SHORT,
      short_name: "gabcat",
      description: ROUTES.home.description,
      start_url: "/",
      scope: "/",
      display: "standalone",
      lang: "en",
      background_color: theme.light,
      theme_color: theme.accent,
      icons: [
        {
          src: `${brand}/favicon.svg`,
          type: "image/svg+xml",
          sizes: "any",
          purpose: "any",
        },
        {
          src: `${brand}/apple-touch-icon.png`,
          type: "image/png",
          sizes: "180x180",
          purpose: "any",
        },
        {
          src: `${brand}/icon-192.png`,
          type: "image/png",
          sizes: "192x192",
          purpose: "any",
        },
        {
          src: `${brand}/icon-512.png`,
          type: "image/png",
          sizes: "512x512",
          purpose: "any",
        },
      ],
    },
    null,
    2,
  )}\n`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
