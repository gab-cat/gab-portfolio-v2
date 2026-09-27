import type { ServerDesign } from "../types";
import { Frame } from "./Frame";
import { head } from "./meta";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

export const design: ServerDesign = {
  Frame,
  pages: { home: Home, contact: Contact, notFound: NotFound },
  head,
};
