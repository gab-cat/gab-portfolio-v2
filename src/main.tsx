import { StrictMode, type ComponentType } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import design from "@design";
import { RouterProvider, useRouter } from "./lib/router";
import { routeFromPath, type RouteId } from "./seo";

const container = document.getElementById("root")!;
const pages: Partial<Record<RouteId, ComponentType>> = {};
const { Frame } = design;

async function loadPage(id: RouteId) {
  if (!pages[id]) pages[id] = await design.load(id);
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
        <Frame>
          <Page />
        </Frame>
      </RouterProvider>
    </StrictMode>
  );

  if (container.firstChild) {
    hydrateRoot(container, app);
  } else {
    createRoot(container).render(app);
  }
});
