---
name: design-system
description: Ensure mobile UI stays aligned with the existing platform design system.
---

# Design System Skill

Use this skill when:
- building UI
- creating components
- modifying styling
- implementing animations
- aligning mobile with web UX

## Core Rule

The existing design system is the source of truth.

Never:
- invent arbitrary spacing
- invent colors
- invent typography
- invent component behavior
- hardcode visual values when tokens exist

## Workflow

1. Search for existing components before creating new ones.
2. Search for design tokens and theme usage.
3. Compare web behavior when mobile feature mirrors a web feature.
4. Use existing mobile design system primitives.
5. Create new components only when reuse is impossible.

## UI Rules

Reuse:
- colors/tokens
- typography scales
- spacing systems
- elevation rules
- shape/radius rules
- animation patterns

## UX Rules

Maintain consistency with:
- web platform UX
- mobile platform conventions
- loading behavior
- empty states
- error states
- form validation

## Accessibility

Validate:
- readable contrast
- scalable text
- touch targets
- screen reader labels
- semantic roles
