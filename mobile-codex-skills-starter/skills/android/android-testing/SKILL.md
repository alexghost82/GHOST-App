---
name: android-testing
description: Add or improve Android tests for feature logic, mapping, and release safety.
---

# Android Testing Skill

Use this skill when:
- adding tests
- improving test coverage
- validating state transitions
- making logic testable

## Test Priority

Prioritize tests for:
1. ViewModel state transitions
2. repository behavior
3. DTO serialization
4. mapper behavior
5. feature flag branches
6. analytics triggering

## Rules

Prefer:
- deterministic unit tests
- fake repositories
- coroutine test dispatchers
- small test cases

Avoid:
- brittle UI tests for simple logic
- sleeps/timeouts
- testing implementation details

## Required Cases

Where relevant, test:
- loading to success
- loading to error
- empty response
- retry flow
- unauthorized flow
- unknown enum values
