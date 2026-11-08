# UI in the gabcat.dev portfolio

The live design is Signal (`src/designs/signal`). One WebGL2 particle field sits in a
persistent frame and re-forms into a new figure for each chapter. Clay
(`src/designs/clay`) is archived but must keep building. Build new site work inside
the live design's folder, and keep shared logic in `src/lib`.

## Gab's rules (never traded away)

These are the same rules as Gab's global CLAUDE.md, restated so they hold in any session.

- Sentence case. No all-caps text, no letter-spaced uppercase labels.
- No eyebrows (the small label above a heading). Lead with the heading.
- Cards are slightly rounded (6 to 8px), never pill-shaped or heavily rounded. No shadows on cards; separate with a 1px border or a background tint.
- No generic AI icons: sparkles, stars, magic wands, ✨, ✳. Icons name the actual thing, or no icon.
- No icon tiles: never an icon on a small tinted or filled square or rounded box, in headings, cards, empty states or feature lists. Show something real (faces, a count, an illustration in the page's own style) or just the heading. Plain inline icons in nav, buttons and rows are fine.
- Text is the foreground colour. Muted text only in rare, deliberate cases (a timestamp), never as the default body colour.
- Copy follows the anti-slop approach: no filler, taglines or counts nobody asked for, no triplets of abstract nouns, no "not just X, it's Y", no hype ("seamless", "elevate", "unlock", "effortless"), no em-dash flourishes, one idea per sentence.
- Every interaction gives feedback: hover, press, focus, and a loading state for every async action, then success or error.
- Content enters with a short entrance animation; lists and grids stagger. Respect `prefers-reduced-motion`.
- Skeletons only for dynamic data, mirroring the real layout. Static parts render immediately as real content. (This site has almost no dynamic data; the contact form's `loading` status is the one case.)

## Known deviations: raise with Gab before adding more

Signal predates these rules being applied to it, and Gab chose and has approved the look, so
don't "fix" any of this silently, and don't add more of it without asking.

- **Eyebrow labels.** `.sg-label` (in `src/designs/signal/styles/signal.css`) sits above a heading on the home hero ("Developer & DevOps engineer · Naga City, PH"), "What I do", "2022 – now · 6 roles", "2024 – 2025 · Hackathons and CTFs", "Selected work", on Contact ("Contact") and on the 404 ("Error 404"). That is the eyebrow pattern the rules forbid.
- **Uppercase, letter-spaced labels.** `.sg-label` sets `text-transform: uppercase` with `letter-spacing: 0.08em`, and so do the tuner, dial links, craft and win row labels, topic legend, meter, stamp and dev-send button in the same file.
- **Pills.** The file header says "Buttons and chips are pills; nothing else has a radius." `.sg-btn`, `.sg-icon`, `.sg-skip` and `.sg-devsend` are `border-radius: 999px` (buttons, not cards, but still pill-shaped controls).
- **Muted text.** `var(--fog)` (`#5b5a56` light, `#8e8b85` dark) colours many body-adjacent lines, about thirty rules.

What to do: for new work, follow the rules (sentence case, heading first, ink colour, 6 to 8px if a card is ever needed). If a new section needs a label above its heading, put the question to Gab with your recommendation instead of reusing `.sg-label`. Report the deviation in your summary when you touch a line that has it. Gab's recorded feedback below is about layout and figures; it does not say the labels are approved.

## Signal's taste: Gab's recorded feedback, with the reason

Each line is something Gab said about this site. The reason is what he wants, so you can judge cases the lines don't cover.

- **Do not repeat the same layout across chapters.** On 2026-09-27 he rejected three chapters in a row with text on the left and a figure on the right as "no creativity". Each chapter gets its own composition on wide screens: Listen is a full-bleed horizon wave, Build is an exploded view around the lattice. Placements live in `src/designs/signal/scene/field.ts` under `spread`, and the CSS sits under the `WIDE` media query (`(min-width: 1024px) and (min-aspect-ratio: 11/10)`, defined in `src/designs/signal/scene/stage.ts`). *Why: he wants an award-style site where every chapter feels composed, not templated.*
- **Soft edges, never hard cuts.** He disliked figures that end in a crisp slice: the waveform's ends and the black hole's rim. Taper density and alpha at figure edges so they dissolve into the page. *Why: figures should feel like part of the page, not stickers on it.*
- **Figures move.** Every figure has continuous motion, like the globe's arcs. He called a static arc meeting point "so static". Keep motion slow; he asked for slower. *Why: a still shape reads as a picture, not a signal.*
- **Figures mean something.** A plain particle "7" was "not creative"; a constellation 7 and seven light beams were rejected too. Wins became a scanned trophy with seven lights circling it, one per podium (hovering a row calls `signal.focus(i)` in `Home.tsx`). Contact's dish was too literal, so it became a Lissajous curve that tunes in from noise as the form fills. The 404 is a radar sweep. A glitching "404" text and the waveform on the 404 page were disliked. *Why: he wants a figure about the thing itself, not a shape for its own sake.*
- **Loose, not gridded.** He disliked figures that look too organized or perfect: grids, evenly spaced rings, uniform dot sizes. Build figures from loose random scatter with mixed dot sizes, like the black hole and waveform. *Why: perfect geometry looks generated; scatter looks alive.*
- **Complete on arrival.** A figure must be whole the moment it appears: no build-ups such as stars lighting in turn or arcs drawing in. *Why: entrance theatre reads as waiting.*
- **Keep "Now I keep it running." (the journey chapter) as is.** He asked for the original layout back after a planet-horizon version. Don't redesign it unless he asks.
- **Sparse pages.** He called the contact page "crowded, not minimal like the landing page". It now uses floating labels, a one-line text topic picker and a single email and privacy line. Keep every page as sparse as the hero.
- **No hard swaps.** He disliked the form swapping instantly to the thank-you message. Sending now lifts the typed letters toward the figure before the reply eases in (a dev-only "test send" button in `Contact.tsx` replays it). Give state changes a transition.
- **Chrome can be playful.** He found the tick-rail chapter index "kinda good but too minimal", so it became a radio-tuner dial (`src/designs/signal/Dial.tsx`: mirrored spectrum bars, an orange needle that shows static between chapters, an FM 88 to 108 readout) and the scrollbar is hidden. The dial and `src/designs/signal/Tuner.tsx` (the loading tuner) are themed on purpose.
- **Bold craft over clever flat ideas.** Round 1 of the explorations (support chat, status page, transit map, zine, film) was rejected as "not creative". Round 2 (real WebGL, award-style) won with Signal. When proposing design work, lead with bold visual craft and real-time 3D and name specific award-winning references. Dev-only explorations live in `explorations/`.
- **Hero.** Figure 0 is a Gargantua-style black hole (`FIGURE.horizon`, drawn in the vertex shader of `src/designs/signal/scene/field.ts`). The social card, favicon and no-WebGL stills are shot from the live field by `bun scripts/brand-signal.ts`. Rerun it after changing the hero. The globe's land comes from `src/designs/signal/scene/land.ts`, generated by `bun scripts/globe-land.ts`. The countries in that script and the cities in `globe()` must stay in step.
- **Copy about Gab avoids gendered pronouns.** Third person says "Gab" or "Gabriel".

## Tokens and type

- Tokens are CSS custom properties in `src/designs/signal/styles/signal.css`: `--bg`, `--ink`, `--fog`, `--line`, `--field`, `--accent`, `--on-accent`, `--grain`, `--mono`, `--ease`, `--gutter`. Light is `:root`, dark is `.dark` on `<html>`. Both themes are first-class: check both.
- Palette: paper `#efeee9` and ink `#121211` in light, `#060607` and `#efebe4` in dark, orange accent `#e2480f` (dark `#ff6a3d`). Orange lives inside the particles and on the primary button.
- Type: Mona Sans Variable (wide and light, `font-variation-settings 'wdth' 125`) for voice, Geist Mono for labels. Self-hosted under `public/fonts/`; `unicode-range` keeps extras off the wire. Don't add a web font without checking the LCP budget.
- Theme logic is `src/lib/theme.ts` (`setTheme`, `toggleTheme`, `useTheme`). `?mode=light` or `?mode=dark` forces a theme. The theme sweep uses the View Transitions API and falls back to a fade.
- The clay design has its own Tailwind v4 tokens in `src/designs/clay/styles/index.css`. Tailwind is used by clay only.

## Motion pieces to reuse

- Scroll reveals: `Rise` (fade and rise), `Stagger` (each child in turn, 60ms gap) and `Lines` (masked line reveal, lines passed explicitly) in `src/designs/signal/reveal.tsx`. Plain IntersectionObserver and Web Animations; no animation library on Signal. Copy already on screen at first paint is never hidden, so the prerendered text stays the largest paint. Don't add `opacity: 0` styles to above-the-fold copy.
- Magnetic buttons: `Magnetic` in `src/designs/signal/Magnetic.tsx` (mouse only, skipped for touch and reduced motion).
- Pages pick the figure: `signal.show(scene)`, `signal.focus(i)`, `signal.kick(n)`, `signal.level(v)`, `signal.beat(n)` from `src/designs/signal/scene/stage.ts`. `FIGURE` lists the nine figures; `only(figure)` builds a scene; `Home.tsx` blends weights by scroll. `field.ts` is loaded later in its own chunk, so `signal` calls are safe before it arrives.
- Smooth scroll: `src/lib/lenis.ts` (`initLenis`), `src/lib/scroll.ts` (`scrollToId`, `scrollToTop`). Lenis owns scrolling on the home page, so `scroll-behavior` is `auto`.
- Client routing: `src/lib/router.tsx` (`RouterProvider`, `Link`, `useRouter`). Use `Link` so Cmd-click still opens a new tab.
- Motion pause: `src/lib/motion.ts` (`isMotionPaused`, `onMotionChange`, `setMotionPaused`) is one switch for every scene: the visitor's pause button in `Nav.tsx` and reduced motion.

## Reduced motion

Handled in four places, and a new animation needs to join them:
`src/lib/motion.ts` stops the particle motion; `reveal.tsx` skips hiding and animating;
`Dial.tsx`, `Contact.tsx`, `lenis.ts`, `scroll.ts` and `theme.ts` each check
`prefers-reduced-motion`; and the `@media (prefers-reduced-motion: reduce)` block at
the end of `signal.css` drops the canvas transition, magnetic drift and dial clip-path. Drop
the movement, keep the state change.

## Phone and wide layouts

- Phone breakpoint is 820px: `@media (max-width: 820px)` in `signal.css` (gutter 18px, black hole centred above the copy) and `window.innerWidth < 820` in `Home.tsx` (copy dims figures differently). Keep the two in step. There is a smaller `max-width: 420px` block too.
- Wide layouts use the `WIDE` query from `stage.ts`; `signal.css` repeats the same query at `min-width: 1024px) and (min-aspect-ratio: 11/10`. Change both together.
- Pages with sticky sections use `overflow-x: clip`, not `hidden` (`hidden` breaks sticky).
- Check 360, 768, 1280 and 1920 widths, light and dark, and with WebGL unavailable (the no-WebGL stills are `public/brand/signal/horizon-dark.webp` and `horizon-light.webp`, under 160 kB each).

## Performance bar

Set 2026-09-27: Lighthouse mobile 97 to 98, desktop 100, accessibility, best practices and SEO 100. Signal ships no three.js and no motion library (raw WebGL2, about 8 kB gzipped for the draw path). The chunk list from `bun run build` is the first check: the main `index-*.js` was 229 kB (73 kB gzip) on 2026-11-09, and `field-*.js` 44 kB. `scripts/seo-check.ts` fails if `three` lands in the main entry, if `og.png` exceeds 180 kB gzip, or if a horizon still exceeds 160 kB. Don't import `three` or `motion` into Signal.

## Every state of every dynamic surface

The one dynamic surface is the contact form (`src/designs/signal/pages/Contact.tsx` over `useContactForm` in `src/lib/contact-form.ts`; statuses `loading`, `ready`, `sending`, `sent`, `error`).

| State | What good looks like |
|---|---|
| Loading | The form is real content; the send button reads "Getting ready…" and stays disabled until the token arrives. |
| Ready | Floating labels, one-line topic picker, one email and privacy line. |
| Sending | Button reads "Sending…", fields disabled, double submit blocked (`busy` ref), the meter shows busy. |
| Sent | The typed letters lift off toward the figure, then the reply eases in. |
| Error | The server's plain-words message in a `role="alert"` block, the input kept, a way to retry or email directly. A 400 or 409 clears the token so the form refreshes. |
| Rate limited | 429 with `Retry-After`; copy tells them to try later or email. |
| Reduced motion | The lift-off is skipped; the state change still shows. |

## Interaction

- Hover, press, focus-visible and disabled states on every control. Disabled controls say why.
- Touch targets at least 40px (the icon button is 40px).
- Real `<a>` links for navigation. There is a skip link (`.sg-skip`); keep it.
- Keyboard: tab order follows the page; Enter submits the form; the nav pause button and theme toggle work by keyboard.
- Every page sets its own `<title>`, canonical and one `<h1>`; `scripts/seo-check.ts` fails on missing ones.
- Inputs are 16px or larger so iOS doesn't zoom.

## Verify

- Run the site: `bun run dev` (or the `dev` / `preview` configs in `.claude/launch.json`; `preview` serves the built `dist/` on 4173, with `/contact` and the 404 handled).
- WebGL needs a real GPU browser for honest screenshots. Take the same route, theme and viewport before and after, at laptop and phone width. Headless without GPU shows the no-WebGL stills; say so if that's all you can get.
- Never put candidate or customer data from client projects in a screenshot.
