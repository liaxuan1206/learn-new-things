# Learn New — Design System and Interaction Rules

## Direction

Learn New is a warm adult “digital learning desk,” not a school dashboard and not a generic AI chat shell. The experience should feel editorial, calm, tactile, and quietly intelligent.

## Visual language

- Foundation: warm ivory paper with white surfaces.
- Primary accents: dusty terracotta, muted plum, restrained ochre, and quiet green.
- Headings: Noto Serif SC for an editorial, reflective tone.
- Interface text: Noto Sans SC for clarity.
- Cards: light borders, modest shadows, rounded corners, and generous internal spacing.
- Icons: Phosphor icons with consistent line weight; icons supplement labels rather than replace them.
- Decoration: small sparkles, stamps, rails, notes, and paper-like layering may suggest a desk, but never compete with the learning task.

## Anti-template guardrails

- No purple-to-blue gradients, neon glows, floating orb backgrounds, or generic “AI assistant” hero treatments.
- Do not wrap every text group in a card. Use open editorial spacing, rules, shelves, and paper sections where grouping is already clear.
- Do not nest decorative cards inside decorative cards.
- Avoid rounded-square icon tiles above every heading.
- Use tinted ink instead of pure black and maintain readable contrast on colored surfaces.
- Motion is quiet and purposeful; no bounce or elastic easing.
- A redesign preserves Learn New’s copy, information architecture, and adult digital-desk identity instead of swapping in a generic SaaS template.

## Hierarchy

Each screen should answer three questions in this order:

1. Where am I?
2. What am I learning or deciding now?
3. What should I do next?

Use a single dominant heading and a single primary action per stage. Secondary actions remain visibly subordinate.

## Application structure

- Public landing: product promise, method, domains, and one clear entry action.
- Signed-in shell: persistent desktop sidebar and mobile bottom navigation.
- Workspace: topic breadcrumb, stage navigation, source access, main learning content, and optional progress context.
- Learning center: overview first, then history, calibration, profile, and preferences.

## Workspace rules

- Preserve the selected topic across every stage.
- Show the current pack and concept in the workspace breadcrumb.
- The materials stage confirms the selection before showing alternatives.
- A learning path is a sequential checklist, not a decorative mind map.
- The progress rail may disappear before the main learning content becomes cramped.
- Source excerpts must match the current topic or uploaded file.

## Responsive behavior

- Desktop shell starts with a 236 px sidebar and a fluid content area.
- At medium desktop widths, the optional progress rail is removed before content is compressed.
- Stage navigation may scroll horizontally when labels cannot fit.
- Below 760 px, the sidebar becomes a four-item bottom navigation.
- Cards collapse to one column; primary actions become full width where useful.
- No screen should depend on horizontal page scrolling.

## Interaction and feedback

- Hover and selected states use border, background, and restrained shadow changes.
- All asynchronous prototype actions show immediate progress and a clear completion message.
- Disabled actions explain their prerequisite through nearby text.
- Mastery feedback is encouraging but specific; it must not imply evidence the prototype did not collect.
- Every icon-only interactive control requires an accessible name.

## Writing style

- Chinese is direct, warm, and adult.
- Prefer concrete verbs: “确认路径”“回看讲解”“讲给 AI 听”.
- Avoid school-like punishment language such as “错误次数” or “落后”.
- Call unresolved understanding “待澄清”“待验证” or “边界”.
- Label demo behavior and future capabilities explicitly.

## Design QA checklist

- Topic continuity is correct from library selection through deep learning.
- Primary action and current stage are visible without guesswork.
- Text does not clip at 1280 px, 1024 px, or 390 px widths.
- Focus, selected, loading, empty, and error states are visible.
- Icon-only controls have accessible names.
- No debug UI, invented production data, or false cloud-processing claims appear.
