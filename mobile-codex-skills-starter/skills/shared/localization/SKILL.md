---
name: localization
description: Preserve localization consistency across web, iOS, and Android.
---

# Localization Skill

Use this skill when adding or changing user-visible text.

## Core Rule

Do not hardcode user-visible strings if the project has localization infrastructure.

## Workflow

1. Search for existing copy in the web app.
2. Search for existing localization keys in mobile apps.
3. Reuse keys if the meaning is identical.
4. Create new keys only when necessary.
5. Keep placeholders explicit and safe.
6. Check pluralization and gender/context where relevant.

## Do Not

- concatenate localized strings
- hardcode English text
- reuse a key with a different meaning
- put dynamic values into translation keys

## Required Checks

- empty state text
- error text
- button text
- accessibility labels
- screen titles
- form validation messages
