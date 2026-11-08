---
name: gabcat-portfolio-founder-grade
description: >-
  gabcat.dev edition of Gab's founder-grade standard: finding the real reason
  behind every ask, reading every relevant line, building end to end through the
  single data source (src/data.ts) into Signal, clay, JSON-LD, llms files and the
  sitemap, Apple-level polish for the Signal design under Gab's anti-slop UI rules
  and his recorded layout feedback, the small contact function and its CSP and
  rate limits, researching when unsure, and expanding the ask when it makes the
  site better. Use it when you judge a task in this repo would benefit (a content
  change, a new or changed chapter or figure, a bug, the contact form, SEO, a
  redesign), or when the user asks for it: founder-grade, polish this, make it
  the best version, /gabcat-portfolio-founder-grade.
---

# Founder-grade in the gabcat.dev portfolio

The same standard as the general `founder-grade` skill (in `~/.claude/skills/` when
it's installed), written so it stands on its own in this repo, plus what this site
has already taught us. In this repo, this file wins where the two differ.
Based on founder-grade (2026-11-09). To refresh it, follow the general skill's
`customize.md`.

This is Gab's own site and his calling card to clients, recruiters and hackathon
judges. It is small and public, so every flaw is visible to everyone who visits.
Ship work you would put your own name on, because it is Gab's name. The bar is an
award-style site that still scores Lighthouse 97+ on mobile and 100 on desktop.

## The five commitments

1. **Find the real reason.** Solve the problem behind the ask, not just the words of it.
2. **Understand before you touch.** Read every line the change depends on.
3. **Build end to end.** Data, Signal, clay, SEO output, copy, states, tests and a real run. Nothing half-wired.
4. **Polish to the last pixel and the last millisecond.** UI per [ui.md](ui.md). The contact function per [backend.md](backend.md).
5. **Own the outcome.** Expand the ask when it makes the result better, solve the problems you find on the way, then say what you did.

## 1. Find the real reason

The ask is what Gab noticed on his own site. Your job is the reason behind it.

- **Name the goal in one line**: what should be true for a visitor (a client, a recruiter, a judge) when you're done. The literal request is a clue, not the ceiling.
- **Ask why until you reach the cause.** For a bug: what happens, on which page, in which browser or width, since when (`git log`), why it happens, and why `bun run check` didn't catch it. For a request: what problem made Gab ask, and what he will try next. Write the chain in a line or two before you build.
- **Prove the cause, don't guess it.** Evidence lives in the built output (`dist/`, from `bun run build`), `bun run seo:check`, `git log` and `git show`, the browser (the `.claude/launch.json` configs start `dev`, `dev-5174` and `preview`), and the Vercel function logs for `/api/contact`. A fix for a guessed cause is a second bug.
- **Fix the cause, then the class.** Patch the root, then look for the same mistake elsewhere: the other chapters, `/contact`, the 404, clay, the JSON-LD, `public/llms*.txt`, the sitemap.
- **Check the fix answers the reason, not just the words.** If doing exactly what was asked wouldn't solve the real problem, say so, solve the real one, and explain the difference.
- **Be proactive, even unprompted.** When you notice something wrong while working (a dead link, a stale number, a claim that doesn't match LinkedIn, a layout break at some width, a silent failure), dig into it the same way. Fix it when it's safe and outside the ask-first list below; otherwise report it with the cause and the fix you'd make.
- **Think one step ahead.** What happens at phone width, with WebGL missing, with reduced motion, with JavaScript off, with the rate-limit store down? What will Gab ask for once this works?
- **Lessons this repo already taught**:
  - A project card that "links to GitHub" instead of the project is a symptom. In `src/data.ts`, `PROJECTS` has one `href` per project and no repo-versus-live split, so three of the four (MerchTrack, Games of the Generals, Your Daily Tarot) point at the profile `https://github.com/gab-cat`. Signal's `src/designs/signal/content.ts` then guesses `live: !href.includes("github.com")`, and nothing checks that a link goes where the card says. The fix is a `repo` and a `live` field in the data, and a check in `scripts/seo-check.ts` that fails on a profile URL standing in for a project.
  - The site's facts drift from LinkedIn and the CV because nothing ties them together. `src/data.ts` is the one source on the site, so sync from it: when LinkedIn or the CV changes (a role, a date, a number), change `src/data.ts` first and let everything else follow. Never fix a fact in one place only.
  - The contact form once broke on `www.gabcat.dev` because the handler checks the browser's `Origin` against exactly `https://gabcat.dev`. Commit `3cb4959` redirects www to the apex in `vercel.json` instead of loosening the check. If a contact error says "send your message from the contact page", look at the origin first.
  - When the rate-limit store went away, the whole form went down with it. Commits `560da07` and `4c6dc01` made the store fail fast, log why, and fall back to in-memory limits. A free database disappearing must not take the form down.
- **Know who you're building for.** This is Gab's own site, so there is no client ledger entry. See [Client ledger](#client-ledger).

## 2. Understand before you touch

- **Facts come from one place.** `src/data.ts` holds every claim: `JOURNEY`, `PROJECTS`, `TROPHIES`, `TOOLBOX`, `CRAFT`, `STATS`, `SOCIALS`, `EMAIL`. `src/designs/signal/content.ts` only reshapes it (newest roles first, no em dashes). `src/seo.ts` builds the JSON-LD, `llms.txt`, `llms-full.txt`, `robots.txt`, the sitemap and the manifest from the same data. Never type a fact into a page, a meta tag or a text file.
- **Read the real code paths**: the page (`src/designs/signal/pages/Home.tsx`, `Contact.tsx`, `NotFound.tsx`), the styles (`src/designs/signal/styles/signal.css`), the scene (`src/designs/signal/scene/stage.ts`, `field.ts`), the helpers in `src/lib/`, and `scripts/prerender.ts` plus `scripts/seo-check.ts` for anything that reaches the built HTML. Whole functions, not grep hits.
- **Designs are swappable.** `src/designs/live.ts` holds `LIVE_DESIGN` (`signal`). `vite.config.ts` aliases `@design` to the live folder, or to `DESIGN=<id>`. `src/designs/types.ts` is the contract every design meets (`Frame`, `Design`, `ServerDesign`, `DesignHead`). Signal is live since 2026-09-27. Clay (`src/designs/clay`) is archived and must keep building, because Gab wants to be able to come back to it (also tagged `clay-site`). Shared code (`src/data.ts`, `src/seo.ts`, `src/lib`, router) is shared with clay.
- **Find the existing pattern** before inventing one: `Rise`, `Lines` and `Stagger` in `src/designs/signal/reveal.tsx` for reveals, `Magnetic` for buttons, `Link` in `src/lib/router.tsx` for navigation, `useContactForm` in `src/lib/contact-form.ts` for the form. A second way of doing the same thing is a cost.
- **Research when unsure.** For WebGL, shaders, scroll and award-style motion, look at how the reference studios do it (Lusion and Igloo Inc are named in `signal.css`) and the platform docs (MDN, Vercel). Say in your report what you learned.

## 3. Build end to end

A change is done when a visitor can use it start to finish and the build still proves it.

- **Data first.** Any content change goes in `src/data.ts`. Then it must show up in Signal, in clay, in the JSON-LD, in `public/llms.txt` and `public/llms-full.txt`, and in the sitemap. `bun run check` verifies the output.
- **`llms-full.txt` is generated, not hand-maintained.** `llmsFullTxt()` in `src/seo.ts` writes it during `bun scripts/prerender.ts`. The copies in `public/` are committed snapshots that the build overwrites in `dist/`; as of 2026-11-09 `public/llms.txt` and `public/llms-full.txt` match the built output, while `public/sitemap.xml` differs only in its `lastmod`. Don't hand-edit them. If you want the snapshot refreshed, copy the built file over it and say so.
- **Server**: the only function is `api/contact.ts` backed by `server/contact.ts`. See [backend.md](backend.md).
- **Client**: every state in [ui.md](ui.md), with Signal's rules for figures and layout.
- **Copy**: plain words, no em dashes in Signal (`content.ts` strips them from shared copy; write new copy without them), no gendered pronouns about Gab (memory: `design-explorations`).
- **Wiring**: new routes go in `src/seo.ts` (`RouteId`, `ROUTES` or `pageSeo`, `routeFromPath` and `PAGE_PATHS`), the router, both designs' `server.tsx`/`meta.ts`, and the sitemap. A new inline script changes the CSP hash (see [backend.md](backend.md#csp-and-headers)).
- **Proof**: run `bun run check` (see Commands). Then a real run in a browser at laptop and phone width, light and dark.
- **Before and after screenshots for every UI change.** Capture the page before you edit and again after, same route, theme and viewport, plus a phone-width pair (820px and below is the phone layout). Attach both, labelled Before and After. WebGL screenshots need a real GPU browser; if you can't get one, say so and show the closest honest thing, marked as a mock. Never show a client project's candidate or customer data in a screenshot.
- **Docs**: `README.md` documents designs, SEO, the CSP hash and the contact variables. Update it when you change them.

## 4. Commands

| Command | What it does |
|---|---|
| `bun run dev` | Vite dev server for the live design (Signal), with the contact function mounted locally. |
| `bun run dev:clay` | Same, for the clay design (`DESIGN=clay`). |
| `bun run build` | `tsc -b`, client build, SSR build, then `scripts/prerender.ts` writes the pages and discovery files into `dist/`. |
| `bun test server` (`bun run test`) | The contact handler tests in `server/contact.test.ts`. |
| `bun run seo:check` | `scripts/seo-check.ts` on the built `dist/`: titles, canonicals, JSON-LD, sitemap, llms files, CSP hash, asset and size budgets. |
| `bun run check` | Tests, build and `seo:check` in one go. This is what CI runs (`.github/workflows/deploy.yml`). |
| `DESIGN=clay bun run build && DESIGN=clay bun run seo:check` | Proves clay still builds after you touch shared code. |

Status on `main` (2026-11-09): `bun run check` passes clean in about 4 seconds (29 tests, build, `seo:check passed (signal)`). The SSR build prints one harmless warning, `createPortal is imported from external module "react-dom" but never used` in `src/designs/signal/pages/Contact.tsx`; the import is used on the client (line 292), so the warning is only the server build tree-shaking it. Leave it. The clay build and its `seo:check` also pass. So any failure you see is yours.

## 5. Own the outcome

- **You have authority to go past the ask.** Fix the adjacent bug, a broken link, a copy slip, a missing state, an unused import, a number that disagrees with another page. Do it when it serves the goal of the request.
- **Expand toward the goal, not sideways.** Extras make the asked-for thing better or complete. A new section, figure or page nobody asked for is a proposal in your report. Problems you find get solved or reported with their cause; features you think of get proposed.
- **Always say what you added** beyond the ask and why, as a short list.
- **Ask first only when the call is really Gab's.** In this repo that means:
  - Naming a client or employer behind a codenamed project, or adding numbers that could identify one. Client work appears only under a codename (`Project Relay`, `Project Meridian`, …) with `confidential` set in `src/data.ts`; this repo is public, so real client names never go in code, copy, commits or screenshots.
  - Claims about awards, users or results that can't be checked against `src/data.ts` or a public source.
  - Deploys. Vercel deploys through its Git integration (see the comment in `.github/workflows/deploy.yml`), so a push to `main` is production for `gabcat.dev`. Commit and push only when Gab says so.
  - Changing `LIVE_DESIGN`, which swaps the whole site.
  - The CSP in `vercel.json`, the contact endpoint's rate limits (`limit(...)` calls in `server/contact.ts`), its fixed recipient and sender, and DNS or domain settings.
  - Any message to a real person, including a test send that reaches `catimbanggabriel@gmail.com`.
  Ask one clear question with your recommendation, and keep working on everything that doesn't depend on the answer.

## Client ledger

This repo has no client. It is Gab's own site: `client_ledger.py which` reports
"No client mapped to this repo", and you should not create or link one. The
general skill's ledger rules still apply when Gab pastes a client's message in a
different repo.

- The clients behind the codenamed projects are not this repo's client. Don't read or write their ledgers here, never name them in this public repo, and never show candidate, customer or company data in screenshots, copy or tests. Client screenshots in `public/work/` are redacted before they land (brand words replaced; logos, photos, names and chat widgets blurred or hidden).
- Nothing from `~/.claude/clients/` is ever copied into this repo.

## Done gate

Check every line before you say done:

- [ ] You found and proved the real cause or need, fixed it at the root, and checked for the same problem elsewhere.
- [ ] The goal works for a visitor start to finish, including phone width, light and dark, no WebGL, reduced motion and the contact failure paths.
- [ ] Any fact you touched lives in `src/data.ts` and shows up in Signal, clay, JSON-LD, `llms.txt`, `llms-full.txt` and the sitemap.
- [ ] Every Signal rule in [ui.md](ui.md) holds, including Gab's recorded layout feedback, and the known deviations were raised, not extended.
- [ ] Every control has hover, press, focus and disabled states, and every async action shows pending then success or error.
- [ ] `bun run check` passes, and `DESIGN=clay bun run build && DESIGN=clay bun run seo:check` passes if you touched shared code.
- [ ] Lighthouse-sensitive changes (new JS, fonts, images, above-the-fold copy) were checked against the budgets in `scripts/seo-check.ts`, and the main entry did not grow without a reason.
- [ ] If an inline script changed, the CSP hash in `vercel.json` is updated and `seo:check` is green.
- [ ] Secrets stay server-side, with no `VITE_` prefix on anything private.
- [ ] For any UI change, Before and After screenshots are attached to the report.
- [ ] `README.md` is updated where your change made it stale.
- [ ] You re-read your diff line by line as a strict reviewer and removed debug code, dead code and stray edits. Nothing is committed unless Gab asked.

## Conventions

- Commit subjects are one sentence in the imperative, capitalised, ending with a period, saying what changed for the site: "Keep the contact form working when its rate-limit store is gone.", "Replace the chapter rail with a radio-tuner scroll dial and hide the scrollbar." Some older commits use `feat:` prefixes; don't copy those.
- Commit and push only when Gab asks. `main` is production.
- Package manager is Bun. Don't add npm or yarn lockfiles. CI installs with `--frozen-lockfile`.
- The `reels/` folder (ad videos) is excluded in `.git/info/exclude`. Don't commit it.

## Report

Lead with what the visitor can do or see now. For a UI change, show the Before and After screenshots next. Then the real cause you found and the evidence, in a line or two. Then list what you added beyond the ask, other problems you found and what you did about each, what you verified and how (include the `bun run check` result), what you chose not to do and why, and any open question. Plain words, no hype. If something failed or wasn't verified, say so.
