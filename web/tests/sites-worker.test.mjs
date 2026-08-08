import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { prepareSitesBuild } from "../scripts/prepare-sites-build.mjs";
import worker from "../worker/index.js";

test("serves existing static assets without a fallback", async () => {
  const calls = [];
  const response = await worker.fetch(new Request("https://example.test/assets/app.js"), {
    ASSETS: {
      fetch: async (request) => {
        calls.push(new URL(request.url).pathname);
        return new Response("asset", { status: 200 });
      },
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/assets/app.js"]);
});

test("falls back to index.html for an unknown app route", async () => {
  const calls = [];
  const response = await worker.fetch(
    new Request("https://example.test/flow/step-two?source=share", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async (request) => {
          const url = new URL(request.url);
          calls.push(url.pathname + url.search);
          return new Response(url.pathname === "/index.html" ? "app" : "missing", {
            status: url.pathname === "/index.html" ? 200 : 404,
          });
        },
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/flow/step-two?source=share", "/index.html"]);
});

test("does not turn missing API routes into the app shell", async () => {
  let calls = 0;
  const response = await worker.fetch(
    new Request("https://example.test/api/missing", { headers: { accept: "application/json" } }),
    {
      ASSETS: {
        fetch: async () => {
          calls += 1;
          return new Response("missing", { status: 404 });
        },
      },
    },
  );

  assert.equal(response.status, 404);
  assert.equal(calls, 0);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});

test("does not turn non-API write requests into the app shell", async () => {
  let calls = 0;
  const response = await worker.fetch(
    new Request("https://example.test/flow", { method: "POST", headers: { accept: "text/html" } }),
    {
      ASSETS: {
        fetch: async () => {
          calls += 1;
          return new Response("missing", { status: 404 });
        },
      },
    },
  );

  assert.equal(response.status, 404);
  assert.equal(calls, 1);
});

test("emits the files required by Sites packaging", async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), "learn-new-sites-"));
  context.after(() => rm(root, { recursive: true, force: true }));

  await Promise.all([
    mkdir(path.join(root, "dist", "client"), { recursive: true }),
    mkdir(path.join(root, "worker"), { recursive: true }),
    mkdir(path.join(root, ".openai"), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(path.join(root, "dist", "client", "index.html"), "<main>Learn New</main>"),
    writeFile(path.join(root, "worker", "index.js"), "export default {};"),
    writeFile(path.join(root, "worker", "api.js"), "export const api = {};"),
    writeFile(path.join(root, ".openai", "hosting.json"), "{}"),
  ]);

  prepareSitesBuild(root);

  await access(path.join(root, "dist", "client", "index.html"));
  await access(path.join(root, "dist", "server", "index.js"));
  await access(path.join(root, "dist", "server", "api.js"));
  await access(path.join(root, "dist", ".openai", "hosting.json"));
});
