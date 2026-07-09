# V3-PHASE-10 — Delivery-Role Slots (DE / PM / M&S assignment, queues, notifications)

> **Cursor — read this fully before editing. Surgical feature phase; Phases 0–9 merged.**
> Standing rules:
> - Do **not** regenerate files. **Read each target file first**, then `str_replace`/surgical edits. If a target differs or a change would clobber a fix, **stop and report**.
> - Never `git add -A` blindly — stage intended files, report anything else modified.
> - End at green `npm run build` **and** `npm run test`.
> - **Git — commit, DO NOT push.** After green build+tests, `git commit -m "feat(roles): named DE/PM/M&S assignment + work queues + notifications + CI [Phase 10]"`. **No push** — remediation sequence pushes once at Phase 13. Never force-push.
> - Report to **`docs/refactor1/V3-PHASE-10_REPORT.md`**.

## Scope
Give the three **delivery roles** the same first-class "slot" the BA got in Phase 8 — **named per-project assignment → "assigned to me" + work queue → targeted notifications → CI column** — for **DataEngineering, AIProgramManager, MaintenanceSustainability**. This is the systemic fix the audits identified (BA already done; R&C/GL deliberately excluded as role-wide oversight). **Reuse the Phase-8 `businessAnalystId` pattern exactly** — do not invent a new mechanism. **No new stage artifacts here** (DE verification = Phase 12; M&S Use content = Phase 11); this phase is assignment + surfacing only.

## Read first
- Phase-8 precedent: `types/index.ts` (`businessAnalystId`), `baArtifacts.ts` (`canAssignBusinessAnalyst`), `ProjectQualificationTab.tsx` (BA picker), `ProjectHeaderCard.tsx` (BA select/display), `projectsStore.ts` (`assignBusinessAnalyst`, `qualifyProject` payload), `ProfilePage.tsx` ("Assigned to me (BA)"), `dashboardStats.ts` + `DashboardPage.tsx` (BA queues `baRequirementsQueue`/`baUatQueue`), `notificationRules.ts` (BA kinds), `ciPortalAdapter.ts` (BA column).
- `src/lib/roles.ts` (the Phase-9 shared constant); `lifecycle.ts` (who owns Development/Deployment/Use → informs default assignment + queue meaning).

## Step 1 — Data model (`types/index.ts`)
Add three nullable fields to `Project`, mirroring `businessAnalystId`:
- `dataEngineerId: string | null` — the lead builder (Development owner-of-record).
- `programManagerId: string | null` — the deployment/program lead.
- `maintenanceOwnerId: string | null` — the operational owner for the live project (Use).
Keep nullable; reseed defaults in Step 6.

## Step 2 — Assignment actions & UI
- **Store** (`projectsStore.ts`): add `assignDataEngineer`, `assignProgramManager`, `assignMaintenanceOwner` (each mirrors `assignBusinessAnalyst` — set field, audit entry, `lastActivityAt`). **Assigner roles:** GovernanceLead / AIProgramManager / Admin (same as BA assignment); additionally allow **self-claim** — a user of the matching role may assign themselves (a DE can claim `dataEngineerId`, etc.) since these are delivery leads, not governance-granted. Add a `canAssign{Role}` helper set (or one generic `canAssignRole(project, user, slot)`), consistent with `canAssignBusinessAnalyst`.
- **Picker UI:** extend the assignment surface. On the **Qualification tab**, alongside the BA picker, add optional pickers for DE / PM (assignable at qualify via extended `qualifyProject` payload). On the **project header/Overview**, add reassignment Selects for all three (DE, PM, M&S), each populated from users of the matching role, editable later by the assigner roles. Show assigned names on `ProjectHeaderCard` next to the BA.
- **Defaults/sensible timing:** DE/PM may be assigned at qualification; **M&S owner** is most meaningful at go-live — prompt/allow assignment when a project reaches `Active` (a hint on Overview if `maintenanceOwnerId` is null and status is `Active`). Don't hard-require any of them.

## Step 3 — "Assigned to me" (Profile)
Extend `ProfilePage` → the "Assigned to me" area so it shows, for the current user, projects where they are the assigned **BA, DE, PM, or M&S** (whichever roles apply to them), grouped/labeled by slot. Reuse the Phase-8 BA section pattern.

## Step 4 — Work queues (dashboard callouts)
Add role callouts mirroring the BA queues, each deep-linking to a filtered `/projects` list. Add the counts to `dashboardStats` (scoped to `currentUser.id` as the assigned lead):
- **DataEngineering:** projects assigned to me in `currentStage: Development` (to build) — and reuse where helpful, projects `Active` in Development needing work.
- **AIProgramManager:** the **`Submitted` awaiting review** queue (PM owns the review gate but had no queue — audit's top PM fix) **and** projects assigned to me in `currentStage: Deployment`.
- **MaintenanceSustainability:** projects assigned to me that are `Active` (live to operate) and any that are `Idle`/aging (reuse the Phase-9 idle wiring; surface `needsAttention` here for the M&S owner).
Add a **`?tier=` filter** to the projects list (the Phase-9 R&C Tier3 callout wanted it) and an assigned-to-me filter param as needed — keep the URL-filter approach already in `useFilteredProjects`.

## Step 5 — Targeted notifications (`notificationRules.ts`)
Tighten from role-wide to **assigned-lead TO** where an assignment exists (fall back to role-wide if unassigned), and add the delivery hand-off kinds:
- On **go-live** (`approved` no-EHS / `ehs-approved` → Active): TO the assigned **M&S owner** (fallback all M&S) — the Use owner learns the project is live.
- On entering **Development**: TO assigned **DE** (this complements the Phase-8 `requirements-requested` to BA).
- On entering **Deployment**: TO assigned **PM** (complements `uat-requested` to BA).
- Where `dataEngineerId`/`programManagerId`/`maintenanceOwnerId` is set, prefer TO that person over the role-wide list for the relevant existing kinds (e.g. `uat-signed-off` → assigned DE if set). Keep CC coverage as-is.
Reuse the Phase-8 emit points; don't invent a parallel system.

## Step 6 — CI mirror + seeds
- **CI (`ciPortalAdapter.ts` / `CiPortalRecord`):** add **Data Engineer**, **Program Manager**, **Maintenance Owner** columns (assigned display names) beside the BA column; show on `/ci-portal`.
- **Seeds (`seedProjects.ts`):** assign `usr-data` / `usr-pm` / `usr-maint` as `dataEngineerId` / `programManagerId` / `maintenanceOwnerId` across the relevant Active/qualified+ projects (coherent with existing BA assignments), so each delivery persona has populated "assigned to me" queues and the CI columns render. Leave a couple unassigned to demo the assign/claim flow and the go-live M&S prompt.

## Step 7 — Tests
Extend vitest: each `assign*` sets the field + audit; self-claim allowed for matching role, denied for others; `canAssignRole` matrix; assigned-lead notification targeting (TO assigned person when set, role-wide fallback when null); dashboard queue counts scoped to the assigned user.

## Step 8 — Verify · Git · report
1. `npm run build` ✅ and `npm run test` ✅.
2. Manually: as **PM**, dashboard shows "Submitted awaiting review" + assigned Deployment queue; as **DE**, "assigned to me" build queue + can self-claim an unassigned project; as **M&S**, an `Active` project assigned to me appears, a null-owner Active project shows the assign hint, and going live notifies the M&S owner. CI mirror shows all four lead columns.
3. `git commit` (message above). **No push.**
4. Write **`docs/refactor1/V3-PHASE-10_REPORT.md`**: fields added, assign actions + `canAssignRole` logic (incl. self-claim), queues + any new URL filters, notification targeting changes (assigned-vs-role-wide), CI columns, seed assignments, tests, anything skipped/flagged. Note this closes the systemic delivery-role slot for DE/PM/M&S (BA already done).
