# Contributing to Learn New

Thanks for helping make Learn New a better learning product. The project values evidence of understanding over content volume, and focused improvements over feature sprawl.

## Before opening a pull request

1. Read `AGENTS.md` for the product and privacy boundaries.
2. Keep the core journey intact: materials → map → story-led explanation → check → Feynman or Socratic deep learning → review.
3. Use only public or fictional examples. Never commit private learning material, credentials, or internal company information.
4. In `web/`, run:

   ```bash
   npm test
   npm run build
   ```

5. Check the changed flow on both desktop and a narrow mobile viewport.

## Good contributions

- clearer story-to-concept mappings with explicit limits and counterexamples;
- better retrieval, transfer, and teach-back checks;
- accessible keyboard, screen-reader, contrast, and responsive improvements;
- secure material parsing and storage;
- evidence-based review scheduling;
- new learning packs backed by public sources.

## Pull request shape

Keep each pull request focused. Explain the learner problem, the behavior you changed, how you verified it, and any follow-up work that remains. Include screenshots for visible changes.
