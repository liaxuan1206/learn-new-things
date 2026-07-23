# Learn New Things

> An adaptive learning Skill for new concepts, practical skills, and exam preparation.

把一个模糊的“我想学会它”，变成可以马上开始、能够验证效果、并且会根据学习结果自动调整的学习循环。

## Why this project

Most learning plans begin with a long resource list. This project begins with three different questions:

1. What does the learner already know?
2. What would count as observable mastery?
3. What is the smallest useful next step?

它不会只给你一份资料清单，而是先判断起点、定义“学会”的证据，再生成一段可以执行和复盘的学习过程。

## Three learning modes

| Mode | Best for | Evidence of progress |
| --- | --- | --- |
| `concept` | Understanding a new idea or field | Explain, compare, and apply it without notes |
| `skill` | Building a practical capability | Produce and improve a working artifact |
| `exam` | Preparing for a fixed deadline | Solve representative questions under realistic conditions |

## The learning loop

`diagnose → prioritize → learn → retrieve → apply → review → adapt`

- **Diagnose:** find the current baseline and likely knowledge gaps.
- **Prioritize:** build an 80/20 map instead of an oversized syllabus.
- **Learn:** study one bounded unit with a clear target.
- **Retrieve:** close the notes and recall from memory.
- **Apply:** solve a new problem or create a small artifact.
- **Review:** record errors and schedule the next revisit.
- **Adapt:** change the next session using real learning evidence.

## Try it

Example prompts:

```text
Use $learn-new-things to help me understand what an AI Agent is from scratch.
```

```text
Use $learn-new-things to build a 14-day plan for learning basic Web Coding.
```

```text
Use $learn-new-things to prepare for my final exam from this syllabus and these past papers.
```

## Project structure

```text
learn-new-things/
├── SKILL.md
├── agents/
│   └── openai.yaml
└── references/
    └── learning-modes.md
```

## Current status

`v0.1 — Skill foundation`

- [x] Concept, skill, and exam modes
- [x] Evidence-based mastery checks
- [x] Daily session and check-in templates
- [ ] Interactive diagnostic generator
- [ ] Reusable error log
- [ ] Progress adaptation rules
- [ ] Lightweight web prototype

## Design principles

- Active practice before passive resource collecting
- Observable evidence before confidence
- Small feedback loops before long rigid plans
- Sustainable study before all-night cramming
- Privacy-conscious handling of learning materials

---

Built in public by [Elia](https://github.com/liaxuan1206) — turning fuzzy learning goals into small, testable loops.
