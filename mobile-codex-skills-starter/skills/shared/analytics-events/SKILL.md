---
name: analytics-events
description: Preserve analytics event consistency across web, iOS, and Android.
---

# Analytics Events Skill

Use this skill when adding, changing, or reviewing analytics.

## Core Rule

Analytics must be consistent across web, iOS, and Android.

Never invent event names or parameter names without checking existing conventions.

## Workflow

1. Search for existing web event names for the same feature.
2. Search iOS and Android for equivalent tracking patterns.
3. Reuse event names and parameter names when possible.
4. If a new event is required, document why.
5. Track only meaningful user or system actions.
6. Avoid duplicate tracking from nested components.

## Track Common Events

- screen opened
- primary CTA tapped
- secondary CTA tapped
- form submitted
- validation failed
- API failure when meaningful
- feature flag exposure when required

## Avoid

- noisy events
- inconsistent casing
- raw PII
- secrets/tokens
- huge payloads
- duplicate events on recomposition or view re-render

## Output Format

Include:
- events added or reused
- parameters added or reused
- source files changed
- risk of duplicate tracking
