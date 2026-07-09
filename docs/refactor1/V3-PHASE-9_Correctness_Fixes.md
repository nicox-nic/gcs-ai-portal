# V3-PHASE-9 — Correctness Fixes (no new features)

> **Cursor — read this fully before editing. Surgical fix pass; Phases 0–8 are merged (1.0 + BA involvement live).**
> Standing rules:
> - Do **not** regenerate files. **Read each target file first**, then `str_replace`/surgical edits. If a target differs from what's described or a change would clobber a fix, **stop and report**.
> - Never `git add -A` blindly — stage intended files, report anything else modified.
> - End at green `npm run build` **and** `npm run test`.
> - **Git — commit, DO NOT push.** After green build+tests, `git commit -m "fix(roles): submit gate, supplier-oversight copy, high-risk metric, M&S aging + EHS/Sponsor polish [Phase 9]"`. **No push** — this is the first of a remediation sequence (Phases 9–13); Cursor pushes once at the end. Never force-push.
> - Report to **`docs/refactor1/V3-PHASE-9_REPORT.md`**.

## Scope
Six discrete correctness fixes surfaced by the role audits (BA/DE/PM/R&C/GL/M&S + remaining). **No new subsystems, no new artifacts, no data-model growth** beyond the tiny metric/role-gate touches below. Each fix is independent — if any one conflicts with current code, fix the others and report the conflict.

## Read first
- `types/index.ts` (`Role`), and the `SUBMIT_ROLES` definition — the audit found it in **six** places: `SubmitProjectPage.tsx`, `ManualSubmitPage.tsx`, `AssistedIntakePage.tsx`, `ProjectsListPage.tsx`, `DashboardPage.tsx`, `Sidebar.tsx`.
- `lifecycle.ts` (SupplierOversight stage `description`), `dashboardStats.ts` (`highRiskProjects`), `DashboardPage.tsx` (the callout using it).
- `projectsStore.ts` (`reactivateProject` roles, `EHS_ACTION_ROLES`, `sponsorApprove`/`sponsorDisapprove`), `StatusGateActions.tsx` (reactivate + EHS gating), `notificationRules.ts` (`recipientsFor` — aging kinds, `completed`/`disapproved`).
- `aging.ts` / `demoClockStore` only as needed to confirm aging flow (do not change the ladder).

---

## Fix 1 — Submit-gate contradiction (expand roles)
Add `DataEngineering`, `AIProgramManager`, `MaintenanceSustainability` to `SUBMIT_ROLES` in **all six** locations (they already appear as `submitterId` in seeds — this removes the seed-vs-gate contradiction). **Best practice:** if `SUBMIT_ROLES` is duplicated as six literals, **hoist it to one shared constant** (e.g. `src/lib/roles.ts`) and import it everywhere, so it can't drift again — but only if that's a clean refactor; if risky, update all six in place and note it. Do **not** add Sponsor/EHS/GL/R&C (no seed uses them as submitter; they're intentional non-submitters).

## Fix 2 — SupplierOversight description honesty
The SupplierOversight stage `description` in `lifecycle.ts` currently claims **AI SAQ compliance** that isn't implemented. Soften it so it no longer asserts a feature that doesn't exist (e.g. describe supplier/third-party oversight as a governance responsibility without claiming an in-app SAQ). One-string change. (The real SAQ arrives in Phase 13.)

## Fix 3 — `highRiskProjects` mislabel
`dashboardStats.highRiskProjects` counts `Idle`/`Blocked`, but it's surfaced as "high risk." Fix the **meaning to match the label**: count projects whose **risk tier is High** (`tier === 'Tier3'` / `riskTier === 'High'`). If the existing Idle/Blocked count is still wanted as an "attention" stat, keep it under an accurately-named field (e.g. `needsAttention`) rather than deleting it — report what you chose. Update the `DashboardPage` callout wording to match.

## Fix 4 — Wire M&S into the aging / idle machinery (highest-ROI ops fix)
M&S is Accountable for AI Use (live operations) but is excluded from the only "keep live projects healthy" system. Without adding new artifacts:
- Add `MaintenanceSustainability` to the **`reactivateProject`** allowed roles (so M&S can reactivate Idle/Deactivated projects) and to the reactivate affordance in `StatusGateActions`.
- Add `MaintenanceSustainability` to the **idle/deactivated dashboard callout** audience (currently Gov/PM/Admin) so M&S sees idle attention.
- Add `MaintenanceSustainability` to the **aging notification recipients** in `recipientsFor` (`aging-reminder`/`idle`/`alert`/`deactivated`/`reactivated`) — role-wide TO/CC as appropriate — so the Use owner is informed when live projects age. (Named M&S ownership + targeting comes in Phase 10; this is the role-wide wiring now.)

## Fix 5 — EHS act restricted to assigned coordinator
Mirror the Sponsor pattern: when `ehsCoordinatorId` is set, restrict `ehsApprove`/`ehsReject` (store `EHS_ACTION_ROLES` path + `StatusGateActions` `canEhs`) to **that coordinator** (or Admin); if unset, any EHS may act (demo fallback). Match how `canSponsorDecide` handles assigned-vs-fallback.

## Fix 6 — Sponsor TO on closure outcome
In `recipientsFor`, make the assigned Sponsor a **TO** (not only CC) on `completed` and `disapproved` (keep the owners on the line too). Small recipients tweak.

---

## Step 7 — Tests
- Update any test asserting `SUBMIT_ROLES` membership or `highRiskProjects` semantics.
- Add: DE/PM/M&S are permitted to submit; `highRiskProjects` counts Tier3; M&S may `reactivateProject`; EHS act blocked for a non-assigned EHS when a coordinator is set (allowed for the assigned one / Admin).

## Step 8 — Verify · Git · report
1. `npm run build` ✅ and `npm run test` ✅.
2. Manually: log in as **DataEngineering** → Submit Project is reachable; **M&S** → can reactivate an Idle project and sees the idle callout + aging notifications; SupplierOversight stage copy no longer claims SAQ; the dashboard "high risk" stat reflects Tier3; a non-assigned EHS cannot approve when a coordinator is set.
3. `git add` intended files → `git commit` (message above). **No push.**
4. Write **`docs/refactor1/V3-PHASE-9_REPORT.md`**: each fix, files touched, whether `SUBMIT_ROLES` was hoisted or updated in place, what happened to the old Idle/Blocked count, tests updated, anything skipped/flagged. Note this clears the correctness items ahead of the Phase-10 delivery-role slot.
