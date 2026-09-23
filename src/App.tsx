import type { ComponentType } from "react";
import type { RouteId } from "./seo";
import { RouterProvider, useRouter } from "./lib/router";
import ContactApp from "./pages/ContactApp";
import HomeApp from "./pages/HomeApp";
import NotFoundApp from "./pages/NotFoundApp";

const PAGES: Record<RouteId, ComponentType> = {
  home: HomeApp,
  contact: ContactApp,
  notFound: NotFoundApp,
};

function Page() {
  const Current = PAGES[useRouter().route];
  return <Current />;
}

/** Used by prerender. The client entry lazy-loads each route module instead. */
export default function App({ path = "/" }: { path?: string }) {
  return (
    <RouterProvider initialPath={path}>
      <Page />
    </RouterProvider>
  );
}
