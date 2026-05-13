---
name: firebase-deployment
description: Prepare and publish an existing web project to Firebase Console safely, preserving existing functionality.
---

# Firebase Deployment Skill

Use this skill when the user asks to publish, deploy, configure, or prepare a web project for Firebase Console.

## Mission

Deploy the existing web project to Firebase safely and reproducibly without changing product functionality.

## Hard Rules

- Do not create or delete Firebase projects without explicit user request.
- Do not overwrite production hosting, database rules, storage rules, or environment configuration without explicit user request.
- Do not expose secrets.
- Do not change app behavior just to make deployment easier.
- Do not invent project IDs, site IDs, or environment variables.

## Inspection Checklist

Before changing deployment files, inspect:

- framework and build output directory
- package manager
- build command
- Firebase config files
- `.firebaserc`
- `firebase.json`
- Hosting rewrites
- SPA fallback needs
- SSR support needs
- environment variables
- Firestore rules
- Storage rules
- Functions, if present

## Hosting Rules

For static/SPAs:

- configure correct public/build directory
- configure SPA rewrite only if the project uses client-side routing
- preserve cache behavior when already defined

For SSR frameworks:

- do not force static hosting if SSR is required
- inspect framework adapter requirements

## Environment Rules

- Use `.env.example` for documentation only.
- Never put real secrets in committed files.
- Client-exposed variables must use the project's required public prefix.

## Deployment Commands

Use project scripts when present.
Typical commands may include:

```bash
npm run build
firebase login
firebase use <project-id>
firebase deploy --only hosting
```

Do not run destructive deploys without explicit request.

## Validation Before Deploy

Required before publishing:

- install dependencies
- lint
- typecheck
- tests where available
- production build
- local preview if possible

## Output

Report:

- Firebase files prepared/changed
- build output directory
- deployment command to run
- checks completed
- manual Firebase Console steps, if any
