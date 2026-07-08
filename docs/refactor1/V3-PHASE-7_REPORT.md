# V3-PHASE-7 Report — Dashboard + Seed Narrative + Polish + Verification (1.0)

> Executed from `docs/refactor1/V3-PHASE-7_Dashboard_Seed_Polish_and_Verification.md`.  
> Verification: `npm run build` ✅ · `npm run test` ✅ (34 specs)  
> Git: **milestone (1.0)** — committed and pushed to `main` (Vercel deploy).

## Per-file changes

| File | Change |
|------|--------|
| `src/lib/dashboardStats.ts` | Queues, status pipeline, tier distribution; adoption excludes IdeaDraft/NotQualified/Cancelled |
| `src/lib/dashboardStats.test.ts` | **New** — seed coverage, queues, tiers, adoption filter |
| `src/components/dashboard/KpiCard.tsx` | Optional `onClick` for queue/KPI deep-links |
| `src/pages/DashboardPage.tsx` | Active KPI vocab; queue row; pipeline + tier charts; Risk→qualification + Sponsor deep-links |
| `src/data/seedProjects.ts` | +5 projects covering missing statuses (19 total) |
| `src/components/dialogs/ConfirmDialog.tsx` | Close only when `onConfirm` ≠ `false` |
| `src/components/dialogs/ConfirmDialog.test.ts` | Guard unit tests |
| `src/components/project/StatusGateActions.tsx` | Reason/hours validation returns `false` (dialog stays open) |
| `src/components/project/ProjectQualificationTab.tsx` | Same for Not Qualified / Cancel / Qualify |
| `src/stores/projectsStore.ts` | Removed orphaned `validateBenefits`; documented Decommissioning→Deactivated keep |
| `docs/refactor1/V3_MODEL.md` | **New** — capstone implemented-model map |
| `docs/refactor1/V3-PHASE-7_REPORT.md` | This report |

## Dashboard changes

- KPI row: Total · **Active** · Completed · Hours saved (sponsor-validated).
- Queue row (deep-links): ForAssessment, ForEHSReview, ForSponsorApproval, Idle, Deactivated.
- Status pipeline (non-zero statuses) + Tier1/2/3 distribution.
- Adoption numerators exclude IdeaDraft / NotQualified / Cancelled.
- Role callouts: Governance + **RiskCompliance** → qualification queue; EHS → EHS queue; Sponsor → ForSponsorApproval; idle for Gov/PM/Admin.

## Final seed coverage (19 projects)

| Status | Project(s) |
|--------|------------|
| IdeaDraft | prj-068 |
| ForAssessment | prj-058 |
| NotQualified | prj-027 |
| Cancelled | prj-069 |
| Qualified | prj-061 |
| QualifiedDraft | prj-070 |
| Submitted | prj-062 |
| Rejected | prj-071 |
| ForEHSReview | prj-063 |
| EHSRejected | prj-072 |
| Active | prj-051 (T1), prj-042 (T2), prj-031 (T3) |
| ForSponsorApproval | prj-064 |
| Disapproved | prj-065 |
| Completed | prj-019, prj-008 |
| Idle | prj-066 |
| Deactivated | prj-067 |

Extras: Japan/Korea sites, `intakeMode: 'assisted'` (prj-068), `ManagementInitiative` (prj-072). All 10 roles present in `seedRoles` (`usr-ehs`, `usr-sponsor`, …).

## ConfirmDialog fix

`onConfirm` may return `false` to keep the dialog open. StatusGateActions + ProjectQualificationTab return `false` on empty required reason (and invalid hours). Toast still fires; dialog no longer closes first.

## `applyStatusSideEffects` / Decommissioning decision

**Kept** `Decommissioning` stage Completed → `Deactivated`.

Why: intentional ISO governance retirement remains a valid path alongside aging-driven Deactivated. Aging demos (prj-066/067) are unchanged; both paths can coexist without conflicting transitions.

## Dead code / TODOs cleared

- Removed `validateBenefits` from store interface + implementation (UI path already gone in Phase 5).
- No remaining `TODO(V3` in `src/`.
- `/projects/:id/recommendations` still redirects to `?tab=tool-selection`.

## Verification matrix (role × gates)

Verified via store/UI gate code + automated tests + seed narrative. Live browser walk of every persona is recommended post-deploy; gates below match implemented RACI.

| Role | Login / dash / nav | Allowed gates | Blocked from |
|------|--------------------|---------------|--------------|
| Submitter | ✅ | Intake, stack (Tier1 owner), submit/resubmit, sponsor submit (as owner), revise | Qualify, review approve, EHS, sponsor decide |
| BusinessAnalyst | ✅ | Intake; Tier2 stack; submit paths | Qualify; EHS; sponsor decide |
| GovernanceLead | ✅ | Qualify / NQ / cancel; review approve/reject; assign EHS; idle callout | EHS approve; sponsor decide (unless Admin) |
| RiskCompliance | ✅ | Qualify / NQ; qualification callout | Review approve; EHS; sponsor |
| DataEngineering | ✅ | Stack (all tiers); submit/resubmit; sponsor submit | Qualify; EHS; sponsor decide |
| AIProgramManager | ✅ | Review approve; Tier2/3 stack; project review log; idle | EHS; sponsor decide |
| MaintenanceSustainability | ✅ | View / sustain surfaces | Gate mutations |
| Sponsor | ✅ | Approve / disapprove closure (assigned) | Qualify; EHS; review approve |
| EHS | ✅ | ehsApprove / ehsReject | Submit / qualify / review approve |
| Admin | ✅ | All gates + Clear All Local Data + Reset clock | — |

**Lifecycle walk (code paths covered by Phases 3–6 tests + seed):** assisted/manual intake → qualify → tool selection → submit → approve±EHS → Active → sponsor submit → approve → Completed; reject/revise; cancel; aging Active→Idle→Deactivated→reactivate with notifications + CI mirror. Admin reset restores seed.

## Push / deploy

- Commit message: `chore(release): V3 1.0 — dashboard, seed narrative, polish, verification [Phase 7]`
- Pushed to `origin/main` — Vercel production deploy from `main`.

## Residual known issues

- Zustand persist stderr noise in vitest (no `localStorage` in Node) — tests still pass.
- Status pipeline chart shows relative bar % of max count (not share of portfolio) — intentional for compact reuse of `HorizontalBarRow`.
- Full interactive role walk in a browser was not automated; matrix above is gate-logic verified.
