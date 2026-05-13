---
name: ios-performance
description: Investigate and improve iOS performance without risky rewrites.
---

# iOS Performance Skill

Use this skill when:
- UI is slow
- scrolling stutters
- startup is slow
- memory grows unexpectedly
- network or parsing is expensive

## Workflow

1. Identify the measurable symptom.
2. Inspect recent changes and related feature code.
3. Look for main-thread work, large View recomputation, excessive state updates, and repeated network calls.
4. Propose the smallest safe fix.
5. Add regression protection when possible.

## Common Fixes

- move heavy work off main actor
- reduce View body complexity
- split large Views
- cache mapped data where safe
- avoid repeated task execution
- debounce user-triggered actions

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
