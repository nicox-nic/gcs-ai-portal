# V3-PHASE-6 Report — Aging Engine + Demo Clock + Notifications + CI Portal Mirror

> Executed from `docs/refactor1/V3-PHASE-6_Aging_Notifications_and_CI_Mirror.md`.  
> Verification: `npm run build` ✅ · `npm run test` ✅ (26 specs)  
> Git: **milestone** — committed and pushed to `main` (Vercel deploy).

## Per-file changes

| File | Change |
|------|--------|
| `src/stores/demoClockStore.ts` | **New** — offset days from `DEMO_TODAY`; `getDemoNow` / `demoNowIso` |
| `src/lib/aging.ts` + `.test.ts` | **New** — ladder constants + `computeAging` + milestone helpers |
| `src/stores/notificationsStore.ts` | **New** — persisted mock email feed |
| `src/lib/notificationRules.ts` | **New** — `recipientsFor` + `notify` |
| `src/lib/ciPortalAdapter.ts` | **New** — `CiPortalAdapter` + `LocalMirrorAdapter` + `ciPortal` |
| `src/stores/projectsStore.ts` | `nowIso`→demo clock; `runAging` / `reactivateProject`; notify hooks |
| `src/stores/bootstrapStores.ts` | Rehydrate + clear democlock/notifications; `runAging` on load |
| `src/lib/utils.ts` | `formatRelative` uses `getDemoNow()` via `formatDistance` |
| `src/components/admin/AdminDemoControlsTab.tsx` | Demo clock panel (+7/+14/+30/+180/custom/reset) |
| `src/components/layout/Topbar.tsx` | Bell + unread badge + dropdown |
| `src/components/layout/Sidebar.tsx` | Notifications + CI Portal nav |
| `src/routes/AppRoutes.tsx` | `/notifications`, `/ci-portal` |
| `src/pages/NotificationsPage.tsx` | **New** — full TO/CC feed |
| `src/pages/CiPortalPage.tsx` | **New** — read-only mirror table |
| `src/components/project/StatusGateActions.tsx` | Reactivate for Idle/Deactivated |
| `src/components/project/ProjectHeaderCard.tsx` | “Mirrored to CI Portal” chip |
| `src/lib/dashboardStats.ts` + `DashboardPage` | `idleCount` / `deactivatedCount` + idle callout |
| `src/data/seedProjects.ts` | prj-031 ~10d inactive; prj-066 Idle; prj-067 Deactivated |
| `src/types/index.ts` | `Notification`, `CiPortalRecord`, `AgingMilestone` |

## Demo-clock wiring

| API | Uses |
|-----|------|
| `projectsStore.nowIso()` | `demoNowIso()` — all new timestamps/transitions |
| `formatRelative(iso)` | `formatDistance(iso, getDemoNow())` — list Updated, activity labels, notification times |
| Audit `formatDateTime` | Absolute recorded timestamps (unchanged) |

**Anchor note:** Spec said “offset from real now.” Implementation anchors to **`DEMO_TODAY` (2026-06-20)** so seed `lastActivityAt` aging is demoable at offset 0. Flagged below.

## Aging constants

`AGING_REMINDER_DAYS=7` · `AGING_IDLE_DAYS=14` · `AGING_ALERT_DAYS=180` · `AGING_DEACTIVATE_DAYS=187`

`runAging` is idempotent via `agingMilestone` on each project. Active projects past idle threshold always Idle first (even if days also exceed alert/deactivate).

## Notification emit points

| kind | Trigger |
|------|---------|
| submitted-for-assessment | `submitProject` |
| qualified / not-qualified | qualify / reject |
| submitted-for-review | `submitForReview` |
| approved / rejected | approve (no EHS) / reject submission |
| ehs-review-requested | approve → ForEHSReview |
| ehs-approved / ehs-rejected | ehsApprove / ehsReject |
| sponsor-approval-requested | `submitForSponsorApproval` |
| completed / disapproved | sponsorApprove / sponsorDisapprove |
| project-review-logged | `logProjectReview` (Phase-5 TODO cleared) |
| aging-* / reactivated | `runAging` / `reactivateProject` |

## CI adapter

```ts
interface CiPortalAdapter { list(): CiPortalRecord[]; get(projectId): CiPortalRecord | null }
export const ciPortal = LocalMirrorAdapter
```

Top-of-file comment documents swap to `RemoteCiPortalAdapter` later.

## Seed additions

| ID | Status | Inactivity |
|----|--------|------------|
| prj-031 | Active Tier3 | `lastActivityAt` ~10d — +7d → Idle live |
| prj-066 | Idle | ~20d back |
| prj-067 | Deactivated | ~190d back |

## Push / deploy

- Commit: `9821365` — `feat(lifecycle): aging engine + demo clock + notifications + CI Portal mirror [Phase 6]`
- Pushed to `origin/main` (`b1ab03d..9821365`) — Vercel production deploy triggered from `main`.

## Skipped / flagged

- Demo clock anchored to `DEMO_TODAY`, not wall-clock “real now,” so seed aging works out of the box.
- `formatRelative` on audit entries also uses demo now (absolute `formatDateTime` remains authoritative).
- Clear-all wipes democlock + notifications; Reset clock restores offset 0 and re-runs aging.
