# Mobile Deliverables

Load this file when preparing the audit result, the 3 realization options, or the final Android/iOS handoff.

## 1. Project Understanding Report
- Product summary in plain language.
- Primary user roles and their goals.
- Core journeys that must survive the mobile transition.
- Current UX/UI strengths worth preserving.
- Current friction points in layout, hierarchy, responsiveness, and discoverability.
- Functional gaps, broken sequences, placeholder surfaces, or unclear state transitions.
- Logic risks:
  - permission edges,
  - async behavior,
  - validation,
  - data freshness,
  - offline or retry expectations,
  - role-specific behavior.
- Mobile translation summary:
  - what can stay,
  - what must compress,
  - what must split into steps,
  - what must become persistent navigation.

## 2. Mobile Translation Risks
- Desktop patterns that will fail on touch devices.
- Screens that contain too many simultaneous responsibilities.
- Controls that depend on hover, wide tables, or precise cursor work.
- Flows that need bottom-sheet, tab, stack, or stepper restructuring.
- Areas that need stronger loading, empty, confirmation, or error states.

## 3. Three Realization Options
For each of the 3 options include:
- One-sentence concept.
- Best fit for this product.
- UX tradeoffs.
- Engineering implications.
- Design-system implications.
- Risk level.
- Speed level.
- Android/iOS parity impact.

Always include one recommended option and explain why it best balances product clarity, delivery risk, and mobile usability.

## 4. Detailed Android/iOS Design Blueprint
- App structure and navigation model.
- Screen inventory with purpose for each screen.
- Entry points and primary actions.
- Component families:
  - cards,
  - lists,
  - filters,
  - tabs,
  - sheets,
  - forms,
  - chat/composer patterns,
  - alerts,
  - settings surfaces.
- State inventory for each critical flow:
  - loading,
  - empty,
  - success,
  - partial data,
  - validation error,
  - destructive confirmation,
  - offline or reconnect.
- Design tokens direction:
  - spacing rhythm,
  - typography scale,
  - color roles,
  - radius,
  - elevation,
  - motion.
- Adaptive rules:
  - compact phone,
  - large phone,
  - tablet or foldable if relevant.
- Platform notes:
  - Android navigation, back behavior, permissions, Material expectations.
  - iOS navigation, gesture expectations, safe areas, sheet behavior.

## 5. Implementation Plan Including Agents
- Ordered implementation phases.
- Which phase should happen in web/source product first, if any.
- Which parts can be delegated in parallel.
- Clear agent ownership examples:
  - audit consolidation,
  - design-system extraction,
  - screen architecture,
  - Android implementation,
  - iOS implementation,
  - QA and accessibility pass.
- Verification plan:
  - responsive checks,
  - interaction checks,
  - state coverage,
  - parity review against the approved blueprint.
