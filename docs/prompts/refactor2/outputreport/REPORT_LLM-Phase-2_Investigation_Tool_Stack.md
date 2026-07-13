# REPORT — LLM Phase 2 Investigation: Tool Stack, Accept Flow, Risk Tier, Reward Category

**Branch:** `feature/openai-llm-provider`  
**Mode:** Read-only (this file is the only artifact created).  
**Date:** 2026-07-12

## Summary

A **rule-based tool-stack recommender already exists** (`recommendTools` / `recommendCombos` in `src/lib/recommendationEngine.ts`) and is **wired** — but only on the project-detail **Tool Selection** tab **after qualification** (`Qualified` / `QualifiedDraft`), not at intake submit and not inside the qualification “accept” handler. Intake sidebar copy that promises “top 3 tool recommendations instantly” is **static marketing text** with no engine call on the wizard path. Governance “accept” of a project as AI (`qualifyProject`) already sets **risk tier** and **reward category** and does **not** touch `toolStack`. A second “accept” (`approveSubmission`) reviews the user-built stack after `submitForReview` and also does not invent tools. Relative to the governance IF-ACCEPT box (tier + stack + reward on accept), the **code splits concerns**: tier + reward at qualification; stack recommendation + pick later on Tool Selection; stack approve still later. A future LLM recommender would **augment** the existing engine/UI, with the cleanest insertion at Tool Selection (post-`qualifyProject`, when `tier`/`rewardCategory` already exist) or optionally inside the qualify confirm dialog if product wants stack+reward in one step.

---

## A. Tool catalog

### A1. Does a catalog exist?

**Yes.**

| Layer | Evidence |
|---|---|
| Seed list | `src/data/seedTools.ts` — `SEED_TOOLS` |
| Runtime store | `src/stores/catalogStore.ts` — `tools` cloned from seed (`seedCatalog` ~L25–28) |
| Type | `Tool` in `src/types/index.ts:94-107` |
| Combos (related) | `src/data/seedCombos.ts` — `SEED_COMBOS`; type `ToolCombo` `src/types/index.ts:123-134` |

**`Tool` shape** (`src/types/index.ts:94-107`):

```ts
export interface Tool {
  id: string
  name: string
  category: string
  vendor: string
  description: string
  typicalUseCases: string[]
  requiredSkillLevel: SkillLevel
  maxDataSensitivity: DataSensitivity
  trainingIds: string[]
  gettingStartedUrl: string
  lastReviewed: string
  iconHint: string
}
```

**Excerpt** (`src/data/seedTools.ts` — first entry, Power Apps): `id: 'tool-power-apps'`, `category: 'Low-code'`, `vendor: 'Microsoft'`, `typicalUseCases: ['Mobile field apps', ...]`, `requiredSkillLevel: 'Basic'`, `maxDataSensitivity: 'Internal'`.

### A2. Tied to tier / reward / department?

**Flat catalog.** No `riskTier`, `rewardCategory`, `department`, or `group` on `Tool`. Department/group live on `Project` (`src/types/index.ts:283-285`). Combos carry `bestForKeywords`, `skillLevelRequired`, `riskFlags`, `matchScore` — still not keyed to project tier/reward (`src/types/index.ts:123-134`).

### A3. Counts and fields

- **10 tools** in `SEED_TOOLS` (10 `id: 'tool-…'` entries).
- **5 combos** in `SEED_COMBOS`.
- Per-tool fields: the 12 properties listed in A1 (`id` through `iconHint`).

---

## B. Recommendation logic (the “top 3”)

### B4. Recommendation logic exists?

**Yes.** `src/lib/recommendationEngine.ts`:

- `recommendTools(submission, tools, trainings)` (~L217+) — keyword rules over `useCase`/`problem`/`goal`, typical-use-case tokens, skill gap, sensitivity, existing tools, integrations; returns top 3 with `confidence > 0.3` plus alternatives.
- `recommendCombos(submission, combos, tools)` (~L244+) — rescores combos from `matchScore`, keywords, skill, sensitivity, existing primary tool.

**Does not key off** `project.tier`, `rewardCategory`, `department`, or readiness/qualification checklists — only `Submission` + catalog.

### B5. Wired or dead?

**Wired** (not dead):

| Call site | Evidence |
|---|---|
| Generate + persist | `ProjectDetailTabs.tsx:685-697` (`recommendTools` / `recommendCombos` → `setRecommendations`) |
| Auto-run when empty | `ProjectDetailTabs.tsx:700-705` — only when `editable` (`Qualified` \| `QualifiedDraft`) |
| Store | `projectsStore.ts` `setRecommendations` (~L462+) |
| Combo display helper | `RecommendationSections.tsx` imports `recommendCombos` (~L20, ~L43) |
| Legacy route | `RecommendationPage.tsx` redirects to `?tab=tool-selection` — no standalone UI |

**No match found:** `recommendationEngine.test.ts`.

**Not called from:** `submitProject`, `qualifyProject`, `approveSubmission`, `ManualSubmitPage`, `AssistedIntakePage`, `SubmitProjectPage`.

### B6. Intake “top 3 instantly” copy

**Static text only** — not backed by a call on the wizard path:

```12:16:src/components/submission/SubmissionWizardSidebar.tsx
const AFTER_SUBMIT_STEPS = [
  "You'll see your top 3 tool recommendations instantly.",
  'Your project goes to the Governance Lead for qualification review.',
  "You'll be notified when it's approved to proceed to development.",
]
```

Rendered from `ManualSubmitPage` (sidebar). Assisted intake does **not** use this sidebar or the engine (**no match** for `recommend` in `AssistedIntakePage.tsx`).

**Actual recommendation UI:** Tool Selection tab inside `ProjectDetailTabs.tsx` (~L656–898) after qualification — combo cards + rankings from `project.recommendations`.

**Contradiction resolved:** UI copy implies intake-time recommendations; **code runs recommendations only post-qualification** on Tool Selection.

---

## C. Accept / reject flow

There are **two** reviewer accept/reject gates (no symbol named `accept`).

### C7. Where?

#### Gate 1 — Qualification (`ForAssessment` → Qualified / NotQualified)

| Piece | Evidence |
|---|---|
| UI | `ProjectQualificationTab.tsx` — Qualify / Not Qualified / Cancel |
| Page wiring | `ProjectDetailPage.tsx` — `qualifyProject` / `rejectQualification` / `cancelProject` |
| Store | `projectsStore.ts:645-721` `qualifyProject`; `rejectQualification` ~L723+ |
| Roles | Governance Lead, Risk & Compliance, Admin (`QUALIFY_ROLES` / tab `REVIEWER_ROLES`) |

#### Gate 2 — Tool-stack submission review (`Submitted` → Active / ForEHSReview / Rejected)

| Piece | Evidence |
|---|---|
| UI | `StatusGateActions.tsx` — Approve / Reject when status `Submitted` |
| Mounted from | `ProjectDetailTabs.tsx` Tool Selection tab (~L806+) |
| Store | `approveSubmission` `projectsStore.ts:955-1021`; `rejectSubmission` ~L1023+ |
| Roles | Governance Lead, AI Program Manager, Admin |

### C8. What happens on accept?

#### `qualifyProject` (project accepted as AI)

Changes (`projectsStore.ts:679-715`):

- `status: 'Qualified'`
- persists `readiness`, `qualification` (incl. `riskTier`)
- sets `tier`, `tierRationale`, `rewardCategory`, `autoTiered: false`
- optional BA/DE/PM ids
- `currentStage: 'Policy'`; Assessment → Completed
- **Does not** set `toolStack`, `recommendations`, or call the engine

#### `approveSubmission` (submitted stack accepted)

Changes (`projectsStore.ts:964-1005`):

- `ForEHSReview` if `ehsCoordinatorId` set, else `Active` via `activateProjectFields`
- **Does not** modify `toolStack`, `recommendations`, `tier`, or `rewardCategory`
- Prerequisite: non-empty `toolStack` at `submitForReview` (store ~L861+)

### C9. Natural insertion points for LLM stack suggestion (do not build)

1. **Tool Selection tab** (`ProjectDetailTabs.tsx` `generateRecommendations`) — already the recommender home; tier/reward already on project. Cleanest augment of existing UX.
2. **`StatusGateActions` approve dialog** (~L308–347) — reviewer confirms stack at final approve (stack already chosen).
3. **`qualifyProject` confirm dialog** (`ProjectQualificationTab`) — only if product wants stack+reward in the IF-ACCEPT box; today stack is usually still empty here.
4. Intake wizard — would match the misleading copy but **contradicts** post-accept governance framing in the prompt.

---

## D. Risk tier & qualification

### D10. Where assigned / stored?

| Piece | Evidence |
|---|---|
| Hint only | `suggestTier(submission)` `src/lib/qualificationLogic.ts:49-73` — sensitivity + keyword nudges + `estimatedUsers` |
| UI seed | `ProjectQualificationTab.tsx` initializes from `suggestTier` (~L271–274) |
| Persist | `qualifyProject` writes `project.tier`, `tierRationale`, `qualification.riskTier` (`projectsStore.ts:686-692`) |
| Mapping | `RISK_BY_TIER` / `TIER_BY_RISK` in `src/lib/projectStatus.ts:161-171` |

`autoTiered` exists on `Project` but qualify always sets `autoTiered: false` — **no auto-tier implementation**.

### D11. Tier available before stack approve?

**Yes.** Order: `ForAssessment` → `qualifyProject` (sets tier) → Tool Selection / recommendations → `submitForReview` → `approveSubmission`. At `Submitted`, `project.tier` and `rewardCategory` are already set. `approveSubmission` does not read them.

### D12. Qualification criteria / readiness

| Piece | Evidence |
|---|---|
| Criteria text | `src/lib/qualificationCriteria.ts` — feasibility/viability/desirability arrays; Section A/B/C; risk options |
| Scoring | `scoreReadiness`, `qualifiesAsAI`, `canQualify` in `qualificationLogic.ts` |
| Persist | `project.readiness`, `project.qualification` (`types/index.ts:306-307`) written only in `qualifyProject` |

Wizard “Readiness” step is **team skills/tools/integrations** into `Submission`, **not** the `ReadinessAssessment` checklist (**no match** for readiness checklist on intake).

---

## E. Reward category

### E13. Assigned where / how / when?

- **When:** At **qualification** (`qualifyProject`), required by `canQualify` (`qualificationLogic.ts:83-89`).
- **Where:** Manual select in `ProjectQualificationTab.tsx` (~L531–547); options `REWARD_CATEGORY_OPTIONS` in `qualificationCriteria.ts:112-117` (`Kaizen` \| `TeamProject` \| `ManagementInitiative` \| `Innovation`).
- **Logic:** **None automated** — reviewer must pick. Seed projects set via helpers only.

### E14. Coupled to tool stack?

**Independent.** No references to `rewardCategory` in `recommendationEngine.ts`, `toolStack.ts`, or `approveSubmission`. Displayed later (e.g. CI portal adapter). Workflow diagram may bundle “IF ACCEPT → stack + reward”; **code assigns reward at qualify and stack later**.

---

## F. Data model

### F15. Fields for a recommender

**`Submission`** (`types/index.ts:136-150`) — engine inputs today: `useCase`, `problem`, `goal`, `targetUsers`, `expectedOutcome`, `dataSources`, `dataSensitivity`, `dataAccessStatus`, `skillLevelAvailable`, `existingTools`, `integrationTargets`, `estimatedUsers`, `expectedBenefitHours`.

**Already on `Project` for storage / context** (`types/index.ts:289-307`):

| Field | Role |
|---|---|
| `recommendations` / `alternativeRecommendations` / `recommendedComboIds` | Persist ranked suggestions |
| `toolStack` | Assigned primary + supporting tools |
| `tier` / `tierRationale` / `autoTiered` | Risk tier after qualify |
| `rewardCategory` | Reward after qualify |
| `qualification` / `readiness` | Checklists after qualify |
| `group` / `site` / `department` | Org context (unused by current engine) |

New project create leaves recommendations/stack/tier/reward empty (`projectsStore` create path ~L411+).

---

## UNKNOWN / not found

| Item | Status |
|---|---|
| `recommendationEngine` unit tests | **No match found** |
| Automated reward-category assignment | **No match found** (manual only) |
| Catalog rows keyed by tier/reward/department | **No match found** |
| Engine call on intake submit / assisted intake | **No match found** |
| Symbol named `accept` / `acceptProject` | **No match found** (use Qualify / Approve) |
| Whether product intent is to move stack into `qualifyProject` vs keep Tool Selection | **UNKNOWN** (product decision; code currently separates them) |
| Production OpenAI model id for a future LLM recommender | **UNKNOWN** (infra uses `OPENAI_MODEL`; out of scope here) |

---

## Implications for building

1. **Augment, don’t build from scratch.** Catalog, `toolStack` / `Recommendation` types, rule engine, and Tool Selection UI already exist. An LLM recommender should feed the same shapes (`Recommendation[]`, combo ids, optional direct `toolStack` suggestion) and can sit beside or behind `recommendTools`/`recommendCombos`.
2. **Tier-aware LLM is feasible at the current wiring point** — `project.tier` (and reward) already exist when Tool Selection generates recommendations. Intake-time LLM would **not** have tier yet unless tiering moves earlier.
3. **Cleanest insertion:** `generateRecommendations` in `ProjectDetailTabs.tsx` (post-qualify), with graceful fallback to the rule engine via `tryCallLLM`. Optional second surface: qualify dialog only if governance wants stack+reward in one accept step (would be a product/flow change vs today’s code).
4. **Fix or retire misleading copy** in `SubmissionWizardSidebar.tsx:13` when implementing — it currently contradicts the real pipeline.
5. **Do not conflate gates:** qualification accept ≠ stack approve. Reward is already handled at qualify; stacking LLM work onto `approveSubmission` alone would miss where users actually pick tools today.

---

## Files touched this investigation

- **Created:** `docs/prompts/refactor2/outputreport/REPORT_LLM-Phase-2_Investigation_Tool_Stack.md` (this file).
- **No other files modified** during this investigation.
- **Note:** Pre-existing uncommitted working-tree changes from earlier LLM local-dev debugging (`api/llm.ts`, `vercel.json`, `.gitignore`, `docs/llm/SETUP.md`, plus unrelated `docs/` moves) were left untouched and are **not** part of this report’s scope. No commit (per prompt).
