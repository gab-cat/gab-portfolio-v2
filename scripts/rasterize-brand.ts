import puppeteer from "puppeteer-core";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--hide-scrollbars"],
});

// The social card uses the site's own faces, inlined so nothing is fetched.
const font = (family: string, file: string, weight: number, style = "normal") =>
  `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${readFileSync(resolve(root, "public/fonts", file)).toString("base64")}) format("woff2");font-weight:${weight};font-style:${style}}`;
const fonts = [
  font("Power Grotesk", "PowerGroteskTrial-Bold.woff2", 700),
  font("Instrument Sans", "instrument-sans-latin-wght-normal.woff2", 600),
  font("Instrument Sans", "instrument-sans-latin-wght-normal.woff2", 500),
  font("Instrument Serif", "instrument-serif-latin-400-italic.woff2", 400, "italic"),
].join("");

/** Renders an SVG to a PNG of any size; `transparent` keeps the corners clear. */
async function raster(svgPath: string, width: number, height: number, out: string, transparent = false) {
  const svg = readFileSync(resolve(root, svgPath), "utf8");
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.setContent(
    `<!doctype html><html><head><style>${fonts}*{margin:0;padding:0}html,body{width:${width}px;height:${height}px;overflow:hidden;background:transparent}svg{display:block;width:100%;height:100%}</style></head><body>${svg}</body></html>`,
    { waitUntil: "load" },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(root, out), type: "png", omitBackground: transparent });
  await page.close();
  console.log("wrote", out);
}

mkdirSync(resolve(root, "public"), { recursive: true });
const tmp = mkdtempSync(resolve(tmpdir(), "gabcat-brand-"));
await raster("public/og.svg", 1200, 630, "public/og.png");
await raster("public/apple-touch-icon.svg", 180, 180, "public/apple-touch-icon.png");
await raster("public/apple-touch-icon.svg", 192, 192, "public/icon-192.png");
await raster("public/apple-touch-icon.svg", 512, 512, "public/icon-512.png");
await raster("public/favicon.svg", 48, 48, resolve(tmp, "favicon-48.png"), true);
await browser.close();

const png = readFileSync(resolve(tmp, "favicon-48.png"));
writeFileSync(resolve(root, "public/favicon.ico"), pngIco(png, 48, 48));
rmSync(tmp, { recursive: true, force: true });
console.log("wrote public/favicon.ico");

function pngIco(png: Buffer, width: number, height: number): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(width >= 256 ? 0 : width, 0);
  entry.writeUInt8(height >= 256 ? 0 : height, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}
