---
name: crash-investigation
description: Investigate production crashes across iOS and Android with backend/web context.
---

# Crash Investigation Skill

Use this skill when:
- analyzing crash reports
- fixing production crashes
- reducing crash risk before release

## Workflow

1. Identify platform, app version, device/OS, and affected flow.
2. Map stack trace to source files.
3. Check recent changes in the same area.
4. Compare behavior with web/backend assumptions.
5. Identify root cause.
6. Apply smallest safe fix.
7. Add regression test if possible.

## Common Root Causes

- null/optional values from backend
- unknown enum values
- lifecycle race conditions
- navigation after disposal
- invalid cached data
- feature flag mismatch
- auth/session expiration

## Output

Include:
- probable root cause
- confidence level
- patch summary
- test coverage
- rollout/monitoring notes
