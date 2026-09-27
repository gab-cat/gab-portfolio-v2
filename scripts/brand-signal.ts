/**
 * Signal's brand files: the social card (the particle black hole beside the
 * headline), the still black hole shown when WebGL is missing, and the icons.
 * The black hole is shot from the live particle field, so it always matches
 * the site. Writes into public/brand/signal. Run with: bun scripts/brand-signal.ts
 */
import puppeteer, { type Page } from "puppeteer-core";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer as createNetServer, type AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { deflateSync } from "node:zlib";
import { createServer } from "vite";

const root = resolve(import.meta.dirname, "..");
const dir = resolve(root, "public/brand/signal");
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const inline = (file: string, type: string) => `data:${type};base64,${readFileSync(resolve(root, file)).toString("base64")}`;

// A throwaway dev server on a free port (Vite reads port 0 as "the default", so ask the OS first).
const port = await new Promise<number>((done) => {
  const probe = createNetServer().listen(0, "127.0.0.1", () => {
    const { port } = probe.address() as AddressInfo;
    probe.close(() => done(port));
  });
});
process.env.DESIGN = "signal";
const server = await createServer({ root, logLevel: "error", server: { host: "127.0.0.1", port, strictPort: true } });
await server.listen();
const site = `http://127.0.0.1:${port}`;

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox", "--hide-scrollbars"] });

/**
 * The home page's particle field alone, on a transparent background. Reduced
 * motion holds the field still at its first frame, so every run draws the same picture.
 */
async function field(theme: "dark" | "light", width: number, height: number, scale: number, clip?: { x: number; y: number; width: number; height: number }) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: scale });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(`${site}/?mode=${theme}`, { waitUntil: "networkidle0" });
  await page.waitForSelector(".sg-canvas.is-ready");
  await page.addStyleTag({
    content: "html,body{background:transparent!important}#root>:not(.sg-canvas),.sg-grain{visibility:hidden!important}",
  });
  await new Promise((done) => setTimeout(done, 400));
  const png = Buffer.from(await page.screenshot({ type: "png", omitBackground: true, ...(clip ? { clip } : {}) }));
  await page.close();
  return png;
}

/** Chrome's own WebP encoder, so no image tooling is needed. */
async function webp(page: Page, png: Buffer, quality: number) {
  const data = await page.evaluate(
    async (src: string, q: number) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      c.getContext("2d")!.drawImage(img, 0, 0);
      return c.toDataURL("image/webp", q);
    },
    `data:image/png;base64,${png.toString("base64")}`,
    quality,
  );
  return Buffer.from(data.split(",")[1], "base64");
}

const hole = await field("dark", 1200, 630, 2);

const card = `<!doctype html><html><head><style>
@font-face{font-family:"Mona Sans";src:url(${inline("public/fonts/mona-sans-latin-wdth-normal.woff2", "font/woff2")}) format("woff2");font-weight:200 900;font-stretch:75% 125%}
@font-face{font-family:"Geist Mono";src:url(${inline("public/fonts/geist-mono-latin-wght-normal.woff2", "font/woff2")}) format("woff2");font-weight:100 900}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden;background:#060607;color:#efebe4}
.hole{position:absolute;inset:0;width:1200px;height:630px}
.copy{position:absolute;left:72px;top:64px;bottom:60px;display:flex;flex-direction:column;justify-content:space-between}
.label,.foot{font-family:"Geist Mono";font-size:17px;letter-spacing:.08em;text-transform:uppercase;color:#8e8b85}
h1{margin-top:auto;margin-bottom:44px;font-family:"Mona Sans";font-weight:250;font-stretch:125%;font-size:104px;line-height:.95;letter-spacing:-.045em}
.foot{display:flex;align-items:center;gap:12px;color:#efebe4}
.foot i{width:12px;height:12px;border-radius:50%;background:#ff6a3d}
</style></head><body>
<img class="hole" src="data:image/png;base64,${hole.toString("base64")}" alt="">
<div class="copy">
  <p class="label">Gabriel Catimbang · Developer &amp; DevOps engineer</p>
  <h1>From noise<br>to signal.</h1>
  <p class="foot"><i></i>gabcat.dev</p>
</div>
</body></html>`;

async function shoot(html: string, width: number, height: number, out: string, { transparent = false, palette = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const png = Buffer.from(await page.screenshot({ type: "png", omitBackground: transparent }));
  if (palette) {
    // Thousands of soft dots barely deflate as truecolour; 256 colours look the same and weigh a third.
    const rgba = await page.evaluate(async (src: string) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      return Array.from(ctx.getImageData(0, 0, c.width, c.height).data);
    }, `data:image/png;base64,${png.toString("base64")}`);
    writeFileSync(out, indexedPng(Uint8Array.from(rgba), width, height));
  } else {
    writeFileSync(out, png);
  }
  await page.close();
  console.log("wrote", out.replace(`${root}/`, ""));
}

const svg = (file: string, size: number) =>
  `<!doctype html><html><head><style>*{margin:0}html,body{width:${size}px;height:${size}px;overflow:hidden;background:transparent}svg{display:block;width:100%;height:100%}</style></head><body>${readFileSync(resolve(dir, file), "utf8")}</body></html>`;

const tmp = mkdtempSync(resolve(tmpdir(), "gabcat-signal-"));
await shoot(card, 1200, 630, resolve(dir, "og.png"), { palette: true });
await shoot(svg("apple-touch-icon.svg", 180), 180, 180, resolve(dir, "apple-touch-icon.png"));
await shoot(svg("apple-touch-icon.svg", 192), 192, 192, resolve(dir, "icon-192.png"));
await shoot(svg("apple-touch-icon.svg", 512), 512, 512, resolve(dir, "icon-512.png"));
await shoot(svg("favicon.svg", 48), 48, 48, resolve(tmp, "favicon-48.png"), { transparent: true });

// Without WebGL the home page shows a still of the black hole instead: the right side of a desktop hero, per theme.
const encoder = await browser.newPage();
for (const theme of ["dark", "light"] as const) {
  const still = await field(theme, 1440, 900, 1, { x: 480, y: 0, width: 960, height: 800 });
  writeFileSync(resolve(dir, `horizon-${theme}.webp`), await webp(encoder, still, 0.7));
  console.log(`wrote public/brand/signal/horizon-${theme}.webp`);
}
await browser.close();
await server.close();

writeFileSync(resolve(dir, "favicon.ico"), pngIco(readFileSync(resolve(tmp, "favicon-48.png")), 48, 48));
rmSync(tmp, { recursive: true, force: true });
console.log("wrote public/brand/signal/favicon.ico");

/** Quantise to the 256 most common colours (5 bits a channel), then write an indexed PNG. */
function indexedPng(rgba: Uint8Array, width: number, height: number): Buffer {
  const key = (i: number) => ((rgba[i] >> 3) << 10) | ((rgba[i + 1] >> 3) << 5) | (rgba[i + 2] >> 3);
  const counts = new Map<number, number>();
  for (let i = 0; i < rgba.length; i += 4) counts.set(key(i), (counts.get(key(i)) ?? 0) + 1);
  const palette = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 256).map(([k]) => k);
  const rgb = palette.map((k) => [((k >> 10) & 31) * 8.2, ((k >> 5) & 31) * 8.2, (k & 31) * 8.2].map(Math.round));
  const lookup = new Map<number, number>(palette.map((k, i) => [k, i]));
  const nearest = (k: number) => {
    const r = ((k >> 10) & 31) * 8.2, g = ((k >> 5) & 31) * 8.2, b = (k & 31) * 8.2;
    let best = 0;
    let bestD = Infinity;
    rgb.forEach(([pr, pg, pb], i) => {
      const d = (pr - r) ** 2 + (pg - g) ** 2 + (pb - b) ** 2;
      if (d < bestD) (bestD = d), (best = i);
    });
    lookup.set(k, best);
    return best;
  };
  const rows = Buffer.alloc((width + 1) * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const k = key((y * width + x) * 4);
      rows[y * (width + 1) + 1 + x] = lookup.get(k) ?? nearest(k);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 3, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("PLTE", Buffer.from(rgb.flat().map((v) => Math.min(255, v)))),
    chunk("IDAT", deflateSync(rows, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type: string, data: Buffer) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

function crc32(buf: Buffer) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

/** A one-image ICO wrapping a PNG, which every current browser reads. */
function pngIco(png: Buffer, width: number, height: number): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(width >= 256 ? 0 : width, 0);
  entry.writeUInt8(height >= 256 ? 0 : height, 1);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}
