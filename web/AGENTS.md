# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable product decisions

- The public product name is “Learn New”. Do not use “Learn New Things” or “Renew” in the interface or published metadata.
- The public header includes a language selector with 中文, English, 日本語, and 한국어.
- The product serves anyone learning a new concept; university exam revision is only one example.
- Desktop web is the primary surface and must remain responsive on mobile.
- The visual direction is a warm adult “digital desk” using ivory, pastel pink, and lavender.
- The core journey is: email sign in → choose/upload material → confirm a sequential learning path → simple explanation → mastery check → Feynman or Socratic deep learning → learning center.
- Use “认知校准档案” instead of childish labels such as “错题本” or “薄弱点”.
- The learner supplies their own API key. Never ask for it in chat; prototype settings keep it only in browser-local storage.
- A learning map means the concrete order of learning, not a conceptual mind map. Each step must state what to learn, how to learn it, how long it takes, and what counts as complete.
- The learning workspace must always offer explicit routes back to the domain library and today desk. Source excerpts are an optional toggle, never a blocking sidebar.
- The explanation stage teaches before it tests: start with a story, reveal the concept near the ending, formally decode the concept and its metaphors, keep a real-life example visible, then offer “讲解完成，进入互动学习”.
- Deep learning must keep the full names “费曼学习法” and “苏格拉底学习法” visible, including the current mode.
- Keep the public website and the signed-in learning product visually and structurally distinct. The public page explains the product, shows a dynamic greeting/date/calendar, and offers login; app navigation appears only after login.
- The signed-in navigation has one canonical route for each area: 今日桌面 → 领域书架 → 学习空间 → 学习中心. Do not duplicate learning-center entrances in the primary navigation.
- The avatar menu contains personal settings and logout. Account, API Key, and privacy remain in personal settings; learning preferences and AI personality/intelligence controls belong inside the learning center.
- Authentication is email-only. Do not add phone login or SMS verification to the prototype.
- Learning reminders appear only on the product homepage/today desk. Do not request system push permission or send reminder emails.
- The first signed-in experience is a short product tour. API configuration is requested only when the learner starts a real learning session or explicitly opens settings.
- The domain picker should feel like a browsable bookshelf, support upload, and include varied adult-learning topics beyond management and product.
- Keep library search and category filters on separate rows. The shelf should feel rich, with question-led discovery cards and varied topics.
- Today desk includes a daily knowledge briefing, learning fun fact, or AI learning observation; clearly label mock editorial content in the prototype.
- Make “当前薄弱环节” visible inside the learning center while keeping “认知校准档案” as the professional system name.
- The learning center includes a human-readable AI observation with “值得表扬”, “优先改进”, and “接下来怎么练”.

## Story-first explanation

- Teach before asking the learner to interact: narrative explanation → delayed concept reveal → formal definition → metaphor mapping and boundaries → comprehension check → Feynman or Socratic interaction.
- For abstract concepts, begin with a fictional allegory or story without naming the concept in the opening. Reveal the concept near the ending, then explicitly map every important story element to the professional idea.
- Do not let the story oversimplify the concept. The full explanation must include mechanisms, limitations, counterexamples, and a reminder that the metaphor is not the concept itself.
