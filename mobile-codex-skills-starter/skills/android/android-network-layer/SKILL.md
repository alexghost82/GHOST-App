---
name: android-network-layer
description: Implement or modify Android networking while preserving backend/web compatibility.
---

# Android Network Layer Skill

Use this skill when:
- adding endpoints
- modifying Retrofit/Ktor clients
- changing DTOs
- integrating auth-protected flows

## Workflow

1. Inspect existing networking setup.
2. Inspect equivalent web API usage.
3. Identify auth, headers, query params, and error formats.
4. Add typed DTOs and mappers.
5. Add tests for serialization/mapping.

## Rules

Never:
- hardcode base URLs
- bypass interceptors
- expose raw DTOs to Composables
- ignore unknown enum values
- assume non-null fields without proof

Prefer:
- repository boundaries
- explicit domain errors
- safe parsing
- testable clients

## Validation

Check:
- success response
- empty response
- validation error
- unauthorized error
- server error
- offline/network failure
