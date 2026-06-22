# GCS AI Project Portal — Cursor Prompt 5

> **Context:** This prompt is part of a sequence. See the Mockup Reference Guide below before starting.

---

## Mockup Reference Guide

Keep the mockup file (`MOCKUP-GCS-AI-Portal.html`) open in your browser while running this prompt. The table below maps mockup tab names to prompts:

| Mockup Tab Name | Used in Prompt |
|---|---|
| MOCKUP-LOGIN | Prompt 4 |
| MOCKUP-DASHBOARD | Prompt 6 |
| MOCKUP-SUBMISSION-WIZARD | Prompt 8 |
| MOCKUP-RECOMMENDATIONS | Prompt 9 |
| MOCKUP-CUSTOMISE-STACK | Prompt 9 |
| MOCKUP-PROJECT-DETAIL | Prompt 10 |
| MOCKUP-TRAINING-CATALOG | Prompt 11 |

---

## Prompt 5 — App Shell, Sidebar, Topbar, Demo Banner

```
Continue building the GCS AI Project Portal demo.

Build the persistent layout that wraps all authenticated pages. Match the sidebar and topbar shown in MOCKUP-DASHBOARD (and consistent across MOCKUP-SUBMISSION-WIZARD, MOCKUP-RECOMMENDATIONS, MOCKUP-PROJECT-DETAIL, MOCKUP-TRAINING-CATALOG).

1. `src/components/layout/AppShell.tsx`
   - Two-column layout: fixed left Sidebar (200px wide) + main content area.
   - Inside main: DemoBanner (thin yellow strip) → Topbar → page content with padding 20px.

2. `src/components/layout/DemoBanner.tsx`
   - Thin yellow strip across the top of the main area: background `#FAEEDA`, border-bottom 0.5px warning color, padding 6px 20px.
   - Text (11px, color `#633806`): "DEMO MODE — Phase 0. Data is stored locally in your browser. No backend connected."
   - Optional × button on the right to dismiss (writes to `uiStore.demoBannerDismissed`). Since uiStore is not persisted, the banner returns on refresh.

3. `src/components/layout/Sidebar.tsx`
   - Header: small GCS logo placeholder (26×26 indigo square with "GCS" text in white, font-size 10px, weight 500) + "AI Project Portal" beside it (12px, weight 500). Separator below.
   - Nav items (12px, padding 8px 10px, radius medium):
     - Dashboard (LayoutDashboard icon)
     - Submit Project (PlusCircle icon) — visible only if role is Submitter, BusinessAnalyst, or Admin
     - Projects (FolderKanban icon)
     - Training Catalog (GraduationCap icon)
     - Admin (Settings icon) — visible only if role is Admin
   - Active state: indigo `#534AB7` background, white text and icon. Inactive: dark text, muted icon, no background.
   - Bottom (margin-top: auto): a small block on `var(--color-background-secondary)`: padding 10px, radius medium, contains info icon + "Demo Mode · Phase 0" (11px, muted).

4. `src/components/layout/Topbar.tsx`
   - Light background, border-bottom 0.5px tertiary, padding 12px 20px.
   - Left: current page title from `uiStore.pageTitle` (14px, weight 500).
   - Right: bell icon (16px, muted) + 28×28 circular Avatar with the current user's initials. Avatar background and color match the role's RoleBadge palette.
   - Avatar click opens a dropdown: User name + RoleBadge → "Switch role" (clears auth, goes to /login) → "Sign out" (same effect for demo).

5. `src/components/layout/PageHeader.tsx`
   - Reusable component pages use at the top of their content: title (18px, weight 500), optional subtitle (12px, muted), optional right-aligned action slot.
   - Sets the page title in uiStore on mount so Topbar reflects it.

6. `src/components/common/RoleBadge.tsx` — colored badge per role using these palettes (used everywhere a role is shown):
   - GovernanceLead: bg `#EEEDFE`, text `#3C3489`
   - RiskCompliance: bg `#FCEBEB`, text `#A32D2D`
   - DataEngineering: bg `#E6F1FB`, text `#185FA5`
   - BusinessAnalyst: bg `#F4E8F3`, text `#6B4181`
   - AIProgramManager: bg `#FBEDD8`, text `#BA7517`
   - MaintenanceSustainability: bg `#D5EBE0`, text `#0F6E56`
   - Submitter: bg neutral secondary, text muted
   - Sponsor: bg `#EAF3DE`, text `#3B6D11`
   - Admin: bg neutral, text dark

7. `src/components/common/GroupBadge.tsx` — colored badge per group:
   - PROGs: indigo / green palette (use `#1D9E75` accents)
   - Engineering: indigo `#534AB7`
   - Field: `#6B8FBF`
   - Marketing: `#D4537E`

8. `src/components/common/StatusBadge.tsx` — overloaded badge accepting either ProjectStatus or StageStatus via a discriminated prop. Use semantic colors. Pair every badge with text — never rely on color alone.

9. `src/components/common/EmptyState.tsx` — icon + title + description + optional action button.

10. `src/components/common/ToolStackChips.tsx` — reusable component that takes a `toolStack: ToolStackEntry[]` and renders the indigo "primary" pill + green "+ add-on" pills, separated by "+" markers. Used in the project header, project detail, and the selected stack summary. Uses each tool's `iconHint` to render a 11–12px lucide icon inside the primary chip.

11. Responsive: on screens < 768px, sidebar collapses into a Sheet opened by a menu button in the Topbar.

Visual tone: lots of whitespace, subtle 0.5px borders, neutral grays, indigo as the single accent. NO heavy shadows except on the active recommendation card in MOCKUP-RECOMMENDATIONS.
```

---
