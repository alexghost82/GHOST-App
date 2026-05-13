---
name: performance-optimization
description: Improve performance of an existing web project safely without changing functionality.
---

# Web Performance Optimization Skill

Use this skill when the user asks to improve speed, Core Web Vitals, loading time, bundle size, rendering, or responsiveness.

## Mission

Improve performance while preserving existing behavior and UX.

## Hard Rules

- Do not remove features to improve performance unless explicitly requested.
- Do not change visual output unless explicitly requested.
- Do not introduce caching that can serve stale sensitive data.
- Do not perform broad rewrites.

## Inspection Checklist

Check:

- framework rendering mode
- bundle size
- route splitting
- images
- fonts
- third-party scripts
- API waterfalls
- memoization needs
- hydration cost
- unnecessary re-renders
- large dependencies

## Safe Optimizations

Allowed when relevant:

- lazy loading
- code splitting
- image optimization
- memoization
- reducing unnecessary renders
- removing dead imports
- deferring non-critical work
- improving loading states
- using existing framework optimization primitives

## Not Allowed Without Explicit Request

- replacing framework
- replacing UI library
- removing analytics
- removing content
- changing routes
- changing feature behavior

## Validation

Run:

- build
- tests
- Lighthouse/PageSpeed if available
- bundle analyzer if available

## Output

Report:

- bottleneck found
- optimization made
- expected impact
- functionality preserved
- checks run
