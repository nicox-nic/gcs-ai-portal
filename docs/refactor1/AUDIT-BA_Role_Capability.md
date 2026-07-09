# AUDIT-BA — Business Analyst Role Capability Findings

> Read-only audit against the BA responsibility matrix. **No code changes.**  
> Inspected: `lifecycle.ts`, `tiering.ts`, `notificationRules.ts`, submit/qualification/tool-selection/lifecycle UI, `Project`/`Submission` types, dashboard callouts, Profile My Entries, CI mirror.  
> Date: 2026-07-09 · codebase at post–Phase 7 + nav fix (`e467dca`).

## 1. Summary verdict

| RACI tier | Verdict |
|-----------|---------|
| **R (Responsible)** | **Weak.** Intake submit is Supported. Requirements Definition (Development) and UAT (Deployment) have **no dedicated artifacts** — only generic ISO stage advances that BA *can* trigger as a supporting role. High-level benefit/ROI as R is only via BA-as-submitter intake fields, not a BA assessment channel. |
| **C / Supporting** | **Partial.** BA is listed on Assessment/Development/Deployment/Improvement/Enablement in `LIFECYCLE_STAGES` and can advance those stages when current. Qualification is **not viewable** while `ForAssessment` (blocked message only). Tier2 stack ownership is Supported. No consult/comment mechanism. |
| **I (Informed)** | **Mostly Missing for BA-as-role.** `recipientsFor` never targets `BusinessAnalyst` by role. BA only gets notifications if they are the project `submitterId` (or open the unfiltered global feed when not in TO/CC — page filters to TO/CC for the logged-in user). No BA work queue / dashboard callout. |

**Bottom line:** The app treats BA primarily as a **second submitter + Tier2 stack collaborator + generic stage supporter**. Governance RACI “owns requirements / UAT” work is **not modeled** as BA-owned surfaces.

---

## 2. Capability table

| # | BA responsibility | RACI | Status | Evidence | BA-reachable? | Notes / gap |
|---|-------------------|------|--------|----------|---------------|-------------|
| 1 | Submit/intake (manual + AI-assisted) | — (submitter) | **Supported** | `SUBMIT_ROLES` includes `BusinessAnalyst` in `SubmitProjectPage.tsx` L9, `ManualSubmitPage.tsx` L23, `AssistedIntakePage.tsx` L24, `ProjectsListPage.tsx` L35, `DashboardPage.tsx` L34, `Sidebar.tsx` L36 (`roles: […, 'BusinessAnalyst', …]` for `/submit`) | **Yes** — sidebar Submit Project; `/submit`, `/submit/manual`, `/submit/assisted` allow BA | Seed persona `usr-ba` (Chris Aguillon) can enter both intake paths |
| 2 | High-level benefit / ROI during Assessment | R (swimlane) / C on qualify | **Partial** | Intake field `Submission.expectedBenefitHours` (`types/index.ts` L149); readiness **Viability** checklist scored in `qualificationLogic.ts` (`scoreReadiness` / `viabilityMet`) but only editable by `REVIEWER_ROLES` = Gov/Risk/Admin (`ProjectQualificationTab.tsx` L48, L264–266). Benefits tab report hours exclude BA (`ProjectDetailTabs.tsx` `canReport` L832–839: Admin / submitter / DE / PM) | **Partial** — BA can set expected hours **only when BA is the submitter** at intake; cannot edit Viability during qualification; cannot report actual benefits unless submitter | No BA-specific ROI assessment step; no channel into qualification checklists |
| 3 | Support AI Assessment (consulted) | C | **Missing** (view) / **Partial** (resubmit) | On `ForAssessment` + `!canReview`, UI shows only “Awaiting Governance…” — **no** readiness/qualification read-only (`ProjectQualificationTab.tsx` L300–308). Post-decision: `ReadOnlySummary` when readiness/qualification/tier exist (L296–297). BA may `resubmitForAssessment` (`projectsStore.ts` L551–554; tab L313–317) | **No** for live consult on ForAssessment; **Yes** for resubmit-as-BA and read-only after qualify | Gap vs “consulted”: BA cannot see checklists while assessment is open; no comment/consult affordance |
| 4 | Requirements Definition (Development) | **R** | **Missing** (artifact) / **Partial** (stage) | No requirements type/field/editor in `types` or project tabs. `canActOnStage('BusinessAnalyst','Development')` = true via `supportingRoles` (`lifecycle.ts` L59–65, `canActOnStage` L124–128). Overview + Lifecycle tabs expose `TransitionButtons` when `currentStage === Development` (`ProjectDetailTabs.tsx` L119–168, L406–411, L560–567) | **Yes** for stage Start/Complete/Advance on Active projects in Development; **No** dedicated requirements ownership UI | RACI R reduced to generic stage advance; primary owner remains DataEngineering |
| 5 | Solution Design support (Development) | C | **Partial** | Same as #4 — supporting role on Development; Tier2 stack edit is separate (#6). No design doc / solution-design surface | **Yes** stage participation; **No** design artifact | Same stage-level participation only |
| 6 | Tool stack selection for Tier2 | (execution) | **Supported** | `getStackOwnerRoles('Tier2')` includes `BusinessAnalyst` (`tiering.ts` L48–49). `canOwnStack` returns true for BA on Tier2 (`tiering.ts` L59–79; covered in `tiering.test.ts` L95). Tool Selection: `canEdit = editable && canOwnStack` for Qualified/QualifiedDraft (`ProjectDetailTabs.tsx` L600–602); store `submitForReview` / `saveQualifiedDraft` gated by `canOwnStack` (`projectsStore.ts` L635–680) | **Yes** on Tier2 Qualified / QualifiedDraft | Tier1/Tier3: BA not in owner roles (unless Admin). Null-tier pre-qualify set excludes BA (`tiering.ts` L52–54) |
| 7 | UAT during Deployment | **R** | **Missing** (artifact) / **Partial** (stage) | No UAT record/checklist/artifact. BA in Deployment `supportingRoles` (`lifecycle.ts` L68–74). Same `TransitionButtons` / `canActOnStage` path as #4 | **Yes** for Deployment stage transitions when current; **No** UAT-specific drive | RACI R not represented beyond stage complete |
| 8 | Support Deployment & Improvement | supporting | **Supported** (gates) | BA in `supportingRoles` for Deployment (L74) and Improvement (L92). Transitions reachable via Overview Current Stage Actions + Lifecycle tab when that stage is current | **Yes** when project is on those stages | Enablement also lists BA as supporting (L110) — cross-cutting; stage actions only if Enablement is `currentStage` (unusual in seed) |
| 9 | Named BA assignment on project | (org) | **Missing** | `Project` has `submitterId`, `sponsorId`, `ehsCoordinatorId` — **no** `businessAnalystId` (`types/index.ts` L180–199). `CiPortalRecord` / `toRecord` has no BA field (`ciPortalAdapter.ts` L19–35) | **No** | CI Portal org field “Business Analyst — selected from list” not modeled |
| 10 | Find work that needs BA action | (workflow) | **Missing** | `RoleCallout` only for GovernanceLead, EHS, RiskCompliance, Sponsor, idle for Gov/PM/Admin (`DashboardPage.tsx` L70–115) — **no** BA branch. Profile **My Entries** filters `submitterId === currentUser.id` (`ProfilePage.tsx` L53) — helps BA only for projects they submitted | **No** BA queue; **Partial** My Entries if BA submitted | No “Development needs requirements / Deployment needs UAT” queue |
| 11 | Notifications targeted to BA | I | **Missing** (by role) | `recipientsFor` (`notificationRules.ts` L13–65): TO/CC use submitter, sponsor, ehs, Gov, Risk, DE, PM — **never** `BusinessAnalyst` role via `usersWithRoles`. `NotificationsPage` filters to TO/CC for current user (L16–19) | **Only if** BA is submitter (or somehow in TO/CC); role-wide BA feed empty for supported projects | No Development/Deployment event kinds that CC BA |
| 12 | General visibility | — | **Supported** | Auth is login-only after nav fix (`ProtectedRoute.tsx`). Sidebar: Dashboard, Projects, Notifications, CI Portal, Trainings, Profile for all roles (`Sidebar.tsx` L30–43). Project detail / Audit / CI portal pages have no BA role block | **Yes** | Admin-only: `/admin`. Submit gated as in #1 |

---

## 3. Gaps & recommendations (Partial / Missing only)

| Item | Gap | Likely fix type |
|------|-----|-----------------|
| **#2 Benefit/ROI** | BA cannot contribute Viability/ROI during Assessment unless they are the submitter; cannot report benefits as BA-collaborator | **Feature + role-gate** — optional BA edit on expected hours / consult note; or include BA in `canReport` when assigned (#9) |
| **#3 Assessment consult** | ForAssessment shows blocker instead of read-only checklists; no comment | **Role-gate / UI** — allow read-only Qualification tab for all authenticated roles; optional consult note → auditLog |
| **#4 Requirements (R)** | No requirements artifact; stage advance ≠ owning requirements | **Feature** — requirements checklist/doc on Development with BA as primary editor; optionally make BA `primaryOwnerRole` for a sub-step (larger model change) |
| **#5 Solution design** | No design surface beyond stage + Tier2 stack | **Feature** (light) — design notes field, or accept stack selection as the design proxy and document that |
| **#7 UAT (R)** | No UAT record; only Deployment stage advance | **Feature** — UAT sign-off checklist gated to BA before Deployment can Complete |
| **#9 Named BA** | No `businessAnalystId` / assign UI / CI field | **Data-model + UI** — field on `Project`, assign picker, CI mirror column |
| **#10 Work queue** | No BA dashboard callout / filtered work list | **Feature** — callout + `/projects` filters (e.g. Active+Development, Active+Deployment) once #4/#7/#9 exist; extend My Entries to “assigned BA” |
| **#11 Notifications** | BA role never in `recipientsFor` | **Role-gate** — CC assigned BA (needs #9) or all BA personas on Development/Deployment / project-review events |

**Not recommended as “bugs”:** #1, #6, #8 stage gates, #12 visibility — these work as implemented.

---

## 4. Open questions

1. **Should BA-as-submitter count as fulfilling RACI R for benefit/ROI (#2)?** Governance docs imply BA assesses during Assessment even when someone else submitted — code only supports BA-as-author of the submission.
2. **Is generic ISO stage advance an acceptable stand-in for Requirements (#4) and UAT (#7) in Phase 0 demo scope?** If yes, Status should be reframed as Partial-by-design rather than Missing artifact; product intent is unclear in code.
3. **`resubmitForAssessment` allows any `BusinessAnalyst`**, not only the submitter (`projectsStore.ts` L554) — intentional org-wide BA power, or should it be submitter-only / assigned-BA-only once #9 exists?
4. **Null-tier stack owners exclude BA** (`getStackOwnerRoles` default) while Tier2 includes BA — can a BA help select tools on a freshly Qualified project before tier is set? (Qualify always sets tier in happy path, so may be moot.)
5. **Enablement supporting role:** BA is listed, but seed/projects rarely have `currentStage: Enablement` — is Enablement meant to be actionable for BA in the demo?

---

*End of audit. No implementation performed.*
