---
name: request-discipline
description: Enforce exact user-request execution. Prevents hallucinated features, scope creep, removals, rewrites, and unrequested behavior changes.
---

# Request Discipline Skill

Use this skill for every task in an existing web project.

## Mission

Perform exactly what the user requested. Do not add, remove, redesign, refactor, rename, migrate, or change functionality unless the user explicitly asked for it.

This skill is the highest-priority guardrail for all other skills.

## Non-Negotiable Rules

- Do not invent requirements.
- Do not add new features without a direct request.
- Do not remove existing features without a direct request.
- Do not change business logic without a direct request.
- Do not change UI/UX behavior beyond the requested scope.
- Do not rename routes, components, API fields, CSS classes, environment variables, or database fields unless explicitly requested.
- Do not perform broad refactors when the user asked for a targeted fix.
- Do not replace libraries/frameworks unless explicitly requested.
- Do not upgrade dependencies unless explicitly requested or required to fix a directly requested security issue.
- Do not change authentication, authorization, payment, analytics, or deployment configuration unless explicitly requested.

## Required First Step

Before changing code, identify:

1. The exact user request.
2. The minimum files likely needed.
3. The existing implementation pattern.
4. The safest minimal change.

If the request is ambiguous, make the safest narrow interpretation and state it in the final response.

## Scope Control

Allowed:

- Small targeted edits.
- Tests directly related to the change.
- Documentation updates directly related to the change.
- Bug fixes necessary for the requested change to work.

Not allowed without explicit request:

- New pages.
- New routes.
- New data models.
- New services.
- New UI sections.
- New analytics events.
- New permissions.
- New external integrations.
- Major styling redesigns.
- Architecture rewrites.

## Output Requirements

At the end of work, report:

- What was changed.
- What was not changed.
- Which files were touched.
- Which tests/checks were run.
- Any risk or limitation.

## If Tempted To Improve

If you notice unrelated improvements, do not implement them. Mention them under:

"Optional future improvements, not implemented."
