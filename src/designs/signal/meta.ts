import type { DesignHead } from "../types";

export const head: DesignHead = {
  id: "signal",
  // Geist Mono only sets small labels, so it can arrive a beat later.
  fontPreloads: ["/fonts/mona-sans-latin-wdth-normal.woff2"],
  routeModules: {
    home: ["pages/Home.tsx", "scene/field.ts"],
    work: ["pages/Work.tsx", "scene/field.ts"],
    project: ["pages/Project.tsx", "scene/field.ts"],
    contact: ["pages/Contact.tsx", "scene/field.ts"],
    notFound: ["pages/NotFound.tsx", "scene/field.ts"],
  },
  intro:
    "I build web apps and run them. I'm Gabriel Catimbang, a developer in Naga City, Philippines: I write the app, set up the Linux servers it runs on and wire the pipeline that ships it.",
  theme: { light: "#efeee9", dark: "#060607", accent: "#e2480f" },
  brand: "/brand/signal",
};
