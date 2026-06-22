# GCS AI Project Portal — Cursor Prompt 3

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

## Prompt 3 — Zustand Stores with localStorage Persistence

```
Continue building the GCS AI Project Portal demo.

Implement four Zustand stores. Three persist to localStorage; one is in-memory only.

1. `src/stores/authStore.ts` (persist key: `gcs-ai-portal-auth`)
   - State: `currentUser: User | null`
   - Actions: `loginAs(user: User)`, `logout()`
   - Selector: `useIsAuthenticated()`

2. `src/stores/catalogStore.ts` (persist key: `gcs-ai-portal-catalog`)
   - State: `tools: Tool[]`, `trainings: Training[]`, `combos: ToolCombo[]`
   - Actions: full CRUD on each (`addTool`, `updateTool`, `deleteTool`, same for trainings, same for combos), plus `resetCatalog()` which re-seeds from SEED_TOOLS / SEED_TRAININGS / SEED_COMBOS.
   - On first hydration (empty storage), initialize from the seed data.

3. `src/stores/projectsStore.ts` (persist key: `gcs-ai-portal-projects`)
   - State: `projects: Project[]`
   - Actions:
     - `createProject(input: { title; submitterId; group; site; department; submission })` — generates id `prj-XXX` via nanoid, status 'Draft', currentStage 'Assessment', empty recommendations, empty toolStack, empty auditLog, all stageStatus 'NotStarted'.
     - `submitProject(projectId)` — sets status 'Submitted', logs transition.
     - `setRecommendations(projectId, recs, alternatives, recommendedComboIds)` — stores engine output.
     - `applyCombo(projectId, comboId)` — replaces toolStack with the primary + add-ons from the combo, preserving each add-on's role label as `usageNote`.
     - `updateToolStack(projectId, stack: ToolStackEntry[])` — used by the Customise Stack dialog. Validates exactly one entry has role 'primary'.
     - `advanceStage(projectId, toStage, toStatus, actor: User, note)` — see Prompt 7 for full rules.
     - `updateProject(projectId, patch)`
     - `reportBenefits(projectId, hours)` — submitter action.
     - `validateBenefits(projectId)` — sponsor action; sets sponsorValidated true.
     - `resetProjects()` — re-seeds from SEED_PROJECTS.
   - On first hydration, initialize from SEED_PROJECTS.

4. `src/stores/uiStore.ts` (NOT persisted, in-memory only)
   - State: `pageTitle: string`, `demoBannerDismissed: boolean`
   - Actions: `setPageTitle(title)`, `dismissDemoBanner()`

In `src/lib/utils.ts`, add:
- `formatDate(iso): string` — date-fns format "MMM d, yyyy"
- `formatDateTime(iso): string` — "MMM d, yyyy, h:mm a"
- `formatRelative(iso): string` — "2 hours ago", "3 days ago", using date-fns formatDistanceToNow
- `humanizeRole(role: Role): string` — 'BusinessAnalyst' → 'Business Analyst', etc.
- `humanizeStage(stage: LifecycleStage): string` — 'SupplierOversight' → 'Supplier Oversight', etc.
- `roleDescription(role: Role): string` — short tagline per role (used on login cards).
- `cn(...)` — the standard shadcn class merger.

Use TypeScript strictly. Each store exposes typed selectors. Leave `advanceStage` permissive in this prompt — Prompt 7 adds the role gating.
```

---
