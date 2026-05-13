# Security Policy For AI Agents

## Secrets

Never commit:

- API keys intended to be private
- Firebase service account keys
- OAuth secrets
- private tokens
- database credentials
- `.env` files with real values

## Client-Side Security

- Treat client-exposed config as public.
- Do not expose server-only secrets through frontend code.
- Avoid unsafe HTML rendering.
- Validate user input according to existing project patterns.
- Do not log sensitive data.

## Firebase Security

- Firestore, Realtime Database, and Storage rules must follow least privilege.
- Public read/write rules are not allowed unless the user explicitly requests a demo-only setup.
- Deploying rules requires explicit user request.

## Auth

- Do not change authentication or authorization behavior unless directly requested.
- Do not weaken access checks to fix UI bugs.
