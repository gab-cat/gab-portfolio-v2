# gabcat.dev

Personal portfolio of **Gabriel "Gab" Catimbang**, developer & DevOps engineer
from Naga City, Philippines. Live at [gabcat.dev](https://gabcat.dev).

Light mode and dark mode are both first-class citizens (there's a toggle in the nav).

## Designs

The same three routes (`/`, `/contact`, `404`) and the same facts (`src/data.ts`)
render through one design at a time. Each lives in `src/designs/<id>` and the build
imports only the live one through the `@design` alias, so the others never ship.

| Design | What it is | Status |
| --- | --- | --- |
| `signal` | One GPU particle field (36,000 points on desktop, custom GLSL) that re-forms for each chapter. The hero is a black hole: the disk orbits (inner edge fastest), its far side bends up over the shadow, and stars bend around it as they drift past. Then a waveform, a lattice, a globe with arcs leaving Naga City, a seven, "hello." The contact waveform listens as you type; the 404 has no signal. | **Live** |
| `clay` | The hand-made clay world: procedural 3D machine hero, clay chapters, a postbox contact page, and the hero terminal (`help`, `coffee`, `sudo hire-me`). | Archived, still builds |

- **Ship a different design:** change `LIVE_DESIGN` in `src/designs/live.ts`.
- **Preview one without shipping it:** `bun run dev:clay`, or `DESIGN=<id> bun dev`. `DESIGN=<id> bun run build` builds it.
- The clay site exactly as it was live is also tagged `clay-site` in git.
- Each design's `meta.ts` sets what the prerender puts in every head: fonts to preload, theme colours, and a brand folder (`public/brand/<id>/`) with the favicon, app icons and social card (Signal's also holds the still black hole shown without WebGL). Regenerate them with `bun scripts/brand-signal.ts` or `bun scripts/rasterize-brand.ts` (clay).
- Directions that were explored but not shipped are dev-only pages under `explorations/`; open `/explorations/` in dev.

## Stack

- [Vite](https://vitejs.dev) + [React 19](https://react.dev) + TypeScript
- [Three.js](https://threejs.org) for the particle field (and clay's 3D scenes), loaded in its own chunk
- [Motion](https://motion.dev) for reveals and springs, [Lenis](https://lenis.darkroom.engineering) for smooth scrolling
- [Phosphor](https://phosphoricons.com) icons; self-hosted Mona Sans and Geist Mono
- [Tailwind CSS v4](https://tailwindcss.com), used by the clay design only
- [Bun](https://bun.sh) for package management

Production HTML is prerendered for `/` and `/contact`, with a `noindex` `404.html`.
Crawler files live at `/robots.txt`, `/sitemap.xml`, `/llms.txt`, and `/llms-full.txt`.
Run `bun run check` to typecheck, test the contact API, build, and validate SEO artifacts.

## Performance and SEO

Measured with Lighthouse 12 on the production build (simulated mobile / desktop):

| Page | Mobile | Desktop |
| --- | --- | --- |
| `/` | 98 · 100 · 100 · 100 | 100 · 100 · 100 · 100 |
| `/contact` | 97 · 100 · 100 · 100 | 100 · 100 · 100 · 100 |
| `404` | 98 · 100 · 100 · (noindex) | |

(Performance · Accessibility · Best Practices · SEO; mobile LCP 2.2 s, TBT 0 ms, CLS 0.)

What keeps it there:

- The particle field is plain WebGL2 (one draw call, about 8 kB gzipped) instead of a 3D library, builds its figures in small slices, and compiles its shader off the main thread where the browser supports it. It loads in parallel with the app and never blocks the first paint.
- No animation library on Signal: reveals use IntersectionObserver and the Web Animations API. Copy that is on screen at first paint is never hidden, so the prerendered text is the largest paint.
- The prerender inlines the stylesheet when it is small, preloads the headline font, and adds `modulepreload` links for each route's own chunks (from the Vite manifest). The field needs no images: every figure is maths or text.
- Structured data: Person, Organization (logo at `/logo.png`, contact point), WebSite, ProfilePage with the selected work as an ItemList, ContactPage with breadcrumbs, and `dateModified` from git. `bun run seo:check` verifies all of it, plus the CSP hash of the inline theme script.

## Develop

```sh
bun install
bun dev        # local dev server
bun run build  # type-check + production build to dist/
bun run preview
```

Tip: append `?mode=light` or `?mode=dark` to the URL to force a theme.

The inline theme script in `index.html` is allowed by hash in the CSP in `vercel.json`.
If you edit it, update the hash; `bun run seo:check` fails until you do.

## Contact form and Vercel deployment

The site now has two prerendered pages: `/` and `/contact`. Import this repository
into Vercel using the Vite preset. `vercel.json` builds the static pages and deploys
`api/contact.ts` as a Node server function. The GitHub workflow validates tests and
builds; it no longer publishes to GitHub Pages, which cannot run the endpoint.
Connect `gabcat.dev` in Vercel and apply the DNS records Vercel provides when ready
to switch hosting. No DNS, hosting account, or production secrets are changed by
this repository update.

Set these **server-side** environment variables in Vercel, then redeploy:

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | A Resend key with sending access for the verified domain |
| `CONTACT_ORIGIN` | `https://gabcat.dev` (exact browser origin, no trailing slash) |
| `UPSTASH_REDIS_REST_URL` | HTTPS REST endpoint from an Upstash Redis database |
| `UPSTASH_REDIS_REST_TOKEN` | Database REST token with read/write and EVAL access |

Verify `generalsonline.app` in Resend and publish the required DNS records. The
sender is fixed to `Gabcat Portfolio <contact@generalsonline.app>`. Messages are
sent only to `catimbanggabriel@gmail.com`; Reply-To is the validated visitor email.
No automatic reply is sent to arbitrary visitors. Never use a `VITE_` prefix for
these secrets. `.env.example` lists the variables, and `.env.local` is ignored.
For a Vercel preview domain, explicitly configure its exact `CONTACT_ORIGIN` in
that preview environment before using the form. Configure the primary domain's
redirect in Vercel so visitors use the same origin.

`bun dev` includes the same contact handler through a local Vite adapter. For
local sending, use `.env.local` with `CONTACT_ORIGIN=http://localhost:5173` and
valid Resend/Upstash credentials. Without credentials, the UI displays a helpful
email fallback and the endpoint returns 503. It never pretends to send a message.
`bun run preview` previews static output only; use `bun dev` or `vercel dev` for
function testing. Vercel sets `VERCEL=1` and its trusted forwarding header on
hosted functions; the local Vite adapter instead uses the socket address.

### Abuse protection

- Same-origin JSON submissions, no permissive CORS, 16 KiB streamed body limit.
- Server validation: name 2–80 chars, email at most 254, one of four topics,
  message 20–5,000 chars, and control-character rejection.
- Honeypot plus HMAC-signed, IP-bound form sessions. Tokens require at least
  3 seconds and expire after 30 minutes; the Resend key signs tokens server-side.
- Atomic Redis limits shared across function instances: 30 form sessions / 15 min,
  8 submission attempts / 15 min, 5 sends / hour per IP, 3 / hour per email, and
  a global maximum of 30 send attempts / rolling 24 hours. Failed sends and
  retries count conservatively against the caps.
- Redis stores only keyed hashes, counters, and message fingerprints, with
  expirations; names and message content are not stored there. Provider email
  data remains subject to Resend and inbox retention.
- A form nonce is bound to one message, and Resend idempotency keys make exact
  retries safe. Changed messages require a refreshed form session.
- Missing Redis, missing API key, unknown trusted IP, and provider errors fail
  closed. Generic errors never reveal credentials, provider payloads or PII.

These controls bound sending rather than promising an abuse-proof public URL.
Enable Vercel Firewall/Bot Protection and platform spend alerts to curb large
request floods before they reach the function or Redis. Limits are deliberately
small for a personal portfolio and can be adjusted in `server/contact.ts`.

Run `bun test server` for boundary, rate-limit, replay, validation, and failure
checks. Tests use mocked Redis and Resend; they do not send live email. After
production configuration, submit one real note and confirm receipt and Reply-To.

Primary implementation references:
[Vercel Web Handlers](https://vercel.com/docs/functions/functions-api-reference),
[Vercel trusted IP headers](https://vercel.com/docs/headers/request-headers),
[Resend send API](https://resend.com/docs/api-reference/emails/send-email),
[Upstash REST commands](https://upstash.com/docs/redis/features/restapi).
