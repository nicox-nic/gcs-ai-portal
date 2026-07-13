# Remediation: Submission → Review Flow & Checklist Alignment

Date: 2026-07-13
Scope: Submission + Review/Qualification only.
Baseline spec count: 98 before → Final spec count: 101 after

## Phase 0 — Pre-flight

- Working tree was **not clean** at start (unrelated docs moves, LLM provider WIP on `feature/openai-llm-provider`). Proceeded with phase commits limited to in-scope source files only.
- `npm run build`: green.
- `npm run test`: 17 files / **98** tests green (baseline).
- Cited files matched audit descriptions for coupling (`setRisk` → `TIER_BY_RISK`, `canQualify`/`allMet`, cancel without notify). No material divergence that required scope change.
- Note: audit path in prompt header referenced `docs/prompts/refactor3/AUDIT-…`; actual audit lives at `docs/prompts/refactor3/outputreport/AUDIT-SubmissionReview_ChecklistAlignment.md`.

## Phase 1 — project.tier consumer investigation

| Consumer (file:line) | Bucket (A/B/C) | Justification | Behavior when tier is null |
|---|---|---|---|
| `src/lib/baArtifacts.ts:10-12` `isBaGateMandatory` | A | Delivery gate (Tier2/3 BA sign-off) | `false` — gates not mandatory (pre-tier / unlocked BA path) |
| `src/lib/baArtifacts.ts:42-56` `canCompleteDevelopment/Deployment` | A | Stage complete depends on BA/verification by delivery tier | When null, `isBaGateMandatory` false → completes allowed (same as Tier1 path) |
| `src/lib/verification.ts:3-5` `isVerificationMandatory` | A | DE verification mandatory for Tier2/3 | `false` when null |
| `src/lib/tiering.ts:44-55` `getStackOwnerRoles` | A | Who may own the tool stack by delivery model | Uses pre-tier collaborative role set |
| `src/lib/tiering.ts:59-86` `canOwnStack` | A | Stack edit permission | Allows project submitter when tier null (existing pre-tier path) |
| `src/stores/projectsStore.ts:1200` `logProjectReview` | A | Tier2/3-only project reviews | Throws unless Tier2/3 — null blocks reviews (locked) |
| `src/components/project/ProjectDetailTabs.tsx:229-245` tier card / review UI | A/B | Shows delivery meta; gates log-review | Card hidden when null; review button off |
| `src/components/project/ProjectHeaderCard.tsx` tier badge | B | Display only | Was hidden; now shows **Not yet assigned** post-qualification |
| `src/pages/ProjectsListPage.tsx:230` / `CiPortalPage.tsx:77` | B | Compact display | Hide / em dash when null |
| `src/hooks/useFilteredProjects.ts:130` | B | Filter by delivery tier | Excludes null when a specific tier filter is active |
| `src/lib/dashboardStats.ts:316` `highRiskProjects` (pre-change) | C | Used `tier === 'Tier3'` as risk proxy | Redirected to `qualification.riskTier === 'High'` |
| `src/lib/dashboardStats.ts:368-371` tier distribution | B | Counts delivery tiers | Nulls omitted from distribution (correct) |
| `src/lib/ciPortalAdapter.ts:29` | B | Mirror field | Passes null through |
| `src/components/project/ProjectQualificationTab.tsx` `setRisk` / `TIER_BY_RISK` (pre-change) | C | Wrote delivery tier from risk | Removed coupling |
| `src/lib/qualificationLogic.ts:75-76` `suggestProjectTier` | C | Maps risk→ProjectTier | Retained helper; no longer used to set `project.tier` at qualify |
| `src/lib/projectStatus.ts:161-170` `RISK_BY_TIER` / `TIER_BY_RISK` | C | Mapping tables | Kept for legacy label helpers; not used to auto-write at qualify |
| `src/lib/tiering.ts:13-37` `TIER_META.risk` | C | Displayed risk from delivery tier | Tier card Risk line now reads `qualification.riskTier` |

STOP condition triggered? **No.** Null `tier` does not hard-crash; gates use existing pre-tier / non-mandatory behavior or lock (reviews). No logic fundamentally requires delivery tier at qualification time. (Note: no DE “assign delivery tier” action exists yet — out of scope; Qualified seeds with null tier demonstrate “Not yet assigned.”)

## Phase 2 — Tier decoupling

- `qualifyProject` no longer writes `payload.tier`; forces `tier: null`; stores risk only on `qualification.riskTier`.
- `QualifyPayload` dropped `tier`; keeps `tierRationale` as risk-rationale notes.
- `canQualify` no longer requires delivery tier (Phase 4 later removed readiness gate).
- UI: Section D shows Low/Medium/High only (no `→ Tier1/2/3`); Risk / Delivery fields split in summary.
- Display: header/closure show **Not yet assigned** when delivery tier is null post-qualification.
- Bucket C: `highRiskProjects` uses `qualification.riskTier === 'High'`.
- Spec: `projectsStore qualifyProject tier decoupling` asserts `tier === null` and `riskTier` set after qualify.

## Phase 3 — Seed data

**Before (status × tier, approximate):**
- `Qualified` + Tier1: prj-061
- `QualifiedDraft` + Tier1: prj-070
- Later lifecycle (`Submitted`, `Active`, `ForEHSReview`, `Rejected`, `Completed`, etc.): tier populated via `assessmentBundle`
- Intake (`IdeaDraft`, `ForAssessment`, `NotQualified`, `Cancelled`): already null via `v3Defaults`

**Nulled:** prj-061 (`Qualified`), prj-070 (`QualifiedDraft`) — just past qualification, before DE delivery-tier assignment.

**Kept:** all Submitted+ / Active+ / Rejected / EHS / Sponsor / Idle / Deactivated / Completed seeds — treated as past DE delivery-tier assignment.

Audit notes on those two seeds updated to “Risk … Delivery tier not yet assigned.”

## Phase 4 — Readiness informational

- Removed `allMet` from `canQualify`; gate is `qualifiesAsAI` + `rewardCategory !== null`.
- Store error message updated accordingly.
- UI badge when not all Met: “Informational — does not block Qualify” (Met/Not-Met chips and F/V/D totals retained).
- Reward dropdown already unrestricted — verified preserved.
- Specs: Qualify allowed with a Not Met dimension; reward freely selectable (`Kaizen` / `TeamProject` / `Innovation` with Not Met readiness).

## Phase 5 — Cancel notification

- Added `NotificationKind` `'cancelled'`.
- Recipients: TO submitter, CC governance (same as `not-qualified`).
- Subject: `[GCS AI] Project cancelled — {title}`.
- `cancelProject` calls `notify(..., 'cancelled', actor)`.
- **Necessary matrix fix:** `ForAssessment → Cancelled` was missing from `STATUS_TRANSITIONS` while the review UI exposed Cancel — added so review cancel (and its notification) can succeed. Documented as judgment call below.
- Specs: recipients parity test; store test asserts submitter on `cancelled` notification.

## Phase 6 — Project ID timing

Verified: `createProject` assigns `id: \`prj-${nanoid(6)}\`` at draft creation (`src/stores/projectsStore.ts:399`). **Confirmed already correct, no change.**

## Build & Test

| Phase | Build | Tests |
|---|---|---|
| 0 baseline | green | 98 passed |
| 2 | green | 99 passed |
| 3 | green | 99 passed |
| 4 | green | 99 passed |
| 5 | green | 101 passed |
| Final | green | 101 passed |

Specs added/updated: qualify tier-null; readiness Not Met does not block; cancel notify + recipients; highRisk via `riskTier`; `canQualify` signature updates.

Commits:
1. `refactor(review): decouple risk tier from delivery tier; tier null after qualification`
2. `chore(seed): null delivery tier for pre-assessment seed projects`
3. `refactor(review): readiness checklist informational only; does not gate qualify`
4. `feat(review): send notification alert on project cancellation`

## Anything that required a STOP / judgment call

- **No Phase 1 STOP** — proceeded with Phases 2–3.
- **Judgment (Phase 5):** Allowed `ForAssessment → Cancelled` in `STATUS_TRANSITIONS` because the Qualification tab Cancel control is on For Assessment and the matrix previously blocked that transition (cancel from review could not succeed). Required for cancel notification parity on the review path; not a delivery-tier / RACI / Manual-form expansion.
- Working tree had unrelated dirty docs/LLM work; phase commits staged only remediation files.
- No DE UI to assign delivery tier after qualify — noted; seeds beyond Qualified keep tiers so gated demos still work.
