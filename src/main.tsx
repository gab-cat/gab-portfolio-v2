import { StrictMode, type ComponentType } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import "./styles/site.css";
import "./styles/home.css";
import "./contact.css";
import { RouterProvider, useRouter } from "./lib/router";
import { routeFromPath, type RouteId } from "./seo";

const container = document.getElementById("root")!;
const pages: Partial<Record<RouteId, ComponentType>> = {};

async function loadPage(id: RouteId) {
  if (pages[id]) return;
  if (id === "contact") pages[id] = (await import("./pages/ContactApp")).default;
  else if (id === "notFound") pages[id] = (await import("./pages/NotFoundApp")).default;
  else pages[id] = (await import("./pages/HomeApp")).default;
}

/** The router only commits a route after loadPage resolves, so the module is always here. */
function Page() {
  const Current = pages[useRouter().route]!;
  return <Current />;
}

const path = window.location.pathname;

void loadPage(routeFromPath(path)).then(() => {
  const app = (
    <StrictMode>
      <RouterProvider initialPath={path} prepare={loadPage}>
        <Page />
      </RouterProvider>
    </StrictMode>
  );

  if (container.firstChild) {
    hydrateRoot(container, app);
  } else {
    createRoot(container).render(app);
  }
});
