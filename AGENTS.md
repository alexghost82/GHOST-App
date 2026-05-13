# Web Project AI Rules

This repository is an existing web project.

AI agents working in this repository must preserve existing functionality and perform exactly the user's request.

## Highest Priority Rule

Do not add, remove, rename, redesign, refactor, or change functionality unless the user explicitly asks for it.

If the user asks for a small fix, make a small fix.
If the user asks for UI improvement, improve UI only within the requested scope.
If the user asks for security hardening, harden only the relevant risk areas.
If the user asks for Firebase deployment, prepare/deploy only the requested target.

## Mandatory Behavior

Before changing code:

1. Read the user request carefully.
2. Inspect the existing project structure.
3. Identify the existing framework, package manager, scripts, routing, styling, and tests.
4. Follow existing conventions.
5. Make the smallest safe change.

## Forbidden Without Explicit Request

- Adding new product features.
- Removing existing features.
- Changing business logic.
- Changing authentication or authorization behavior.
- Changing database schema or Firebase collections.
- Changing API contracts.
- Changing routes.
- Replacing libraries or frameworks.
- Performing broad refactors.
- Redesigning the whole UI.
- Adding external integrations.
- Adding analytics events.
- Upgrading dependencies broadly.
- Committing real secrets.
- Deploying to production.

## Existing Project First

The existing codebase is the source of truth.

Never invent:

- API fields
- endpoints
- environment variables
- Firebase project IDs
- Firestore collections
- Storage paths
- user roles
- business rules
- design tokens
- routes

## UI/UX Rules

When improving UI/UX:

- preserve existing functionality
- preserve existing flows
- preserve existing content unless copy changes are requested
- use existing components and tokens
- improve accessibility where relevant
- keep changes focused

## Security Rules

- Never expose secrets.
- Never log sensitive data.
- Never weaken auth or permissions.
- Never make Firebase rules broadly public unless explicitly requested for a demo/emulator use case.
- Prefer least privilege.

## Testing Rules

- Run relevant tests/checks when possible.
- Do not delete failing tests to make a task pass.
- Do not weaken assertions.
- Add regression tests when fixing bugs if practical.

## Firebase Rules

- Do not create/delete Firebase projects without explicit request.
- Do not deploy without explicit request.
- Do not overwrite production config blindly.
- Inspect firebase.json and .firebaserc before deployment work.

## Final Response Required Format

Every completed task should report:

- Changed:
- Not changed:
- Files touched:
- Checks run:
- Risks/notes:
