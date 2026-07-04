/**
 * Post-build prerender: renders the React app to static HTML and injects it
 * into dist/index.html, so the deployed page is full content — not an empty
 * shell waiting for JS. Run via `bun run build`.
 */
import { readFileSync, writeFileSync } from "node:fs";
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
