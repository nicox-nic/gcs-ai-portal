# V3-PHASE-4 — Tool Selection + Submit + EHS Gate → Active

> **Cursor — read this fully before editing. Surgical refactor; Phases 0–3 are merged.**
> Standing rules:
> - Do **not** regenerate files. **Read each target file first**, then `str_replace`/surgical edits. If a target differs or a change would clobber a later fix, **stop and report**.
> - Read the tool catalog from `catalogStore`; profiles from `profileStore`.
> - Never `git add -A` blindly — stage intended files, report anything else modified.
> - End at green `npm run build` **and** `npm run test`.
> - **Git — MILESTONE phase → commit AND push to `main`.** After green build+tests **and** the Step 9 verification, `git commit -m "feat(gates): post-qualification tool selection + submit + EHS gate to Active [Phase 4]"` then **`git push origin main`** (triggers the Vercel deploy — confirm in the report). Never force-push.
> - Report to **`docs/refactor1/V3-PHASE-4_REPORT.md`**.

## Scope
Complete the governed spine after qualification: **tool selection moves to post-qualification** (relocating the interim recommendations), then **Submit → 2nd review → conditional EHS gate → Active**. Reaching `Active` starts the aging clock. This **removes the Phase-0 interim seam** ("post-Assessment InProgress → Active").

## V3 sub-flow (statuses already in the graph)
`Qualified → QualifiedDraft | Submitted` · `QualifiedDraft → Submitted` · `Submitted → ForEHSReview | Active | Rejected` · `ForEHSReview → Active | EHSRejected` · `Rejected → Submitted | Cancelled` · `EHSRejected → Submitted | Cancelled`.
**EHS is conditional:** at the 2nd-review approval, if the project has an `ehsCoordinatorId` → `ForEHSReview`; if blank → straight to `Active`.

## Read first
- `src/lib/projectStatus.ts` (graph + `STATUS_STAGE_ANCHOR`), `src/stores/projectsStore.ts` (**the Phase-0 interim Active seam to remove**; `applyCombo`/`updateToolStack`/`setRecommendations`; how the store reads `catalogStore`).
- `src/components/project/ProjectDetailTabs.tsx` (the **Recommendations tab** → repurpose as **Tool Selection**), `src/pages/ProjectDetailPage.tsx`, `src/components/recommendations/RecommendationSections.tsx`, `src/components/dialogs/CustomiseStackDialog.tsx`.
- `src/pages/ManualSubmitPage.tsx` + `src/pages/RecommendationPage.tsx` (relocate/repoint the interim pre-assessment recommendations), `src/lib/recommendationEngine.ts`.
- `src/lib/lifecycle.ts` (Deployment RACI: A=AIProgramManager), `src/data/seedRoles.ts` (`usr-ehs`), `src/data/seedProjects.ts`, `src/lib/dashboardStats.ts` + `src/pages/DashboardPage.tsx`.

---

## Step 1 — Relocate recommendations to post-qualification
- **`ManualSubmitPage`:** stop generating recommendations at submit and stop routing to `/recommendations`. On submit it should mirror the assisted path — create + `submitProject` (→ `ForAssessment`) → navigate to project detail. Remove/neutralise the `TODO(V3 Phase 4)` marker.
- **`/recommendations` page:** it's no longer the post-submit destination. Repoint it to **redirect to the project's Tool Selection tab** (or remove the route if nothing links to it) — report which you did and why.
- Recommendations are now produced **post-qualification** (Step 2), not at intake.

## Step 2 — Tool Selection tab (repurpose the Recommendations tab)
Rename the existing Recommendations tab to **"Tool Selection"** and drive it by status:
- **`Qualified` / `QualifiedDraft`:** if `project.recommendations` is empty, generate them from `project.submission` using the **live catalog** (`recommendTools` + `recommendCombos(tools)`) and store via `setRecommendations`; offer a **Re-generate** action. Show ranked tools + combos and let the user **select / customise the stack** (reuse `applyCombo`, `updateToolStack`, `CustomiseStackDialog`). Then two buttons:
  - **Submit for review** → `submitForReview` (requires a non-empty tool stack).
  - **Save draft** → `saveQualifiedDraft`.
- **`Submitted` and later:** read-only stack + rationale (no editing).
- **Role gate for tool selection/customise:** submitter, `DataEngineering`, `AIProgramManager`, `Admin`. *(Per-tier tightening — Tier1 self vs Tier3 team-led — is Phase 5; leave a `// TODO(V3 Phase 5)` note.)*

## Step 3 — Store actions (`src/stores/projectsStore.ts`)
Remove the Phase-0 interim `→ Active` seam. Add (each graph-validates the transition, role-gates, appends audit, stamps `lastActivityAt`):
| Action | Transition | Roles |
|--------|-----------|-------|
| `submitForReview` | `Qualified`/`QualifiedDraft → Submitted` (guard: tool stack non-empty) | submitter, DataEngineering, AIProgramManager, Admin |
| `saveQualifiedDraft` | `Qualified → QualifiedDraft` | same |
| `assignEhsCoordinator(projectId, ehsUserId \| null)` | sets `ehsCoordinatorId` (no status change) | GovernanceLead, AIProgramManager, Admin |
| `approveSubmission` | `Submitted →` **`ForEHSReview` if `ehsCoordinatorId` set, else `Active`** | GovernanceLead, AIProgramManager, Admin |
| `rejectSubmission(reason)` | `Submitted → Rejected` | same |
| `ehsApprove` | `ForEHSReview → Active` | EHS, Admin |
| `ehsReject(reason)` | `ForEHSReview → EHSRejected` | EHS, Admin |
| `resubmitAfterRejection` | `Rejected`/`EHSRejected → Submitted` | submitter, DataEngineering, AIProgramManager, Admin |

Add a private **`activateProject(project)`** helper called by `approveSubmission` (no-EHS path) and `ehsApprove`: set status `Active`, stamp `activeSince` (if null) and `lastActivityAt`, and set the governance-progress view to `currentStage: 'Development'`, `stageStatus.Development: 'InProgress'`.

## Step 4 — Status/gate action surface (`src/components/project/StatusGateActions.tsx`, new)
A small contextual component (sibling to the existing "Current Stage Actions" block on Overview) that, given `project` + `currentUser`, renders the **operational V3 gate buttons** for the current status, each wired to the matching store action via the existing confirm/reason dialog pattern:
- `Submitted` + Gov/PM/Admin → **Approve** (opens a panel to optionally **assign an EHS coordinator** from EHS users before approving — makes the gate conditional) and **Reject** (reason).
- `ForEHSReview` + EHS/Admin → **EHS Approve** / **EHS Reject** (reason).
- `Rejected`/`EHSRejected` + owner roles → **Revise & resubmit**.
Roles without an available action see a read-only "awaiting {role}" note (reuse the tooltip pattern). Keep it a single switch on status so Phase 5 (sponsor closure) and Phase 6 (reactivate) can extend it. Render it on the Overview tab; also surface the EHS actions on the Tool Selection/Overview area for the EHS persona.

## Step 5 — EHS assignment + queue (light)
- The EHS-coordinator assignment lives in Step 4's Approve panel (select an EHS user, or leave blank to skip EHS). Show on the project header/overview whether **EHS review is required** (coordinator assigned) once `Submitted`.
- Dashboard: add a small **EHS review queue** stat/link (projects in `ForEHSReview`) visible to the EHS role, deep-linking to the list filtered `?status=ForEHSReview`. Reuse the existing pending-queue pattern.

## Step 6 — Dashboard vocab
Ensure `dashboardStats` counts read sensibly with the new gate statuses (e.g. `Submitted` and `ForEHSReview` counted as in-pipeline, `Active` as the active count). No new charts — just correct filters.

## Step 7 — Seeds (`src/data/seedProjects.ts`)
Make the whole spine demoable end-to-end:
- Set/add **one `Qualified`** seed (assessment + tier populated in Phase 3, **empty tool stack**) → live tool-selection demo.
- Add **one `Submitted`** seed (stack selected, no EHS coordinator) → 2nd-review demo.
- Add **one `ForEHSReview`** seed (`ehsCoordinatorId: 'usr-ehs'`, stack selected) → EHS gate demo.
- Keep the `ForAssessment` (prj-058) and `NotQualified` (prj-027) demos, and the Active/Completed tiered seeds (ensure Active seeds have `activeSince` + a tool stack).

## Step 8 — Tests
Extend vitest: `approveSubmission` routes to `ForEHSReview` when a coordinator is set and to `Active` when not; `activateProject` stamps `activeSince` once; `submitForReview` is blocked with an empty stack.

## Step 9 — Verify · Git (milestone) · report
1. `npm run build` ✅ and `npm run test` ✅.
2. Manually walk the spine: qualify prj-058 → **Tool Selection** tab generates recommendations → pick a combo → **Submit for review** (`Submitted`) → as **Governance/PM**, Approve **without** EHS → `Active` (`activeSince` stamped, stage → Development). Repeat on the `Submitted` seed but **assign `usr-ehs`** → `ForEHSReview` → log in as **EHS** → **EHS Approve** → `Active`; and **EHS Reject** → `EHSRejected` → revise & resubmit. Confirm manual intake no longer detours through `/recommendations`.
3. `git commit` (message above) → **`git push origin main`** → confirm Vercel deploy.
4. Write **`docs/refactor1/V3-PHASE-4_REPORT.md`**: per-file changes, the `StatusGateActions` design, what happened to the `/recommendations` route, the new store actions + role gates, seed additions, push/deploy confirmation, and anything skipped/flagged.
