import "./styles/signal.css";
import type { Design } from "../types";
import { Frame } from "./Frame";

/** Signal: one particle field that re-forms for every part of the site. */
const signal: Design = {
  Frame,
  async load(route) {
    if (route === "contact") return (await import("./pages/Contact")).default;
    if (route === "notFound") return (await import("./pages/NotFound")).default;
    return (await import("./pages/Home")).default;
  },
};

export default signal;
