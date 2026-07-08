# RECON-01 — Codebase Reconnaissance (read-only)

> Captured from a read-only recon of the GCS AI Project Portal. No files were modified during the recon itself; this document is the saved report.

---

## 1. Tech & build baseline

**Build tooling:** Vite `^6.3.5` (`@vitejs/plugin-react` `^4.5.2`). Not CRA / Next.js.  
**Node version pinned:** **not present** (no `.nvmrc`, no `engines` in `package.json`).

**`package.json` scripts / deps (raw):**

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

```json
"dependencies": {
  "@fontsource-variable/geist": "^5.2.9",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "date-fns": "^4.1.0",
  "lucide-react": "^0.525.0",
  "nanoid": "^5.1.5",
  "next-themes": "^0.4.6",
  "radix-ui": "^1.6.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "recharts": "^2.15.4",
  "shadcn": "^4.11.0",
  "sonner": "^2.0.7",
  "tailwind-merge": "^3.6.0",
  "tw-animate-css": "^1.4.0",
  "zustand": "^5.0.6"
}
```

```json
"devDependencies": {
  "@eslint/js": "^9.29.0",
  "@types/node": "^24.0.7",
  "@types/react": "^18.3.23",
  "@types/react-dom": "^18.3.7",
  "@vitejs/plugin-react": "^4.5.2",
  "autoprefixer": "^10.4.21",
  "eslint": "^9.29.0",
  "eslint-plugin-react-hooks": "^5.2.0",
  "eslint-plugin-react-refresh": "^0.4.20",
  "globals": "^16.2.0",
  "postcss": "^8.5.6",
  "tailwindcss": "^3.4.17",
  "typescript": "~5.8.3",
  "typescript-eslint": "^8.34.1",
  "vite": "^6.3.5"
}
```

**TypeScript:** Root `tsconfig.json` only has `paths` + project references. Real options are in `tsconfig.app.json`:

```json
"compilerOptions": {
  "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
  "target": "ES2022",
  "useDefineForClassFields": true,
  "lib": ["ES2022", "DOM", "DOM.Iterable"],
  "module": "ESNext",
  "skipLibCheck": true,
  "moduleResolution": "bundler",
  "allowImportingTsExtensions": true,
  "verbatimModuleSyntax": true,
  "moduleDetection": "force",
  "noEmit": true,
  "jsx": "react-jsx",
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "erasableSyntaxOnly": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedSideEffectImports": true,
  "baseUrl": ".",
  "paths": { "@/*": ["./src/*"] }
}
```

**Tests:** **not present** — no vitest/jest/RTL deps; 0 `*.test.*` / `*.spec.*` files. Pass/fail: N/A.

---

## 2. Repo map

**`src/` tree (2–3 levels):**

```
src/
  App.tsx, main.tsx, index.css, vite-env.d.ts
  components/
    admin/          common/         dashboard/
    dialogs/        layout/         project/
    recommendations/ submission/    trainings/   ui/
  data/             hooks/          lib/
  pages/            routes/         stores/      types/
```

**Line counts (every file under `src/`, ascending; PowerShell `Measure-Object -Line`):**

| Lines | Path |
|------:|------|
| 1 | `src/vite-env.d.ts` |
| 3 | `src/components/dialogs/FormDialog.tsx` |
| 9 | `src/hooks/useDashboardStats.ts` |
| 10 | `src/hooks/useHydrationReady.ts` |
| 11 | `src/components/ui/skeleton.tsx` |
| 13 | `src/data/seedOrg.ts` |
| 13 | `src/stores/uiStore.ts` |
| 14 | `src/main.tsx` |
| 14 | `src/routes/ProtectedRoute.tsx` |
| 15–50 | (ui primitives, badges, small layout) |
| 52 | `src/hooks/useFilteredProjects.ts` |
| 64 | `src/lib/projectDisplay.ts` |
| 68 | `src/components/common/StatusBadge.tsx` |
| 77 | `src/components/dialogs/AdvanceStageDialog.tsx` |
| 93 | `src/pages/LoginPage.tsx` |
| 95 | `src/stores/catalogStore.ts` |
| 125 | `src/components/project/LifecycleStepper.tsx` |
| 147 | `src/types/index.ts` |
| 156 | `src/lib/submissionWizard.ts` |
| 201 | `src/lib/lifecycle.ts` |
| 207 | `src/pages/ProjectDetailPage.tsx` |
| 209 | `src/pages/RecommendationPage.tsx` |
| 246 | `src/pages/ProjectsListPage.tsx` |
| 255 | `src/lib/recommendationEngine.ts` |
| 297 | `src/lib/dashboardStats.ts` |
| 308 | `src/stores/projectsStore.ts` |
| 308 | `src/pages/TrainingCatalogPage.tsx` |
| 337 | `src/pages/DashboardPage.tsx` |
| 408 | `src/components/submission/WizardFormFields.tsx` |
| 463 | `src/components/recommendations/RecommendationSections.tsx` |
| 471 | `src/components/dialogs/CustomiseStackDialog.tsx` |
| 634 | `src/components/project/ProjectDetailTabs.tsx` |
| 919 | `src/data/seedProjects.ts` |

**Total `src/` lines ≈ 11,907.**

---

## 3. State machine — HIGHEST PRIORITY

### Where defined / who owns transitions

| Concern | Location |
|--------|----------|
| Type unions | `src/types/index.ts` — `ProjectStatus`, `LifecycleStage`, `StageStatus` |
| Allowed stage transitions + RACI | `src/lib/lifecycle.ts` — `getAllowedTransitions`, `canActOnStage`, `isAllowedTransition`, `nextStage` |
| Mutation + `ProjectStatus` side effects | `src/stores/projectsStore.ts` — `advanceStage`, `submitProject`, `applyStatusSideEffects` |
| UI that triggers transitions | `src/pages/ProjectDetailPage.tsx` + `src/components/project/ProjectDetailTabs.tsx` + `AdvanceStageDialog.tsx` |

**Centralization:** Stage *options* and role gating are centralized in `lifecycle.ts`. Applying transitions and mapping them onto `ProjectStatus` lives in `projectsStore.ts`. Display/filter/seed still hardcode status/stage strings in several files (see blast radius).

### Transition function + status side-effect mapping

```ts
// src/lib/lifecycle.ts — getAllowedTransitions
export function getAllowedTransitions(
  currentStage: LifecycleStage,
  currentStageStatus: StageStatus,
): StageTransitionOption[] {
  switch (currentStageStatus) {
    case 'NotStarted':
      return [{ toStage: currentStage, toStatus: 'InProgress', label: 'Start this stage' }]
    case 'InProgress':
      return [
        { toStage: currentStage, toStatus: 'Completed', label: 'Mark complete' },
        { toStage: currentStage, toStatus: 'Blocked', label: 'Mark blocked' },
      ]
    case 'Completed': {
      const upcoming = nextStage(currentStage)
      if (!upcoming) return []
      return [{ toStage: upcoming, toStatus: 'NotStarted', label: `Advance to ${getStageMeta(upcoming).label}` }]
    }
    case 'Blocked':
      return [
        { toStage: currentStage, toStatus: 'InProgress', label: 'Resume' },
        { toStage: currentStage, toStatus: 'NotStarted', label: 'Reset stage' },
      ]
    default:
      return []
  }
}
```

```ts
// src/stores/projectsStore.ts — applyStatusSideEffects
function applyStatusSideEffects(
  project: Project,
  toStage: LifecycleStage,
  toStatus: StageStatus,
): ProjectStatus {
  let status = project.status
  if (toStage === 'Assessment' && toStatus === 'Completed' && status === 'Submitted') {
    status = 'Qualified'
  }
  if (toStatus === 'InProgress' && status === 'Qualified') {
    status = 'InProgress'
  }
  if (toStage === 'Use' && toStatus === 'Completed') {
    status = 'Completed'
  }
  if (toStage === 'Decommissioning' && toStatus === 'Completed') {
    status = 'Decommissioned'
  }
  return status
}
```

Also: `submitProject` sets `status: 'Submitted'` and `stageStatus.Assessment = 'InProgress'` independently of `applyStatusSideEffects`.

### `status` vs `stageStatus` / `currentStage`

- **`currentStage` + `stageStatus[currentStage]`** = operational “where in the lifecycle” (stepper / advance UI).
- **`status: ProjectStatus`** = coarse project-level badge (Draft → Submitted → Qualified → InProgress → Completed / Decommissioned).
- They are **set independently**, then loosely coupled by `applyStatusSideEffects` / `submitProject`.
- **Source of truth for “where is this project” in the lifecycle:** `currentStage` + `stageStatus`.
- **Source of truth for list/dashboard filters & badges:** mostly `status` (plus some stage checks, e.g. pending qualification = `Submitted` + `Assessment`).

**Notable gap:** `OnHold` and `Rejected` exist on `ProjectStatus` and in UI filters/badges, but **no store method ever sets them** (only seed data has `OnHold`).

### Blast-radius counts

**`ProjectStatus` / status-literal pattern:**  
**TOTAL_MATCHES = 166** across **12 files**:

| Count | File |
|------:|------|
| 72 | `src/data/seedProjects.ts` |
| 22 | `src/components/common/StatusBadge.tsx` |
| 16 | `src/stores/projectsStore.ts` |
| 12 | `src/types/index.ts` |
| 11 | `src/lib/dashboardStats.ts` |
| 11 | `src/pages/ProjectsListPage.tsx` |
| 9 | `src/lib/projectDisplay.ts` |
| 6 | `src/lib/lifecycle.ts` |
| 3 | `src/components/project/LifecycleStepper.tsx` |
| 2 | `src/hooks/useFilteredProjects.ts` |
| 1 | `src/components/project/ProjectDetailTabs.tsx` |
| 1 | `src/pages/ProjectDetailPage.tsx` |

**`LifecycleStage` / stage-name files** — **13 files**:

- `src/components/dashboard/LifecycleStageChart.tsx`
- `src/components/project/LifecycleStepper.tsx`
- `src/data/seedProjects.ts`
- `src/hooks/useFilteredProjects.ts`
- `src/lib/dashboardStats.ts`
- `src/lib/lifecycle.ts`
- `src/lib/projectDisplay.ts`
- `src/lib/utils.ts`
- `src/pages/DashboardPage.tsx`
- `src/pages/ProjectDetailPage.tsx`
- `src/pages/ProjectsListPage.tsx`
- `src/stores/projectsStore.ts`
- `src/types/index.ts`

### Hardcoded vs helpers

- **Routed through helpers for stage *actions*:** `getAllowedTransitions` / `canActOnStage` / `isAllowedTransition` / `getStageMeta` (store + ProjectDetailTabs).
- **No `humanizeStatus` export** — labels live inside `StatusBadge` (`projectStatusLabel` / `stageStatusLabel`) and `projectDisplay.stageStatusLabel`.
- **Hardcoded status arrays/literals in UI:** `ProjectsListPage.tsx` filter list; `StatusBadge` switch; `dashboardStats` filters; `ProjectDetailPage.showBenefitsTab`.
- **Rough split:** stage *transition enforcement* ≈ centralized; status *vocabulary / display / filters / seeds* ≈ **scattered** (~half the blast radius is seed + badge + list filters).

---

## 4. Role gating

**Chosen/stored:** Mock role selector on `src/pages/LoginPage.tsx` → `useAuthStore.loginAs(user)` → persisted key `gcs-ai-portal-auth` (`src/stores/authStore.ts`). Users from `src/data/seedRoles.ts`.

```ts
// src/lib/lifecycle.ts
export function canActOnStage(role: Role, stage: LifecycleStage): boolean {
  if (role === 'Admin') return true
  const meta = getStageMeta(stage)
  return role === meta.primaryOwnerRole || meta.supportingRoles.includes(role)
}
```

**Does every gated action use it?** **No.**

| Path | Mechanism |
|------|-----------|
| Stage advance | `canActOnStage` in store + UI |
| Submit / nav “Submit Project” | Direct `SUBMIT_ROLES` / `Sidebar` `roles` arrays |
| Admin nav | `roles: ['Admin']` on sidebar item |
| Dashboard callouts | Direct `currentUser.role === 'GovernanceLead' \| 'Sponsor' \| ...` |
| Benefits validate | Role checks in ProjectDetailTabs (not via `canActOnStage`) |

---

## 5. Stores & persistence

| Store | File | Responsibility | localStorage key |
|-------|------|----------------|------------------|
| `useAuthStore` | `src/stores/authStore.ts` | `currentUser`, login/logout | `gcs-ai-portal-auth` |
| `useCatalogStore` | `src/stores/catalogStore.ts` | tools / trainings / combos CRUD | `gcs-ai-portal-catalog` |
| `useProjectsStore` | `src/stores/projectsStore.ts` | projects, lifecycle, stacks, recs | `gcs-ai-portal-projects` |
| `useUiStore` | `src/stores/uiStore.ts` | page title, demo banner dismiss | **none** (not persisted) |

**Hydration:** `bootstrapStores()` in `src/stores/bootstrapStores.ts` — `persist.rehydrate()` for auth/catalog/projects; if a key is missing, `resetCatalog()` / `resetProjects()` / auth `null`. Merge: if persisted array empty/missing, keep in-memory seed. **No schema migration** — wipe-and-reseed style.

**Admin reset** (`AdminDemoControlsTab.tsx`):

- Reset catalog → `resetCatalog()` (seed tools/trainings/combos)
- Reset projects → `resetProjects()` (seed projects)
- Clear all → `clearAllLocalData()` removes all three keys + `window.location.reload()`

---

## 6. Tiering — was it built?

**`REFACTOR-01/02/03`:** **not present** (no refactor prompt files; no tier types/UI).

| Artifact | Status |
|----------|--------|
| `ProjectTier` | **not present** |
| `DesiredInvolvement` | **not present** |
| `suggestTier` | **not present** |
| “Assign tier” panel | **not present** |
| Tier badges | **not present** |
| Stack-ownership gating by tier | **not present** |
| Submitter waiting card | **not present** |
| Auto-tier-on-DE-submission | **not present** |

**`suggestTier`:** **not present** — cannot paste; nothing to classify as skill/impact vs risk-based.  
**DE auto-tier line:** **not present**.  
**Tier display labels / waiting card tiers:** **not present**.

Docs only mention “risk tier” narratively (Policy stage copy in `lifecycle.ts` / RACI docs); **no code model**.

---

## 7. Recommendation engine

**Exports (sync):**

```ts
export function recommendTools(
  submission: Submission,
  tools: Tool[],
  _trainings: Training[],
): { top: Recommendation[]; alternatives: Recommendation[] }

export function recommendCombos(submission: Submission, combos: ToolCombo[]): ToolCombo[]
```

`suggestTier`: **not present**.

**Storage on project:** `recommendations`, `alternativeRecommendations`, `recommendedComboIds`, `toolStack` (`Project` in `types/index.ts`). Written in `SubmitProjectPage.handleSubmit` via `setRecommendations` + `submitProject`; stack applied on Recommendations page (`applyCombo` / `updateToolStack`). UI: `RecommendationPage.tsx` + `RecommendationSections.tsx`; also Project Detail “Recommendations” tab.

---

## 8. Routing & pages

**Library:** `react-router-dom` v6.

```ts
// src/routes/AppRoutes.tsx
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/submit" element={<SubmitProjectPage />} />
        <Route path="/projects" element={<ProjectsListPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/projects/:id/recommendations" element={<RecommendationPage />} />
        <Route path="/trainings" element={<TrainingCatalogPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
```

| Route | Page file |
|-------|-----------|
| `/login` | `src/pages/LoginPage.tsx` |
| `/dashboard` | `src/pages/DashboardPage.tsx` |
| `/submit` | `src/pages/SubmitProjectPage.tsx` |
| `/projects` | `src/pages/ProjectsListPage.tsx` |
| `/projects/:id` | `src/pages/ProjectDetailPage.tsx` |
| `/projects/:id/recommendations` | `src/pages/RecommendationPage.tsx` |
| `/trainings` | `src/pages/TrainingCatalogPage.tsx` |
| `/admin` | `src/pages/AdminPage.tsx` |
| `*` | `src/pages/NotFoundPage.tsx` |

---

## 9. Submission / intake

**Single flow:** 4-step wizard on `/submit`.

- Steps: Basics → Use Case → Data → Readiness (`WIZARD_STEPS` in `src/lib/submissionWizard.ts`)
- State: local `useState` form + optional `draftProjectId`
- Validation: `validateWizardStep` per step; checklist via `getWizardChecklist`
- On submit: `createProject`/`updateProject` → `recommendTools`/`recommendCombos` → `setRecommendations` → `submitProject` → navigate to recommendations
- Roles: Submitter, BusinessAnalyst, Admin only

No second intake path found.

---

## 10. UI / design system

- **Tailwind:** yes (`tailwind.config.ts`, `src/index.css`)
- **shadcn/ui:** yes (`src/components/ui/*`, `components.json`, `shadcn` package)
- **Design tokens in code:** Tailwind `theme.extend.colors.brand.*` in `tailwind.config.ts`; CSS vars in `src/index.css`. Authoritative doc: `docs/DESIGN_TOKENS.md` (not imported as a TS module).

**Status / stage / tier rendering:**

| Kind | Files |
|------|-------|
| Project/stage **status badges** | `src/components/common/StatusBadge.tsx` |
| Lifecycle **stepper** | `src/components/project/LifecycleStepper.tsx` |
| Stage chart (dashboard) | `src/components/dashboard/LifecycleStageChart.tsx` |
| Header status chip | `src/components/project/ProjectHeaderCard.tsx` (uses StatusBadge) |
| **Tier badges** | **not present** |

---

## 11. Divergences & known fragility

**Divergences from `docs/` / `.cursorrules`:**

1. **Azure-from-day-one interfaces** (`IAuthProvider`, `IFileStore`, `ILlmProvider`) — **not present** in `src/lib/`.
2. **Tier / risk-tier as a data model** — mentioned in Policy stage copy / RACI docs; **not implemented** in types or UI.
3. **`OnHold` / `Rejected`** — in types, badges, filters, one seed project (`OnHold`); **no transition path** sets them.
4. **`FormDialog.tsx`** is a stub (`return null`) — dead placeholder.
5. **`REFACTOR-01/02/03` tiering** — **not applied** (contrary to recon context assumption).
6. Recommendation engine uses `SEED_TOOLS` inside `recommendCombos` for sensitivity lookup, not the live catalog store tools — fragile if Admin edits tools.

**`TODO` / `FIXME` / `HACK` in `src`:** **0 matches**.

**Other fragility:**

- Dual status model (`status` vs `stageStatus`) can drift if side-effect rules change incompletely.
- Role gating split between `canActOnStage` and ad-hoc role arrays.
- Persist merge has no versioning — old localStorage shapes won’t migrate.

---

## Wrap-up

1. **Architecture (3–5 sentences):** This is a Vite + React 18 SPA with Zustand/`localStorage` as the only persistence layer. Domain “smarts” sit in pure `src/lib/` modules (`lifecycle.ts` for stage transitions/RACI, `recommendationEngine.ts` for tool/combo scoring, `submissionWizard.ts` for intake validation) while mutations live in Zustand stores—especially `projectsStore`, which owns project CRUD, stack updates, and the `ProjectStatus` side effects of stage advances. Pages compose UI; seed data under `src/data/` bootstraps first run. There is no backend and no tiering subsystem in this tree.

2. **Status/transition centralization (the answer you care about most):** **Partially centralized, not fully.** Allowed *stage* transitions and role checks are owned by `src/lib/lifecycle.ts`, and applying them + mapping to `ProjectStatus` is owned by `src/stores/projectsStore.ts`. But changing the **set of statuses** (or labels/filters) still requires touching **many files** — types, StatusBadge, ProjectsListPage filters, dashboardStats, seeds, and possibly ProjectDetailPage — **~12 files / ~166 references**. Stage vocabulary similarly spans **13 files**. So: transition *rules* are concentrated; status *vocabulary blast radius* is **not**.

3. **Shortlist to read in full (do not zip):**
   1. `src/types/index.ts`
   2. `src/lib/lifecycle.ts`
   3. `src/stores/projectsStore.ts`
   4. `src/lib/recommendationEngine.ts`
   5. `src/pages/SubmitProjectPage.tsx`
   6. `src/components/project/ProjectDetailTabs.tsx`
   7. `src/lib/submissionWizard.ts`
   8. `src/stores/bootstrapStores.ts`
   9. `docs/DATA_MODEL.md`
   10. `docs/ROLE_LIFECYCLE_RACI.md`
