# Design explorations

Alternative directions for the portfolio: dev-only pages that Vite serves but never builds.

**Signal is now the site's design** and lives properly in `src/designs/signal` (the page here is the original pitch). The clay site it replaced is archived in `src/designs/clay` and still builds: `bun run dev:clay` to look at it, or set `LIVE_DESIGN` in `src/designs/live.ts` to bring it back. It is also tagged `clay-site` in git.

```bash
bun run dev
```

Open http://localhost:5173/explorations/ for the index. Every page has a "Directions" pill (bottom left) to hop between them and flip light and dark mode. `?mode=dark` or `?mode=light` works too.

## Round two: award-site craft, mostly real-time 3D

| Direction | Path | After | What it does |
| --- | --- | --- | --- |
| Signal | `/explorations/signal/` | Lusion, Active Theory, Igloo Inc | 22,000 GPU particles sampled from the portrait re-form per chapter: waveform, lattice, globe with arcs from Naga, a seven, "hello." |
| GC-61 | `/explorations/keys/` | Teenage Engineering, Nothing | A studio-lit 3D keyboard that assembles on load, responds to the real keyboard (type WORK + enter), and explodes into five labelled stack layers. |
| 1-Bit Bicol | `/explorations/onebit/` | Obra Dinn, Awwwards dither sites | A scroll-driven flight over a procedural Bicol (Naga City, Isarog, Mayon) rendered through a three-ink Bayer dither. |
| Kinetic | `/explorations/kinetic/` | Obys, Exo Ape, Locomotive | Roboto Flex width and weight axes react to the cursor and scroll; counter preloader, lit manifesto, velocity marquee, colour-flip work list, pinned journey. |
| Toybox | `/explorations/toybox/` | Bruno Simon, Shopify Editions | A single-screen physics pit (cannon-es). Tabs drop alphabet blocks, project crates, trophies and tool pills; drag to throw, click to read. |

## Round one

`support`, `status`, `line`, `zine`, `film`: concept-led, mostly 2D. Kept for comparison.

## How it's put together

- `shared/content.ts` reads everything from `src/data.ts`, adds real month ranges, and strips em-dashes. No direction invents facts.
- `shared/gl.ts` holds the WebGL plumbing (renderer, sleep-when-hidden loop, image and text point samplers, simplex noise). `shared/motion.tsx` holds Lenis, line reveals and the preloader counter.
- Each direction is self-contained: `index.html`, `main.tsx` (fonts), `App.tsx`, a `scene.ts` for the 3D ones, and one CSS file with light and dark tokens.
- Every 3D scene is built in code; there are no model files. All of them honour reduced motion and pause when the tab is hidden.
- Fonts (`@fontsource`), icons (`@phosphor-icons/react`) and physics (`cannon-es`) are dev dependencies. Move them to `dependencies` if a direction ships.
- Only the clay design uses Tailwind, and its stylesheet has `@source not` lines for this folder, so these class names never reach production CSS.
- `thumbs/` holds the index screenshots, captured with the local Chrome through `puppeteer-core`.

Type-check with `bunx tsc --noEmit -p explorations/tsconfig.json`.
