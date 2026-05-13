# Web Codex Skills Starter Kit

A complete project-specific skills starter kit for an existing web project.

## Purpose

This kit teaches Codex/AI coding agents to continue development, improve UI/UX, improve security, deploy to Firebase, test, and perform visual/clickable QA while obeying strict scope control.

## Install

Copy `AGENTS.md`, `skills/`, `context/`, and `scripts/` into the root of your existing web repository.

## Prime Rule

The agent must do exactly what the user requested. It must not add or remove features, change business logic, redesign flows, or modify functionality without a direct request.

## Recommended First Command

```bash
bash scripts/detect-project.sh
```

## Recommended Validation Command

```bash
bash scripts/run-safe-checks.sh
```
