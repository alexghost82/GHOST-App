---
name: ios-feature-screen
description: Create or modify iOS SwiftUI feature screens connected to the existing web platform backend.
---

# iOS Feature Screen Skill

Use this skill when:
- creating new iOS screens
- modifying existing screens
- implementing API-backed UI
- integrating backend-driven state

## Primary Goal

Implement production-grade SwiftUI screens fully compatible with the existing web platform.

The implementation MUST:
- respect existing backend contracts
- reuse existing design patterns
- follow current app architecture
- preserve analytics consistency

## Workflow

### Step 1 — Inspect Existing Feature

Before coding:
- inspect neighboring features
- inspect API models
- inspect navigation flows
- inspect analytics events
- inspect localization keys
- inspect design system components
- inspect the equivalent web feature

Never invent patterns if similar implementations already exist.

### Step 2 — Preferred Feature Structure

Use the existing project structure. If none exists, prefer:

- `FeatureView.swift`
- `FeatureViewModel.swift`
- `FeatureModels.swift`
- `FeatureService.swift`
- `FeatureMapper.swift`
- `FeatureAnalytics.swift`

### Step 3 — UI Rules

Use:
- SwiftUI
- reusable design system components
- explicit state rendering
- previews with realistic data

Avoid:
- networking in Views
- business logic in Views
- giant View structs
- hardcoded user-visible text

## State Rules

Every screen MUST support:
- loading
- success
- empty
- error
- retry
- refresh when relevant

State should be explicit and testable.

## Networking Rules

Before implementing networking:
- inspect existing API clients
- inspect authentication handling
- inspect token refresh flows
- inspect the web API usage

Never:
- duplicate networking logic
- bypass interceptors
- hardcode URLs

Use:
- existing repositories/services
- typed DTOs
- mappers between API and UI

## Analytics Rules

Before adding analytics:
- inspect existing event naming
- inspect tracking patterns
- compare with web tracking

Track:
- screen open
- CTA taps
- failures when applicable

## Accessibility Rules

Always support:
- VoiceOver
- Dynamic Type
- semantic labels
- accessibility identifiers for tests where the project uses them

## Validation

Before finalizing:
1. run relevant tests
2. inspect previews
3. inspect accessibility
4. inspect localization
5. inspect analytics coverage
6. verify backend compatibility
