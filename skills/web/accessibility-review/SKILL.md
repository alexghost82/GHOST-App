---
name: accessibility-review
description: Review and improve accessibility of an existing web project without changing functionality.
---

# Accessibility Review Skill

Use this skill when the user asks to improve accessibility, keyboard support, screen reader behavior, or WCAG compliance.

## Mission

Make the existing UI more accessible while preserving existing functionality and visual intent.

## Hard Rules

- Do not remove UI controls.
- Do not change business logic.
- Do not change navigation flow unless explicitly requested.
- Do not hide information from assistive technologies unless appropriate.

## Checklist

Review:

- semantic HTML
- button vs link usage
- labels for inputs
- ARIA only when needed
- keyboard navigation
- focus order
- visible focus states
- color contrast
- alt text
- headings hierarchy
- modal focus trapping
- error announcements
- form validation messages

## Preferred Fixes

- Use semantic elements first.
- Add labels/descriptions.
- Improve focus management.
- Add accessible names.
- Fix keyboard traps.
- Use ARIA only when semantic HTML is insufficient.

## Validation

Run if available:

- accessibility tests
- Playwright accessibility checks
- axe checks
- lint
- build

## Output

Report:

- accessibility issues fixed
- behavior preserved
- files changed
- validation run
