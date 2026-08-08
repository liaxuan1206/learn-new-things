const encoder = new TextEncoder();
const SESSION_COOKIE = "lnt_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const AUTH_RATE_LIMIT = 12;
const MAX_JSON_BYTES = 256 * 1024;

function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function apiError(status, code, message, details) {
  return json({ error: { code, message, ...(details ? { details } : {}) } }, { status });
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function toBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function randomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return toBase64(new Uint8Array(digest));
}

async function hashPassword(password, salt = randomToken(18)) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: encoder.encode(salt),
      iterations: 210_000,
    },
    key,
    256,
  );
  return { salt, hash: toBase64(new Uint8Array(bits)) };
}

async function verifyPassword(password, salt, expectedHash) {
  const actual = await hashPassword(password, salt);
  const expected = fromBase64(expectedHash);
  const received = fromBase64(actual.hash);
  if (expected.length !== received.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected[index] ^ received[index];
  return difference === 0;
}

function parseCookies(request) {
  const result = {};
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    result[part.slice(0, separator).trim()] = decodeURIComponent(part.slice(separator + 1).trim());
  }
  return result;
}

function sessionCookie(token, env, maxAge = SESSION_TTL_SECONDS) {
  const secure = env.COOKIE_SECURE !== "false" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${maxAge}`;
}

function requireStore(env) {
  if (!env.LEARN_NEW_STORE) {
    throw Object.assign(new Error("Persistent storage is not configured."), { status: 503, code: "STORAGE_NOT_CONFIGURED" });
  }
  return env.LEARN_NEW_STORE;
}

async function readJson(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_JSON_BYTES) {
    throw Object.assign(new Error("Request body is too large."), { status: 413, code: "PAYLOAD_TOO_LARGE" });
  }
  try {
    return await request.json();
  } catch {
    throw Object.assign(new Error("Request body must be valid JSON."), { status: 400, code: "INVALID_JSON" });
  }
}

function requireSameOrigin(request) {
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(request.method)) return;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    throw Object.assign(new Error("Cross-origin writes are not allowed."), { status: 403, code: "ORIGIN_REJECTED" });
  }
}

async function enforceRateLimit(request, env) {
  const store = requireStore(env);
  const address = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "local";
  const bucket = Math.floor(Date.now() / 60_000);
  const key = `rate:auth:${address}:${bucket}`;
  const attempts = Number((await store.get(key)) || 0);
  if (attempts >= AUTH_RATE_LIMIT) {
    throw Object.assign(new Error("尝试次数过多，请稍后再试。"), { status: 429, code: "RATE_LIMITED" });
  }
  await store.put(key, String(attempts + 1), { expirationTtl: 120 });
}

async function createSession(user, env) {
  const store = requireStore(env);
  const token = randomToken();
  const tokenHash = await sha256(token);
  const now = new Date();
  const session = {
    userId: user.id,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString(),
  };
  await store.put(`session:${tokenHash}`, JSON.stringify(session), { expirationTtl: SESSION_TTL_SECONDS });
  return token;
}

async function getAuthenticatedUser(request, env) {
  const store = requireStore(env);
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = bearer || parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const tokenHash = await sha256(token);
  const session = await store.get(`session:${tokenHash}`, "json");
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null;
  return store.get(`user:${session.userId}`, "json");
}

async function requireUser(request, env) {
  const user = await getAuthenticatedUser(request, env);
  if (!user) {
    throw Object.assign(new Error("请先登录。"), { status: 401, code: "AUTH_REQUIRED" });
  }
  return user;
}

function validateCredentials(body, { registering = false } = {}) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw Object.assign(new Error("请输入有效邮箱。"), { status: 400, code: "INVALID_EMAIL" });
  }
  if (password.length < 10 || password.length > 128) {
    throw Object.assign(new Error("密码需要 10–128 个字符。"), { status: 400, code: "INVALID_PASSWORD" });
  }
  const name = String(body.name || email.split("@")[0]).trim().slice(0, 60);
  if (registering && !name) {
    throw Object.assign(new Error("请输入显示名称。"), { status: 400, code: "INVALID_NAME" });
  }
  return { email, password, name };
}

async function register(request, env) {
  await enforceRateLimit(request, env);
  const store = requireStore(env);
  const credentials = validateCredentials(await readJson(request), { registering: true });
  if (await store.get(`email:${credentials.email}`)) {
    return apiError(409, "EMAIL_EXISTS", "这个邮箱已经注册。");
  }
  const password = await hashPassword(credentials.password);
  const user = {
    id: crypto.randomUUID(),
    email: credentials.email,
    name: credentials.name,
    passwordSalt: password.salt,
    passwordHash: password.hash,
    createdAt: new Date().toISOString(),
  };
  await store.put(`user:${user.id}`, JSON.stringify(user));
  await store.put(`email:${user.email}`, user.id);
  const token = await createSession(user, env);
  return json(
    { user: publicUser(user) },
    { status: 201, headers: { "set-cookie": sessionCookie(token, env) } },
  );
}

async function login(request, env) {
  await enforceRateLimit(request, env);
  const store = requireStore(env);
  const credentials = validateCredentials(await readJson(request));
  const userId = await store.get(`email:${credentials.email}`);
  const user = userId ? await store.get(`user:${userId}`, "json") : null;
  if (!user || !(await verifyPassword(credentials.password, user.passwordSalt, user.passwordHash))) {
    return apiError(401, "INVALID_CREDENTIALS", "邮箱或密码不正确。");
  }
  const token = await createSession(user, env);
  return json({ user: publicUser(user) }, { headers: { "set-cookie": sessionCookie(token, env) } });
}

async function demoLogin(env) {
  if (env.ALLOW_DEMO !== "true") return apiError(404, "NOT_FOUND", "Not found.");
  const user = {
    id: "demo-user",
    email: "demo@learnnew.app",
    name: "Lia Xuan",
    createdAt: new Date().toISOString(),
  };
  const store = requireStore(env);
  await store.put(`user:${user.id}`, JSON.stringify(user));
  const token = await createSession(user, env);
  return json({ user: publicUser(user) }, { headers: { "set-cookie": sessionCookie(token, env) } });
}

async function logout(request, env) {
  const store = requireStore(env);
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = bearer || parseCookies(request)[SESSION_COOKIE];
  if (token) await store.delete(`session:${await sha256(token)}`);
  return json({ ok: true }, { headers: { "set-cookie": sessionCookie("", env, 0) } });
}

function normalizeLearningSession(body, existing = {}) {
  const stage = ["materials", "map", "lesson", "check", "deep", "completed"].includes(body.stage)
    ? body.stage
    : existing.stage || "materials";
  const masteryValue = Number(body.mastery ?? existing.mastery ?? 0);
  const mastery = Math.min(100, Math.max(0, Number.isFinite(masteryValue) ? masteryValue : 0));
  return {
    ...existing,
    packId: String(body.packId ?? existing.packId ?? "").slice(0, 80),
    packTitle: String(body.packTitle ?? existing.packTitle ?? "").slice(0, 120),
    conceptTitle: String(body.conceptTitle ?? existing.conceptTitle ?? "").slice(0, 180),
    stage,
    mastery,
    evidence: Array.isArray(body.evidence) ? body.evidence.slice(0, 20) : existing.evidence || [],
    notes: String(body.notes ?? existing.notes ?? "").slice(0, 4_000),
  };
}

async function listLearningSessions(request, env) {
  const user = await requireUser(request, env);
  const store = requireStore(env);
  const ids = (await store.get(`learning-index:${user.id}`, "json")) || [];
  const sessions = (await Promise.all(ids.slice(0, 100).map((id) => store.get(`learning:${user.id}:${id}`, "json"))))
    .filter(Boolean)
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
  return json({ sessions });
}

async function createLearningSession(request, env) {
  const user = await requireUser(request, env);
  const store = requireStore(env);
  const now = new Date().toISOString();
  const session = {
    id: crypto.randomUUID(),
    userId: user.id,
    ...normalizeLearningSession(await readJson(request)),
    createdAt: now,
    updatedAt: now,
  };
  if (!session.packId || !session.conceptTitle) {
    return apiError(400, "INVALID_LEARNING_SESSION", "知识包与学习主题不能为空。");
  }
  const indexKey = `learning-index:${user.id}`;
  const ids = (await store.get(indexKey, "json")) || [];
  await store.put(`learning:${user.id}:${session.id}`, JSON.stringify(session));
  await store.put(indexKey, JSON.stringify([session.id, ...ids.filter((id) => id !== session.id)].slice(0, 100)));
  return json({ session }, { status: 201 });
}

async function updateLearningSession(request, env, id) {
  const user = await requireUser(request, env);
  const store = requireStore(env);
  const key = `learning:${user.id}:${id}`;
  const existing = await store.get(key, "json");
  if (!existing) return apiError(404, "LEARNING_SESSION_NOT_FOUND", "没有找到这条学习记录。");
  const session = {
    ...normalizeLearningSession(await readJson(request), existing),
    id: existing.id,
    userId: user.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  await store.put(key, JSON.stringify(session));
  return json({ session });
}

async function clearLearningSessions(request, env) {
  const user = await requireUser(request, env);
  const body = await readJson(request);
  if (normalizeEmail(body.confirmation) !== user.email) {
    return apiError(400, "CONFIRMATION_REQUIRED", "请输入当前账号邮箱确认清除。");
  }
  const store = requireStore(env);
  const indexKey = `learning-index:${user.id}`;
  const ids = (await store.get(indexKey, "json")) || [];
  await Promise.all(ids.map((id) => store.delete(`learning:${user.id}:${id}`)));
  await store.delete(indexKey);
  await store.delete(`study-plan:${user.id}`);
  return json({ ok: true, deleted: ids.length });
}

function normalizeStudyPlan(body, existing = {}) {
  const minutesValue = Number(body.dailyMinutes ?? existing.dailyMinutes ?? 25);
  const dailyMinutes = Math.min(180, Math.max(10, Number.isFinite(minutesValue) ? Math.round(minutesValue) : 25));
  const tasks = Array.isArray(body.tasks)
    ? body.tasks.slice(0, 14).map((task, index) => ({
      id: String(task.id || `task-${index + 1}`).slice(0, 80),
      day: String(task.day || `第 ${index + 1} 天`).slice(0, 40),
      date: String(task.date || "").slice(0, 20),
      title: String(task.title || "学习任务").slice(0, 180),
      method: String(task.method || "故事讲解").slice(0, 80),
      duration: Math.min(180, Math.max(5, Number(task.duration) || 15)),
      evidence: String(task.evidence || "能用自己的话复述").slice(0, 240),
      done: Boolean(task.done),
    }))
    : existing.tasks || [];
  return {
    goal: String(body.goal ?? existing.goal ?? "掌握双系统思维，并能用它解释真实决策").trim().slice(0, 220),
    dailyMinutes,
    tasks,
  };
}

async function getStudyPlan(request, env) {
  const user = await requireUser(request, env);
  const store = requireStore(env);
  return json({ plan: await store.get(`study-plan:${user.id}`, "json") });
}

async function saveStudyPlan(request, env) {
  const user = await requireUser(request, env);
  const store = requireStore(env);
  const now = new Date().toISOString();
  const existing = (await store.get(`study-plan:${user.id}`, "json")) || {};
  const plan = {
    ...normalizeStudyPlan(await readJson(request), existing),
    createdAt: existing.createdAt || now,
    updatedAt: now,
  };
  if (!plan.goal || plan.tasks.length === 0) {
    return apiError(400, "INVALID_STUDY_PLAN", "学习目标与至少一个任务不能为空。");
  }
  await store.put(`study-plan:${user.id}`, JSON.stringify(plan));
  return json({ plan });
}

async function teachBack(request, env) {
  const user = await requireUser(request, env);
  if (!env.AI_API_KEY || !env.AI_MODEL) {
    return apiError(503, "AI_NOT_CONFIGURED", "服务器尚未配置 AI 服务，可以继续使用演示反馈。");
  }
  const body = await readJson(request);
  const mode = body.mode === "socratic" ? "socratic" : "feynman";
  const topic = String(body.topic || "").slice(0, 180);
  const input = String(body.input || "").trim().slice(0, 8_000);
  if (!topic || !input) return apiError(400, "INVALID_TEACHBACK", "学习主题和复述内容不能为空。");
  const system = mode === "feynman"
    ? "你是 Learn New 的费曼学习伙伴。先准确复述学习者的意思，再指出一个最关键的遗漏，最后只问一个问题。语言温暖、具体，不要替学习者直接完成答案。"
    : "你是 Learn New 的苏格拉底学习伙伴。先简短复述学习者的判断，然后只问一个能检查前提、证据或边界的问题。不要一次提出多个问题。";
  const upstream = await fetch(`${String(env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.AI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `学习主题：${topic}\n学习者：${user.name}\n复述：${input}` },
      ],
    }),
  });
  if (!upstream.ok) return apiError(502, "AI_UPSTREAM_ERROR", "AI 服务暂时不可用，请稍后重试。");
  const payload = await upstream.json();
  const feedback = payload.choices?.[0]?.message?.content?.trim();
  if (!feedback) return apiError(502, "AI_EMPTY_RESPONSE", "AI 服务没有返回有效反馈。");
  return json({ feedback, provider: "server" });
}

export async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  try {
    requireSameOrigin(request);

    if (path === "/api/health" && request.method === "GET") {
      return json({
        ok: true,
        service: "learn-new",
        version: "1.0.0",
        storage: Boolean(env.LEARN_NEW_STORE),
        ai: Boolean(env.AI_API_KEY && env.AI_MODEL),
      });
    }
    if (path === "/api/config" && request.method === "GET") {
      return json({
        auth: Boolean(env.LEARN_NEW_STORE),
        ai: Boolean(env.AI_API_KEY && env.AI_MODEL),
        demo: env.ALLOW_DEMO === "true",
      });
    }
    if (path === "/api/auth/register" && request.method === "POST") return await register(request, env);
    if (path === "/api/auth/login" && request.method === "POST") return await login(request, env);
    if (path === "/api/auth/demo" && request.method === "POST") return await demoLogin(env);
    if (path === "/api/auth/logout" && request.method === "POST") return await logout(request, env);
    if (path === "/api/auth/session" && request.method === "GET") {
      const user = await getAuthenticatedUser(request, env);
      return user ? json({ user: publicUser(user) }) : apiError(401, "AUTH_REQUIRED", "请先登录。");
    }
    if (path === "/api/learning-sessions" && request.method === "GET") return await listLearningSessions(request, env);
    if (path === "/api/learning-sessions" && request.method === "POST") return await createLearningSession(request, env);
    const learningMatch = path.match(/^\/api\/learning-sessions\/([0-9a-f-]+)$/i);
    if (learningMatch && request.method === "PATCH") return await updateLearningSession(request, env, learningMatch[1]);
    if (path === "/api/study-plan" && request.method === "GET") return await getStudyPlan(request, env);
    if (path === "/api/study-plan" && request.method === "PUT") return await saveStudyPlan(request, env);
    if (path === "/api/me/learning-data" && request.method === "DELETE") return await clearLearningSessions(request, env);
    if (path === "/api/teachback" && request.method === "POST") return await teachBack(request, env);
    return apiError(404, "NOT_FOUND", "API route not found.");
  } catch (error) {
    const status = Number(error.status) || 500;
    const code = error.code || "INTERNAL_ERROR";
    if (status >= 500) console.error("Learn New API error", error);
    return apiError(status, code, status >= 500 ? "服务暂时不可用。" : error.message);
  }
}
