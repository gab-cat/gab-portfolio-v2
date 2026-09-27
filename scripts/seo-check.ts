/**
 * Production checks for prerendered HTML, crawler files, and payload budgets.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { resolve } from "node:path";
import { ROUTES, SITE_ORIGIN, type RouteId } from "../src/seo.ts";
import { pickDesign } from "../src/designs/live.ts";
import type { DesignHead } from "../src/designs/types.ts";

// Check against the same design the build used.
const design = pickDesign(process.env.DESIGN);
const { head } = (await import(`../src/designs/${design}/meta.ts`)) as { head: DesignHead };
const brand = head.brand.replace(/^\//, "");

const dist = resolve(import.meta.dirname, "../dist");
const errors: string[] = [];

function fail(message: string) {
  errors.push(message);
}

function read(path: string) {
  const file = resolve(dist, path);
  if (!existsSync(file)) {
    fail(`missing ${path}`);
    return "";
  }
  return readFileSync(file, "utf8");
}

function count(html: string, tag: string) {
  return [...html.matchAll(new RegExp(`<${tag}\\b`, "gi"))].length;
}

function checkPage(file: string, route: RouteId) {
  const html = read(file);
  if (!html) return;
  const seo = ROUTES[route];
  if (!html.includes(`<title>${seo.title}</title>`)) fail(`${file}: title mismatch`);
  if (!html.includes(`rel="canonical" href="${seo.canonical}"`)) fail(`${file}: canonical mismatch`);
  if (count(html, "h1") !== 1) fail(`${file}: expected one h1, found ${count(html, "h1")}`);
  const jsonBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (jsonBlocks.length !== 1) fail(`${file}: expected one JSON-LD block`);
  for (const block of jsonBlocks) {
    try {
      JSON.parse(block[1] ?? "");
    } catch {
      fail(`${file}: JSON-LD is not parseable`);
    }
  }
  if (route === "home" && !html.includes('"@type":"ProfilePage"')) fail(`${file}: missing ProfilePage`);
  if (route === "home" && !html.includes('"@type":"ItemList"')) fail(`${file}: missing the selected-work ItemList`);
  if (route !== "notFound" && !html.includes('"@type":"Organization","@id"')) fail(`${file}: missing the Organization node`);
  if (route !== "notFound" && !html.includes(`"url":"${SITE_ORIGIN}/logo.png"`)) fail(`${file}: Organization logo should be ${SITE_ORIGIN}/logo.png`);
  if (route === "contact" && !html.includes('"@type":"BreadcrumbList"')) fail(`${file}: missing BreadcrumbList`);
  for (const module of head.routeModules[route]) {
    const stem = module.split("/").pop()!.replace(/\.tsx?$/, "");
    if (!new RegExp(`rel="modulepreload"[^>]*/assets/${stem}-`).test(html)) fail(`${file}: ${module} is not modulepreloaded`);
  }
  if (route === "contact" && html.includes('"@type":"ProfilePage"')) fail(`${file}: contact still has ProfilePage`);
  if (route === "contact" && !html.includes('"@type":"ContactPage"')) fail(`${file}: missing ContactPage`);
  if (route === "notFound" && !html.includes('content="noindex, nofollow"')) fail(`${file}: 404 should be noindex`);
  if (!html.includes('href="/site.webmanifest"')) fail(`${file}: missing manifest`);
  if (!html.includes(`${head.brand}/og.png`)) fail(`${file}: missing social image`);
  if (!html.includes(`${head.brand}/favicon.svg`)) fail(`${file}: missing ${design} favicon`);
  if (!html.includes('id="root"') || html.includes('<div id="root"></div>')) {
    fail(`${file}: root was not prerendered`);
  }
}

checkPage("index.html", "home");
checkPage("contact/index.html", "contact");
checkPage("404.html", "notFound");

// The CSP in vercel.json allows the inline theme script by hash; any edit to it must update the hash.
const inlineScript = read("index.html").match(/<script>([\s\S]*?)<\/script>/)?.[1];
const csp = readFileSync(resolve(import.meta.dirname, "../vercel.json"), "utf8");
if (!inlineScript) fail("index.html: inline theme script not found");
else {
  const hash = createHash("sha256").update(inlineScript).digest("base64");
  if (!csp.includes(`'sha256-${hash}'`)) fail(`vercel.json CSP is missing the inline script hash 'sha256-${hash}'`);
}

const robots = read("robots.txt");
if (!robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)) fail("robots.txt missing sitemap");
if (!robots.includes("Allow: /")) fail("robots.txt should allow crawlers");

const sitemap = read("sitemap.xml");
if (!sitemap.includes(`<loc>${SITE_ORIGIN}/</loc>`)) fail("sitemap missing home URL");
if (!sitemap.includes(`${SITE_ORIGIN}/contact`)) fail("sitemap missing contact URL");
if (sitemap.includes("/404")) fail("sitemap should not list 404");

const llms = read("llms.txt");
if (!llms.startsWith("# ")) fail("llms.txt must start with an H1");
if (!llms.includes("/llms-full.txt")) fail("llms.txt should point at llms-full.txt");
const llmsFull = read("llms-full.txt");
for (const section of ["## Intro", "## What I do", "## Experience", "## Selected work", "## Recognition"]) {
  if (!llmsFull.includes(section)) fail(`llms-full.txt missing ${section}`);
}
const manifest = read("site.webmanifest");
for (const icon of ["favicon.svg", "icon-192.png", "icon-512.png"].map((name) => `${head.brand}/${name}`)) {
  if (!manifest.includes(icon)) fail(`web manifest missing ${icon}`);
}
if (!read("site.webmanifest").includes('"short_name": "gabcat"')) fail("web manifest incomplete");

for (const asset of [
  "favicon.ico",
  "logo.png",
  ...["og.png", "favicon.ico", "favicon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png"].map((name) => `${brand}/${name}`),
  ...head.fontPreloads.map((href) => href.replace(/^\//, "")),
  "portraits/gab-halftone.webp",
  "portraits/gab-editorial.webp",
]) {
  if (!existsSync(resolve(dist, asset))) fail(`missing asset ${asset}`);
}

if (existsSync(resolve(dist, "calling-card"))) fail("calling-card tooling should not ship in dist");
if (existsSync(resolve(dist, "portraits/gab-print.webp"))) fail("unused gab-print.webp is still deployed");

const assetsDir = resolve(dist, "assets");
if (existsSync(assetsDir)) {
  const js = readdirSync(assetsDir).filter((name) => name.endsWith(".js"));
  const homeEntry = js.find((name) => name.startsWith("index-")) ?? js[0];
  const contactChunk = js.find((name) => name.toLowerCase().includes("contact"));
  const threeChunk = js.find((name) => name.startsWith("three-"));
  if (!homeEntry) fail("no JS assets in dist/assets");
  if (!contactChunk) fail("contact route was not code-split");
  if (threeChunk && homeEntry && threeChunk === homeEntry) fail("three.js appears to be in the main entry");
}

function gzipKb(path: string) {
  const buf = readFileSync(resolve(dist, path));
  return gzipSync(buf).length / 1024;
}

const og = `${brand}/og.png`;
if (existsSync(resolve(dist, og)) && gzipKb(og) > 180) {
  fail(`${og} gzip is ${gzipKb(og).toFixed(1)} kB (budget 180)`);
}
if (existsSync(resolve(dist, "portraits/gab-halftone.webp"))) {
  const kb = statSync(resolve(dist, "portraits/gab-halftone.webp")).size / 1024;
  if (kb > 220) fail(`gab-halftone.webp is ${kb.toFixed(0)} kB (budget 220)`);
}

if (errors.length) {
  console.error(errors.map((error) => `• ${error}`).join("\n"));
  process.exit(1);
}

console.log(`seo:check passed (${design})`);
