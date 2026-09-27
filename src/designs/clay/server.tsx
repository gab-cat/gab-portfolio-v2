import type { ServerDesign } from "../types";
import { Frame } from "./Frame";
import { head } from "./meta";
import ContactApp from "./pages/ContactApp";
import HomeApp from "./pages/HomeApp";
import NotFoundApp from "./pages/NotFoundApp";

export const design: ServerDesign = {
  Frame,
  pages: { home: HomeApp, contact: ContactApp, notFound: NotFoundApp },
  head,
};
