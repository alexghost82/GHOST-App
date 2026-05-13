# Analytics Events

## Naming

Format:
screen_action_context

Examples:
- profile_open
- login_success
- payment_failed
- onboarding_completed

## Rules

Always track:
- screen opens
- CTA interactions
- failures
- critical flows

Never:
- invent inconsistent names
- duplicate events
- track sensitive data

## Required Parameters

Common:
- user_id
- session_id
- platform
- app_version

## Platforms

Analytics must stay consistent between:
- web
- iOS
- Android