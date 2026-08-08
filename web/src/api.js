async function request(path, options = {}) {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error?.message || "服务暂时不可用，请稍后重试。");
    error.code = payload.error?.code || "REQUEST_FAILED";
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const api = {
  config: () => request("/api/config"),
  session: () => request("/api/auth/session"),
  register: ({ email, password, name }) => request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  }),
  login: ({ email, password }) => request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }),
  demo: () => request("/api/auth/demo", { method: "POST" }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  listLearningSessions: () => request("/api/learning-sessions"),
  createLearningSession: (record) => request("/api/learning-sessions", {
    method: "POST",
    body: JSON.stringify(record),
  }),
  updateLearningSession: (id, record) => request(`/api/learning-sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(record),
  }),
  getStudyPlan: () => request("/api/study-plan"),
  saveStudyPlan: (plan) => request("/api/study-plan", {
    method: "PUT",
    body: JSON.stringify(plan),
  }),
  clearLearningSessions: (confirmation) => request("/api/me/learning-data", {
    method: "DELETE",
    body: JSON.stringify({ confirmation }),
  }),
  teachback: (record) => request("/api/teachback", {
    method: "POST",
    body: JSON.stringify(record),
  }),
};
