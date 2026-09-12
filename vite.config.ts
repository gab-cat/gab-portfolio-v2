import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { defineConfig, loadEnv, type PreviewServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createContactHandler } from "./server/contact";

function staticStatusPages() {
  return {
    name: "static-status-pages",
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        const dist = resolve(process.cwd(), "dist");
        if (url === "/contact" || url === "/contact/") {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(readFileSync(resolve(dist, "contact/index.html")));
          return;
        }
        if (
          url === "/" ||
          url.startsWith("/assets/") ||
          url.startsWith("/fonts/") ||
          url.startsWith("/portraits/") ||
          url.startsWith("/api/")
        ) {
          next();
          return;
        }
        const direct = resolve(dist, `.${url}`);
        if (existsSync(direct) && extname(direct)) {
          next();
          return;
        }
        if (existsSync(resolve(dist, "404.html"))) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(readFileSync(resolve(dist, "404.html")));
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), staticStatusPages(), {
    name: "local-contact-function",
    configureServer(server) {
      const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
      const handle = createContactHandler({ env });
      server.middlewares.use("/api/contact", async (req, res) => {
        try {
          // Bound the body before constructing a Web Request; mirrors production.
          const chunks: Buffer[] = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 16_384) { res.statusCode = 413; res.end(JSON.stringify({ error: "Your message is too long." })); return; }
            chunks.push(Buffer.from(chunk));
          }
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
          const response = await handle(new Request(`http://localhost/api/contact`, { method: req.method, headers, body: req.method === "POST" ? Buffer.concat(chunks) : undefined }), req.socket.remoteAddress ?? null);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(await response.text());
        } catch { res.statusCode = 500; res.end(JSON.stringify({ error: "The form is unavailable. Please email me directly." })); }
      });
    },
  }],
  base: "/",
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "three";
          if (id.includes("node_modules/motion")) return "motion";
          if (id.includes("node_modules/lenis")) return "lenis";
        },
      },
    },
  },
}));
