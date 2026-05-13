# Mobile Codex Skills Starter Kit

A project-specific skills starter kit for teams building iOS and Android apps on top of an existing web platform/backend.

## Structure

```text
AGENTS.md
skills/
  shared/
  ios/
  android/
scripts/
```

## How to use

1. Copy this folder into the root of your repository.
2. Edit the references inside `skills/**/references/` to match your real project.
3. Keep skills small and task-specific.
4. Ask Codex to use a skill explicitly, for example:

```text
Use $android-compose-screen. Create a Settings screen using the existing API and design system.
```

```text
Use $mobile-code-review. Review the current branch for mobile release risk.
```

## Important principle

Do not treat skills as generic prompts. Treat them as project rules, checklists, workflows, and guardrails.
