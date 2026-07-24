# Learn New maintenance rules

These rules apply to AI agents maintaining this repository.

## Product identity

- The public product name is exactly **Learn New**.
- Use lowercase `learn-new` only for machine-facing Skill identifiers and folder names.
- Do not use “Learn New Things” or “Renew” in public product copy.
- The product serves anyone learning a new concept. University exam revision is one scenario, not the sole audience.

## Learning model

- Teach before asking for interaction: for abstract concepts, prefer a story-led explanation, delayed concept reveal, formal decoding, metaphor mapping, and boundaries before mastery checks, Feynman teach-backs, or Socratic questioning.
- Treat stories as bridges to precision, not substitutes for definitions, mechanisms, limitations, or counterexamples.
- A learning map is a sequential path, not a mind map.
- Every learning-map step states what to learn, how to learn it, expected time, dependencies, and observable completion evidence.
- In Feynman mode, restate the learner’s meaning before identifying a gap.
- In Socratic mode, ask one high-value question at a time.
- Do not infer mastery from confidence alone.
- Use “cognitive calibration record” for the professional learning record. Avoid childish labels.

## Product experience

- Keep the public website and signed-in learning product distinct.
- Desktop web is primary and must remain responsive on mobile.
- Preserve the warm digital-desk direction: ivory, pastel pink, and lavender.
- Keep the public language choices: 中文, English, 日本語, and 한국어.
- Authentication remains email-only unless a later product decision explicitly changes it.
- Learning preferences and AI personality controls belong in the learning center.
- Always provide explicit routes out of the learning workspace.

## Privacy and public boundaries

- Never commit API keys, tokens, passwords, private learning materials, personal records, or production credentials.
- Never expose company-internal projects, documents, data, workflows, customers, screenshots, or confidential experience.
- Use only public or clearly fictional content in examples.
- Keep user-supplied API keys out of chat and front-end source.
- State clearly when login, AI, persistence, uploads, or voice are prototype-only.

## Repository responsibilities

- `README.md` is visitor-facing product, installation, and deployment documentation.
- `SKILL.md` contains the concise executable learning workflow.
- `agents/openai.yaml` contains Skill interface metadata only.
- `references/` contains detailed playbooks loaded on demand.
- This file records durable product and maintenance decisions.
- Keep detailed guidance in references rather than duplicating it in `SKILL.md`.
