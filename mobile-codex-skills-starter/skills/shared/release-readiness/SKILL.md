---
name: release-readiness
description: Review whether mobile changes are safe to release with existing backend and web platform constraints.
---

# Release Readiness Skill

Use this skill before merging or shipping significant mobile changes.

## Review Areas

- backend compatibility
- migration risk
- feature flags
- analytics visibility
- crash risk
- performance risk
- accessibility
- localization
- test coverage
- rollback options

## Workflow

1. Summarize changes.
2. Identify user-facing flows affected.
3. Identify backend/API dependencies.
4. Identify feature flags and kill switches.
5. Check platform-specific release concerns.
6. Produce release decision.

## Output Format

### Decision
Ready / Ready with caution / Not ready

### Blockers
Issues that must be fixed.

### Risks
Known risks and mitigation.

### Monitoring
What to watch after rollout.

### Rollback
How to disable or revert safely.
