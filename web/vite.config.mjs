import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import worker from "./worker/index.js";
import { DevMemoryKv } from "./server/dev-memory-kv.mjs";

const devStore = new DevMemoryKv();

function learnNewApiPlugin(mode) {
  const runtime = loadEnv(mode, process.cwd(), "");
  const env = {
    LEARN_NEW_STORE: devStore,
    COOKIE_SECURE: "false",
    ALLOW_DEMO: "true",
    AI_API_KEY: runtime.AI_API_KEY,
    AI_MODEL: runtime.AI_MODEL,
    AI_BASE_URL: runtime.AI_BASE_URL,
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  };
  return {
    name: "learn-new-local-api",
    configureServer(server) {
      server.middlewares.use(async (incoming, outgoing, next) => {
        if (!incoming.url?.startsWith("/api/")) return next();
        const chunks = [];
        for await (const chunk of incoming) chunks.push(chunk);
        const body = chunks.length ? Buffer.concat(chunks) : undefined;
        const headers = new Headers();
        for (const [name, value] of Object.entries(incoming.headers)) {
          if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
          else if (value !== undefined) headers.set(name, value);
        }
        const origin = `http://${incoming.headers.host || "127.0.0.1"}`;
        const request = new Request(new URL(incoming.url, origin), {
          method: incoming.method,
          headers,
          body,
          ...(body ? { duplex: "half" } : {}),
        });
        const response = await worker.fetch(request, env);
        outgoing.statusCode = response.status;
        response.headers.forEach((value, name) => outgoing.setHeader(name, value));
        outgoing.end(Buffer.from(await response.arrayBuffer()));
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), learnNewApiPlugin(mode)],
}));
