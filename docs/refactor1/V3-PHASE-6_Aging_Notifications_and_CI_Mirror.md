# V3-PHASE-6 — Aging Engine + Demo Clock + Notifications + CI Portal Mirror

> **Cursor — read this fully before editing. Surgical refactor; Phases 0–5 are merged.**
> Standing rules:
> - Do **not** regenerate files. **Read each target file first**, then `str_replace`/surgical edits. If a target differs or a change would clobber a later fix, **stop and report**.
> - Never `git add -A` blindly — stage intended files, report anything else modified.
> - End at green `npm run build` **and** `npm run test`.
> - **Git — MILESTONE phase → commit AND push to `main`.** After green build+tests **and** the Step 9 verification, `git commit -m "feat(lifecycle): aging engine + demo clock + notifications + CI Portal mirror [Phase 6]"` then **`git push origin main`** (Vercel deploy — confirm in report). Never force-push.
> - Report to **`docs/refactor1/V3-PHASE-6_REPORT.md`**.

## Scope (V3 items 5 & 6)
Four self-contained pieces, all **mock/simulated** (decisions locked): a **demo clock**, an **idle/deactivation aging engine** driven by it, a **mock notification feed** (email-style TO/CC), and a **read-only CI Portal mirror behind an adapter seam**. Aging applies only to `Active` (→ `Idle`) and `Idle` (→ `Deactivated`); reactivation returns to `Active`.

## Read first
- `src/stores/projectsStore.ts` (`nowIso()`, transition actions, `activeSince`/`lastActivityAt`, `appendTransition`), `src/lib/projectStatus.ts` (`Active→Idle`, `Idle→Active|Deactivated`, `Deactivated→Active`).
- `src/components/admin/AdminDemoControlsTab.tsx` (demo-clock controls go here), `src/components/layout/Topbar.tsx` (notification bell), `src/routes/AppRoutes.tsx`, `src/components/layout/Sidebar.tsx`.
- `src/lib/utils.ts` (`formatRelative`), `src/stores/bootstrapStores.ts` (run aging on load; clear-all wipes new keys), `src/lib/dashboardStats.ts`, `src/data/seedProjects.ts`, `src/components/project/StatusGateActions.tsx` (add Reactivate).
- `src/types/index.ts` (add `Notification`, `CiPortalRecord`).

---

## Step 1 — Demo clock (`src/stores/demoClockStore.ts`, new)
- Persisted (key `gcs-ai-portal-democlock`): an **offset in days** from real now (default 0).
- `getDemoNow(): Date` = realNow + offsetDays; export a `demoNowIso()`.
- Actions: `advanceDays(n)`, `setOffset(n)`, `reset()`.
- **Make the store's clock demo-aware:** redefine `projectsStore`'s `nowIso()` to return `demoNowIso()` so all new timestamps/transitions follow the demo clock (one change, keeps the timeline coherent). Route **aging + project-activity relative displays** (`formatRelative` on project `updatedAt`/`lastActivityAt`, list "Updated") through `getDemoNow()`; leave already-recorded audit event timestamps as recorded. Report the exact set you routed.
- **Admin demo-clock panel** (in `AdminDemoControlsTab`): show current demo date + offset; buttons **+7d / +14d / +30d / +180d / custom**, and **Reset clock**. Advancing calls `runAging()` (Step 2).

## Step 2 — Aging engine (`src/lib/aging.ts`, new; unit-tested)
Tunable constants: `AGING_REMINDER_DAYS = 7`, `AGING_IDLE_DAYS = 14`, `AGING_ALERT_DAYS = 180`, `AGING_DEACTIVATE_DAYS = 187`.
- `computeAging(project, now): { phase: 'active'|'reminder'|'idle'|'alert'|'deactivated'; daysInactive: number }` — `daysInactive = now − lastActivityAt`; only meaningful for `Active`/`Idle` (else `phase:'active'`, i.e. n/a).
- Ladder (based on inactivity while `Active`/`Idle`): ≥7 → reminder (stays Active), ≥14 → should be `Idle`, ≥180 → alert (stays Idle), ≥187 → should be `Deactivated`.
- Store action **`runAging()`**: for each `Active`/`Idle` project, apply the due status transition (`Active→Idle`, `Idle→Deactivated`) via the graph, append an audit entry, and **emit the matching notification** (reminder / idle / alert / deactivated). Idempotent — re-running at the same demo time does nothing new. Call `runAging()` on **bootstrap** and after every demo-clock advance.
- Store action **`reactivateProject(projectId, actor)`**: `Idle`/`Deactivated → Active`, reset `lastActivityAt = demoNow`, audit + notification. Add **Reactivate** to `StatusGateActions` for `Idle`/`Deactivated` (owner roles + Governance/Admin).

## Step 3 — Notifications (`src/stores/notificationsStore.ts` + `src/lib/notificationRules.ts`, new)
- `Notification` type: `{ id; timestamp; projectId; projectTitle; kind; to: string[]; cc: string[]; subject; body; readBy: string[] }` (recipients are userIds/roles resolved to display names in UI).
- `notificationsStore` (persisted, key `gcs-ai-portal-notifications`): `push(n)`, `markRead(id, userId)`, `unreadCountFor(userId)`, `clear()`.
- `notificationRules.ts`: `recipientsFor(kind, project) → { to, cc }` mapping each event to roles/users. Emit a notification (via a `notify(projectId, kind, actor)` helper) at these transition points (TO = primary owner of the next step; CC = submitter/sponsor as relevant):
  | kind | emitted at | TO / CC |
  |------|-----------|---------|
  | submitted-for-assessment | `submitProject` | TO Governance/Risk · CC submitter |
  | qualified / not-qualified | qualify/reject | TO submitter · CC Governance |
  | submitted-for-review | `submitForReview` | TO PM/Governance · CC submitter |
  | approved / rejected | approve/reject submission | TO submitter+owners · CC Governance |
  | ehs-review-requested | approve→ForEHSReview | TO EHS coordinator · CC submitter |
  | ehs-approved / ehs-rejected | ehsApprove/Reject | TO submitter+owners · CC EHS |
  | sponsor-approval-requested | submitForSponsorApproval | TO sponsor · CC submitter |
  | completed / disapproved | sponsor decision | TO submitter+owners · CC sponsor |
  | project-review-logged | `logProjectReview` (fulfils Phase-5 TODO) | TO owners · CC Governance |
  | aging-reminder / idle / alert / deactivated / reactivated | `runAging` / `reactivateProject` | TO submitter+owners · CC Governance |
- **UI:** a **bell in `Topbar`** with an unread badge (for `currentUser`) and a dropdown of recent notifications; a **`/notifications`** page listing the full feed with TO/CC, subject/body, project link, and demo timestamps. Keep it clearly an **email-style mock**.

## Step 4 — CI Portal read-only mirror (`src/lib/ciPortalAdapter.ts` + `/ci-portal` page)
- Adapter seam: `interface CiPortalAdapter { list(): CiPortalRecord[]; get(projectId): CiPortalRecord | null }`. Implement **`LocalMirrorAdapter`** that maps each project → a CI-Portal-shaped `CiPortalRecord` (CI ID = project id, Project Name, Status, Reward Category, Tier, Submitter/Leader, Sponsor, Group, Site, key dates, reported benefit hours). Export a single `ciPortal = LocalMirrorAdapter` instance so callers don't know the source.
- **`/ci-portal` page** (nav link): a **read-only** table of mirrored records reflecting live project state, with a clear "Mirror · read-only · mock integration" banner. Add a small "Mirrored to CI Portal" indicator on the project detail.
- Top-of-file comment on the adapter: *"Swap `LocalMirrorAdapter` for a `RemoteCiPortalAdapter` (real CI Portal API) later without touching callers."*

## Step 5 — Seeds (`src/data/seedProjects.ts`)
Make aging demoable by relative inactivity (against the default demo clock):
- One `Active` project with `lastActivityAt` ~**10 days** before demo-now (advance +7d → crosses Idle threshold live).
- One seeded **`Idle`** project (`lastActivityAt` ~20 days back) and one **`Deactivated`** (>187 days back) — the demo projects deferred from Phase 0.
- Ensure `Active` seeds have coherent `activeSince`/`lastActivityAt`.

## Step 6 — Dashboard (light)
Add `idleCount` / `deactivatedCount` to `dashboardStats` and a compact callout/stat (idle projects need attention). No new charts.

## Step 7 — Bootstrap & clear-all
Run `runAging()` on bootstrap; ensure Admin → Clear All Local Data also wipes `gcs-ai-portal-democlock` and `gcs-ai-portal-notifications`, and `reset()` restores demo clock to offset 0.

## Step 8 — Tests
Extend vitest: `computeAging` phase boundaries (13d→active/reminder, 14d→idle-due, 187d→deactivated-due); `runAging` transitions `Active→Idle` and emits a notification; `reactivateProject` resets `lastActivityAt` and returns to `Active`.

## Step 9 — Verify · Git (milestone) · report
1. `npm run build` ✅ and `npm run test` ✅.
2. Manually: Admin → **advance +7d** → the ~10-day-idle `Active` project flips to `Idle` and a notification appears in the bell/feed with TO/CC; **+180d** more → `Deactivated`; **Reactivate** → back to `Active`, `lastActivityAt` reset. Open **/ci-portal** → records reflect current statuses/tiers; change a project and see the mirror update. **Reset clock** restores state.
3. `git commit` (message above) → **`git push origin main`** → confirm Vercel deploy.
4. Write **`docs/refactor1/V3-PHASE-6_REPORT.md`**: per-file changes, the demo-clock wiring (what `nowIso`/`formatRelative` now use), aging constants, notification emit points as built, the CI adapter interface, seed additions, push/deploy confirmation, anything skipped/flagged.
