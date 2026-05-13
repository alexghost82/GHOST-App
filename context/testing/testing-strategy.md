# Testing Strategy

## Test Philosophy

Test user-visible behavior and critical logic. Avoid brittle tests that only test implementation details.

## Test Levels

- Unit tests: pure logic and utilities.
- Component tests: UI behavior and states.
- Integration tests: connected flows.
- E2E tests: critical journeys.
- Visual/clickable tests: browser-level QA.

## Do Not

- Delete failing tests to pass CI.
- Weaken assertions.
- Rewrite production code only to satisfy tests.
- Add broad snapshots unless existing project uses them.

## Critical Flows To Test When Present

- login/logout
- forms
- navigation
- data loading
- errors
- empty states
- permissions
- checkout/payment if present
- Firebase-backed reads/writes if present
