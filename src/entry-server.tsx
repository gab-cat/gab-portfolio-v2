import { renderToString } from "react-dom/server";
import App from "./App";

/** Used by scripts/prerender.ts to bake the app into static HTML. */
export function render(path = "/"): string {
  return renderToString(<App path={path} />);
}
