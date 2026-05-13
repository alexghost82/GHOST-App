---
name: ios-testing
description: Add or improve iOS tests for feature logic, mapping, and release safety.
---

# iOS Testing Skill

Use this skill when:
- adding tests
- improving test coverage
- making logic testable
- validating state transitions

## Test Priority

Prioritize tests for:
1. ViewModel state transitions
2. API DTO decoding
3. mapper behavior
4. error handling
5. feature flag branches
6. analytics triggering

## Rules

Avoid brittle UI snapshot tests unless the project already relies on them.

Prefer:
- deterministic unit tests
- fake services
- explicit async expectations
- small test cases

## Required Cases

Where relevant, test:
- loading to success
- loading to error
- empty response
- retry flow
- unauthorized flow
- unknown enum values
