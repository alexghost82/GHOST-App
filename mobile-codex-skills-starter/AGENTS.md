# Mobile Project AI Rules

This repository contains an existing web platform and native mobile applications.

The mobile apps MUST stay compatible with:
- existing backend APIs
- existing authentication flows
- existing analytics events
- existing feature flags
- existing design system
- existing business logic

Before implementing anything:
1. inspect existing APIs
2. inspect existing architecture
3. inspect naming conventions
4. inspect analytics conventions
5. inspect localization conventions
6. inspect navigation conventions
7. inspect CI/test conventions

Never invent:
- API fields
- endpoint contracts
- analytics event names
- feature flag names
- localization keys
- design tokens
- navigation routes

Always search the repository first.

---

## iOS Rules

- SwiftUI for new UI unless the project has a clear UIKit convention.
- MVVM or existing project architecture.
- async/await for async work where supported.
- No networking inside Views.
- No business logic inside Views.
- All UI states must be explicit.
- Avoid force unwraps.

---

## Android Rules

- Kotlin + Jetpack Compose for new UI unless existing project conventions differ.
- UDF/MVI or existing architecture.
- StateFlow for observable state.
- No business logic inside Composables.
- Repositories or use cases for data access.
- Explicit UI state handling.

---

## Shared Rules

Always support:
- loading states
- empty states
- error states
- retry flows
- offline handling when applicable

Always consider:
- accessibility
- localization
- analytics
- performance
- testability
- backend compatibility
- release safety

---

## Pull Request Rules

Changes must:
- minimize regression risk
- avoid unnecessary refactors
- preserve API compatibility
- include tests when logic changes
- avoid duplicated logic
- explain risky decisions

---

## Code Style

Prefer:
- small composable functions
- predictable state flow
- strongly typed models
- reusable UI components
- deterministic behavior

Avoid:
- hidden side effects
- magic strings
- implicit state
- giant files
- speculative abstractions
- broad refactors unrelated to the task
