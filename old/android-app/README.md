# Ghost Android App

Native Android client (Kotlin + Jetpack Compose) mapped from the web project.

## Implemented in this phase

- Login screen wired to `POST /api/auth/login`
- Session persistence via DataStore
- Super admin dashboard wired to `GET /api/admin/dashboard/overview`
- Basic organization list + totals card
- Logout and dashboard refresh

## Run

1. Open `android-app` in Android Studio.
2. Let Gradle sync finish.
3. Start backend at `http://localhost:8787`.
4. Run app on emulator (API URL is `http://10.0.2.2:8787`).

Default login prefilled:
- `Alex`
- `05010108!!`

## Next phases

- Add organization details screen (`/api/admin/dashboard/org/:id`)
- Add issues list and update flow (`/api/admin/issues`)
- Add create/update user and organization management flows
- Bring visual parity with web design system and branding assets
