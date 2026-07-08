# V3-PHASE-0 Report — Status Spine and Data Model

> Executed from `docs/refactor1/V3-PHASE-0_Status_Spine_and_Data_Model.md`.  
> Verification: `npm run build` ✅ · `npm run test` ✅ (3 specs)

## Final `ProjectStatus` set (as implemented)

```
IdeaDraft | ForAssessment | NotQualified | Cancelled
Qualified | QualifiedDraft | Submitted | Rejected
ForEHSReview | EHSRejected | Active
ForSponsorApproval | Disapproved | Completed
Idle | Deactivated
```

(16 states. Old `Draft` / `InProgress` / `OnHold` / `Decommissioned` removed.)

## Per-file summary

### New files
| File | Change |
|------|--------|
| `src/lib/projectStatus.ts` | Status registry: `PROJECT_STATUSES`, `STATUS_META`, transition graph, `STATUS_STAGE_ANCHOR`, `RISK_BY_TIER` / `TIER_BY_RISK`, helpers |
| `src/lib/projectStatus.test.ts` | Vitest: meta completeness, no dangling targets, terminals return `[]` |
| `vitest.config.ts` | Minimal vitest config with `@` alias |
| `docs/refactor1/V3-PHASE-0_REPORT.md` | This report |

### Types & seed
| File | Change |
|------|--------|
| `src/types/index.ts` | V3 `ProjectStatus`; `EHS` role; `ProjectTier`, `RewardCategory`; assessment interfaces; Project + User field extensions |
| `src/data/seedProjects.ts` | Remapped statuses; `v3Defaults(...)` on all 7 seeds; `activeSince` stamped for Active/Completed/Idle |
| `src/data/seedRoles.ts` | Added `usr-ehs` (Patricia Lim, EHS) |

### Store & engines
| File | Change |
|------|--------|
| `src/stores/projectsStore.ts` | `IdeaDraft` / `ForAssessment`; replaced `applyStatusSideEffects` (removed Use→Completed); stamps `lastActivityAt` on mutations; initialises V3 fields |
| `src/lib/recommendationEngine.ts` | `recommendCombos(..., tools)` uses live catalog tools (no `SEED_TOOLS`) |
| `src/lib/submissionWizard.ts` | `// TODO(V3 Phase 2)` on hardcoded `estimatedUsers: 50` |
| `src/lib/dashboardStats.ts` | Active / ForAssessment / Idle vocabulary; completion-rate exclusions updated |
| `package.json` | `vitest` devDep + `"test": "vitest run"` |

### UI (vocab only — no new screens)
| File | Change |
|------|--------|
| `src/components/common/StatusBadge.tsx` | Project badges delegate to `STATUS_META` |
| `src/pages/ProjectsListPage.tsx` | Filter list = `PROJECT_STATUSES` |
| `src/pages/ProjectDetailPage.tsx` | Benefits tab also for `ForSponsorApproval` |
| `src/pages/SubmitProjectPage.tsx` | Passes `tools` into `recommendCombos` |
| `src/pages/RecommendationPage.tsx` | Passes `tools` into `getDisplayedCombos` |
| `src/components/recommendations/RecommendationSections.tsx` | `getDisplayedCombos` takes `tools` |
| `src/components/project/ProjectDetailTabs.tsx` | Same `tools` threading |
| `src/lib/utils.ts` | `EHS` in `humanizeRole` / `roleDescription` |
| `src/lib/roleStyles.ts` | `EHS` styles (green token palette) |
| `src/pages/LoginPage.tsx` | `EHS` in role order + icon |

## Interim stage→status seams (TODO markers)

Left in `projectsStore.applyStatusSideEffects` as specified:
- Assessment Completed + `ForAssessment` → `Qualified` — **TODO(V3 Phase 3)**
- First post-Assessment `InProgress` while status ∈ {Qualified, QualifiedDraft, Submitted} → `Active` — **TODO(V3 Phase 4)**
- Decommissioning Completed → `Deactivated`
- **Removed** Use Completed → Completed (sponsor-driven, Phase 5)

## Skipped / flagged

1. **No new screens** — confirmed (no EHS review, profile setup, AI intake, tier UI, aging).
2. **`OnHold` / `Rejected` transition paths** — `Rejected` remains in the V3 graph; `OnHold` remapped to `Idle` in seeds. Dedicated Idle/Deactivated demo projects deferred to Phase 6 per prompt.
3. **Tier / qualification content** — fields present, all `null` / empty; no invented checklist data.
4. **Azure provider interfaces** — still not present (pre-existing divergence; out of scope for this phase).
5. **`FormDialog.tsx` stub** — untouched.
6. **EHS role styling** — used existing green token classes (no new teal token added to design system).
7. **Login grid** — now 10 roles; layout still 3-column responsive grid (no layout redesign).

## Confirmations

- [x] `npm run build` passes  
- [x] `npm run test` passes (3/3)  
- [x] Status vocabulary centralized in `src/lib/projectStatus.ts`  
- [x] ISO 9-stage lifecycle retained; V3 status layered on top  
- [x] No new pages/routes added  
