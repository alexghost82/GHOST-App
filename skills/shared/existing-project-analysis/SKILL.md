---
name: existing-project-analysis
description: Analyze an existing web project before making changes, preserving architecture, conventions, and behavior.
---

# Existing Project Analysis Skill

Use this skill before any development work in an existing web project.

## Mission

Understand the project before changing it. Preserve current behavior unless the user explicitly asks to change behavior.

## Inspection Checklist

Before coding, inspect:

- package manager: npm, pnpm, yarn, bun
- framework: React, Next.js, Vue, Nuxt, Angular, Svelte, Astro, Vite, Remix, other
- TypeScript usage
- routing structure
- component structure
- state management
- API/client layer
- environment variables
- styling approach
- testing tools
- build scripts
- lint/format tools
- Firebase config, if present

## Project Convention Rules

Follow existing conventions for:

- file naming
- component naming
- folder layout
- imports
- hooks/composables/services
- CSS modules/Tailwind/styled-components/etc.
- error handling
- loading states
- form validation
- tests

Never introduce a new pattern if a local pattern already exists.

## Minimal Change Rule

Prefer the smallest safe change that satisfies the request.

Avoid:

- unrelated cleanup
- mass formatting
- broad renames
- framework-specific rewrites
- dependency churn

## Final Report

Include:

- detected framework/tools
- implementation pattern followed
- files changed
- checks run
