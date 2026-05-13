---
name: backend-integration
description: Integrate mobile features with an existing web backend and web-platform behavior.
---

# Backend Integration Skill

Use this skill when mobile work depends on existing backend or web behavior.

## Goal

Make mobile behavior match the existing production web platform unless the task explicitly requires a mobile-specific difference.

## Workflow

1. Search the web app for the equivalent feature.
2. Identify API calls, payloads, query params, cache behavior, feature flags, and analytics.
3. Inspect backend client abstractions in the mobile app.
4. Reuse existing auth, retry, refresh-token, and error handling flows.
5. Implement mobile-specific UI while preserving domain behavior.
6. Validate edge cases against the web implementation.

## Do Not

- Create a second source of truth.
- Duplicate backend logic already represented in shared clients.
- Bypass auth/session interceptors.
- Assume web-only defaults apply to mobile without checking.

## Required Checks

- Authenticated and unauthenticated behavior.
- Expired session behavior.
- Slow network behavior.
- Empty response behavior.
- Server error behavior.
- Permission/role-based behavior.
