# V3-PHASE-11 — AI Use Overlay for M&S (Health, Incidents, Drift)

> **Cursor — read this fully before editing. Surgical feature phase; Phases 0–10 merged.**
> Standing rules:
> - Do **not** regenerate files. **Read each target file first**, then `str_replace`/surgical edits. If a target differs or a change would clobber a fix, **stop and report**.
> - Never `git add -A` blindly — stage intended files, report anything else modified.
> - End at green `npm run build` **and** `npm run test`.
> - **Git — commit, DO NOT push.** After green build+tests, `git commit -m "feat(use): M&S health status + incident log + drift on Active/Use [Phase 11]"`. **No push** — remediation sequence pushes once at Phase 13. Never force-push.
> - Report to **`docs/refactor1/V3-PHASE-11_REPORT.md`**.

## Scope
Turn the "empty theater" AI Use phase into something the **Maintenance & Sustainability** owner actually operates. Per the audit's minimum-viable set and your decisions: a **health status** and an **incident log** on live projects, with **model drift owned by M&S** (framework RACI is authoritative). **Light overlay on the existing Use/Active state — no new stage, reuse Phase-6 aging and Phase-10 assignment.** This is the M&S analogue of the Phase-8 BA overlay.

## Read first
- Phase-8 precedent (the pattern to mirror): `baArtifacts.ts`, `BaDeliveryPanels.tsx`, how the Requirements/UAT panels attach to a stage card and gate/summary by role.
- `types/index.ts` (`Project`, tier/status), `lifecycle.ts` (Use stage; per Phase-9 decision confirm **M&S** owns drift — add M&S to Use if needed), `projectsStore.ts` (action pattern, `nowIso`, audit), `notificationRules.ts` (add incident/health kinds), `dashboardStats.ts` + `DashboardPage.tsx` (M&S queues from Phase 10, `needsAttention`), `deliverySlots.ts` (`maintenanceOwnerId`, `canAssignMaintenanceOwner`), `ciPortalAdapter.ts`, `ProjectDetailTabs.tsx` (Overview + Lifecycle Use stage card), `seedProjects.ts`.

## Step 1 — Data model (`types/index.ts`)
- `HealthState = 'Healthy' | 'Watch' | 'Incident'`.
- `Incident = { id: string; openedAt: string; severity: 'Low'|'Medium'|'High'; summary: string; status: 'Open'|'Closed'; closedAt: string | null; note: string }`.
- `DriftState = 'None' | 'Suspected' | 'Confirmed'`.
- `Project.operations: { health: HealthState; incidents: Incident[]; drift: DriftState; driftNote: string; lastReviewedAt: string | null } | null` (null until the project goes live / Use begins).
Keep nullable; reseed in Step 6.

## Step 2 — Logic (`src/lib/operations.ts`, new; unit-tested)
- `canOperate(project, user)` = user is the assigned `maintenanceOwnerId` **or** Admin (fallback: any M&S if no owner assigned, matching the delivery-slot fallback pattern).
- `deriveHealth(project)` helper: `Incident` if any open incident; else the stored `health` (default `Healthy`). Keep health explicitly settable by M&S but auto-flip to `Incident` while an open incident exists.
- `openIncidentCount(project)`, `hasOpenIncident(project)`.
- Do **not** gate any status transition on health/incidents (operations is monitoring, not a stage gate) — unlike BA/DE gates. Flag if product later wants "can't close with open incidents."

## Step 3 — Store actions (`projectsStore.ts`)
Each `canOperate`-gated, audit + `lastActivityAt`, and initialises `project.operations` if null:
- `setHealthStatus(projectId, health, actor)`.
- `logIncident(projectId, { severity, summary, note }, actor)` → appends an `Open` incident, sets health `Incident`.
- `closeIncident(projectId, incidentId, note, actor)` → marks `Closed`/`closedAt`; if no other open incidents, health returns to `Watch` (M&S can then set `Healthy`).
- `setDrift(projectId, drift, note, actor)` → sets `DriftState` (+ note).
- `recordUseReview(projectId, note, actor)` → stamps `lastReviewedAt` + audit (the periodic monitoring touch).
Initialise `operations` (health `Healthy`, empty incidents, drift `None`) when a project **goes live** (in `activateProjectFields`) so live projects start with an operations record.

## Step 4 — UI (Use overlay)
Mirror the Phase-8 delivery panels. On the **Use stage card** in `ProjectLifecycleTab` (and a compact summary on **Overview** when status `Active`):
- **Operations panel** (assigned M&S / Admin edit; others read-only):
  - **Health** control (Healthy / Watch / Incident) with a colored indicator; auto-`Incident` when an incident is open.
  - **Incident log** — list with severity/status/date; "Log incident" (severity + summary + note) and "Close incident" actions.
  - **Model drift** control (None / Suspected / Confirmed) + note — **M&S-owned** per RACI decision.
  - **"Record monitoring review"** button → stamps `lastReviewedAt`.
- Show a compact **health chip** (with open-incident count) on `ProjectHeaderCard` and in the projects list for `Active`+ projects.

## Step 5 — Notifications, queues, drift ownership
- **Notifications** (`notificationRules.ts`): kinds `incident-opened` (TO assigned M&S + CC Governance/PM), `incident-closed` (TO owners/M&S), `drift-flagged` (TO assigned M&S + CC DE — since remediation may involve the builder, and Confirmed drift is a build concern). Reuse `assignedOrRole`.
- **Queues** (`dashboardStats` + `DashboardPage`): extend the M&S callouts — "N live projects with open incidents" and "N with drift Suspected/Confirmed" (scoped to `maintenanceOwnerId === currentUser.id`, role-wide fallback). Reuse `needsAttention` where sensible.
- **Drift ownership:** ensure `MaintenanceSustainability` is on the **Use** stage in `lifecycle.ts` (supporting or as the drift owner) so the RACI decision (drift = M&S) is reflected; note if DE should be CC/supporting for Confirmed drift.

## Step 6 — CI mirror + seeds
- **CI:** add **Health** (Healthy/Watch/Incident + open-incident count) and **Drift** (None/Suspected/Confirmed) columns on `/ci-portal`.
- **Seeds:** on the Active/Use demo projects (with `maintenanceOwnerId` from Phase 10), populate `operations`: one **Healthy**, one **Watch** with a closed incident in history, one with an **open High incident** (health auto-`Incident`, shows in M&S queue), one with **drift Suspected**. Backfill Completed projects with a coherent closed operations record. Confirm a couple of live projects are assigned to `usr-maint` so the M&S persona sees populated panels/queues.

## Step 7 — Tests
Extend vitest: `canOperate` (assigned M&S yes, other role no, Admin yes, role-wide fallback when unassigned); open incident forces health `Incident`; closing last incident returns to `Watch`; `setDrift`; go-live initialises `operations`; incident/drift notifications target the assigned M&S.

## Step 8 — Verify · Git · report
1. `npm run build` ✅ and `npm run test` ✅.
2. Manually, as **M&S (`usr-maint`)** assigned to a live project: set health, log an incident (health flips to Incident, appears in M&S queue + notification), close it, set drift Suspected (DE CC'd), record a monitoring review. A non-owner M&S / other role sees read-only. CI shows Health + Drift columns.
3. `git commit` (message above). **No push.**
4. Write **`docs/refactor1/V3-PHASE-11_REPORT.md`**: data model, `operations.ts` logic, store actions, UI placement, notification/queue additions, how drift ownership was reflected in `lifecycle.ts`, CI columns, seed operations states, tests, anything skipped/flagged. Note this closes the M&S "empty Use phase" gap.
