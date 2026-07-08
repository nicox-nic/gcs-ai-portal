# V3-PHASE-4 Report — Tool Selection + Submit + EHS Gate → Active

> Executed from `docs/refactor1/V3-PHASE-4_Tool_Selection_Submit_and_EHS_Gate.md`.  
> Verification: `npm run build` ✅ · `npm run test` ✅ (15 specs)  
> Git: **milestone** — committed and pushed to `main` (Vercel deploy).

## Per-file changes

| File | Change |
|------|--------|
| `src/stores/projectsStore.ts` | Removed Phase-0 interim Active seam; added gate actions + `activateProjectFields` |
| `src/stores/projectsStore.test.ts` | **New** — empty-stack guard, EHS vs Active routing, `activeSince` once |
| `src/components/project/StatusGateActions.tsx` | **New** — status-switch gate UI (approve/reject/EHS/resubmit) |
| `src/components/project/ProjectDetailTabs.tsx` | Overview mounts `StatusGateActions`; Recommendations → **Tool Selection** |
| `src/components/project/ProjectHeaderCard.tsx` | Customise gated; EHS-required chip when coordinator set |
| `src/pages/ProjectDetailPage.tsx` | Tab rename + `?tab=tool-selection`; stack edit role gate |
| `src/pages/ManualSubmitPage.tsx` | No recs at intake; submit → project detail (mirrors assisted) |
| `src/pages/RecommendationPage.tsx` | Redirect → `/projects/:id?tab=tool-selection` |
| `src/lib/dashboardStats.ts` | `pendingEhsReview` count |
| `src/pages/DashboardPage.tsx` | EHS role callout → `?status=ForEHSReview` |
| `src/data/seedProjects.ts` | `prj-061` Qualified, `prj-062` Submitted, `prj-063` ForEHSReview |

## StatusGateActions design

Single switch on `project.status`:

- **Submitted** + Gov/PM/Admin → Approve (optional EHS picker) / Reject (reason)
- **ForEHSReview** + EHS/Admin → EHS Approve / EHS Reject
- **Rejected / EHSRejected** + owner roles → Revise & resubmit
- Others → read-only “awaiting {role}” note

Rendered on Overview (sibling to Current Stage Actions) and again on Tool Selection for Submitted/EHS statuses so the EHS persona sees actions without hunting.

## `/recommendations` route

**Kept as a redirect** to `/projects/:id?tab=tool-selection`. Reason: bookmarks and any stale links still resolve; the page no longer hosts selection UI. Manual intake no longer navigates there.

## Store actions + role gates

| Action | Transition | Roles |
|--------|-----------|-------|
| `submitForReview` | Qualified/QualifiedDraft → Submitted (non-empty stack) | submitter, DataEngineering, AIProgramManager, Admin |
| `saveQualifiedDraft` | Qualified → QualifiedDraft | same |
| `assignEhsCoordinator` | field only | GovernanceLead, AIProgramManager, Admin |
| `approveSubmission` | Submitted → ForEHSReview if coordinator else Active | same |
| `rejectSubmission` | Submitted → Rejected | same |
| `ehsApprove` | ForEHSReview → Active | EHS, Admin |
| `ehsReject` | ForEHSReview → EHSRejected | EHS, Admin |
| `resubmitAfterRejection` | Rejected/EHSRejected → Submitted | submitter / DE / PM / Admin |

`activateProjectFields` (private): status Active, stamp `activeSince` if null, `currentStage: Development`, `stageStatus.Development: InProgress`.

`// TODO(V3 Phase 5)` left on tool-selection role gate for per-tier tightening.

## Seed additions

| ID | Status | Purpose |
|----|--------|---------|
| prj-061 | Qualified | Empty stack — live Tool Selection demo |
| prj-062 | Submitted | Stack set, no EHS — 2nd-review / skip-EHS demo |
| prj-063 | ForEHSReview | `ehsCoordinatorId: usr-ehs` — EHS gate demo |
| prj-058 / prj-027 | unchanged | ForAssessment / NotQualified demos |
| Active seeds | unchanged | `activeSince` + tool stacks present |

## Push / deploy

- Commit: `73ada05` — `feat(gates): post-qualification tool selection + submit + EHS gate to Active [Phase 4]`
- Also pushed Phase 3 (`9a0fc3e`) which was still local-only.
- Pushed to `origin/main` (`cb8b38f..73ada05`) — Vercel production deploy triggered from `main`.

## Skipped / flagged

- ConfirmDialog still closes on empty reject reason before the toast (minor UX); store still enforces required reason.
- Zustand persist stderr noise in vitest (no localStorage in Node) — tests pass.
- Per-tier tool-selection tightening deferred to Phase 5 (TODO markers in place).
