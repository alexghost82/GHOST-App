---
name: forms-validation
description: Improve or fix forms and validation in an existing web project without changing requested business behavior.
---

# Forms and Validation Skill

Use this skill when working on forms, validation messages, input handling, submit flows, or form UX.

## Mission

Make forms correct, clear, accessible, and consistent with existing behavior.

## Hard Rules

- Do not add new fields unless requested.
- Do not remove fields unless requested.
- Do not change validation rules unless requested.
- Do not change submitted payload shape unless requested.
- Do not bypass backend validation.

## Checklist

Review:

- required fields
- validation timing
- error messages
- disabled/loading submit state
- duplicate submit prevention
- preserving input after errors
- accessibility labels
- keyboard submission
- mobile keyboard type
- backend error mapping

## Implementation Rules

Use existing:

- form library
- validation schema library
- error display components
- API submit patterns

Do not introduce a new form library unless explicitly requested.

## Validation

Run:

- unit/component tests
- e2e form flow tests if available
- lint/typecheck/build

## Output

Report:

- form behavior changed
- validation behavior preserved or changed as requested
- files changed
- tests run
