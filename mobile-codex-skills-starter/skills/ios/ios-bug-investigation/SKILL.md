---
name: ios-bug-investigation
description: Investigate iOS bugs using existing architecture, logs, and web behavior as reference.
---

# iOS Bug Investigation Skill

Use this skill when:
- debugging iOS behavior
- comparing iOS and web behavior
- investigating regressions
- fixing crash-prone flows

## Workflow

1. Reproduce or infer the failing flow.
2. Compare iOS behavior with existing web behavior.
3. Inspect recent changes and neighboring code.
4. Identify root cause, not just symptom.
5. Apply the smallest safe fix.
6. Add regression tests where possible.

## Check

- state transitions
- threading/main actor usage
- navigation lifecycle
- optional/null handling
- stale cached data
- feature flag state
- auth/session state

## Output

Include:
- root cause
- fix
- regression test coverage
- remaining uncertainty
