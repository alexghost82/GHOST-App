---
name: api-contracts
description: Validate compatibility between mobile applications and existing backend APIs.
---

# API Contracts Skill

Use this skill when:
- integrating APIs
- changing DTOs
- modifying serialization
- debugging backend compatibility
- mapping web-platform concepts into mobile models

## Core Rule

The backend and existing web platform behavior are the source of truth.

Never:
- invent fields
- silently ignore breaking changes
- rename API properties without a mapper
- change serialization assumptions
- hardcode example responses as truth

## Workflow

1. Inspect existing API clients and schemas.
2. Inspect the web implementation for the same feature.
3. Identify request shape, response shape, auth requirements, pagination, and error format.
4. Create separate DTO, domain, and UI models if the project uses that separation.
5. Add defensive parsing for nullable/missing/unknown values.
6. Add tests for mapping and error handling.

## DTO Rules

Separate:
- API DTOs
- domain models
- UI models

Never expose raw API models directly to UI unless the existing architecture explicitly does this.

## Serialization Rules

Handle:
- missing fields
- nullable values
- unknown enum values
- version mismatches
- empty arrays
- partial failures

Fail gracefully and preserve user trust.

## Output Requirements

When reporting results, include:
- endpoints touched
- fields added or mapped
- compatibility risks
- validation performed
- tests added or updated
