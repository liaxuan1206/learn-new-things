# Learn New Web

A deployable full-stack learning product that turns a selected topic into a sequential path, story-led explanation, mastery check, and Feynman or Socratic teach-back.

The current experience also includes an account-synced 7-day learning sprint, an evidence notebook tied to the active source, and an evidence-based review queue.

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm test
npm run build
```

## Project guides

- `PRODUCT.md` — audience, learning contract, release boundary.
- `DESIGN.md` — visual language, responsive rules, and anti-template guardrails.
- `ARCHITECTURE.md` — frontend, API, storage, authentication, and AI boundaries.
- `DEPLOYMENT.md` — local, production, and Cloudflare deployment steps.

The browser never stores model credentials. Production accounts and learning history use the same-origin edge API and a persistent `LEARN_NEW_STORE` binding.

The verification suite currently covers 12 API behaviors, including study-plan persistence and normalization.
