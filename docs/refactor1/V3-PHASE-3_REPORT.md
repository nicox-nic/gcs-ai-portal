# V3-PHASE-3 Report — Qualification + Risk Tiering

> Executed from `docs/refactor1/V3-PHASE-3_Qualification_and_Risk_Tiering.md`.  
> Verification: `npm run build` ✅ · `npm run test` ✅ (11 specs)  
> Git: **non-milestone** — committed locally, **not pushed**.

## Criteria module structure

`src/lib/qualificationCriteria.ts`
- Readiness: `READINESS_FEASIBILITY` / `VIABILITY` / `DESIRABILITY` (7 each), Met threshold = 4
- Qualification: Section A (6), B (4), C (5), Section D risk options + controls
- Reward categories + `emptyReadiness()` / `emptyQualification()` helpers

`src/lib/qualificationLogic.ts`
- `scoreReadiness`, `qualifiesAsAI`, `suggestTier` (hint only), `canQualify`
- Spec: `qualificationLogic.test.ts` (5 tests)

## Store actions + role gates

Removed interim `Assessment Completed + ForAssessment → Qualified` from `applyStatusSideEffects`.

| Action | Transition | Roles |
|--------|------------|-------|
| `qualifyProject` | `ForAssessment → Qualified`; Assessment Completed → Policy NotStarted; stores readiness/qualification/tier/reward; `autoTiered:false` | GovernanceLead, RiskCompliance, Admin |
| `rejectQualification` | `ForAssessment → NotQualified`; Assessment Blocked | same |
| `resubmitForAssessment` | `NotQualified → ForAssessment` | submitter, BA, or Governance/Risk/Admin |
| `cancelProject` | → `Cancelled` (graph-validated) | own IdeaDraft submitter, or Governance/Risk/Admin |

All append audit entries and stamp `lastActivityAt`.

## UI

- New **Qualification** tab (`ProjectQualificationTab`) on Project Detail for assessment-band statuses
- Interactive form for Governance/Risk/Admin on `ForAssessment`
- Read-only awaiting state for other roles; read-only summary after decision
- Dashboard “Pending qualification” → `/projects?status=ForAssessment` (URL filter wired in `useFilteredProjects`)

## Seed tier distribution

| Project | Status | Tier |
|---------|--------|------|
| prj-058 | **ForAssessment** (live demo, empty assessment) | — |
| prj-027 | **NotQualified** (rejection audit) | — |
| prj-042 | Active | Tier2 |
| prj-031 | Active | Tier3 |
| prj-019 | Completed | Tier1 |
| prj-051 | Active | Tier2 |
| prj-008 | Completed | Tier1 |

## Per-file summary

### New
- `src/lib/qualificationCriteria.ts`
- `src/lib/qualificationLogic.ts`
- `src/lib/qualificationLogic.test.ts`
- `src/components/project/ProjectQualificationTab.tsx`
- `docs/refactor1/V3-PHASE-3_REPORT.md`

### Updated
- `src/stores/projectsStore.ts` — qualify/reject/resubmit/cancel; removed Phase-3 interim seam
- `src/pages/ProjectDetailPage.tsx` — Qualification tab wiring
- `src/pages/DashboardPage.tsx` — pending queue deep-link
- `src/hooks/useFilteredProjects.ts` — `?status=` URL sync
- `src/data/seedProjects.ts` — assessment bundles + NotQualified demo

## Skipped / flagged

1. Did **not** change `projectStatus.ts` transition graph (already had the needed edges).
2. Phase-4 Active/EHS interim seam left in place with its TODO.
3. `suggestTier` is sensitivity + scale + customer-keyword heuristic only — Governance override is the source of truth.
4. Clear localStorage / Admin reset projects to see new seed assessment data.
