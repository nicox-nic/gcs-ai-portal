# V3-PHASE-9 Report — Correctness Fixes

> Executed from `docs/refactor1/V3-PHASE-9_Correctness_Fixes.md`.  
> Verification: `npm run build` ✅ · `npm run test` ✅  
> Git: **committed, not pushed** (remediation sequence 9–13; push once at end).

## Fixes

| # | Fix | What changed |
|---|-----|--------------|
| 1 | Submit-gate contradiction | Hoisted `SUBMIT_ROLES` to `src/lib/roles.ts`; added DE / PM / M&S. All six call sites import the shared constant (pages + Sidebar). Sponsor / EHS / GL / R&C remain excluded. |
| 2 | SupplierOversight copy | Softened `lifecycle.ts` description — no longer claims in-app AI SAQ. |
| 3 | `highRiskProjects` mislabel | Now counts `tier === 'Tier3'`. Old Idle/Blocked count kept as **`needsAttention`**. R&C callout text: “Tier 3 (high-risk) projects:”. |
| 4 | M&S aging / idle | `reactivateProject` + `StatusGateActions` allow M&S; idle dashboard callout includes M&S; aging + `reactivated` notify TO includes all M&S users. |
| 5 | EHS assigned-only act | `canEhsDecide` / `canEhsAct` mirror Sponsor: assigned coordinator (or Admin) when set; any EHS if unset. |
| 6 | Sponsor TO on closure | `completed` / `disapproved`: Sponsor on **TO** with owners; Gov on CC. |

## Files touched

- **New:** `src/lib/roles.ts`, `src/lib/roles.test.ts`, `src/lib/notificationRules.test.ts`, `docs/refactor1/V3-PHASE-9_REPORT.md`
- **Edited:** `lifecycle.ts`, `dashboardStats.ts` (+ test), `notificationRules.ts`, `projectsStore.ts` (+ test), `StatusGateActions.tsx`, `DashboardPage.tsx`, `SubmitProjectPage.tsx`, `ManualSubmitPage.tsx`, `AssistedIntakePage.tsx`, `ProjectsListPage.tsx`, `Sidebar.tsx`

## Notes

- **`SUBMIT_ROLES` was hoisted** (not six in-place edits).
- **`needsAttention`** is computed and returned from `computeDashboardStats` but not yet surfaced in a separate dashboard callout (idle callout already covers Idle). Available for Phase 10+ if needed.
- Tier3 R&C callout deep-links to `/projects` (no tier URL filter exists; avoided inventing one).
- Nothing skipped.

## Ahead

Clears audit correctness items before Phase 10 delivery-role named slots.
