---
name: ui-ux-improvement
description: Improve existing web UI/UX safely without changing functionality unless explicitly requested.
---

# UI/UX Improvement Skill

Use this skill when the user asks to improve the graphical interface, usability, layout, visual quality, accessibility, or user experience.

## Mission

Improve UI/UX while preserving existing functionality, routes, data flow, and business logic.

## Hard Rules

- Do not add new product features.
- Do not remove existing UI elements unless explicitly requested.
- Do not change business logic.
- Do not change API behavior.
- Do not change navigation flow unless explicitly requested.
- Do not redesign the entire product when asked to improve one area.

## UX Inspection Checklist

Review the requested area for:

- visual hierarchy
- spacing consistency
- typography consistency
- contrast
- focus states
- hover/active states
- mobile responsiveness
- loading states
- error states
- empty states
- form clarity
- accessibility labels
- keyboard navigation
- touch target size

## Design System Rules

Use existing:

- design tokens
- CSS variables
- Tailwind config
- theme values
- component library
- spacing scale
- typography scale
- color palette

Never invent arbitrary colors, spacing, shadows, or animations unless no design system exists.

## Safe Improvements

Allowed when relevant:

- clearer spacing
- better alignment
- consistent typography
- improved responsive layout
- improved focus states
- accessible labels
- better loading/error/empty state presentation
- reduced visual clutter without removing functionality

## Not Allowed Without Explicit Request

- new screens
- new navigation items
- new flows
- new modals
- new onboarding
- new feature cards
- marketing copy changes that alter meaning
- removal of fields/buttons
- changing conversion funnels

## Validation

After UI changes, run:

- lint/typecheck
- unit tests if relevant
- visual tests if available
- Playwright/Cypress smoke test if available
- build

## Final Response

Report:

- UX/UI changes made
- functionality preserved
- files changed
- checks run
- anything intentionally not changed
