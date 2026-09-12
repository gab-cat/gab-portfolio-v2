# gabcat.dev

Personal portfolio of **Gabriel "Gab" Catimbang** — developer & DevOps engineer
from Naga City, Philippines. Live at [gabcat.dev](https://gabcat.dev).

Orange & black, always. Light mode and dark mode are both first-class citizens
(there's a toggle in the nav — or type `theme` into the hero terminal).

## The terminal is real

The terminal in the hero accepts input. Try `help`, `coffee`, or `sudo hire-me`.

## Stack

- [Vite](https://vitejs.dev) + [React 19](https://react.dev) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) — theme tokens in `src/index.css`
- [Motion](https://motion.dev) — reveals, kinetic type, springs
- [Lenis](https://lenis.darkroom.engineering) — smooth scrolling
- [Bun](https://bun.sh) for package management

## Develop

```sh
bun install
bun dev        # local dev server
bun run build  # type-check + production build to dist/
bun run preview
```

Tip: append `?mode=light` or `?mode=dark` to the URL to force a theme.

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
