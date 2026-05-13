---
name: mobile-code-review
description: Review mobile changes as a senior staff-level mobile engineer.
---

# Mobile Code Review Skill

Review code with production-grade standards.

Focus on:
- architecture
- scalability
- maintainability
- regression risk
- backend compatibility
- analytics consistency
- accessibility
- performance
- testing
- release safety

## Review Checklist

### Architecture

Check:
- separation of concerns
- state ownership
- dependency boundaries
- feature isolation
- unnecessary abstractions
- broad unrelated refactors

### UI

Check:
- loading states
- empty states
- retry handling
- accessibility
- localization
- visual consistency

### Networking

Check:
- API compatibility
- error handling
- auth handling
- defensive parsing
- pagination
- offline behavior

### Performance

Check:
- recomposition or re-render risks
- memory issues
- threading
- blocking operations
- unnecessary network calls

### Analytics

Check:
- event consistency
- parameter consistency
- duplicate tracking
- privacy risks

### Testing

Check:
- missing tests
- flaky logic
- edge cases
- state transitions
- API mapping tests

## Output Format

### Critical Issues
Blocking release risks.

### Important Improvements
Should be fixed before merge.

### Nice Improvements
Optional improvements.

### Suggested Refactors
Concrete implementation suggestions.

### Risk Assessment
Low / Medium / High, with reasoning.
