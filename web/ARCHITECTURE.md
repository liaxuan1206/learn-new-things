# Learn New — Architecture

## Shape

Learn New is a same-origin React application with an edge API. Static assets and API routes are deployed together so authentication cookies, CSRF checks, and learning data do not require cross-origin exceptions.

```text
Browser
  ├─ React learning workspace
  └─ /api/*
       └─ Edge worker
            ├─ password and session service
            ├─ learning-record service
            ├─ teaching-feedback adapter
            └─ KV persistence
```

## Frontend

- React 19 and Vite.
- `src/App.jsx` owns the product flow and accessible UI states.
- `src/api.js` is the only browser-to-server boundary.
- No model key is accepted or stored by the browser.
- The selected knowledge pack is the source of truth for the path, story, check, excerpts, prompts, and saved progress.

## Edge API

- `worker/index.js` routes `/api/*`, applies security headers, serves static assets, and performs SPA fallback.
- `worker/api.js` contains the API contract and business rules.
- Passwords use PBKDF2-SHA-256 with a unique salt and 210,000 iterations.
- Sessions use random opaque tokens. Only a SHA-256 digest is stored; the browser receives an HTTP-only, SameSite=Lax cookie.
- Write requests with a foreign `Origin` are rejected.
- Authentication routes are rate-limited.
- JSON payload size and user-controlled field lengths are bounded.

## Storage keys

The production binding is named `LEARN_NEW_STORE`.

```text
email:{normalizedEmail}              -> userId
user:{userId}                        -> user record
session:{sha256(sessionToken)}       -> session record (30-day TTL)
learning-index:{userId}              -> latest 100 learning session IDs
learning:{userId}:{learningSessionId}-> learning session
study-plan:{userId}                  -> account-scoped 7-day sprint
rate:auth:{address}:{minute}         -> login/register attempt counter
```

KV gives a simple deployable baseline and globally fast reads. If the product later needs transactional billing, organization membership, or high-frequency analytics, move those domains to a relational store while preserving the API contract.

## AI boundary

`POST /api/teachback` is authenticated and calls an OpenAI-compatible server endpoint using deploy-time secrets:

- `AI_API_KEY` — encrypted deployment secret;
- `AI_MODEL` — deployed model name;
- `AI_BASE_URL` — optional compatible endpoint.

When the model service is not configured, the UI keeps the verified demo teaching feedback. The fallback is explicit and never pretends a remote model was called.

## Failure behavior

- API failures use a stable `{ error: { code, message } }` envelope.
- Missing storage returns `503 STORAGE_NOT_CONFIGURED`.
- Missing model configuration returns `503 AI_NOT_CONFIGURED`.
- Unauthenticated data access returns `401 AUTH_REQUIRED`.
- The SPA fallback never converts missing API routes or write requests into HTML.

## Future production domains

- object storage and isolated parsing jobs for uploaded source files;
- email verification and password recovery;
- organization/team tenancy;
- background evaluation and adaptive-path jobs;
- structured observability and cost limits;
- relational storage when cross-record transactions become necessary.
