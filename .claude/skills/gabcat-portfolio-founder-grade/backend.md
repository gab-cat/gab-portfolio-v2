# Backend in the gabcat.dev portfolio

There is one server function: the contact form. `api/contact.ts` is a thin Vercel
Node function; the logic is in `server/contact.ts` as `createContactHandler`, so the
tests and the local dev server run the same code. Keep it small and cheap. Vercel
bills a function by invocation and duration; a portfolio form sees a handful of
requests a week, so the real cost to watch is Resend email spend and abuse, not compute.

## Files

- `api/contact.ts`: builds the handler, derives the client IP from `x-vercel-forwarded-for` (only when `VERCEL === "1"`; never trust a user-supplied `X-Forwarded-For`), exports `GET` and `POST`.
- `server/contact.ts`: origin check, bounded JSON body (16 KiB), field validation, signed one-time token, rate limits, Resend send.
- `server/contact.test.ts`: 29 tests via `bun test server`. They cover foreign origins, honeypot, byte limits, token reuse and expiry, each rate limit, Resend idempotency, provider errors and the store-down fallback.
- `src/lib/contact-form.ts`: the browser half (`useContactForm`, `TOPICS`, `LIMITS`). It mirrors the server rules. Change both together.
- `src/designs/signal/pages/Contact.tsx`: the form UI.
- `vite.config.ts`: mounts the same handler in `bun run dev` as the `local-contact-function` plugin, so the form works locally.

## How a request flows

1. `GET /api/contact` returns a signed token (`id`, time, hashed IP). It is rate limited (30 per 15 minutes per IP).
2. `POST` must arrive from exactly the configured origin, as JSON, at least 3 seconds after the token was issued and within 30 minutes. Attempts are limited (8 per 15 minutes per IP).
3. Per-sender (3 per hour), per-IP (5 per hour) and a global daily cap (30) bound email spend even with rotating IPs and addresses.
4. A Redis `SET NX` lock binds the token to the exact message, so a retry sends the same Resend `Idempotency-Key` and never emails twice.
5. The email goes to a fixed recipient from a fixed sender, with the visitor's address as Reply-To. Browser input is never used as a recipient.

## Environment variables (names only)

Set on Vercel, server-side only. Never prefix with `VITE_`. The list is in `.env.example` and the README.

- `RESEND_API_KEY`: required. Without it the form fails closed with a 503.
- `CONTACT_ORIGIN`: the exact browser origin, no trailing slash. Locally set it to `http://localhost:5173` in `.env.local`.
- Rate-limit store, first set wins: Upstash REST (`UPSTASH_REDIS_REST_URL`/`_TOKEN`, or `CONTACT_KV_REST_API_URL`/`_TOKEN`, or `KV_REST_API_URL`/`_TOKEN`), then a TCP URL (`CONTACT_REDIS_URL`, then `REDIS_URL`) through the `redis` package.

## Rate-limit store: fail fast, log why, keep working

Commit `560da07` made the TCP client fail fast (`connectTimeout: 4000`, `reconnectStrategy: false`, `disableOfflineQueue: true`), so a dead host no longer hangs every request. Commit `4c6dc01` added an in-memory fallback (`memoryCommand`) that runs the same three commands (`EVAL`, `SET`, `GET`) per warm instance, logs `contact rate-limit store unavailable, using in-memory limits: <cause>`, and retries the real store after 60 seconds. The limits still apply, but only per instance. The lesson: a lost free database must not take the form down. Never log contact details, payloads or secrets; the existing messages carry only the error text.

## CSP and headers

`vercel.json` sets the security headers on every route: a strict Content-Security-Policy (`default-src 'self'`, `frame-ancestors 'none'`, `connect-src 'self'`, `img-src 'self' data:`), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy`.

- **The script-src hash covers one inline script**: the theme script in `index.html` (it adds the `dark` class before paint). `script-src` is `'self' 'sha256-…'`, so any edit to that script, even whitespace, changes the hash and the browser blocks it. `scripts/seo-check.ts` hashes the inline script in the built `dist/index.html` and fails with the hash it expects: `vercel.json CSP is missing the inline script hash 'sha256-…'`. Copy that value into `vercel.json` and rerun `bun run seo:check`. A new inline script, a new external script host, a font or image from another origin, or a `fetch` to another origin all need a CSP change; ask Gab first.
- **www redirects to the apex** (`redirects` in `vercel.json`, commit `3cb4959`). The contact handler compares `Origin` to exactly `https://gabcat.dev`; without the redirect, a visitor on `www.gabcat.dev` gets a 403. Don't loosen the origin check.
- **Cache headers**: `/api/*` is `no-store`; `/assets/*`, `/fonts/*` and `/portraits/*` are `immutable` for a year (hashed or stable names only: if you replace a file in `public/fonts` or `public/portraits`, give it a new name); `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt` and `site.webmanifest` revalidate every time.
- The function's `maxDuration` is 30 seconds. The Resend call times out at 10 and the store call at 4.

## Before you change the function

- Read the whole handler and its tests. Add a test for every new rule or failure path in `server/contact.test.ts`.
- Keep it fail-closed: missing key or untrusted IP is a 503, never an unsent success.
- Don't change the limits, recipient, sender or Resend payload without asking Gab; they decide how much mail he can receive.
- Test sends reach Gab's real inbox. Use the unit tests and an injected `fetch` (see how `server/contact.test.ts` does it) rather than sending real mail.
- `bun run check` runs the tests with the build and `seo:check`.

## Shipping

CI (`.github/workflows/deploy.yml`) runs `bun test server`, `bun run build` and `bun run seo:check` on pushes to `main` and on pull requests. Vercel's Git integration does the production deploy, so a push to `main` goes live. I could not verify the Vercel project settings from this repo; check them before assuming previews or auto-deploys.
