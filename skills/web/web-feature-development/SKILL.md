---
name: web-feature-development
description: Continue developing an existing web project with exact-scope feature work, preserving existing behavior and architecture.
---

# Web Feature Development Skill

Use this skill when the user asks to add, modify, or complete web project functionality.

## Mission

Implement exactly the requested functionality in the existing web project without scope creep.

## Required Rules

- Follow `request-discipline` first.
- Inspect existing implementation before writing code.
- Preserve existing routes, APIs, state shape, and UI behavior unless explicitly requested.
- Use existing components and utilities before creating new ones.
- Add only the minimum new code required.

## Workflow

1. Restate the user request internally as a narrow task.
2. Locate relevant files.
3. Identify current architecture and conventions.
4. Implement the smallest safe change.
5. Add/update tests only for changed behavior.
6. Run available checks.
7. Report touched files and validation results.

## Frontend Rules

Use existing patterns for:

- components
- hooks/composables
- state management
- API calls
- error handling
- forms
- routing
- styling

Never add a new state library, UI library, API client, or form library unless explicitly requested.

## API/Data Rules

- Do not invent backend endpoints.
- Do not invent API fields.
- Do not change request/response contracts.
- Do not bypass existing API clients.
- Do not hardcode secrets or URLs.

## UI Rules

When changing UI:

- keep existing visual language
- preserve existing interaction behavior
- preserve accessibility
- preserve responsive behavior

Do not redesign unless asked.

## Validation

Run the most relevant available commands, such as:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Use the project's actual package manager and scripts.
