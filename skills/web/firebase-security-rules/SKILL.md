---
name: firebase-security-rules
description: Review and improve Firebase Firestore, Realtime Database, Storage, and Hosting security rules safely.
---

# Firebase Security Rules Skill

Use this skill when the project uses Firebase and the user asks about security rules, deployment safety, or Firebase access control.

## Mission

Protect Firebase resources without breaking intended existing app behavior.

## Hard Rules

- Do not make data publicly writable.
- Do not make private user data publicly readable.
- Do not deploy rules blindly.
- Do not invent collection names or document shapes.
- Do not change app data model unless explicitly requested.

## Inspection Checklist

Inspect:

- `firestore.rules`
- `database.rules.json`
- `storage.rules`
- `firebase.json`
- app queries and writes
- auth usage
- custom claims usage
- emulator tests, if any

## Rule Principles

Prefer:

- least privilege
- authenticated access where required
- owner-based access
- role/custom-claim checks when existing
- validation of allowed fields
- validation of field types

Avoid:

- `allow read, write: if true`
- client-controlled role fields
- trusting request data blindly
- broad recursive wildcards without constraints

## Validation

Use Firebase Emulator tests if available.

Commands may include:

```bash
firebase emulators:exec "npm test"
firebase deploy --only firestore:rules
firebase deploy --only storage
```

Do not deploy without explicit user request.

## Output

Report:

- rules reviewed
- risks found
- changes made
- emulator/tests run
- deploy command if requested
