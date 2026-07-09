# AUDIT-DE — Data Engineering Role Capability Findings

> Read-only audit against the DE responsibility matrix. **No code changes.**  
> Inspected: `lifecycle.ts`, `tiering.ts`, `baArtifacts.ts` (Phase-8 gates), `notificationRules.ts`, submit/stack/lifecycle UI, dashboard callouts, Profile, `Project` types, CI mirror.  
> Date: 2026-07-09 · codebase post–Phase 8 (`c9ff0fa` / `e6486b5`).

## 1. Summary verdict

| RACI tier | Verdict |
|-----------|---------|
| **A / R** | **Weak relative to accountability.** DE is correctly **Accountable** for Development (`primaryOwnerRole`) and can advance that stage (and Deployment as supporting) once Phase-8 BA gates clear. Almost all other R checklist duties (solution design, data prep, model validation, progress/version, tool/model verification, remediation, drift) are **not modeled as DE-owned artifacts** — only generic ISO stage advances, intake strings, and `auditLog`. |
| **C / Supporting** | **Supported** for Supplier Oversight, Deployment, and Improvement. **Not** listed on Use or Decommissioning. |
| **I** | **Partial.** DE is TO on Phase-8 `requirements-confirmed` / `uat-signed-off` (all DE seed users, not a named lead). Also in the broad `owners` set for approve/reject/aging. No DE-specific build/deploy/remediation kinds. No DE work queue. |

**vs BA post–Phase 8:** The BA (R for Requirements/UAT) now has **assignment → owned artifact → hard gate → queue → notifications → CI column**. DE (A for Development, R for most build/deploy execution) still has **stage ownership + stack ownership** but **no parallel first-class build/verification/remediation overlay**. DE’s accountability is *less* first-class than the BA’s responsibility became in Phase 8 — the main asymmetry this audit flags.

---

## 2. Capability table

| # | DE responsibility | RACI | Status | Evidence | DE-reachable? | Notes / gap |
|---|-------------------|------|--------|----------|---------------|-------------|
| 1 | Submit/intake (manual + assisted) | — | **Missing** (role gate) | `SUBMIT_ROLES` = Submitter / BA / Admin only — `SubmitProjectPage.tsx` L9, `ManualSubmitPage.tsx` L23, `AssistedIntakePage.tsx` L24, `ProjectsListPage.tsx` L35, `DashboardPage.tsx` L34, `Sidebar.tsx` submit `roles` | **No** via `/submit` as DE | Seed `usr-data` can appear as `submitterId` on seeded projects but cannot open Submit Project UI while logged in as DE |
| 2 | Own & advance AI Development (A) | **A** | **Supported** | `primaryOwnerRole: 'DataEngineering'` (`lifecycle.ts` L59–65); `canActOnStage` L124–128; Overview/Lifecycle `TransitionButtons` (`ProjectDetailTabs.tsx`); Phase-8 `canCompleteDevelopment` allows any actor (incl. DE) once requirements confirmed, blocks otherwise (`baArtifacts.ts` L48–51; store `advanceStage` gate) | **Yes** on Active + `currentStage: Development` | Gate correctly unblocks DE after BA confirm; Admin override exists |
| 3 | Solution Design | **R** | **Missing** (artifact) / **Partial** (stage) | No solution-design type/field/panel. Only Development stage advance + Tier2/3 stack (shared) | **Yes** stage; **No** design artifact | Same pattern as pre–Phase-8 BA Requirements |
| 4 | Data Engineering & Preparation | **R** | **Missing** | Intake `Submission.dataSources` string only (`types/index.ts` L142); no DE-owned prep status/record | **No** dedicated affordance | Subsumed into intake + stage narrative |
| 5 | Model Development & Validation | **R** | **Missing** | No model/validation artifact in `Project` or tabs | **No** | Audit notes in seeds are narrative only |
| 6 | Progress & Version Updates | **R** | **Partial** | Generic `auditLog` / stage transitions only; no version/progress log DE maintains | **Yes** via stage notes on advance; **No** version surface | Weaker than BA’s structured items list |
| 7 | Tool stack ownership (all tiers) | (execution) | **Supported** | `getStackOwnerRoles`: Tier1/2/3 + null all include `DataEngineering` (`tiering.ts` L44–55); `canOwnStack` true for DE role (`L59–79`); Tool Selection `canEdit` + `submitForReview`/`saveQualifiedDraft` gated by `canOwnStack` (`ProjectDetailTabs.tsx` ~L640; `projectsStore.ts` ~L724/766) | **Yes** on Qualified / QualifiedDraft | Strongest DE-owned execution surface today |
| 8 | Tool & Model Verification (Deploy) | **R** | **Missing** | No DE verification checklist/sign-off. Deployment Complete gated only by BA UAT (`canCompleteDeployment` / `uatPassed` in `baArtifacts.ts` L58–61) | **No** DE verification gate | Natural Phase-8-symmetric fix: DE verification artifact before Deployment Complete |
| 9 | Control Implementation + Production Deployment | **R** | **Partial** | DE in Deployment `supportingRoles` (`lifecycle.ts` L73–74); PM is primary. DE can Complete Deployment once UAT passes (same gate as BA/PM) | **Yes** stage actions when Deployment current | No DE-owned deploy checklist; RACI R reduced to supporting stage advance |
| 10 | Issue Remediation (Deploy) | **R** | **Missing** | UAT Fail shows text only: `BaDeliveryPanels.tsx` L449–452; `deploymentGateBlockReason` L73–74 (“remediate with Data Engineering”) — **no** DE remediation action/status/field | **No** actionable remediation | Pointer without affordance |
| 11 | Model Drift Monitoring (Use) | **R** | **Missing** | Use `primaryOwnerRole: MaintenanceSustainability`; supporting = Risk only (`lifecycle.ts` L77–84) — **DE not listed**. No drift surface | **No** Use stage act; **No** drift UI | Checklist R for DE not reflected in lifecycle meta |
| 12 | Support Supplier / Deploy / Improve | supporting | **Supported** (3 stages) | DE in `supportingRoles`: SupplierOversight L56, Deployment L74, Improvement L92. **Not** on Decommissioning L100–101 | **Yes** when those stages are current | Decommissioning support absent if governance expects it |
| 13 | Named DE assignment (lead builder) | (org) | **Missing** | `Project` has `businessAnalystId` but **no** `dataEngineerId` / lead-builder field (`types/index.ts` ~L210–217). CI has BA column only (`ciPortalAdapter.ts`) | **No** | Systemic slot gap vs Phase-8 BA |
| 14 | Find DE work (queue) | (workflow) | **Missing** | `RoleCallout` covers Gov / EHS / Risk / Sponsor / BA only (`DashboardPage.tsx` L71–119) — **no** DE branch. Profile “Assigned to me (BA)” only (`ProfilePage.tsx` L62, L183); My Entries = `submitterId` | **No** DE queue | Cannot find “build / verify / remediate” work as DE |
| 15 | Notifications targeted to DE | I | **Partial** | TO: `requirements-confirmed` → all DE users (`notificationRules.ts` L69–72); `uat-signed-off` → PM+DE L74–77. Also in `owners` for approved/rejected/aging/completed (L22–25, L36–61). **Not** TO on `requirements-requested` / `uat-requested` (BA only). No remediation/build-specific kinds | **Yes** for those kinds (role-wide, not assigned-lead) | Weaker than BA’s assigned-TO pattern |
| 16 | General visibility | — | **Supported** | Auth login-only; sidebar Dashboard/Projects/Notifications/CI/Trainings/Profile for all roles; no DE blocks on detail/Audit/CI | **Yes** | Admin-only `/admin`; Submit blocked as #1 |

---

## 3. Gaps & recommendations (Partial / Missing only)

### Systemic (shared pattern with BA Phase 8)

| Item | Gap | Fix type |
|------|-----|----------|
| **#13 Named DE** | No `dataEngineerId` / assign UI / CI column | **Data-model + UI** — mirror `businessAnalystId` |
| **#14 Work queue** | No DE dashboard callout / “Assigned to me (DE)” | **Feature** — queues for Development (build), Deployment (verify/deploy), UAT-Fail (remediate); needs #13 for scoping |
| **#15 Notifications** | Role-wide TO only on BA confirm/sign-off; no assigned-lead targeting | **Role-gate** — TO assigned DE once #13 exists; optional build/deploy/remediation kinds |

### DE-specific (build / verify / remediate / drift)

| Item | Gap | Fix type |
|------|-----|----------|
| **#1 Submit** | DE excluded from `SUBMIT_ROLES` | **Role-gate** — add `DataEngineering` if self-submit is intended (seed already uses DE as submitter) |
| **#3 Solution Design** | No DE-owned design artifact | **Feature** (light) — design notes / checklist on Development, DE editor |
| **#4 Data prep** | No prep status beyond intake `dataSources` | **Feature** — data-prep checklist DE owns |
| **#5 Model validation** | No model/validation record | **Feature** — validation result + sign-off |
| **#6 Progress / version** | Only generic audit | **Feature** (light) — version/progress log DE maintains |
| **#8 Tool & model verification** | No DE gate symmetric to BA UAT | **Feature + hard gate** — DE verification artifact before Deployment Complete (Tier2/3), Admin override |
| **#9 Deploy controls** | Supporting stage only | **Feature** (optional) — deploy checklist; or accept PM-primary + DE supporting |
| **#10 Remediation** | Text pointer on UAT Fail | **Feature** — DE remediation note/status that clears Fail path / re-opens UAT |
| **#11 Drift (Use)** | DE not on Use; no monitoring UI | **Role-gate + feature** — add DE to Use supportingRoles and/or drift log |

**Not gaps (working as designed):** #2 Development A + Phase-8 requirements gate interaction; #7 stack ownership all tiers; #12 support on Supplier/Deploy/Improve; #16 visibility.

---

## 4. Open questions

1. **Should DE be in `SUBMIT_ROLES`?** Seeds already use `usr-data` as submitter; UI blocks DE from `/submit` — intentional (DE builds others’ ideas) or oversight?
2. **Is Development A satisfied by stage ownership + stack + waiting on BA requirements**, or must Solution Design / Data Prep / Model Validation / Progress be separate DE-owned overlays (Phase-8 style)?
3. **Deployment RACI:** Framework lists PM as Deployment primary and DE as R for verification/deploy — should Deployment Complete require a **DE verification** sign-off *in addition to* BA UAT, or is UAT+PM stage enough for the demo?
4. **Remediation:** On UAT Fail, is a free-text “remediation log” by assigned DE enough, or must Fail → DE status → BA re-test be a state machine?
5. **Use / drift:** Checklist says DE R for drift; lifecycle gives Use to M&S only — which source of truth should the app follow?
6. **Named DE vs role-wide DE:** Phase-8 BA notifications TO the *assigned* BA; DE notifications TO *all* DE personas. Should a future `dataEngineerId` tighten that, or is org-wide DE OK for a single-persona demo?

---

*End of audit. No implementation performed.*
