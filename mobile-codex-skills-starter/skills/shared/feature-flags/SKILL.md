---
name: feature-flags
description: Implement and review feature-flagged mobile releases that depend on existing platform flags.
---

# Feature Flags Skill

Use this skill when:
- adding gated features
- migrating rollout logic from web to mobile
- reviewing release safety
- implementing experiments

## Core Rule

Feature flags are release-safety tools, not architecture substitutes.

## Workflow

1. Search existing web and mobile feature flags.
2. Reuse existing flag names when the same product behavior is being gated.
3. Inspect default values and fallback behavior.
4. Make disabled-state behavior explicit.
5. Make rollout and kill-switch behavior safe.
6. Add tests for enabled and disabled paths.

## Never

- invent flag names without checking existing systems
- hardcode permanent flag states
- hide broken states behind flags without documenting risk
- couple unrelated features to the same flag

## Required Checks

- fresh install behavior
- logged-out behavior
- offline behavior
- stale flag cache behavior
- flag removed behavior
- partial rollout behavior
