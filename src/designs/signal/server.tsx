import type { ServerDesign } from "../types";
import { Frame } from "./Frame";
import { head } from "./meta";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Project from "./pages/Project";
import Work from "./pages/Work";

export const design: ServerDesign = {
  Frame,
  pages: { home: Home, work: Work, project: Project, contact: Contact, notFound: NotFound },
  head,
};
