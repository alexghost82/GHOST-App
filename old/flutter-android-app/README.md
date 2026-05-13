# Flutter Android App from Project

This Flutter app is built as a phased Android client derived from the existing GHOST web/backend project.

## Progress

- [x] Phase 1: Discover source project
- [x] Phase 2: Produce feature mapping plan
- [x] Phase 3: Scaffold or align Flutter Android app
- [x] Phase 4: Implement prioritized features (login + dashboard)
- [x] Phase 5: Integrate backend/auth/config
- [ ] Phase 6: Build, verify, and report (blocked by missing Flutter SDK in current environment)

## Feature mapping (short)

- Login page -> `LoginScreen` (`/api/auth/login`)
- Super admin dashboard overview -> `DashboardScreen` (`/api/admin/dashboard/overview`)
- Auth/session storage -> `SessionStore` (`shared_preferences`)
- API contracts -> typed Dart models in `lib/models`

## Implemented files

- `lib/main.dart` - app bootstrap, auth state, routing between login and dashboard
- `lib/screens/login_screen.dart` - credential login UI
- `lib/screens/dashboard_screen.dart` - super admin tabs:
  - overview,
  - organization details (`/api/admin/dashboard/org/:id`),
  - issues list + status update,
  - users create/update,
  - organizations create/update
- `lib/services/api_client.dart` - backend API calls
- `lib/services/session_store.dart` - token/profile persistence
- `lib/models/auth_models.dart` - login/profile models
- `lib/models/dashboard_models.dart` - dashboard models

## Backend integration

- Base URL is set to `http://10.0.2.2:8787` for Android emulator.
- Uses your existing backend auth and admin endpoints.
- No secrets are hardcoded beyond local default login text fields.

## Run after installing Flutter

```bash
cd flutter-android-app
flutter pub get
flutter analyze
flutter test
flutter run
flutter build apk --debug
```

## Notes

- Current environment does not have Flutter CLI (`flutter` command not found), so build/verification steps were prepared but could not be executed here.
