# API Conventions

## Backend Rules

- Backend contracts are source of truth
- Never invent fields
- Never assume nullable fields are always present

## Authentication

- OAuth2 bearer tokens
- Refresh token flow required
- Auto refresh handled in interceptors

## Error Handling

All APIs may return:
- network errors
- validation errors
- authorization errors
- rate limiting

## Pagination

Cursor-based pagination preferred.

## Serialization

### iOS
- Codable
- snake_case decoding

### Android
- Kotlin Serialization
- snake_case mapping

## Mapping Rules

API DTOs must be mapped into:
- domain models
- UI models

Never expose raw DTOs directly to UI.