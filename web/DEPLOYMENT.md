# Learn New — Deployment

## What is ready

The build contains:

- versioned frontend assets in `dist/client`;
- an edge worker in `dist/server`;
- same-origin account, session, learning-record, export/delete, and teaching-feedback APIs;
- SPA fallback that excludes API and write requests;
- automated API and packaging tests.

## Local development

```bash
npm install
npm run dev
```

Vite starts the frontend and an in-memory development API on the same origin. Demo login works without external services. To test real teaching feedback, copy `.env.example` to `.env.local` and set `AI_API_KEY` and `AI_MODEL`.

Development storage resets when the Vite process restarts. Production must use the persistent `LEARN_NEW_STORE` binding.

## Production build

```bash
npm test
npm run build
```

Do not deploy when either command fails.

## Cloudflare Workers

1. Create a Workers KV namespace for accounts, sessions, and learning records.
2. Copy `wrangler.example.jsonc` to `wrangler.jsonc`.
3. Replace `PASTE_YOUR_KV_NAMESPACE_ID` with the namespace ID.
4. Choose the deployed model in `AI_MODEL`.
5. Store the model key as an encrypted Worker secret:

```bash
npx wrangler secret put AI_API_KEY
```

6. Build and deploy:

```bash
npm test
npm run build
npx wrangler deploy
```

The asset configuration invokes the Worker first for `/api/*` and exposes the built frontend through the `ASSETS` binding.

## Required production checks

- `GET /api/health` returns `storage: true`.
- If real AI is expected, `/api/health` also returns `ai: true`.
- Registration sets an HTTP-only, Secure, SameSite=Lax session cookie.
- An anonymous request to `/api/learning-sessions` returns 401.
- A request with a foreign `Origin` cannot write.
- A topic selected in the library remains the topic in map, lesson, check, and teach-back.
- Desktop (1280 px) and mobile (390 × 844) have no clipped primary content.

## Secret and data rules

- Never put `AI_API_KEY`, real account data, or uploaded learning materials in Git.
- Keep `COOKIE_SECURE=true` in production.
- Set `ALLOW_DEMO=false` if the public deployment should not offer a shared demo account.
- Back up or migrate the KV namespace before changing key formats.
- Uploaded file parsing is not enabled in the production API yet; the current browser entry remains an explicitly labeled demo until isolated object storage and parsing jobs are added.
