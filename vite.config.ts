import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createContactHandler } from "./server/contact";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), {
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
}));
