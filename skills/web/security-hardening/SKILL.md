---
name: security-hardening
description: Improve security of an existing web project without unrequested feature or architecture changes.
---

# Security Hardening Skill

Use this skill when the user asks to improve security, fix vulnerabilities, review security, or harden the web app.

## Mission

Reduce security risk while preserving existing functionality and avoiding unrequested changes.

## Critical Rules

- Do not change authentication behavior unless explicitly requested or required to fix the vulnerability.
- Do not weaken security for convenience.
- Do not store secrets in code.
- Do not log tokens, passwords, session IDs, private keys, or personal data.
- Do not expose environment variables to the client unless they are intended to be public.
- Do not add external security services unless explicitly requested.

## Security Review Checklist

Inspect relevant areas for:

- XSS risk
- unsafe HTML rendering
- CSRF risk
- insecure cookies
- insecure auth/session handling
- token leakage
- secret leakage
- dependency vulnerabilities
- open redirects
- insecure CORS assumptions
- missing input validation
- missing output encoding
- insecure Firebase rules/config
- overly broad permissions
- sensitive data in logs
- unsafe file upload handling

## Frontend Rules

- Avoid `dangerouslySetInnerHTML` unless safely sanitized.
- Validate and encode user-controlled content.
- Avoid storing sensitive tokens in localStorage unless existing architecture requires it and risk is documented.
- Use secure cookie/session patterns when already present.

## Firebase Rules

When Firebase is present:

- inspect Firestore/Realtime Database rules
- inspect Storage rules
- inspect Auth assumptions
- inspect public config usage
- never expose service account keys
- never deploy permissive rules such as full public read/write unless explicitly requested for a local emulator/demo

## Dependency Rules

If vulnerabilities are dependency-related:

1. Prefer patch/minor safe updates.
2. Avoid major upgrades unless explicitly requested.
3. Explain breaking risk.
4. Run tests/build after updates.

## Validation

Run available checks:

```bash
npm audit
npm run lint
npm run typecheck
npm test
npm run build
```

Use the actual package manager.

## Output

Report:

- vulnerabilities or risks addressed
- files changed
- security behavior preserved
- checks run
- risks still remaining
