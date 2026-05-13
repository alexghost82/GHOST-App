---
name: android-bug-investigation
description: Investigate Android bugs using existing architecture, logs, and web behavior as reference.
---

# Android Bug Investigation Skill

Use this skill when:
- debugging Android behavior
- comparing Android and web behavior
- investigating regressions
- fixing crash-prone flows

## Workflow

1. Reproduce or infer the failing flow.
2. Compare Android behavior with existing web behavior.
3. Inspect recent changes and neighboring code.
4. Identify root cause, not just symptom.
5. Apply the smallest safe fix.
6. Add regression tests where possible.

## Check

- state transitions
- coroutine lifecycle
- navigation effects
- nullable handling
- stale cached data
- feature flag state
- auth/session state
- recomposition-triggered side effects

## Output

Include:
- root cause
- fix
- regression test coverage
- remaining uncertainty
