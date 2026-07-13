# Remediation: Development Phase — Tier Assignment, Fail-Closed & Tier Gates

Date: 2026-07-13
Scope: FIX-NOW items from the development-phase gap analysis. No structural refactor.
Baseline spec count: 101 → Final: 111

## Phase 0 — Pre-flight & assumption check

- Working tree not clean (unrelated docs moves / LLM WIP on `feature/openai-llm-provider`). Phase commits staged only in-scope source files.
- Baseline: `npm run build` green; `npm run test` **101** passed.
- **Entry transition (fail-closed target):** `submitForReview` — `Qualified` / `QualifiedDraft` → `Submitted`. This is the first advancement out of Qualified toward development. Gated on `project.tier !== null`.
- **Gate placement without new statuses:** Feasible. Gate 1 = `pmRequirementsGate` decision record layered on Development (blocks Development Complete). Gate 2 = `pmDevelopmentGate` at Development→Deployment for Tier3. No new lifecycle statuses/stages.
- **Reject-loop mechanism:** Gate 1 Reject clears BA `requirements.confirmedBy/At` (reopens revise). Gate 2 Reject sets Development back to `InProgress` (and pulls `currentStage` back to Development if already on Deployment). Mirrors UAT Fail remediates-without-new-status pattern.
- **STOP?** No. Assumptions held.

## Phase 1 — Tier assignment action

- Store: `assignDeliveryTier(projectId, tier, actor)`.
- Role guard: `DELIVERY_TIER_ASSIGN_ROLES` = `DataEngineering`, `GovernanceLead`, `Admin` (`src/lib/roles.ts`).
- Editable on `Qualified` **and** `QualifiedDraft` (judgment: QualifiedDraft is still pre-development; needed so `prj-070` can be unblocked). Locked once past those statuses (Submitted+).
- No risk default; `suggestProjectTier` left unused.
- UI: Overview “Delivery tier assignment” picker (`ProjectDetailTabs`) with TIER_META labels; starts unset / “Not yet assigned”; audit note on assign.

## Phase 2 — Fail-closed entry gating

- Gated transition: `submitForReview` throws if `!project.tier`; Submit control disabled with amber banner (“Assign a delivery tier…”).
- Seeds `prj-061` (Qualified) and `prj-070` (QualifiedDraft) remain null-tier until assignment → blocked → assign → submit succeeds (covered by store specs).

## Phase 3 — Tier-differentiated gates

- Model: `PmGateDecision` on `project.pmRequirementsGate` / `project.pmDevelopmentGate` (Pending | Accepted | Rejected + actor/reason). Separate from `logProjectReview` (left as Active Tier2/3 note-only review).
- Gate 1 (T2+T3): mandatory before Development Complete; opens Pending when Development starts; Reject clears BA confirm.
- Gate 2 (T3 only): opens Pending when Development completes; must be Accepted before Deployment advance; Reject returns Development to InProgress.
- Tier1: no mandatory PM gates (unchanged).
- Reviewer roles: `PM_GATE_REVIEWER_ROLES` = `AIProgramManager`, `Admin`.
- UAT / DE verification Pass/Fail unchanged and separate.
- UI: `PmRequirementsGatePanel` / `PmDevelopmentGatePanel` on Development/Deployment tabs.
- Seed backfill via `assessmentBundle`: Gate 1 Accepted for all Tier2/Tier3 seeds; Gate 2 Accepted for all Tier3 seeds (so past-stage demos stay unblocked). Includes e.g. prj-042, 073–075, 031, 062–063, 065, 067, 071–072 and other assessmentBundle Tier2/3 projects. Pre-tier seeds prj-061/070 keep null gates via `v3Defaults`.

## Phase 4 — Development cancel

- `STATUS_TRANSITIONS`: `Active → Cancelled` added.
- UI: Cancel control on Active in `StatusGateActions` (GovernanceLead / RiskCompliance / Admin), reusing `cancelProject`.
- Notification: existing `cancelled` kind (submitter TO, governance CC) — no new machinery.

## Phase 5 — Comment cleanup

- Replaced stale 1:1 RiskLevel coupling comment on `ProjectTier` with: delivery-ownership tier assigned by DE post-qualification, independent of risk.

## Build & Test

| Phase | Build | Tests |
|---|---|---|
| 0 baseline | green | 101 |
| 1 | green | (assignment specs) |
| 2 | green | fail-closed specs |
| 3 | green | 109 |
| 4 | green | 111 |
| 5 | green | 111 |
| Final | green | **111** |

Specs added/updated: assignDeliveryTier role/lock; fail-closed submitForReview; PM Gate 1/2 accept/reject; Active→Cancelled transition + notify; baArtifacts Gate helpers; fixture `pmRequirementsGate`/`pmDevelopmentGate` nulls.

Commits:
1. `feat(assessment): DE/Admin/GovLead delivery-tier assignment on qualified projects`
2. `feat(lifecycle): fail-closed — block development entry until delivery tier assigned`
3. `feat(review): tier-differentiated PM accept/reject gates (T2 one, T3 two)`
4. `feat(lifecycle): allow cancellation of active projects`
5. `docs(types): correct stale ProjectTier/RiskLevel coupling comment`

## STOP / judgment calls

- **No STOP** — gates layered without new statuses/stages.
- **Judgment:** allow delivery-tier assignment on `QualifiedDraft` as well as `Qualified` (still pre-Submitted; unblocks `prj-070`).
- Swimlane refactor / Update-re-enters-lane / tier renumbering / folding UAT into PM gates — deferred per prompt; not implemented.
