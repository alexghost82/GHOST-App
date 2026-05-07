---
name: "mobile-app-ux-audit-designer"
description: "Audit an existing project end to end across UX/UI, functionality, and logic, then shape a mobile-app-ready design direction for future Android and iOS apps. Use when the user wants a full product review, a mobile UX/UI redesign blueprint, 3 realization options, or a detailed Android/iOS implementation plan based on the current project."
metadata:
  version: "0.1.0"
  category: "product-design"
  tags: ["ux", "ui", "mobile", "android", "ios", "audit", "design-system"]
  triggers:
    include: ["full ux ui audit", "mobile app design from existing project", "analyze project for android ios app", "review functionality and logic before mobile redesign", "3 implementation options after audit"]
    exclude: ["single css tweak", "small icon replacement", "backend-only bugfix"]
  owners: ["@project-skills/mobile-design"]
---
# Mobile App UX Audit Designer

## When To Use
- Use this skill when the user wants a full review of an existing project, or a selected project area, before designing a mobile experience for Android and iOS.
- Use it when the request is not just "make it prettier", but "understand the product, flows, logic, and constraints first, then design a thoughtful mobile direction".
- Use it when the user wants a structured flow:
  1. deep audit,
  2. confirmation of desired end result,
  3. exactly 3 realization options,
  4. a detailed implementation plan that can later drive Android and iOS work.

## Core Promise
This skill does not invent a mobile UI in a vacuum. It derives the mobile direction from the actual product, current UX/UI, real functionality, data flow, edge cases, and platform constraints.

Default assumption:
- audit the whole project unless the user clearly limits the scope to a feature, screen, route, or module.

## Workflow
1. Inspect the project structure before proposing any design direction.
2. Map the product surface:
   - key routes and screens,
   - user roles,
   - major user journeys,
   - important data states,
   - responsive behavior,
   - technical constraints that will matter on mobile.
3. Audit the current experience across three lenses:
   - UX/UI quality,
   - functional completeness and interaction behavior,
   - product logic and state-flow clarity.
4. Produce a `Project Understanding Report` before suggesting solutions.
   The report must explain:
   - what the product does,
   - which surfaces matter most,
   - where the current desktop/web behavior helps or hurts a mobile translation,
   - what should be preserved, simplified, merged, or rethought for mobile.
5. Pause and ask the user what final result they want after seeing the understanding report.
   Do not jump directly into redesign proposals before this checkpoint.
6. After the user states the target outcome, propose exactly 3 implementation options.
   Each option must include:
   - design direction,
   - scope,
   - product tradeoffs,
   - delivery speed/risk,
   - suitability for Android and iOS parity.
7. After the user selects one option, create a detailed implementation plan that includes:
   - screen inventory,
   - mobile information architecture,
   - navigation model,
   - design-system direction,
   - component/state inventory,
   - responsive and adaptive behavior,
   - Android-specific notes,
   - iOS-specific notes,
   - agent roles and sequencing when agent delegation is allowed.
8. Only after that, if the user asks for implementation, begin design or code changes incrementally.

## Audit Rules
- Review real code and runtime structure before making product recommendations.
- Treat UX, functionality, and logic as inseparable; a beautiful mobile shell over broken flows is not acceptable.
- Preserve proven business logic and recognizable product identity unless the user asks for a deeper product rethink.
- Call out mismatches between current web behavior and mobile expectations such as:
  - overcrowded layouts,
  - hover-dependent interactions,
  - modal-heavy flows,
  - hidden navigation,
  - long forms without step logic,
  - weak empty/loading/error states,
  - poor thumb reach or one-hand ergonomics.
- Prefer explicit tradeoffs over vague design praise.
- If the current project is already inconsistent, say so clearly and normalize the system before proposing motion or visual flourish.

## Required Outputs
- `Project Understanding Report`
- `Mobile Translation Risks`
- `3 Realization Options`
- `Recommended Option`
- `Detailed Android/iOS Design Blueprint`
- `Implementation Plan Including Agents`

Read [references/mobile-deliverables.md](references/mobile-deliverables.md) for the output contract and checklist. Load it whenever you are preparing the audit result, the 3 options, or the final implementation plan.

## Decision Heuristics
- Favor task compression on mobile: fewer competing panels, clearer hierarchy, stronger default actions.
- Preserve user mental models where the current product already works well.
- Design for narrow widths, tall content, interrupted sessions, and touch-first usage.
- Make state visibility explicit: active, unread, syncing, loading, empty, offline, error, disabled, destructive.
- Prefer reusable primitives that can map cleanly to Android and iOS implementation stacks.
- Separate platform parity from platform sameness:
  - flows, information architecture, and component roles should stay aligned,
  - platform-specific interaction patterns may differ when it improves usability.

## Anti-Patterns
- Proposing a mobile redesign without first understanding the current flows.
- Giving only visual moodboards without screen logic or state handling.
- Offering more than 3 options when the workflow calls for 3.
- Mixing the understanding report, option selection, and implementation plan into one undifferentiated answer.
- Copying desktop navigation into mobile without restructuring hierarchy.
- Ignoring edge cases such as empty states, failed network requests, long text, localization, or permissions.

## Handoff Skills
- Use `accessibility` when the mobile proposal needs explicit WCAG or assistive-tech remediation.
- Use `frontend-design` when the user wants the approved visual direction implemented in web code first.
- Use `project-to-android-app` when the user wants the approved direction turned into a real Android app.
- Use `project-to-ios-app` when the user wants the approved direction turned into a real iOS app.

## Done Checklist
- The current product has been audited through UX/UI, functionality, and logic.
- The understanding report is separate from implementation recommendations.
- The user has been explicitly invited to state the desired final result after the audit.
- Exactly 3 realization options are presented after the user states that result.
- The final plan is mobile-specific and implementation-oriented, not just a design essay.
- Android and iOS implications are both covered.
