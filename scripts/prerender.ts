/**
 * Post-build prerender: renders the React app to static HTML and injects it
 * into dist/index.html, so the deployed page is full content — not an empty
 * shell waiting for JS. Run via `bun run build`.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const dist = resolve(import.meta.dirname, "../dist/index.html");
// Built by `vite build --ssr` immediately before this script runs.
const { render } = await import("../dist-server/entry-server.js");

const template = readFileSync(dist, "utf8");
const marker = '<div id="root"></div>';
if (!template.includes(marker)) {
  throw new Error("prerender: could not find root marker in dist/index.html");
}

const html = template.replace(marker, `<div id="root">${render()}</div>`);
writeFileSync(dist, html);

const kb = (html.length / 1024).toFixed(1);
console.log(`prerendered dist/index.html (${kb} kB)`);

const contactTitle = "Contact Gabriel Catimbang — Start a conversation";
const contactDescription = "Have a project, role, or idea in mind? Send Gabriel Catimbang a note. Developer and DevOps engineer based in Naga City, Philippines.";
const contactHtml = template
  .replace(marker, `<div id="root">${render("/contact")}</div>`)
  .replace(/<title>.*?<\/title>/, `<title>${contactTitle}</title>`)
  .replace(/(<meta\s+(?:name|property)="(?:description|og:description|twitter:description)"\s+content=")[^"]*(")/g, `$1${contactDescription}$2`)
  .replace(/(<meta\s+(?:name|property)="(?:og:title|twitter:title)"\s+content=")[^"]*(")/g, `$1${contactTitle}$2`)
  .replace('rel="canonical" href="https://gabcat.dev/"', 'rel="canonical" href="https://gabcat.dev/contact"')
  .replace('property="og:url" content="https://gabcat.dev/"', 'property="og:url" content="https://gabcat.dev/contact"')
  .replace('property="og:type" content="profile"', 'property="og:type" content="website"')
  .replace('</head>', `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "ContactPage", url: "https://gabcat.dev/contact", name: contactTitle, mainEntity: { "@id": "https://gabcat.dev/#gab" } })}</script></head>`);
mkdirSync(resolve(import.meta.dirname, "../dist/contact"), { recursive: true });
writeFileSync(resolve(import.meta.dirname, "../dist/contact/index.html"), contactHtml);
console.log("prerendered dist/contact/index.html");
