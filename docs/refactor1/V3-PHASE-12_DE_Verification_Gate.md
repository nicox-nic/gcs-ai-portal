# V3-PHASE-12 — DE Tool & Model Verification (Deployment gate)

> **Cursor — read this fully before editing. Surgical feature phase; Phases 0–11 merged.**
> Standing rules:
> - Do **not** regenerate files. **Read each target file first**, then `str_replace`/surgical edits. If a target differs or a change would clobber a fix, **stop and report**.
> - Never `git add -A` blindly — stage intended files, report anything else modified.
> - End at green `npm run build` **and** `npm run test`.
> - **Git — commit, DO NOT push.** After green build+tests, `git commit -m "feat(de): tool & model verification sign-off gating Deployment [Phase 12]"`. **No push** — remediation pushes once at Phase 13. Never force-push.
> - Report to **`docs/refactor1/V3-PHASE-12_REPORT.md`**.

## Scope
Give **Data Engineering** an owned, gated Deployment artifact — a **Tool & Model Verification** sign-off — **symmetric to the BA's UAT** (Phase 8). DE is Responsible for Tool & Model Verification / Control Implementation / Production Deployment; today Deployment completion is gated only by BA UAT. This adds DE's side so the DE↔BA handoff is real on both ends. **Reuse the Phase-8 gate pattern exactly** (artifact + `canComplete*` + `advanceStage` throw + `TransitionButtons` disable). **Light overlay — no new stage.**

## Read first
- Phase-8 precedent (mirror it): `baArtifacts.ts` (`uatPassed`, `canCompleteDeployment`, `canEditUat`, `isBaGateMandatory`), `BaDeliveryPanels.tsx` (UAT panel), `projectsStore.ts` (`saveUat`/`signOffUat`, `advanceStage` Deployment gate + `deploymentGateBlockReason`), `ProjectDetailTabs.tsx` (Deployment stage card + `TransitionButtons`), `submitForSponsorApproval` (UAT-passed guard for Tier2/3).
- `deliverySlots.ts` (`dataEngineerId`, `canOperate`-style helpers), `types/index.ts`, `tiering.ts` (`isBaGateMandatory` = Tier2/3 pattern), `notificationRules.ts`, `dashboardStats.ts` + `DashboardPage.tsx` (DE queues from Phase 10), `ciPortalAdapter.ts`, `seedProjects.ts`.

## Step 1 — Data model (`types/index.ts`)
Mirror `UatArtifact`:
- `VerificationCheck = { id: string; description: string; result: 'Pass' | 'Fail' | 'Untested' }`.
- `VerificationArtifact = { checks: VerificationCheck[]; outcome: 'Pass' | 'Fail' | 'Pending'; notes: string; verifiedBy: string | null; verifiedAt: string | null }`.
- `Project.verification: VerificationArtifact | null` (null until Deployment work begins).
Suggested default checks (seeded when the panel initialises): tool/model configured & access-provisioned; model output validated against acceptance criteria; controls implemented (per risk tier); production readiness confirmed. Keep editable.

## Step 2 — Logic (extend `baArtifacts.ts` or new `src/lib/verification.ts` — match the codebase's convention)
- `verificationPassed(project)` = `verification.outcome === 'Pass'` **and** `verifiedBy != null`.
- `canEditVerification(project, user)` = assigned `dataEngineerId` (or Admin); fallback any `DataEngineering` if unassigned (match the delivery-slot fallback).
- `isVerificationMandatory(project)` = Tier2/Tier3 (same rule as `isBaGateMandatory`); Tier1 = optional **self-attest**.
- Extend the Deployment completion gate: **`canCompleteDeployment` now requires BOTH `uatPassed` AND `verificationPassed`** (Tier2/3), or their Tier1 self-attests, unless Admin override. Update `deploymentGateBlockReason` to name whichever is missing (UAT, verification, or both).

## Step 3 — Store actions (`projectsStore.ts`)
Mirror `saveUat`/`signOffUat`, `canEditVerification`-gated, audit + `lastActivityAt`:
- `saveVerification(projectId, { checks, notes }, actor)`.
- `signOffVerification(projectId, actor)` → sets `outcome` from checks (all Pass → `Pass`, any Fail → `Fail`), stamps `verifiedBy`/`verifiedAt`. A **Fail** blocks Deployment completion (points to remediation — now a real DE-owned artifact, closing the DE audit #10 "text pointer only" gap).
- Ensure the **`advanceStage` Deployment→Completed** gate enforces the combined UAT+verification rule in the store (not just UI), with Admin override — mirror the Phase-8 enforcement.
- **`submitForSponsorApproval`** (Tier2/3): already requires `uatPassed`; **also require `verificationPassed`** so a project can't head to closure without DE verification either. Clear message naming what's missing.

## Step 4 — UI
Mirror the BA UAT panel. On the **Deployment stage card** (+ compact Overview summary when `currentStage: Deployment`):
- **Verification panel** (assigned DE / Admin edit; others read-only): editable checks (Pass/Fail/Untested), notes, **Sign off verification** (stamps verifiedBy/at). Tier1 **self-attest** shortcut. A **Fail** is clearly shown and blocks completion with a remediation note.
- The Deployment **Complete** button now shows the combined block reason (UAT and/or verification) via `deploymentGateBlockReason`.
- Place it beside the BA UAT panel so the Deployment card shows both gates (BA UAT + DE verification) — the two-sided handoff is visible in one place.

## Step 5 — Notifications, queues, CI
- **Notifications** (`notificationRules.ts`): `verification-requested` (on entering Deployment → TO assigned DE, complementing `uat-requested` to BA) and `verification-signed-off` (→ TO assigned PM as Deployment owner, CC Governance). Reuse `assignedOrRole` + existing emit points.
- **Queues** (`dashboardStats`/`DashboardPage`): extend the DE callout — "N projects awaiting your verification" (assigned DE + `currentStage: Deployment` + not `verificationPassed`), scoped to the assigned DE, role-wide fallback.
- **CI:** add a **Verification** column (Pass / Fail / Pending / —) beside UAT on `/ci-portal`.

## Step 6 — Seeds
On the Deployment-stage demo project(s): one with verification **Pending** (DE queue demo), one with a **Fail** (blocks completion, shows remediation), and backfill Completed projects with a passed verification record so history is coherent. Ensure at least one Deployment project is assigned to `usr-data` so the DE persona sees the panel + queue.

## Step 7 — Tests
Extend vitest: `verificationPassed` truth table; combined `canCompleteDeployment` (needs both UAT + verification for Tier2/3; Admin override; Tier1 self-attest); `advanceStage` throws on Deployment-Complete without verification for Tier2; `submitForSponsorApproval` blocked without verification for Tier3; verification notifications target assigned DE/PM.

## Step 8 — Verify · Git · report
1. `npm run build` ✅ and `npm run test` ✅.
2. Manually, as **DE (`usr-data`)** on a Tier2/3 Deployment project: the Deployment **Complete** button is blocked until **both** BA UAT passes and DE verification is signed off; complete the checks, sign off, and (with UAT also passed) completion unblocks; a **Fail** re-blocks and shows remediation. As a **non-assigned DE / other role**, read-only. Confirm Tier3 can't be submitted for sponsor approval without verification.
3. `git commit` (message above). **No push.**
4. Write **`docs/refactor1/V3-PHASE-12_REPORT.md`**: data model, verification logic + combined Deployment gate, store actions, UI placement (both gates on the Deployment card), notifications/queues/CI, seeds, tests, anything skipped/flagged. Note this closes DE audit #7/#8/#10 (verification artifact + real remediation surface) and makes the DE↔BA Deployment handoff two-sided.
