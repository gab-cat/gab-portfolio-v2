import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import "./studio.css";
import "./sculpture.css";
import "./chapters.css";
import "./experience.css";
import "./contact.css";
import "./finale.css";
import { routeFromPath, type RouteId } from "./seo";

const container = document.getElementById("root")!;
const route = routeFromPath(window.location.pathname);

async function loadApp(id: RouteId) {
  if (id === "contact") return (await import("./pages/ContactApp")).default;
  if (id === "notFound") return (await import("./pages/NotFoundApp")).default;
  return (await import("./pages/HomeApp")).default;
}

void loadApp(route).then((Page) => {
  const app = (
    <StrictMode>
      <Page />
    </StrictMode>
  );

  if (container.firstChild) {
    hydrateRoot(container, app);
  } else {
    createRoot(container).render(app);
  }
});
