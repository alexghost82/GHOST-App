---
name: android-navigation
description: Implement Android navigation compatible with existing app flows and deep links.
---

# Android Navigation Skill

Use this skill when:
- adding Compose destinations
- changing navigation graphs
- adding deep links
- integrating auth-gated routes

## Workflow

1. Inspect existing navigation graph and route patterns.
2. Inspect equivalent web routes.
3. Identify parameters, auth requirements, and back behavior.
4. Add navigation using existing abstractions.
5. Validate deep links if applicable.

## Do Not

- invent route formats
- pass large objects through navigation
- put business logic in navigation handlers
- trigger navigation repeatedly due to recomposition

## Required Checks

- cold start deep link
- logged-out deep link
- expired session behavior
- back stack behavior
- tab restoration
- configuration change behavior
