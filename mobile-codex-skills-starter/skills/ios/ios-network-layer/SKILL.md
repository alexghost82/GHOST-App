---
name: ios-network-layer
description: Implement or modify iOS networking while preserving backend/web compatibility.
---

# iOS Network Layer Skill

Use this skill when:
- adding endpoints
- changing API clients
- fixing request/response mapping
- integrating auth-protected backend flows

## Workflow

1. Inspect existing networking abstractions.
2. Inspect equivalent web API usage.
3. Identify auth requirements and error formats.
4. Add typed request/response DTOs.
5. Map DTOs to domain/UI models.
6. Add tests for decoding and mapping.

## Rules

Never:
- hardcode base URLs
- bypass auth/session clients
- expose raw DTOs to Views
- ignore unknown enum cases
- assume non-null fields unless backend guarantees them

Prefer:
- async/await
- dependency injection
- testable services
- defensive decoding
- explicit errors

## Validation

Check:
- success response
- empty response
- validation error
- unauthorized error
- server error
- offline/network failure
