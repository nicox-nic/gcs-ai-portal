# V3-PHASE-7 — Dashboard Refresh + Seed Narrative + Polish + Full Verification (1.0)

> **Cursor — read this fully before editing. Final polish/verification pass; Phases 0–6 are merged. No new subsystems — coherence, narrative, cleanup, and verification only.**
> Standing rules:
> - Do **not** regenerate files. **Read each target file first**, then `str_replace`/surgical edits. If a target differs or a change would clobber a fix, **stop and report**.
> - Never `git add -A` blindly — stage intended files, report anything else modified.
> - End at green `npm run build` **and** `npm run test`.
> - **Git — MILESTONE (1.0) → commit AND push to `main`.** After green build+tests **and** the Step 6 verification matrix, `git commit -m "chore(release): V3 1.0 — dashboard, seed narrative, polish, verification [Phase 7]"` then **`git push origin main`** (Vercel deploy — confirm in report). Never force-push.
> - Report to **`docs/refactor1/V3-PHASE-7_REPORT.md`**.

## Scope
Make the whole thing hang together and prove it works end to end: a **dashboard coherence pass**, a **full seed narrative** covering every status, a **polish/cleanup sweep**, a concise **implemented-model doc**, and a **role×status verification matrix**. All timestamps are relative to the `DEMO_TODAY` anchor from Phase 6.

## Read first
- `src/lib/dashboardStats.ts` + `src/pages/DashboardPage.tsx` (grown incrementally across phases — reconcile).
- `src/data/seedProjects.ts` + `src/data/seedRoles.ts` (narrative), `src/lib/projectStatus.ts` (status set for coverage).
- `src/stores/projectsStore.ts` (`applyStatusSideEffects` remaining content; any orphaned `validateBenefits`), the confirm/reason dialog (`AdvanceStageDialog` / `ConfirmDialog` used by `StatusGateActions`).
- Grep the repo for `TODO(V3` and stale references (`validateBenefits`, removed statuses, `/recommendations` links).

---

## Step 1 — Dashboard coherence pass (no redesign)
Reconcile the incrementally-patched dashboard into one coherent V3 view. Keep the existing look; ensure the data is right and the story is complete:
- **KPI row** reads correctly against V3 vocab: total, **Active**, **Completed**, hours saved (`sponsorValidated && reportedBenefitHours`), and the pending queues — **pending qualification** (`ForAssessment`), **pending EHS** (`ForEHSReview`), **awaiting sponsor** (`ForSponsorApproval`), **idle** + **deactivated**. Each queue stat deep-links to the filtered list.
- Add a compact **status pipeline** breakdown (counts across the operational statuses) and a **tier distribution** (Tier1/2/3), since tier is now core. Reuse existing chart components/tokens.
- Keep group/site adoption, top tools, top contributors, recent activity — verify they still compute correctly with the new statuses (e.g. adoption denominators exclude `IdeaDraft`/`NotQualified`/`Cancelled`).
- Verify role-relevant callouts (EHS queue for EHS; qualification queue for Governance/Risk).

## Step 2 — Full seed narrative (`src/data/seedProjects.ts`)
Curate the seed set so the demo tells the complete V3 story and every screen looks populated and believable:
- **Coverage:** at least one project in **each meaningful status** — `IdeaDraft`, `ForAssessment`, `NotQualified`, `Cancelled`, `Qualified`, `QualifiedDraft`, `Submitted`, `Rejected`, `ForEHSReview`, `EHSRejected`, `Active` (across Tier1/2/3), `ForSponsorApproval`, `Disapproved`, `Completed`, `Idle`, `Deactivated`.
- Spread across **groups, sites, tiers, and reward categories**; realistic titles/owners/sponsors; coherent `submission`, `qualification`/`readiness` (for qualified+), `tier`, `toolStack` (for submitted+), `reportedBenefitHours` + `sponsorDecision` (for completed), `intakeMode`, and `activeSince`/`lastActivityAt` relative to `DEMO_TODAY` (keep the Phase-6 aging demo projects).
- Coherent `auditLog` per project (so the Audit tab and Recent Activity read sensibly). Keep the total count reasonable (~18–22 projects). Confirm `seedRoles` has a persona for every acting role (incl. `usr-ehs`, `usr-sponsor`).

## Step 3 — Polish & cleanup sweep
- **ConfirmDialog required-reason fix** (Phase-4/5 nit): for reason-required actions (reject, disapprove, ehsReject, cancel), **validate the reason is non-empty in the dialog before closing** — keep the dialog open with inline validation on empty, close only on success. No more "closes before the toast."
- **Seam audit:** review `applyStatusSideEffects` — confirm only legitimate mappings remain. Decide the `Decommissioning stage Completed → Deactivated` leftover: either keep it as a documented governance-retirement mapping or remove it so the ISO stage stays governance-only (Deactivated then comes only from aging). **Report which and why.**
- **Dead code / TODOs:** resolve or delete remaining `TODO(V3 …)` markers (they should all be addressed by now); remove orphaned `validateBenefits` if unused; confirm no unreachable statuses; confirm `/recommendations` redirect and all nav links resolve; drop unused imports surfaced by the build.
- **Role-gate consistency:** EHS never submits; tier stack-ownership consistent between store and UI; sponsor gating consistent.

## Step 4 — Implemented-model doc (`docs/refactor1/V3_MODEL.md`, new)
A concise capstone reference (for handoff): the 16 statuses + transition graph as built, the two-axis mapping (V3 status ⟷ ISO stages), tiers + risk + stack ownership, the gate roles (qualification / review / EHS / sponsor), aging ladder + demo clock, notification kinds, and the CI-Portal adapter seam. Keep it tight — a map of what exists, not a rewrite of the prompts.

## Step 5 — Tests
Ensure the suite still passes and add coverage for anything touched: dashboard stat selectors against the new seed (pending-queue counts, tier distribution), and the ConfirmDialog required-reason guard if unit-testable.

## Step 6 — End-to-end verification matrix
Walk and record results in the report. **Per role** (`Submitter`, `BusinessAnalyst`, `GovernanceLead`, `RiskCompliance`, `DataEngineering`, `AIProgramManager`, `MaintenanceSustainability`, `Sponsor`, `EHS`, `Admin`): confirm login, dashboard renders, nav is role-appropriate, and each can perform exactly its allowed gate actions (and is blocked from others). **Full lifecycle walk once:** AI-assisted intake → qualify (Governance) → tool selection → submit → approve with EHS → EHS approve → Active → report benefits → sponsor approve → Completed; plus a rejection/revise loop, a cancel, and a demo-clock aging run (Active→Idle→Deactivated→Reactivate) with notifications and CI-mirror reflection. Confirm Admin → Clear All Local Data + Reset clock restore the full seed narrative.

## Step 7 — Git (1.0 milestone) · report
1. `npm run build` ✅ and `npm run test` ✅.
2. `git commit` (message above) → **`git push origin main`** → confirm Vercel deploy.
3. Write **`docs/refactor1/V3-PHASE-7_REPORT.md`**: dashboard changes, final seed coverage table (status → project), the ConfirmDialog fix, the `applyStatusSideEffects`/`Decommissioning` decision, TODO/dead-code cleared, the verification matrix results, push/deploy confirmation, and any residual known issues.
