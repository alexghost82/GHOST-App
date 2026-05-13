---
name: performance-profiling
description: Profile and improve mobile performance while preserving web/backend behavior.
---

# Performance Profiling Skill

Use this skill when:
- app startup is slow
- screens render slowly
- memory usage is high
- API-heavy flows feel slow
- scrolling is janky

## Workflow

1. Define the exact performance symptom.
2. Identify affected platform and flow.
3. Inspect equivalent web behavior and backend calls.
4. Look for duplicate network requests, heavy mapping, large renders, and synchronous work.
5. Apply narrow fix.
6. Document measurable expected improvement.

## Avoid

- premature caching
- architecture rewrites
- hiding latency with fake loading
- removing useful analytics or validation

## Output

Include:
- performance bottleneck
- proposed fix
- why it is safe
- remaining measurement gap
