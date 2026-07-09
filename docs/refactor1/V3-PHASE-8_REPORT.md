# V3-PHASE-8 Report — Business Analyst Delivery Involvement

> Executed from `docs/refactor1/V3-PHASE-8_BA_Delivery_Involvement.md` (closes BA audit gaps #4, #7, #9, #10, #11; light touch on #2/#3).  
> Verification: `npm run build` ✅ · `npm run test` ✅ (44 specs expected after Phase-8 store tests)  
> Git: **milestone** — committed and pushed to `main` (Vercel deploy).

## Data model

| Field | Shape |
|-------|--------|
| `Project.businessAnalystId` | `string \| null` |
| `Project.requirements` | `RequirementsArtifact \| null` — items (text + Must/Should/Could), notes, `confirmedBy`/`confirmedAt` |
| `Project.uat` | `UatArtifact \| null` — cases (Pass/Fail/Untested), outcome, notes, `signedOffBy`/`signedOffAt` |

Helpers in `src/lib/baArtifacts.ts`: `requirementsComplete`, `uatPassed`, `isBaGateMandatory` (Tier2/3), `canEditRequirements`/`canEditUat` (assigned BA or Admin), `canCompleteDevelopment`/`canCompleteDeployment`, CI labels.

## Gates (where enforced)

| Gate | UI | Store |
|------|----|-------|
| Development → Completed | `TransitionButtons` disables + tooltip (`developmentGateBlockReason`) | `advanceStage` throws unless complete or Admin |
| Deployment → Completed | Same with UAT reason | Same |
| Sponsor approval (Tier2/3) | — | `submitForSponsorApproval` requires `uatPassed` (Admin exempt) |

Tier1: gates optional; UI offers **Self-attest** shortcuts that stamp confirm/sign-off.

## Assignment flow

1. **Qualify:** BA picker on `ProjectQualificationTab` → `qualifyProject` payload `businessAnalystId`.
2. **Later:** Governance / PM / Admin reassign via header Select → `assignBusinessAnalyst` (audit note).
3. Header shows assigned BA; CI mirror column **Business Analyst**.

## BA queue / notifications

- Dashboard callout for `BusinessAnalyst`: requirements queue + UAT queue (`baRequirementsQueue` / `baUatQueue` scoped to `currentUser.id`).
- Profile → **Assigned to me (BA)**.
- Notification kinds: `requirements-requested`, `requirements-confirmed`, `uat-requested`, `uat-signed-off` — TO assigned BA (request) or DE/PM (confirm/sign-off).

Emit points: enter Development/Deployment with BA assigned (`advanceStage`); activate with BA (`approveSubmission` / `ehsApprove`); confirm/sign-off actions.

## CI columns

`CiPortalRecord`: `businessAnalystName`, `requirementsStatus` (Confirmed / Pending / —), `uatStatus` (Pass / Fail / Pending / —) on `/ci-portal`.

## Seed setup

| Project | Demo purpose |
|---------|----------------|
| `prj-031` | Active Tier3 Development — requirements draft **unconfirmed** (BA queue) |
| `prj-042` | Active Tier2 Deployment — UAT **Fail** (blocks Complete) |
| `prj-051` | Active Tier1 Use — confirmed reqs + passed UAT (self-attest history) |
| `prj-019` / `prj-008` / `prj-064` | Completed / sponsor path — backfilled BA + artifacts |
| `prj-061` | Qualified — BA assigned early |

## Audit items closed

| # | Item | Result |
|---|------|--------|
| 4 | Requirements (R) | Owned artifact + hard gate |
| 7 | UAT (R) | Owned artifact + hard gate |
| 9 | Named BA | `businessAnalystId` + assign UI + CI |
| 10 | Work queue | Dashboard BA callout + Profile section |
| 11 | Notifications | BA is TO on request kinds |
| 2 / 3 | Benefit / Assessment view | Partial: BA in `canReport` when assigned; ForAssessment hint to Overview |

## Push / deploy

- Commit: (filled after push) — `feat(ba): BA assignment + gated requirements & UAT artifacts + work queue [Phase 8]`
- Pushed to `origin/main` — Vercel production deploy from `main`.

## Skipped / flagged

- Full read-only Qualification checklist for non-reviewers (#3) not built — Overview hint only.
- Dedicated BA benefit/ROI assessment channel (#2 RACI swimlane) not built beyond assigned-BA `canReport`.
- Clear localStorage / Admin Reset recommended after deploy so seeds pick up new BA fields (persist may hold pre–Phase-8 projects).
