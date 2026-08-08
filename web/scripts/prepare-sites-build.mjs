#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const modulePath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(modulePath), "..");

export function prepareSitesBuild(root = defaultRoot) {
  const dist = path.join(root, "dist");
  const index = path.join(dist, "client", "index.html");
  const worker = path.join(root, "worker", "index.js");
  const api = path.join(root, "worker", "api.js");
  const hosting = path.join(root, ".openai", "hosting.json");

  for (const file of [index, worker, api, hosting]) {
    if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
  }

  mkdirSync(path.join(dist, "server"), { recursive: true });
  mkdirSync(path.join(dist, ".openai"), { recursive: true });
  copyFileSync(worker, path.join(dist, "server", "index.js"));
  copyFileSync(api, path.join(dist, "server", "api.js"));
  copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));
}

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  prepareSitesBuild();
  console.log("Prepared Sites build: dist/server worker modules and dist/.openai/hosting.json");
}
