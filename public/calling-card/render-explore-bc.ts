import puppeteer from "puppeteer-core";

const ids = ["b1", "b2", "b3", "b4", "c1", "c2", "c3", "c4"] as const;

const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox", "--hide-scrollbars"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1050, height: 600, deviceScaleFactor: 1 });

const server = Bun.serve({
  port: 8768,
  async fetch(req) {
    const url = new URL(req.url);
    const file = Bun.file("." + decodeURIComponent(url.pathname));
    if (!(await file.exists())) {
      return new Response("404 " + url.pathname, { status: 404 });
    }
    return new Response(file);
  },
});

await page.goto("http://127.0.0.1:8768/public/calling-card/explore-bc.html", {
  waitUntil: "networkidle0",
});
await page.evaluate(async () => {
  await document.fonts.ready;
});
await Bun.sleep(500);

for (const id of ids) {
  const el = await page.$(`#${id}`);
  if (!el) throw new Error(`Missing #${id}`);
  const out = `public/calling-card/explore-${id}.png`;
  await el.screenshot({ path: out, type: "png" });
  console.log("wrote", out);
}

await browser.close();
server.stop();
