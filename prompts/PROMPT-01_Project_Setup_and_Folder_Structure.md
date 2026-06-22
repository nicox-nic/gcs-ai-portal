# GCS AI Project Portal — Cursor Prompt 1

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

## Prompt 1 — Project Setup and Folder Structure

```
You are scaffolding a frontend-only React demo application called "GCS AI Project Portal". This is Phase 0 of a real internal tool that helps employees submit AI project ideas, get tool recommendations, and track lifecycle.

Stack (use exactly these):
- Vite + React 18 + TypeScript
- Tailwind CSS
- shadcn/ui components
- React Router v6
- Zustand for state management
- lucide-react for icons
- recharts for charts
- date-fns for date formatting
- nanoid for ID generation

Set up a brand-new project in the current directory with this exact folder structure:

src/
  components/
    layout/         (AppShell, Sidebar, Topbar, PageHeader, DemoBanner)
    common/         (StatusBadge, RoleBadge, GroupBadge, EmptyState, ToolStackChips)
    dialogs/        (CustomiseStackDialog, ConfirmDialog, FormDialog)
    ui/             (shadcn/ui generated components live here)
  pages/
    LoginPage.tsx
    DashboardPage.tsx
    SubmitProjectPage.tsx
    RecommendationPage.tsx
    ProjectsListPage.tsx
    ProjectDetailPage.tsx
    TrainingCatalogPage.tsx
    AdminPage.tsx
    NotFoundPage.tsx
  stores/
    authStore.ts
    projectsStore.ts
    catalogStore.ts
    uiStore.ts
  data/
    seedRoles.ts
    seedTools.ts
    seedTrainings.ts
    seedCombos.ts
    seedProjects.ts
    seedOrg.ts
  lib/
    recommendationEngine.ts
    lifecycle.ts
    utils.ts
  types/
    index.ts
  routes/
    AppRoutes.tsx
    ProtectedRoute.tsx
  App.tsx
  main.tsx
  index.css

Tasks for this prompt:
1. Initialize Vite with React + TypeScript.
2. Install all dependencies listed above.
3. Configure Tailwind CSS with the default shadcn/ui setup (CSS variables for theming, neutral base color).
4. Initialize shadcn/ui with components alias `@/components`, utils alias `@/lib/utils`.
5. Add these shadcn/ui components: button, card, input, label, textarea, select, dialog, dropdown-menu, table, tabs, badge, separator, sonner, avatar, progress, alert, sheet, skeleton, checkbox, scroll-area, tooltip.
6. Configure tsconfig and vite.config to use `@/` as alias for `src/`.
7. Create empty placeholder files for every file listed in the folder structure. Each placeholder exports a stub component or empty object so the project compiles.
8. Set up `App.tsx` to render `AppRoutes` inside `BrowserRouter` and include the Sonner Toaster.
9. Set the enterprise tone: neutral palette, single accent color (use Tailwind `indigo-600` as primary, hex `#534AB7`), Inter or system-ui font.
10. Verify the project builds cleanly with `npm run dev`.

Do NOT implement business logic yet — just scaffolding. All page components should render their name as an `<h1>` placeholder.
```

---
