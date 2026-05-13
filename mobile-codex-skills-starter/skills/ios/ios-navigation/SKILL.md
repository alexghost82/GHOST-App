---
name: ios-navigation
description: Implement iOS navigation compatible with existing app flows and deep links.
---

# iOS Navigation Skill

Use this skill when:
- adding screens to navigation
- changing navigation flows
- adding deep links
- integrating auth-gated routes

## Workflow

1. Inspect existing coordinators/navigation patterns.
2. Inspect equivalent web routes.
3. Identify entry points, auth requirements, and back behavior.
4. Add route/state changes using existing navigation architecture.
5. Validate deep links if applicable.

## Rules

Do not:
- create ad hoc navigation paths
- bypass existing coordinators
- break back behavior
- navigate directly from deeply nested Views unless existing architecture allows it

## Required Checks

- cold start deep link
- logged-out deep link
- expired session behavior
- back navigation
- tab restoration
- modal dismissal
