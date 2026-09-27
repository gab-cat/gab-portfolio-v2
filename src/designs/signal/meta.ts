import type { DesignHead } from "../types";

export const head: DesignHead = {
  id: "signal",
  // Geist Mono only sets small labels, so it can arrive a beat later.
  fontPreloads: ["/fonts/mona-sans-latin-wdth-normal.woff2"],
  routeModules: {
    home: ["pages/Home.tsx", "scene/field.ts"],
    contact: ["pages/Contact.tsx", "scene/field.ts"],
    notFound: ["pages/NotFound.tsx", "scene/field.ts"],
  },
  intro:
    "From noise to signal. I'm Gabriel Catimbang. I take half-formed ideas and turn them into software people use, then keep it running.",
  theme: { light: "#efeee9", dark: "#060607", accent: "#e2480f" },
  brand: "/brand/signal",
};
