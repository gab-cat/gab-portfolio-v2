import puppeteer from "puppeteer-core";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--hide-scrollbars"],
});

async function raster(svgPath: string, width: number, height: number, out: string) {
  const svg = readFileSync(resolve(root, svgPath), "utf8");
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.setContent(
    `<!doctype html><html><head><style>*{margin:0;padding:0}html,body{width:${width}px;height:${height}px;overflow:hidden}</style></head><body>${svg}</body></html>`,
    { waitUntil: "load" },
  );
  await page.screenshot({ path: resolve(root, out), type: "png", omitBackground: false });
  await page.close();
  console.log("wrote", out);
}

mkdirSync(resolve(root, "public"), { recursive: true });
await raster("public/og.svg", 1200, 630, "public/og.png");
await raster("public/apple-touch-icon.svg", 180, 180, "public/apple-touch-icon.png");
await raster("public/apple-touch-icon.svg", 48, 48, "public/favicon-48.png");
await browser.close();

const png = readFileSync(resolve(root, "public/favicon-48.png"));
writeFileSync(resolve(root, "public/favicon.ico"), pngIco(png, 48, 48));
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
