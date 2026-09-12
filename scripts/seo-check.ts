/**
 * Production checks for prerendered HTML, crawler files, and payload budgets.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { resolve } from "node:path";
import { ROUTES, SITE_ORIGIN, type RouteId } from "../src/seo.ts";

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
  if (route === "contact" && html.includes('"@type":"ProfilePage"')) fail(`${file}: contact still has ProfilePage`);
  if (route === "contact" && !html.includes('"@type":"ContactPage"')) fail(`${file}: missing ContactPage`);
  if (route === "notFound" && !html.includes('content="noindex, nofollow"')) fail(`${file}: 404 should be noindex`);
  if (!html.includes('href="/site.webmanifest"')) fail(`${file}: missing manifest`);
  if (!html.includes("/og.png")) fail(`${file}: missing social image`);
  if (!html.includes('id="root"') || html.includes('<div id="root"></div>')) {
    fail(`${file}: root was not prerendered`);
  }
}

checkPage("index.html", "home");
checkPage("contact/index.html", "contact");
checkPage("404.html", "notFound");

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
if (!read("llms-full.txt").includes("Selected work")) fail("llms-full.txt missing work section");
if (!read("site.webmanifest").includes('"short_name": "gabcat"')) fail("web manifest incomplete");

for (const asset of [
  "og.png",
  "favicon.ico",
  "favicon.svg",
  "apple-touch-icon.png",
  "fonts/PowerGroteskTrial-Bold.woff2",
  "fonts/instrument-sans-latin-wght-normal.woff2",
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
  const threeChunk = js.find((name) => name.toLowerCase().includes("sculpture") || name.includes("three"));
  if (!homeEntry) fail("no JS assets in dist/assets");
  if (!contactChunk) fail("contact route was not code-split");
  if (threeChunk && homeEntry && threeChunk === homeEntry) fail("three.js appears to be in the main entry");
}

function gzipKb(path: string) {
  const buf = readFileSync(resolve(dist, path));
  return gzipSync(buf).length / 1024;
}

if (existsSync(resolve(dist, "og.png")) && gzipKb("og.png") > 180) {
  fail(`og.png gzip is ${gzipKb("og.png").toFixed(1)} kB (budget 180)`);
}
if (existsSync(resolve(dist, "portraits/gab-halftone.webp"))) {
  const kb = statSync(resolve(dist, "portraits/gab-halftone.webp")).size / 1024;
  if (kb > 220) fail(`gab-halftone.webp is ${kb.toFixed(0)} kB (budget 220)`);
}

if (errors.length) {
  console.error(errors.map((error) => `• ${error}`).join("\n"));
  process.exit(1);
}

console.log("seo:check passed");
