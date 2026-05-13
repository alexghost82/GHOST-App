---
name: ci-cd
description: Modify and review CI/CD workflows for web, iOS, and Android safely.
---

# CI/CD Skill

Use this skill when:
- editing GitHub Actions/GitLab CI/Bitrise/Fastlane workflows
- adding test jobs
- fixing flaky pipelines
- preparing release automation

## Workflow

1. Inspect existing CI workflows.
2. Identify platform-specific jobs for web, iOS, and Android.
3. Preserve secrets handling.
4. Keep cache keys safe and deterministic.
5. Avoid broad workflow rewrites unless necessary.
6. Validate commands locally where possible.

## Required Checks

- secrets are not printed
- caches do not cross unsafe boundaries
- release jobs are gated
- pull request jobs are fast enough
- test reports remain visible
- artifacts are uploaded only when needed

## Output

Include:
- workflow files changed
- commands added/changed
- expected CI behavior
- release risk
