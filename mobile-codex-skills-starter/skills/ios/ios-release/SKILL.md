---
name: ios-release
description: Prepare and review iOS release changes safely.
---

# iOS Release Skill

Use this skill when:
- preparing App Store/TestFlight release
- reviewing release risk
- changing build configuration
- updating app versioning

## Workflow

1. Inspect release scripts and CI.
2. Inspect signing/configuration assumptions.
3. Check feature flags and kill switches.
4. Check migrations and backend compatibility.
5. Check crash/analytics visibility.
6. Produce release-risk summary.

## Required Checks

- build succeeds
- tests pass
- app version/build number updated if required
- environment configuration is correct
- secrets are not committed
- debug flags are disabled
- feature flags have safe defaults

## Output

Include:
- release readiness
- blockers
- risks
- rollback/kill-switch notes
