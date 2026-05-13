---
name: visual-clickable-testing
description: Perform visual and clickable web testing using browser automation while preserving existing functionality.
---

# Visual and Clickable Testing Skill

Use this skill when the user asks to visually test, click through, QA, smoke test, or verify UX in a browser.

## Mission

Verify the existing web project from the user's perspective. Do not change functionality unless the user explicitly asks for fixes.

## Hard Rules

- Do not alter app behavior while testing.
- Do not bypass auth unless the project has test utilities for it.
- Do not create production data unless explicitly requested.
- Do not run destructive actions in production.
- Do not invent expected behavior; infer it from UI, tests, docs, or user request.

## Inspection Checklist

Before testing:

- identify local dev command
- identify preview/build command
- identify test credentials or seed flow if available
- identify e2e framework
- identify critical routes
- identify protected routes

## Manual/Automated Click Path Checklist

Verify:

- page loads
- navigation links work
- buttons are clickable
- forms accept input
- validation appears
- loading states appear
- errors are understandable
- modals open/close
- dropdowns work
- responsive layout works
- keyboard navigation works
- focus states are visible

## Visual QA Checklist

Check:

- layout breaks
- overflow
- clipped text
- contrast issues
- inconsistent spacing
- broken images/icons
- mobile viewport issues
- desktop viewport issues
- dark/light theme issues if supported

## Browser Automation Tools

Prefer existing tools:

- Playwright
- Cypress
- Storybook test runner
- Testing Library

If no tool exists, provide a minimal safe smoke test only if the user asked to add tests.

## Output

Report:

- tested routes/flows
- passed checks
- failed checks
- screenshots or traces if generated
- bugs found
- fixes only if requested
