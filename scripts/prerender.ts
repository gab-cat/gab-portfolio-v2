/**
 * Post-build prerender: injects unique heads, JSON-LD, and static HTML for
 * `/`, `/contact`, and `404`, plus crawler discovery files.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import {
  INDEXABLE_ROUTES,
  ROUTES,
  headMarkup,
  llmsFullTxt,
  llmsTxt,
  robotsTxt,
  sitemapXml,
  webManifest,
  type RouteId,
} from "../src/seo.ts";

const distDir = resolve(import.meta.dirname, "../dist");
const dist = resolve(distDir, "index.html");
const { render } = await import("../dist-server/entry-server.js");

const template = readFileSync(dist, "utf8");
if (!template.includes("<!--app-head-->") || !template.includes('<div id="root"></div>')) {
  throw new Error("prerender: expected <!--app-head--> and empty #root in dist/index.html");
}

const fontPreloads = [
  "/fonts/PowerGroteskTrial-Bold.woff2",
  "/fonts/instrument-sans-latin-wght-normal.woff2",
];

function lastmod(): string | undefined {
  try {
    const value = execSync("git log -1 --format=%cs", { encoding: "utf8" }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

function pageHtml(route: RouteId): string {
  const path = ROUTES[route].path;
  return template
    .replace("<!--app-head-->", headMarkup(route, { fontPreloads }))
    .replace('<div id="root"></div>', `<div id="root">${render(path)}</div>`);
}

function writePage(file: string, html: string, label: string) {
  mkdirSync(resolve(file, ".."), { recursive: true });
  writeFileSync(file, html);
  console.log(`prerendered ${label} (${(html.length / 1024).toFixed(1)} kB)`);
}

writePage(dist, pageHtml("home"), "dist/index.html");
writePage(resolve(distDir, "contact/index.html"), pageHtml("contact"), "dist/contact/index.html");
writePage(resolve(distDir, "404.html"), pageHtml("notFound"), "dist/404.html");

writeFileSync(resolve(distDir, "robots.txt"), robotsTxt());
writeFileSync(resolve(distDir, "sitemap.xml"), sitemapXml(lastmod()));
writeFileSync(resolve(distDir, "llms.txt"), llmsTxt());
writeFileSync(resolve(distDir, "llms-full.txt"), llmsFullTxt());
writeFileSync(resolve(distDir, "site.webmanifest"), webManifest());
console.log(`wrote discovery files for ${INDEXABLE_ROUTES.join(", ")}`);
