import "./styles/index.css";
import "./styles/site.css";
import "./styles/home.css";
import "./styles/contact.css";
import type { Design } from "../types";
import { Frame } from "./Frame";

/** The clay world (live until September 2026). Each page brings its own AppShell. */
const clay: Design = {
  Frame,
  async load(route) {
    if (route === "contact") return (await import("./pages/ContactApp")).default;
    if (route === "notFound") return (await import("./pages/NotFoundApp")).default;
    return (await import("./pages/HomeApp")).default;
  },
};

export default clay;
