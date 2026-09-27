/**
 * Post-build prerender: injects unique heads, JSON-LD, and static HTML for
 * `/`, `/contact`, and `404`, plus crawler discovery files. Fonts, colours and
 * icons come from whichever design the SSR bundle was built with.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import {
  INDEXABLE_ROUTES,
  LOGO_PATH,
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
const { render, head } = (await import("../dist-server/entry-server.js")) as typeof import("../src/entry-server.tsx");

const template = readFileSync(dist, "utf8");
if (!template.includes("<!--app-head-->") || !template.includes('<div id="root"></div>')) {
  throw new Error("prerender: expected <!--app-head--> and empty #root in dist/index.html");
}

function lastmod(): string | undefined {
  try {
    const value = execSync("git log -1 --format=%cs", { encoding: "utf8" }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

// Small stylesheets go inline: one less render-blocking request before first paint.
const INLINE_CSS_LIMIT = 48 * 1024;
const stylesheet = template.match(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/);
const inlined = (() => {
  if (!stylesheet) return template;
  const css = readFileSync(resolve(distDir, `.${stylesheet[1]}`), "utf8");
  if (css.length > INLINE_CSS_LIMIT) return template;
  console.log(`inlined ${stylesheet[1]} (${(css.length / 1024).toFixed(1)} kB)`);
  return template.replace(stylesheet[0], `<style>${css}</style>`);
})();

// Each route's own modules (its page, the particle field) start downloading with the entry.
type ManifestChunk = { file: string; imports?: string[] };
const manifest: Record<string, ManifestChunk> = JSON.parse(readFileSync(resolve(distDir, ".vite/manifest.json"), "utf8"));
function modulePreloads(route: RouteId): string {
  const files = new Set<string>();
  const visit = (key: string) => {
    const chunk = manifest[key];
    if (!chunk || files.has(chunk.file)) return;
    files.add(chunk.file);
    chunk.imports?.forEach(visit);
  };
  for (const module of head.routeModules[route]) {
    const key = `src/designs/${head.id}/${module}`;
    if (!manifest[key]) throw new Error(`prerender: ${key} is not in the build manifest`);
    visit(key);
  }
  return [...files]
    .filter((file) => !inlined.includes(`/${file}"`))
    .map((file) => `<link rel="modulepreload" crossorigin href="/${file}" />`)
    .join("\n    ");
}

const modified = lastmod();

function pageHtml(route: RouteId): string {
  const path = ROUTES[route].path;
  return inlined
    .replace("<!--app-head-->", `${headMarkup(route, head, { modified })}\n    ${modulePreloads(route)}`)
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
writeFileSync(resolve(distDir, "sitemap.xml"), sitemapXml(modified));
writeFileSync(resolve(distDir, "llms.txt"), llmsTxt());
writeFileSync(resolve(distDir, "llms-full.txt"), llmsFullTxt(head.intro));
writeFileSync(resolve(distDir, "site.webmanifest"), webManifest(head));
// Browsers and crawlers still ask for /favicon.ico directly; answer with the live design's.
copyFileSync(resolve(distDir, `.${head.brand}/favicon.ico`), resolve(distDir, "favicon.ico"));
// The Organization logo in the JSON-LD points at one stable URL whatever the design.
copyFileSync(resolve(distDir, `.${head.brand}/icon-512.png`), resolve(distDir, LOGO_PATH.slice(1)));
console.log(`wrote discovery files for ${INDEXABLE_ROUTES.join(", ")}`);
