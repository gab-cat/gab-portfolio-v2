import type { ServerDesign } from "../types";
import { Frame } from "./Frame";
import { head } from "./meta";
import ContactApp from "./pages/ContactApp";
import HomeApp from "./pages/HomeApp";
import NotFoundApp from "./pages/NotFoundApp";

export const design: ServerDesign = {
  Frame,
  // Clay predates /work; it shows its home page (with its Work chapter) there.
  pages: { home: HomeApp, work: HomeApp, project: HomeApp, contact: ContactApp, notFound: NotFoundApp },
  head,
};
