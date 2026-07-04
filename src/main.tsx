import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/instrument-sans/wght-italic.css";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/instrument-serif";
import "@fontsource/instrument-serif/400-italic.css";
import "./index.css";
import App from "./App.tsx";

const container = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Production HTML is prerendered at build time — hydrate it. Dev serves an
// empty root — render from scratch.
if (container.firstChild) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
