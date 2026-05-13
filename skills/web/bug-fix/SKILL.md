---
name: web-bug-fix
description: Fix bugs in an existing web project with minimal, evidence-based changes.
---

# Web Bug Fix Skill

Use this skill when the user reports a bug or asks to fix broken behavior.

## Mission

Find the root cause and fix it with the smallest safe change.

## Hard Rules

- Do not rewrite surrounding code unless necessary.
- Do not change unrelated behavior.
- Do not hide errors without fixing the cause.
- Do not silence tests or lint rules to pass checks.

## Workflow

1. Reproduce or inspect the bug.
2. Identify expected behavior from code/tests/docs/user request.
3. Find the smallest root-cause fix.
4. Add/update a regression test if practical.
5. Run relevant checks.
6. Report cause and fix.

## Debug Checklist

Inspect:

- console errors
- network errors
- route params
- state transitions
- null/undefined values
- async race conditions
- environment variables
- auth state
- permissions
- Firebase rules/config if relevant

## Final Output

Report:

- root cause
- fix made
- files changed
- tests/checks run
- remaining risk
