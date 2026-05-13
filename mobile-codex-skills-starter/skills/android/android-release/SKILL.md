---
name: android-release
description: Prepare and review Android release changes safely.
---

# Android Release Skill

Use this skill when:
- preparing Play Store release
- reviewing release risk
- changing Gradle/build config
- updating versioning

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
- lint passes
- versionCode/versionName updated if required
- secrets are not committed
- debug flags are disabled
- feature flags have safe defaults
- min/target SDK impact is understood

## Output

Include:
- release readiness
- blockers
- risks
- rollback/kill-switch notes
