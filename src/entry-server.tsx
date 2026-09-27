import { renderToString } from "react-dom/server";
import { design } from "@design/server";
import App from "./App";

/** Used by scripts/prerender.ts to bake the app into static HTML. */
export function render(path = "/"): string {
  return renderToString(<App path={path} />);
}

/** Fonts, colours and brand folder of the design being built, for each page's head. */
export const head = design.head;
