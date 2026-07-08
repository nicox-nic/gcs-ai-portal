# V3-PHASE-0 — Status State Machine + Data Model Foundation

> **Cursor — read this fully before editing. This is a surgical refactor of an existing app (built from PROMPT-00…13), not a rebuild.**
> Rules for this whole prompt:
> - Do **not** regenerate files. Read each file's current contents before editing, and use `str_replace`/surgical edits.
> - If any target text has changed from what's described here, or a change conflicts with a later custom fix, **stop and report** — don't overwrite blindly.
> - This phase changes the **data model + status state machine only**. Do **not** build new screens/pages (EHS review, profile setup, AI-assisted intake, tier UI, aging) — those are later phases. Touch UI **only** as far as needed to keep `npm run build` green (exhaustive `Record<ProjectStatus,…>` maps, filter arrays, status checks).
> - End at a green `npm run build`. Then write your change report to **`V3-PHASE-0_REPORT.md`** (what you changed, per file; anything you skipped or flagged).

## Architectural rule (applies to all V3 phases)
We are **keeping the 9-stage ISO lifecycle** (`currentStage` + `stageStatus`) as the governance backbone, and **layering the V3 operational status pipeline on top** as a first-class state machine. The two axes are **mapped, not merged**: `ProjectStatus` becomes the V3 pipeline; the ISO stages remain independently walkable underneath `Active`. `Completed` will arrive **only** from sponsor approval (a later phase) — remove any auto-complete rule now.

---

## Step 1 — Types (`src/types/index.ts`)

**1a. Replace the `ProjectStatus` union** with the V3 pipeline (16 states):
```ts
export type ProjectStatus =
  | 'IdeaDraft' | 'ForAssessment' | 'NotQualified' | 'Cancelled'
  | 'Qualified' | 'QualifiedDraft' | 'Submitted' | 'Rejected'
  | 'ForEHSReview' | 'EHSRejected' | 'Active'
  | 'ForSponsorApproval' | 'Disapproved' | 'Completed'
  | 'Idle' | 'Deactivated'
```
(The old `Draft | InProgress | OnHold | Decommissioned` are gone — `OnHold` had no transition path anyway. Reseeding handles migration.)

**1b. Add `'EHS'`** to the `Role` union.

**1c. Add new enums:**
```ts
export type ProjectTier = 'Tier1' | 'Tier2' | 'Tier3'   // 1:1 with RiskLevel: Tier1=Low, Tier2=Medium, Tier3=High
export type RewardCategory = 'Kaizen' | 'TeamProject' | 'ManagementInitiative' | 'Innovation'
```

**1d. Add assessment interfaces** (shape only — the item text lands in Phase 3):
```ts
export interface ReadinessAssessment {   // AI Readiness Checklist
  feasibility: boolean[]    // 7 items, 0/1
  viability: boolean[]      // 7 items
  desirability: boolean[]   // 7 items
}
export interface QualificationAssessment {  // AI Qualification Checklist
  primary: boolean[]        // A1–A6 (any true ⇒ qualifies as AI)
  supporting: boolean[]     // B1–B4
  exclusions: boolean[]     // C1–C5
  riskTier: RiskLevel | null // Section D selection
}
```

**1e. Extend `Project`** — add these fields (nullable/defaulted so seed + reseed stay valid):
```ts
tier: ProjectTier | null
tierRationale: string
autoTiered: boolean
rewardCategory: RewardCategory | null
ehsCoordinatorId: string | null
qualification: QualificationAssessment | null
readiness: ReadinessAssessment | null
activeSince: string | null          // stamped when status first becomes 'Active'
lastActivityAt: string              // for aging (Phase 6); default = updatedAt
sponsorDecision: 'Approved' | 'Disapproved' | null
sponsorDecisionNote: string
```
Keep existing `reportedBenefitHours` / `sponsorValidated` for now (closure phase reconciles them).

**1f. Extend `User`** (profile setup is Phase 1; add the fields now so the model is coherent):
```ts
skillLevel?: SkillLevel
toolChain?: string[]
integrationTargets?: string[]
profileComplete?: boolean
```

Run `npm run build` — expect many errors (exhaustive maps, seeds, store). The next steps fix them.

---

## Step 2 — New status registry + state machine (`src/lib/projectStatus.ts`, new file)

Create a single source of truth for status **vocabulary, display, transitions, and stage mapping** (this fixes today's scatter across StatusBadge / filters / dashboardStats):

- `PROJECT_STATUSES: ProjectStatus[]` — ordered as the pipeline reads.
- `STATUS_META: Record<ProjectStatus, { label: string; variant: string; category: 'intake'|'review'|'active'|'closure'|'lifecycle' }>` — `label` uppercase like the current badge; `variant` = the Tailwind classes currently in `StatusBadge.statusVariant` (reuse the same palette: green=Qualified/Completed, amber=Active, stone=drafts, red=Rejected/NotQualified/EHSRejected/Disapproved, orange=Idle, stone-dark=Deactivated/Cancelled).
- `getAllowedStatusTransitions(status: ProjectStatus): ProjectStatus[]` — encode this graph (the V3 pipeline):
  - `IdeaDraft` → `ForAssessment`, `Cancelled`
  - `ForAssessment` → `Qualified`, `NotQualified`
  - `NotQualified` → `ForAssessment`, `Cancelled`
  - `Qualified` → `QualifiedDraft`, `Submitted`
  - `QualifiedDraft` → `Submitted`
  - `Submitted` → `ForEHSReview`, `Active`, `Rejected`
  - `Rejected` → `Submitted`, `Cancelled`
  - `ForEHSReview` → `Active`, `EHSRejected`
  - `EHSRejected` → `Submitted`, `Cancelled`
  - `Active` → `ForSponsorApproval`, `Idle`
  - `ForSponsorApproval` → `Completed`, `Disapproved`
  - `Disapproved` → `Active`, `ForSponsorApproval`
  - `Idle` → `Active`, `Deactivated`
  - `Deactivated` → `Active`
  - `Completed`, `Cancelled` → `[]` (terminal)
- `humanizeProjectStatus(status)` and `statusVariant(status)` helpers.
- `STATUS_STAGE_ANCHOR: Partial<Record<ProjectStatus, LifecycleStage>>` — anchor the pre-Active statuses to `'Assessment'` (`IdeaDraft`…`EHSRejected` → `Assessment`), and `Deactivated` → `'Decommissioning'`. `Active`/closure/lifecycle statuses do **not** force a stage — the ISO stage axis stays user-driven while Active. Document this.
- `RISK_BY_TIER: Record<ProjectTier, RiskLevel>` = `{ Tier1:'Low', Tier2:'Medium', Tier3:'High' }` and its inverse `TIER_BY_RISK`.

Add a lightweight unit-test file (there is no test runner yet — add `vitest` as a devDep and a `test` script, keep config minimal) covering: every status appears in `STATUS_META`; the transition graph has no dangling target; terminal states return `[]`. Keep it to one spec file.

---

## Step 3 — Rewire the store (`src/stores/projectsStore.ts`)

- `createProject`: set `status: 'IdeaDraft'` (was `'Draft'`); initialise the new fields (`tier:null`, `tierRationale:''`, `autoTiered:false`, `rewardCategory:null`, `ehsCoordinatorId:null`, `qualification:null`, `readiness:null`, `activeSince:null`, `lastActivityAt: timestamp`, `sponsorDecision:null`, `sponsorDecisionNote:''`).
- `submitProject`: set `status: 'ForAssessment'` (was `'Submitted'`).
- **Replace `applyStatusSideEffects`** with interim mappings that keep the app functional *until* the gate screens land in later phases (leave a clear `// TODO(V3 Phase N)` on each seam):
  - Assessment `Completed` while `ForAssessment` → `Qualified`  *(Phase 3 will replace this with the explicit qualify gate)*
  - First post-Assessment stage → `InProgress` while status ∈ {`Qualified`,`QualifiedDraft`,`Submitted`} → set `Active` and stamp `activeSince`/`lastActivityAt` if not set  *(Phase 4 will gate this behind EHS)*
  - Decommissioning `Completed` → `Deactivated`
  - **Remove** the `Use Completed → Completed` rule (closure is sponsor-driven, Phase 5).
- Every mutating action sets `lastActivityAt = nowIso()` (needed for Phase 6 aging).
- Update the `persist` `merge`/`partialize` only if field shape requires it (it shouldn't — still wipe-and-reseed).

---

## Step 4 — Keep the build green (mechanical UI/vocab updates)

- `src/components/common/StatusBadge.tsx`: replace the inline `projectStatusLabel` map and `statusVariant` switch to **delegate to `STATUS_META`** from the new registry (single source of truth). Keep the stage-status path unchanged.
- `src/pages/ProjectsListPage.tsx`: replace the hardcoded `STATUSES` array with `PROJECT_STATUSES` from the registry.
- `src/lib/dashboardStats.ts`: update the status `.filter(...)` calls to the new vocabulary — `inProgressCount` counts `Active`; `completedCount` counts `Completed`; `pendingQualification` = status `ForAssessment`; `awaitingValidation` keep as-is but gate on `Completed`; `highRiskProjects` — replace the `OnHold` check with `status === 'Idle'` **or** any `stageStatus === 'Blocked'`. Update `completionRateByGroup` denominator exclusions (`IdeaDraft`, `NotQualified`, `Cancelled`, `Rejected` instead of `Draft`/`Rejected`).
- `src/pages/ProjectDetailPage.tsx`: `showBenefitsTab` — replace `status === 'Completed'` logic to also allow `ForSponsorApproval`; keep the stage-based conditions.
- Fix `humanizeStatus` in `src/lib/utils.ts` if it enumerates statuses — delegate to the registry.

---

## Step 5 — Debt fixes (do while in here)

- `src/lib/recommendationEngine.ts` → `recommendCombos`: it builds `toolsById` from `SEED_TOOLS`. Change it to accept the live `tools: Tool[]` param (thread it from callers `SubmitProjectPage` and `ProjectDetailTabs`/`RecommendationSections`), so Admin tool edits are respected. If threading is non-trivial, **report** rather than force it.
- (Do **not** touch `buildSubmission`'s `estimatedUsers` hardcode here — that's the Phase 2 intake change. Leave a `// TODO(V3 Phase 2)` note.)

---

## Step 6 — Reseed (`src/data/seedProjects.ts`)

Remap every seed project's `status` to the new vocabulary using **both** its old `status` and `currentStage`, preserving `currentStage`/`stageStatus` and the demo narrative:
- old `Draft` → `IdeaDraft`
- old `Submitted` (currentStage Assessment) → `ForAssessment`
- old `Qualified` → `Qualified`
- old `InProgress` → `Active` (stamp `activeSince` from the project's `updatedAt`)
- old `OnHold` → `Idle`
- old `Completed` → `Completed`
- old `Rejected` → `Rejected`
- old `Decommissioned` → `Deactivated`
Add the new fields to each seed project: default `tier:null`, `tierRationale:''`, `autoTiered:false`, `rewardCategory:null`, `ehsCoordinatorId:null`, `qualification:null`, `readiness:null`, `sponsorDecision:null`, `sponsorDecisionNote:''`, and `lastActivityAt = updatedAt`. **Do not** invent tier/qualification content yet — that arrives with the tiering/qualification phases. Add the EHS seed user to `src/data/seedRoles.ts` (`usr-ehs`, role `'EHS'`, plausible name/dept). Leave dedicated Idle/Deactivated demo projects for Phase 6.

---

## Step 7 — Verify & report
1. `npm run build` passes; `npm run test` (the new vitest spec) passes.
2. App runs; Admin → Clear All Local Data → reload reseeds cleanly; project list, detail, dashboard render with the new statuses.
3. Write **`V3-PHASE-0_REPORT.md`**: per-file summary of changes, the final `ProjectStatus` set as implemented, anything you skipped or flagged, and confirm no new screens were added.
