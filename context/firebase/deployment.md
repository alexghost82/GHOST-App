# Firebase Deployment Context

## Purpose

Guidance for preparing an existing web project for Firebase Console deployment.

## Rules

- Do not invent Firebase project IDs.
- Do not create or delete Firebase resources without explicit request.
- Do not deploy to production without explicit request.
- Do not overwrite rules or hosting config blindly.
- Do not commit real secrets.

## Common Files

- firebase.json
- .firebaserc
- firestore.rules
- storage.rules
- database.rules.json
- .env.example

## Required Validation Before Deploy

- install dependencies
- run lint if available
- run typecheck if available
- run tests if available
- run production build
- preview locally if available

## Deployment Intent

When user asks to publish:

1. Inspect build output.
2. Configure Firebase hosting safely.
3. Build project.
4. Provide or run deployment command only when explicitly requested.
