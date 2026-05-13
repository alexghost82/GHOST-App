---
name: android-compose-screen
description: Create or modify Android Jetpack Compose screens integrated with the existing backend platform.
---

# Android Compose Screen Skill

Use this skill when:
- building Android UI
- modifying Compose screens
- integrating backend-driven flows
- implementing ViewModels and UI state

## Primary Goal

Create production-grade Android features compatible with the existing web platform.

The implementation MUST:
- preserve backend compatibility
- reuse existing architecture
- preserve analytics consistency
- reuse design system components

## Workflow

### Step 1 — Inspect Existing Features

Before coding:
- inspect neighboring modules
- inspect repositories
- inspect navigation
- inspect API models
- inspect analytics
- inspect feature flags
- inspect equivalent web behavior

Never invent patterns when existing patterns exist.

### Step 2 — Preferred Structure

Use existing structure. If none exists, prefer:

- `FeatureScreen.kt`
- `FeatureViewModel.kt`
- `FeatureUiState.kt`
- `FeatureUiEvent.kt`
- `FeatureRepository.kt`
- `FeatureAnalytics.kt`

## Compose Rules

Composable functions should:
- stay stateless where possible
- receive immutable state
- avoid business logic
- remain reusable

Avoid:
- ViewModel access deep in UI tree
- hidden mutable state
- navigation side effects inside UI
- hardcoded user-visible strings

## State Management Rules

Use:
- StateFlow
- immutable UI state
- explicit one-shot events

Support:
- loading
- success
- empty
- error
- retry

## Networking Rules

Before networking:
- inspect Retrofit/Ktor setup
- inspect auth handling
- inspect interceptors
- inspect serialization strategy
- inspect web API usage

Never:
- duplicate clients
- bypass repositories
- hardcode endpoints

## Analytics Rules

Reuse:
- existing event names
- existing screen tracking
- existing parameter naming

Avoid duplicate events caused by recomposition.

## Accessibility Rules

Support:
- TalkBack
- semantic descriptions
- scalable fonts
- touch target sizing

## Validation

Before finalizing:
1. run tests
2. run lint
3. inspect recomposition risks
4. inspect accessibility
5. inspect analytics
6. inspect localization
7. verify backend compatibility
