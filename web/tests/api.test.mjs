import assert from "node:assert/strict";
import test from "node:test";
import worker from "../worker/index.js";

class MemoryKv {
  constructor() {
    this.values = new Map();
  }

  async get(key, type) {
    const entry = this.values.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.values.delete(key);
      return null;
    }
    return type === "json" ? JSON.parse(entry.value) : entry.value;
  }

  async put(key, value, options = {}) {
    this.values.set(key, {
      value,
      expiresAt: options.expirationTtl ? Date.now() + options.expirationTtl * 1000 : null,
    });
  }

  async delete(key) {
    this.values.delete(key);
  }
}

function createEnv(overrides = {}) {
  return {
    LEARN_NEW_STORE: new MemoryKv(),
    COOKIE_SECURE: "false",
    ALLOW_DEMO: "true",
    ASSETS: { fetch: async () => new Response("missing", { status: 404 }) },
    ...overrides,
  };
}

async function call(env, path, init = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  return worker.fetch(new Request(`http://learn-new.test${path}`, { ...init, headers }), env);
}

function cookieFrom(response) {
  return response.headers.get("set-cookie")?.split(";")[0] || "";
}

test("health reports deploy-time capabilities without exposing secrets", async () => {
  const response = await call(createEnv({ AI_API_KEY: "secret", AI_MODEL: "model" }), "/api/health");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: "learn-new",
    version: "1.0.0",
    storage: true,
    ai: true,
  });
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});

test("registers, restores, and logs out an email account with an HTTP-only session", async () => {
  const env = createEnv();
  const registration = await call(env, "/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: "lia@example.com", password: "correct-horse-42", name: "Lia" }),
  });
  assert.equal(registration.status, 201);
  assert.match(registration.headers.get("set-cookie"), /HttpOnly/);
  assert.equal((await registration.json()).user.email, "lia@example.com");

  const cookie = cookieFrom(registration);
  const session = await call(env, "/api/auth/session", { headers: { cookie } });
  assert.equal(session.status, 200);
  assert.equal((await session.json()).user.name, "Lia");

  const logout = await call(env, "/api/auth/logout", { method: "POST", headers: { cookie } });
  assert.equal(logout.status, 200);

  const expired = await call(env, "/api/auth/session", { headers: { cookie } });
  assert.equal(expired.status, 401);
});

test("rejects weak passwords and duplicate accounts", async () => {
  const env = createEnv();
  const weak = await call(env, "/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: "lia@example.com", password: "short", name: "Lia" }),
  });
  assert.equal(weak.status, 400);

  const payload = JSON.stringify({ email: "lia@example.com", password: "correct-horse-42", name: "Lia" });
  assert.equal((await call(env, "/api/auth/register", { method: "POST", body: payload })).status, 201);
  assert.equal((await call(env, "/api/auth/register", { method: "POST", body: payload })).status, 409);
});

test("creates and updates learning sessions only for an authenticated user", async () => {
  const env = createEnv();
  const demo = await call(env, "/api/auth/demo", { method: "POST" });
  const cookie = cookieFrom(demo);

  const created = await call(env, "/api/learning-sessions", {
    method: "POST",
    headers: { cookie },
    body: JSON.stringify({
      packId: "ai-agents",
      packTitle: "AI 智能体",
      conceptTitle: "AI 智能体",
      stage: "map",
      mastery: 18,
    }),
  });
  assert.equal(created.status, 201);
  const record = (await created.json()).session;

  const updated = await call(env, `/api/learning-sessions/${record.id}`, {
    method: "PATCH",
    headers: { cookie },
    body: JSON.stringify({ stage: "deep", mastery: 68, evidence: ["完成一次费曼复述"] }),
  });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).session.mastery, 68);

  const listed = await call(env, "/api/learning-sessions", { headers: { cookie } });
  const sessions = (await listed.json()).sessions;
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].stage, "deep");

  const wrongConfirmation = await call(env, "/api/me/learning-data", {
    method: "DELETE",
    headers: { cookie },
    body: JSON.stringify({ confirmation: "wrong@example.com" }),
  });
  assert.equal(wrongConfirmation.status, 400);

  const cleared = await call(env, "/api/me/learning-data", {
    method: "DELETE",
    headers: { cookie },
    body: JSON.stringify({ confirmation: "demo@learnnew.app" }),
  });
  assert.equal(cleared.status, 200);
  assert.equal((await cleared.json()).deleted, 1);

  const anonymous = await call(createEnv(), "/api/learning-sessions");
  assert.equal(anonymous.status, 401);
});

test("persists an account-scoped study sprint and normalizes task data", async () => {
  const env = createEnv();
  const demo = await call(env, "/api/auth/demo", { method: "POST" });
  const cookie = cookieFrom(demo);
  const saved = await call(env, "/api/study-plan", {
    method: "PUT",
    headers: { cookie },
    body: JSON.stringify({
      goal: "用双系统思维分析一次真实决策",
      dailyMinutes: 240,
      tasks: [{
        id: "day-1",
        day: "第 1 天",
        date: "8月2日",
        title: "建立故事直觉",
        method: "故事讲解",
        duration: 18,
        evidence: "能说出两套系统的差别",
        done: true,
      }],
    }),
  });
  assert.equal(saved.status, 200);
  const savedPlan = (await saved.json()).plan;
  assert.equal(savedPlan.dailyMinutes, 180);
  assert.equal(savedPlan.tasks[0].done, true);

  const loaded = await call(env, "/api/study-plan", { headers: { cookie } });
  assert.equal(loaded.status, 200);
  assert.equal((await loaded.json()).plan.goal, "用双系统思维分析一次真实决策");

  const anonymous = await call(createEnv(), "/api/study-plan");
  assert.equal(anonymous.status, 401);
});

test("rejects cross-origin writes", async () => {
  const response = await call(createEnv(), "/api/auth/demo", {
    method: "POST",
    headers: { origin: "https://attacker.example" },
  });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, "ORIGIN_REJECTED");
});

test("keeps AI credentials server-side and reports missing configuration clearly", async () => {
  const env = createEnv();
  const demo = await call(env, "/api/auth/demo", { method: "POST" });
  const response = await call(env, "/api/teachback", {
    method: "POST",
    headers: { cookie: cookieFrom(demo) },
    body: JSON.stringify({ mode: "feynman", topic: "AI 智能体", input: "Agent 会调用工具完成目标。" }),
  });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "AI_NOT_CONFIGURED");
});
