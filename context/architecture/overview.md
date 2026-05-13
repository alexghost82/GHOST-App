# Architecture Overview

## Platforms

- Web
- iOS
- Android
- Backend APIs

## Mobile Architecture

### iOS
- SwiftUI
- MVVM
- Repository pattern
- async/await

### Android
- Jetpack Compose
- MVI/UDF
- StateFlow
- Repository pattern

## Shared Principles

- Backend is source of truth
- Explicit UI states
- Analytics consistency
- Feature flag driven rollout
- Strong typing preferred

## Layers

UI -> ViewModel -> UseCase -> Repository -> API

## Rules

- No business logic in UI
- No networking in UI
- DTOs must not leak into UI
- State must be explicit