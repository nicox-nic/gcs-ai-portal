# AUDIT-PM — AI Program Manager Role Capability Findings

> Read-only audit against the PM responsibility matrix. **No code changes.**  
> Inspected: `lifecycle.ts`, `StatusGateActions` / store review gates, Phase-8 BA assignment + UAT gates, qualification/dup-detection, tiering, trainings, notifications, dashboard callouts, Profile, `Project` types, CI mirror.  
> Date: 2026-07-09 · codebase post–Phase 8 (`c9ff0fa` / `e6486b5`).  
> Compared to: BA Phase 8 (owned+gated) and DE audit (A under-modeled).

## 1. Summary verdict

| RACI tier | Verdict |
|-----------|---------|
| **A / R (operational V3)** | **Strong.** PM is first-class on the **2nd-review gate** (approve/reject Submitted), **EHS + BA assignment**, **Deployment stage Accountable**, Tier2/3 stack ownership, and `logProjectReview`. Phase-8 UAT correctly unblocks PM’s Deployment Complete once BA signs off. |
| **A / R (checklist / swimlane depth)** | **Thin.** Deployment-activity A (verification, controls, production deploy, training, remediation) collapses to **generic stage advance** — same collapse the DE audit found for DE’s R. Assessment swimlane tasks (completeness, screening, dup detection, decision docs) are **not PM-gated** (qualification = Gov/Risk; dup-check = assisted-intake auto). |
| **C / Supporting** | **Supported** for Development and Supplier Oversight. Enablement primary. |
| **I** | **Partial–good.** TO on `submitted-for-review` and `uat-signed-off`; in `owners` for approve/aging/etc. **No** PM review/deployment work queue (only idle callout shared with Gov/Admin). |

**vs BA (Phase 8) and DE (audit):** PM is **more first-class than DE** on the operational V3 spine (real approve/reject + assignment powers). PM is **less first-class than BA** on *activity-level* ownership: BA has assignment → artifact → hard gate → queue → CI; PM’s Deployment A is stage-level only, with UAT accountability represented mainly as **notification + ability to Complete after BA Pass**, not a PM oversight artifact. Assessment RACI-vs-code conflict is the sharpest gap.

---

## 2. Capability table

| # | PM responsibility | RACI | Status | Evidence | PM-reachable? | Notes / gap |
|---|-------------------|------|--------|----------|---------------|-------------|
| 1 | Submit/intake | — | **Missing** (role gate) | `SUBMIT_ROLES` = Submitter / BA / Admin only (`SubmitProjectPage.tsx` L9, `AssistedIntakePage.tsx` L24, `ManualSubmitPage.tsx` L23, `ProjectsListPage.tsx` L35, `DashboardPage.tsx` L34) | **No** `/submit` as PM | Same exclusion as DE; intake role appears limited to Assessment *support*, not authoring |
| 2 | Own & advance Deployment (A) | **A** | **Supported** | `primaryOwnerRole: 'AIProgramManager'` (`lifecycle.ts` L68–74); `canActOnStage` L124–128; Overview/Lifecycle `TransitionButtons`; Phase-8 `canCompleteDeployment` allows PM once `uatPassed` (`baArtifacts.ts` L58–61) | **Yes** when `currentStage: Deployment` | UAT gate blocks Complete until BA Pass; Admin override exists |
| 3 | 2nd-review approve / reject | (ops) | **Supported** | `SUBMISSION_REVIEW_ROLES` includes PM (`projectsStore.ts` L76–79); `approveSubmission`/`rejectSubmission` assert those roles (~L829/895); UI `REVIEW_ROLES` in `StatusGateActions.tsx` L23, `canReview` L81 | **Yes** on `Submitted` | Signature PM affordance — approve → Active or ForEHSReview; reject → Rejected |
| 4 | EHS-coordinator + BA assignment | (ops) | **Supported** | `EHS_ASSIGN_ROLES` includes PM (`projectsStore.ts` L81); approve dialog calls `assignEhsCoordinator` (`StatusGateActions.tsx` ~L334); `canAssignBusinessAnalyst` includes PM (`baArtifacts.ts` L35–41); header Select + `assignBusinessAnalyst` (`ProjectHeaderCard` / `ProjectDetailPage`) | **Yes** | BA assign also at qualify (Gov/Risk) — PM can reassign later |
| 5 | Assessment: completeness / screening / dup / decision docs | R/A (swimlane) | **Missing** / **Partial** | Qualification `REVIEWER_ROLES` = Gov / Risk / Admin only (`ProjectQualificationTab.tsx` L49) — **PM excluded**. Dup detection = `findSimilarProjects` in assisted intake for submitters (`AssistedIntakePage.tsx` L11, L118–128) — **not a PM action**. No PM screening/decision-doc surface | **No** qualify gate; **No** PM-driven dup | **RACI-vs-code conflict:** swimlane assigns PM Assessment tasks; app gives them to Gov/Risk + auto intake |
| 6 | UAT accountability (PM=A, BA=R) | **A** | **Partial** | BA owns/signs UAT (`canEditUat` = assigned BA; `BaDeliveryPanels`). PM is TO on `uat-signed-off` (`notificationRules.ts` L74–76). PM can Complete Deployment after Pass (#2). **No** PM oversight sign-off / veto / UAT review UI | **Yes** notify + Complete; **No** A-level UAT artifact | Accountability = notification + stage gate consumer, not co-owner |
| 7 | Tool/model verification / controls / production deploy (A) | **A** | **Missing** (artifact) / **Partial** (stage) | No PM-owned deploy checklists. Deployment Complete = stage advance + BA UAT only (same collapse as DE audit #8/#9) | **Yes** stage Complete when UAT passed | A/R split with DE not modeled — both reduced to stage |
| 8 | Training (Deployment A) | **A** | **Missing** (ownership) | `/trainings` is a **generic catalog** for all roles (`TrainingCatalogPage.tsx`; Sidebar no PM-only gate). Project tool-linked trainings shown on detail — not PM-owned deployment training sign-off | **Yes** browse catalog; **No** Deployment-training A | Content page ≠ Deployment RACI Training activity |
| 9 | Issue Remediation (A; DE=R) | **A** | **Missing** | UAT Fail = text pointer to DE only (`BaDeliveryPanels.tsx` L449–452; `deploymentGateBlockReason` in `baArtifacts.ts` L73–74). No PM oversight/escalation affordance | **No** | Same gap as DE audit #10, from the A side |
| 10 | Tool stack (Tier2/Tier3) | (execution) | **Supported** | `getStackOwnerRoles`: Tier2 + Tier3 include PM (`tiering.ts` L48–51); null-tier includes PM (L54); Tier1 does **not**. `canOwnStack` + Tool Selection / `submitForReview` | **Yes** Tier2/3 (+ null-tier) | Aligns with collaborative/team-led model |
| 11 | Support Development & Supplier Oversight | supporting | **Supported** | PM in `supportingRoles` for SupplierOversight (L56) and Development (L65). Also Enablement **primary** (L109) | **Yes** when those stages current | — |
| 12 | `logProjectReview` (Tier2/3) | (Phase 5) | **Supported** | `PROJECT_REVIEW_ROLES` includes PM (`projectsStore.ts` L83–85); Overview `canLogReview` (`ProjectDetailTabs.tsx` L228–234) | **Yes** on Active Tier2/3 | Separate review checkpoint — real PM affordance |
| 13 | Named PM assignment | (org) | **Missing** | `Project` has `businessAnalystId` only — **no** `programManagerId` (`types/index.ts` ~L217). CI has BA column, not PM lead | **No** | Systemic slot gap (BA has it; DE/PM don’t) |
| 14 | Find PM work (queue) | (workflow) | **Partial** | Idle callout for Gov / **PM** / Admin (`DashboardPage.tsx` L125–132). **No** “Submitted awaiting review” or “Deployment ready to complete” callout. Stats have no `pendingReview` for PM. Profile: My Entries = submitter only; “Assigned to me” = BA only (`ProfilePage.tsx` L50–66) | **Idle yes**; **review/deploy queue no** | Strongest missing workflow vs PM’s real gate (#3) |
| 15 | Notifications targeted to PM | I | **Supported** (role-wide) | TO: `submitted-for-review` → `pmGov` (`notificationRules.ts` L34–35); `uat-signed-off` → PM+DE (L74–76). CC on BA request kinds (L67). In `owners` for approve/reject/aging/completed (L22–25) | **Yes** for those kinds | Role-wide (all PM personas), not assigned-lead |
| 16 | General visibility | — | **Supported** | Login-only auth; full sidebar except Admin; detail/Audit/CI/notifications open | **Yes** | Submit blocked as #1 |

---

## 3. Gaps & recommendations (Partial / Missing only)

### Systemic (shared with BA/DE audits)

| Item | Gap | Fix type |
|------|-----|----------|
| **#13 Named PM** | No `programManagerId` / assign UI / CI column | **Data-model + UI** — mirror BA assignment |
| **#14 Work queue** | No Submitted-review or Deployment-drive callout; Profile has no “Assigned to me (PM)” | **Feature** — `pendingReview` queue is the highest-value PM workflow fix (gate #3 already exists) |
| **#15** (tighten) | Role-wide TO only | **Role-gate** — optional assigned-PM TO once #13 exists |

### PM-specific

| Item | Gap | Fix type |
|------|-----|----------|
| **#1 Submit** | PM not in `SUBMIT_ROLES` | **Role-gate** or **document** as intentional (PM doesn’t author intake) |
| **#5 Assessment tasks** | Swimlane PM duties vs Gov/Risk qualify + auto dup-check | **Product decision** then **feature/role-gate** — either add PM to screening/qualify consult, or update RACI docs to match code |
| **#6 UAT A** | No PM oversight beyond notify + Complete | **Feature** (light) — PM ack/visibility on UAT panel, or accept A = stage ownership + notify |
| **#7 Deploy activities** | No verification/controls/deploy checklists | **Feature** — PM-owned deploy checklist (or shared with DE verification from DE audit #8) |
| **#8 Training** | Catalog ≠ Deployment training A | **Feature** — link required trainings to Deployment Complete, PM confirms |
| **#9 Remediation A** | Text pointer only | **Feature** — PM escalation/oversight on UAT Fail alongside DE remediation |

**Not gaps (working):** #2 Deployment A + UAT gate consumer; #3 approve/reject; #4 EHS/BA assign; #10 Tier2/3 stack; #11 support stages; #12 project review log; #16 visibility.

---

## 4. Open questions

1. **Assessment RACI-vs-code:** Swimlane gives PM completeness validation / screening / dup detection / decision documentation — app gives qualification to Gov/Risk and dup-check to assisted intake. Which source of truth should the portal follow?
2. **Is excluding PM from `SUBMIT_ROLES` intentional?** (Same question as DE audit #1.)
3. **UAT Accountable:** Is “PM Completes Deployment after BA Pass + gets `uat-signed-off`” enough to represent A, or does PM need an explicit oversight sign-off?
4. **Deployment activity A vs DE R:** Should verification/controls/deploy be a **shared checklist** (PM A stamps, DE R fills) or remain stage-only for the demo?
5. **Highest-ROI PM queue:** Is “N projects Submitted awaiting your review” sufficient for Phase-next, or must Deployment/UAT-ready queues ship together?
6. **Enablement primary:** PM owns Enablement in `lifecycle.ts` — is that meant to be demoable (seed rarely on Enablement), or metadata only?

---

*End of audit. No implementation performed.*
