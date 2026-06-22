# GCS AI Project Portal — Cursor Prompt 4

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

## Prompt 4 — Mock Authentication (Role Selector Login)

```
Continue building the GCS AI Project Portal demo.

Build the mock authentication experience. Users do NOT enter email/password — they click a role card and the matching seed user is logged in.

**Reference: MOCKUP-LOGIN.** Open it before generating code and match the layout, spacing, and tone.

Specifics from the mockup:

1. `src/pages/LoginPage.tsx`
   - Centered on a subtle white-to-indigo gradient background.
   - Top centered cluster: 36×36 indigo square containing "GCS" in white, beside the text "AI Project Portal" (20px, weight 500). Subtitle below: "Sign in — Demo Mode".
   - "Select your role" label (12px, muted) above the grid.
   - **3-column grid of 9 role cards** (single column on mobile). Each card:
     - 18px lucide icon in the role's accent color, beside the humanized role name (13px, weight 500).
     - Below: the seed user's `displayName` (12px) — DO NOT show site, location, or department here. The login screen omits location by design.
     - One-line tagline from `roleDescription(role)` (11px, muted, line-height 1.4).
   - Card sizing: padding 14px, border 0.5px tertiary, radius medium.
   - Hover state: card gets a 2px indigo border and a very light indigo background `#EEEDFE`.
   - Icon-to-role mapping (lucide icons):
     - Submitter → ClipboardList (indigo)
     - BusinessAnalyst → FileSearch (indigo)
     - GovernanceLead → ShieldCheck (deep indigo)
     - RiskCompliance → AlertTriangle (red)
     - DataEngineering → Database (blue)
     - AIProgramManager → BarChart3 (amber)
     - MaintenanceSustainability → Wrench (teal)
     - Sponsor → Briefcase (green)
     - Admin → Settings (zinc)
   - Clicking a card calls `authStore.loginAs(user)` and navigates to `/dashboard`.
   - Footer (centered, 11px, muted): "Phase 0 — VM-hosted demo · No real backend · No real auth"
   - DO NOT include a separate "info banner" about authentication — the demo nature is communicated through the global demo banner (Prompt 12) and the subtitle/footer only.

2. `src/routes/ProtectedRoute.tsx`
   - If not authenticated, redirect to `/login`.
   - Otherwise render `<Outlet />` inside `<AppShell>`.

3. `src/routes/AppRoutes.tsx`
   - `/login` → LoginPage
   - All else inside ProtectedRoute:
     - `/` → redirect to `/dashboard`
     - `/dashboard` → DashboardPage
     - `/submit` → SubmitProjectPage
     - `/projects` → ProjectsListPage
     - `/projects/:id` → ProjectDetailPage
     - `/projects/:id/recommendations` → RecommendationPage
     - `/trainings` → TrainingCatalogPage
     - `/admin` → AdminPage (only Admin role; non-admins see "Access Denied")
     - `*` → NotFoundPage
```

---
