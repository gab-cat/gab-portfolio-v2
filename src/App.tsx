import { routeFromPath } from "./seo";
import ContactApp from "./pages/ContactApp";
import HomeApp from "./pages/HomeApp";
import NotFoundApp from "./pages/NotFoundApp";

/** Used by prerender. The client entry loads a single route module instead. */
export default function App({ path = "/" }: { path?: string }) {
  const route = routeFromPath(path);
  if (route === "contact") return <ContactApp />;
  if (route === "notFound") return <NotFoundApp />;
  return <HomeApp />;
}
