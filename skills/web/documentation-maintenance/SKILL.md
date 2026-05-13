---
name: documentation-maintenance
description: Update project documentation only where directly relevant to the user's request.
---

# Documentation Maintenance Skill

Use this skill when documentation must be updated as part of a web project change.

## Mission

Keep documentation accurate without creating unnecessary docs or changing project scope.

## Hard Rules

- Do not add large documentation sections unless requested.
- Do not document features that do not exist.
- Do not invent setup instructions.
- Do not include real secrets.

## What To Update

Only update docs related to:

- changed commands
- changed environment variables
- changed deployment steps
- changed test steps
- changed API assumptions
- changed Firebase setup

## Preferred Files

Use existing docs first:

- README.md
- CONTRIBUTING.md
- docs/
- context/
- .env.example

## Output

Report:

- documentation updated
- reason for update
- files changed
