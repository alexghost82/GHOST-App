---
name: web-testing
description: Add, repair, and run tests for an existing web project without changing unrequested functionality.
---

# Web Testing Skill

Use this skill when the user asks for testing, test coverage, bug validation, regression testing, or CI test preparation.

## Mission

Test the existing project behavior accurately. Do not change product behavior unless fixing a confirmed bug within the user's request.

## Hard Rules

- Do not rewrite implementation just to make tests easier.
- Do not delete failing tests unless explicitly requested and justified.
- Do not weaken assertions to make tests pass.
- Do not snapshot huge unstable UI unless project already uses that style.

## Inspection Checklist

Identify:

- test runner: Jest, Vitest, Mocha, Jasmine, etc.
- UI test tool: Testing Library, Enzyme, Vue Test Utils, etc.
- e2e tool: Playwright, Cypress, WebdriverIO, etc.
- existing test naming conventions
- mock patterns
- setup files
- CI commands

## Test Types

Use the smallest relevant test type:

- Unit tests for pure logic.
- Component tests for UI behavior.
- Integration tests for connected flows.
- E2E tests for critical user journeys.

## What To Test

Prioritize:

- requested behavior
- bug regressions
- auth flows
- forms
- data loading
- error states
- empty states
- permission states
- routing
- critical conversion paths

## Assertions

Prefer testing user-visible behavior:

- text
- roles
- labels
- navigation result
- validation message
- enabled/disabled state

Avoid testing implementation details unless necessary.

## Validation Commands

Use available scripts, such as:

```bash
npm test
npm run test
npm run test:unit
npm run test:e2e
npm run coverage
```

Use the actual package manager.

## Output

Report:

- tests added/updated
- behavior covered
- commands run
- failures and likely causes
