# V3-PHASE-5 Report — Per-Tier Development Overlay + Sponsor-Approval Closure

> Executed from `docs/refactor1/V3-PHASE-5_Tier_Development_and_Sponsor_Closure.md`.  
> Verification: `npm run build` ✅ · `npm run test` ✅ (20 specs)  
> Git: **milestone** — committed and pushed to `main` (Vercel deploy).

## Per-file changes

| File | Change |
|------|--------|
| `src/lib/tiering.ts` | **New** — `TIER_META`, `getStackOwnerRoles`, `canOwnStack`, project-review note helpers |
| `src/lib/tiering.test.ts` | **New** — Tier1 includes submitter; Tier3 excludes bare submitter |
| `src/components/common/TierBadge.tsx` | **New** — “Tier N · {label}” with teal/amber/coral palettes |
| `src/stores/projectsStore.ts` | Closure actions + `logProjectReview`; stack gates use `canOwnStack`; `validateBenefits` deprecated |
| `src/stores/projectsStore.test.ts` | Phase 5 closure specs |
| `src/components/project/StatusGateActions.tsx` | Active / ForSponsorApproval / Disapproved gate buttons |
| `src/components/project/ProjectDetailTabs.tsx` | Tier & Development card; tier-aware Tool Selection; Benefits → closure surface |
| `src/pages/ProjectDetailPage.tsx` | `showBenefitsTab` includes Active/Disapproved; removed `validateBenefits` UI path |
| `src/components/project/ProjectHeaderCard.tsx` | `TierBadge` |
| `src/pages/ProjectsListPage.tsx` | Compact `TierBadge` on title cell |
| `src/lib/dashboardStats.ts` | `awaitingValidation` → `ForSponsorApproval` |
| `src/data/seedProjects.ts` | Active Tier1 (`prj-051`), ForSponsorApproval (`prj-064`), Disapproved (`prj-065`), Completed `sponsorDecision:'Approved'` |

## Tier meta + `getStackOwnerRoles`

| Tier | Label | Risk | Stack owners |
|------|-------|------|--------------|
| Tier1 | Self-build | Low | Submitter (project owner) + DataEngineering + Admin |
| Tier2 | Collaborative | Medium | DataEngineering + AIProgramManager + BusinessAnalyst + Admin |
| Tier3 | Team-led | High | AIProgramManager + DataEngineering + Admin (submitter hands-off) |

`canOwnStack` replaces the Phase-4 flat gate everywhere (store + Tool Selection + header customise).

## Closure actions + `validateBenefits`

| Action | Transition | Roles |
|--------|-----------|-------|
| `submitForSponsorApproval` | Active → ForSponsorApproval (hours required) | submitter / DE / PM / Admin |
| `sponsorApprove` | → Completed; `sponsorDecision:'Approved'`, `sponsorValidated:true`, Use Completed | assigned Sponsor / Admin |
| `sponsorDisapprove` | → Disapproved | same |
| `reviseAfterDisapproval` | → Active | owner roles |
| `logProjectReview` | audit only (Tier2/3 Active) | PM / Governance / Admin |

**`validateBenefits`:** left on the store (deprecated comment) but **UI call path removed**. Completion now only via `sponsorApprove`, which still sets `sponsorValidated:true` so `hoursSaved` keeps working.

`// TODO(V3 Phase 6): emit notification` on `logProjectReview`.

## Seed additions

| ID | Status | Notes |
|----|--------|-------|
| prj-051 | Active Tier1 | Retiered from Tier2 for self-build demo |
| prj-042 / prj-031 | Active Tier2 / Tier3 | unchanged |
| prj-064 | ForSponsorApproval | 21 hrs reported, `usr-sponsor` |
| prj-065 | Disapproved | revise-loop demo |
| prj-019 / prj-008 | Completed | `sponsorDecision:'Approved'` |

## Push / deploy

- Commit message: `feat(closure): per-tier development overlay + sponsor-approval closure [Phase 5]`
- Pushed to `origin/main` — Vercel production deploy triggered from `main`.

## Skipped / flagged

- Dashboard does not show a dedicated tier chart (spec: compact badge where relevant — list + header only).
- ConfirmDialog still closes before empty-reason toast on disapprove (same Phase-4 UX quirk); store enforces reason.
