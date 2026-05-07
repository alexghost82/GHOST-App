# GHOST App Figma Handoff

This package is the Phase 0 discovery output for a Figma library build, generated from the current codebase and local rendered screenshots.

## What This Covers

- Global design tokens for light and dark modes
- Ghost Live workspace structure
- Super Admin shell structure
- Login experience direction
- Core component inventory and recommended Figma page structure

## Source Of Truth

- Brand guidelines: `BRAND_UI_UX_GUIDELINES.md`
- App shell and theme wiring: `src/App.tsx`, `src/index.css`, `src/styles/live-ops-chat.css`
- Routing and screen entrypoints: `src/components/root-app.tsx`
- Login: `src/components/login-page.tsx`, `src/components/login-page.css`
- Main navigation: `src/components/topbar.tsx`, `src/components/app-footer.tsx`
- Workspace: `src/components/inbox-panel.tsx`, `src/components/chat-panel.tsx`, `src/components/message-row.tsx`, `src/components/channel-card.tsx`, `src/components/details-panel.tsx`
- Super Admin: `src/components/super-admin-panel.tsx`, `src/components/super-admin-panel.css`

## Visual Direction

The project is not one visual style. In Figma it should be split into three linked surfaces:

1. `Ghost Core`
   Shared typography, spacing, radii, controls, neutral palette, RTL structure.

2. `Ghost Live`
   Operational chat workspace, glass topbar/footer, multi-panel layout, softer atmospheric gradients, WhatsApp-like rhythm without WhatsApp branding.

3. `Ghost Admin`
   Harder monochrome control surface for administrative and billing flows.

4. `Ghost Login`
   Dark glass sign-in experience with floating intel lines and LTR form behavior.

## Required Figma Page Structure

Create the file in this order:

1. `00 Cover`
   Product title, short purpose, mode preview cards for Login, Ghost Live, Super Admin.

2. `01 Foundations`
   Color scales, semantic token tables, spacing bars, radius chips, shadow samples, typography specimens.

3. `02 Foundations / Modes`
   Light, Dark, Ops Light, Ops Dark, Login Dark comparison frames.

4. `03 Screens / Login`
   `Desktop 1440`
   `Tablet 1024`
   `Mobile 390`

5. `04 Screens / Ghost Live`
   `Desktop 1440`
   `Desktop 1024`
   `Mobile 390`

6. `05 Screens / Super Admin`
   `Desktop 1440`
   `Tablet 1024`

7. `06 Components / Navigation`
   Topbar, footer, command trigger, nav tabs, icon buttons, account trigger.

8. `07 Components / Messaging`
   Inbox search, channel card, chat header, message row, composer, unread badge, status dot.

9. `08 Components / Surfaces`
   Panel shells, cards, KPI tiles, modal shells, section headers, pills, chips.

10. `09 Components / Forms`
    Text fields, password field, primary button, ghost button, danger button, select, stacked form group.

11. `10 Utilities / RTL`
    RTL text alignment, mirrored panel order, icon exceptions, mixed Hebrew and English content rules.

## Screen Inventory

### Login

- Centered glass card on dark operational background
- Ghost mark tile, eyebrow, large sign-in title, short subtitle
- Two stacked inputs and a full-width primary button
- Animated intelligence lines in the background
- Layout direction is explicitly LTR

### Ghost Live

- Full-height shell with topbar above the chat workspace and footer below it
- Desktop layout:
  - Inbox sidebar
  - Main chat
  - Details panel
- Mobile layout:
  - One active panel at a time
  - Bottom navigation behavior through panel switching
- Topbar contains:
  - Brand chip
  - Quick command
  - Nav tabs
  - Metrics pills
  - Utility buttons
  - Account trigger
- Footer contains:
  - Version and build pills
  - Live status
  - Clock
  - Footer links

### Super Admin

- Dark split shell with fixed-width sidebar and content area
- Organization list in the sidebar
- KPI grids, forms, ledger rows, and compact administrative cards
- Reuses topbar and footer language, but interior surfaces are more rigid and monochrome

## Component Inventory

### Navigation

- `Topbar`
  Variants:
  - Desktop
  - Mobile
  - With metrics
  - Without metrics
  - Light glass ops
  - Dark glass ops

- `AppFooter`
  Variants:
  - Default
  - Dark

- `Account Trigger`
  States:
  - Default
  - Hover
  - Menu open

### Messaging

- `Channel Card`
  Variants:
  - Default
  - Selected
  - Alerting
  - Group
  - Direct

- `Message Row`
  Variants:
  - User
  - Ghost
  - System
  - Critical alert
  - Routine scan
  - Report
  - Rating
  - Assessment
  Add optional frame preview slot as a boolean property.

- `Composer`
  Variants:
  - Idle
  - Typing
  - Disabled
  - Sending

### Panels

- `Inbox Panel`
- `Chat Panel`
- `Details Panel`
- `Super Admin Sidebar`
- `Super Admin Card`
- `Surface Dialog`

### Controls

- `Primary Button`
- `Ghost Button`
- `Danger Button`
- `Metric Tile`
- `Status Dot`
- `Status Pill`
- `Unread Pill`
- `Search Input`
- `Stacked Form Field`

## Layout Rules To Preserve In Figma

- App surfaces are RTL by default.
- Login is LTR.
- Ghost Live desktop order is inbox, chat, details.
- Topbar stays above the chat shell.
- Footer stays below the workspace.
- Desktop Ghost Live widths should start from:
  - Sidebar `380`
  - Details `332`
- Super Admin sidebar width should start from `340`.
- Primary spacing scale is only `4, 8, 12, 16, 20, 24`.
- Corners stay restrained: `6, 8, 12, 14, pill`.

## Typography Rules

- Hebrew UI: `Miriam Libre`
- Latin support: `Rubik`
- Monospace overlays and intel lines: `ui-monospace`
- Type roles:
  - Title `21`
  - Section `17`
  - Body `14`
  - Meta `11`

## Token Import Notes

- Use `design/figma/ghost-figma-tokens.json` as the seed for variables and styles.
- Keep separate modes in Figma:
  - `Core Light`
  - `Core Dark`
  - `Ops Light`
  - `Ops Dark`
  - `Login Dark`
- Convert gradients into paint styles after variables are created.
- Use semantic colors in components first; do not bind components to raw primitives directly unless the value is intentionally fixed.

## Suggested Build Order In Figma

1. Import or recreate variables from `ghost-figma-tokens.json`.
2. Build foundations page and publish text and effect styles.
3. Build navigation components.
4. Build messaging components.
5. Build Ghost Live full screens.
6. Build Super Admin shells and cards.
7. Build Login screens last, because they reuse fewer shared components.

## Current Limitation

This session does not expose a working Figma MCP or `use_figma` tool, so this package stops at the Figma-ready handoff stage rather than creating the `.fig` file directly.
