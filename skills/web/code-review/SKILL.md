---
name: web-code-review
description: Review existing web project changes for correctness, scope discipline, UX, security, tests, and deployment risk.
---

# Web Code Review Skill

Use this skill when reviewing code changes or before finalizing work.

## Mission

Review as a senior web engineer with strict scope control.

## First Principle

A change is suspicious if it does more than the user asked.

## Review Areas

### Scope

Check:

- Did the change match the request?
- Were features added without request?
- Were features removed without request?
- Was behavior changed silently?

### Architecture

Check:

- conventions followed
- correct layer boundaries
- no unnecessary new patterns
- no broad refactors

### UI/UX

Check:

- visual regressions
- accessibility
- responsive behavior
- loading/error/empty states

### Security

Check:

- XSS risk
- auth/session safety
- secret exposure
- unsafe redirects
- Firebase rule risk

### Tests

Check:

- relevant coverage
- assertions meaningful
- no weakened tests

### Deployment

Check:

- build risk
- environment config
- Firebase hosting config
- cache/rewrite behavior

## Output Format

## Critical
Blocking issues.

## Should Fix
Important issues.

## Nice To Have
Optional improvements not implemented.

## Scope Discipline
What stayed within request and what may exceed it.

## Risk Rating
Low / Medium / High
