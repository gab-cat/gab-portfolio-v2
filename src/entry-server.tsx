import { renderToString } from "react-dom/server";
import App from "./App";

/** Used by scripts/prerender.ts to bake the app into dist/index.html. */
export function render(): string {
  return renderToString(<App />);
}
