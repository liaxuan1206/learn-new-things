# Learn New — Product Definition

## Product promise

Learn New turns an unfamiliar topic or a user-provided source into a short, inspectable learning journey. It does not optimize for producing an answer quickly; it optimizes for helping the learner explain the idea, test it, find its boundary, and use it again.

## Primary user

Curious adults and knowledge workers who:

- regularly enter unfamiliar fields;
- prefer examples and stories before formal definitions;
- want a clear path instead of an open-ended chat;
- care about whether they truly understand, not only whether they finished reading.

## Core job

> When I need to understand a new field, help me move from “I have seen these words” to “I can explain, test, and apply the idea” without losing track of the source or the next step.

## Core journey

1. Sign in with email or enter the demo.
2. Choose a knowledge pack or add a local source.
3. Confirm the selected topic and generate a sequential learning path.
4. Read a story before the concept name and definition are revealed.
5. Inspect the concept, metaphor mapping, evidence, and boundary.
6. Complete a short mastery check.
7. Restate the idea in Feynman mode or reason through one question at a time in Socratic mode.
8. Capture a personal example, a boundary or counterexample, and an open question in the source-grounded evidence notebook.
9. Follow the 7-day learning sprint and complete each task with observable evidence.
10. Review history, due concepts, calibration notes, and the evolving learner profile.

## Learning contract

Every generated path must show:

- what the learner will learn;
- how the learner will learn it;
- how long it should take;
- what observable result counts as completion.

The chosen topic must remain consistent across the workspace header, learning path, lesson, check, prompts, source excerpts, and saved progress. A fallback or prototype experience must be labeled honestly.

## Teaching principles

- Story first, concept reveal later.
- One clear learning objective at a time.
- Feynman feedback begins by restating the learner’s meaning before identifying omissions.
- Socratic feedback asks one question at a time.
- A correct answer includes an applicable example and at least one boundary or counterexample.
- Mastery is evidence of explanation and transfer, not time spent in the interface.

## Trust and privacy

- Email is the only sign-in identifier in the current product.
- API keys remain browser-local in the prototype.
- Local-file handling is described truthfully; prototype behavior is never presented as cloud processing.
- Reading and writing external systems are treated as different risk levels.
- Irreversible or high-risk actions require explicit confirmation.

## Current release boundary

This repository now contains a deployable same-origin application: responsive React frontend, email/password accounts, HTTP-only sessions, persistent learning records, an account-synced 7-day sprint, a source-grounded evidence notebook, a server-side AI adapter, export/delete controls, API tests, and edge deployment packaging.

Uploaded-file parsing, long-running adaptive jobs, verified email delivery/password recovery, voice transcription, organization tenancy, and Office export remain later integration phases. Their UI must stay honestly labeled until the corresponding production service exists.

## Success signals

- A learner can reach a topic-specific path from the library without content switching to another subject.
- A first-time learner can identify the next step without instructions.
- The learner can state the concept, give an example, and name one boundary after a session.
- Core flows remain usable at desktop and mobile widths.
- Prototype limitations and data handling are visible at the moment they matter.
