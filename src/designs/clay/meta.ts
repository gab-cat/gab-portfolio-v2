import type { DesignHead } from "../types";

export const head: DesignHead = {
  id: "clay",
  fontPreloads: ["/fonts/PowerGroteskTrial-Bold.woff2", "/fonts/instrument-sans-latin-wght-normal.woff2"],
  routeModules: {
    home: ["pages/HomeApp.tsx"],
    contact: ["pages/ContactApp.tsx"],
    notFound: ["pages/NotFoundApp.tsx"],
  },
  intro:
    "It starts with a what if. I'm Gabriel Catimbang. I turn curiosity into things people use, and I build the pipelines that keep them running.",
  theme: { light: "#f6f1e8", dark: "#15120f", accent: "#e8501f" },
  brand: "/brand/clay",
};
