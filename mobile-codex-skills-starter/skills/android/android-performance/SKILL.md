---
name: android-performance
description: Investigate and improve Android performance without risky rewrites.
---

# Android Performance Skill

Use this skill when:
- Compose UI recomposes too often
- scrolling is slow
- startup is slow
- memory grows unexpectedly
- network or parsing is expensive

## Workflow

1. Identify measurable symptom.
2. Inspect recent changes and related feature code.
3. Look for unstable parameters, large recomposition scopes, blocking work, and repeated effects.
4. Propose the smallest safe fix.
5. Add regression protection where possible.

## Common Fixes

- use stable UI models
- move heavy work out of Composables
- use `remember` or `derivedStateOf` carefully
- reduce recomposition scope
- avoid repeated `LaunchedEffect` triggers
- debounce user actions

## Do Not

- rewrite architecture as a first step
- introduce caching without invalidation rules
- hide bugs with arbitrary delays

## Output

Include:
- suspected cause
- files inspected
- fix applied
- remaining risks
