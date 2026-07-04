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

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with
Bun and publishes `dist/` to GitHub Pages (custom domain via `public/CNAME`).
GitHub Pages must be set to deploy from **GitHub Actions** in the repo
settings.
