# V3-PHASE-13 — Vendor AI-SAQ + Remediation Verification + Push

> **Cursor — read this fully before editing. Final remediation phase; Phases 0–12 merged. This phase also PUSHES the whole 9–13 sequence.**
> Standing rules:
> - Do **not** regenerate files. **Read each target file first**, then `str_replace`/surgical edits. If a target differs or a change would clobber a fix, **stop and report**.
> - Never `git add -A` blindly — stage intended files, report anything else modified.
> - End at green `npm run build` **and** `npm run test`.
> - **Git — this is the SINGLE PUSH for the remediation.** After green build+tests **and** the Step 8 verification, `git commit -m "feat(supplier): Vendor AI-SAQ for R&C + remediation verification [Phase 13]"`, then **`git push origin main`** — this deploys Phases **9–13** together (confirm the Vercel deploy in the report). Also stage/commit the untracked `docs/refactor1/AUDIT-*.md` audit files so the audit trail lives in the repo. Never force-push.
> - Report to **`docs/refactor1/V3-PHASE-13_REPORT.md`**.

## Scope
Two parts:
- **A. Vendor AI-SAQ** — give **Risk & Compliance** an owned, gated artifact on **Supplier & Third-Party Oversight** (the 31-question supplier self-assessment), **scoped to projects that use external/third-party AI vendors** (per decision). Restores the honest SAQ story the Phase-9 copy fix deferred.
- **B. Remediation verification** — a role×capability re-check confirming Phases 9–12 closed what the audits found, then the single deploy.

## Read first
- Phase-8/12 gate precedent (mirror it): `baArtifacts.ts` / `verification.ts` (artifact + `canComplete*` + `advanceStage` gate + block reason), `BaDeliveryPanels.tsx` / `VerificationPanel`.
- `AI_Checklists.xlsx` **Vendor SAQ** sheet — **9 sections / 31 questions** (the authoritative content). If the workbook isn't accessible in-repo, use the section structure below and note that the exact question text should be confirmed against the sheet.
- `lifecycle.ts` (SupplierOversight stage — R&C primary; the Phase-9 softened description to restore), `projectsStore.ts` (`advanceStage`, action pattern), `types/index.ts`, `tiering.ts`, `deliverySlots.ts` (R&C is oversight/role-wide — **no named assignment**), `notificationRules.ts`, `dashboardStats.ts` + `DashboardPage.tsx` (R&C qualification callout), `ciPortalAdapter.ts`, `ProjectDetailTabs.tsx` (SupplierOversight stage card), `seedProjects.ts`.

---

## Part A — Vendor AI-SAQ

### A1 — "Uses third-party AI" scoping
The SAQ applies only to projects using an external AI vendor. Determine the flag with least churn:
- Prefer an explicit `Project.usesExternalVendor: boolean` (settable at qualification by R&C/Gov), **defaulted by a heuristic** if cheap (e.g. tool stack contains a third-party/vendor tool via `Tool.vendor`, vs internal-only). If a clean heuristic exists, seed the flag from it but keep it editable.
- `isSaqRequired(project)` = `usesExternalVendor === true`. Internal-only projects are **exempt** (no SAQ, stage completes without it).

### A2 — Data model (`types/index.ts`)
- `SaqAnswer = { id: string; section: string; question: string; response: 'Yes' | 'No' | 'NA'; note: string }`.
- `SaqArtifact = { answers: SaqAnswer[]; outcome: 'Pass' | 'Fail' | 'Waived' | 'Pending'; notes: string; completedBy: string | null; completedAt: string | null }`.
- `Project.vendorSaq: SaqArtifact | null` and `Project.usesExternalVendor: boolean`.

### A3 — SAQ content (`src/lib/vendorSaq.ts`, new)
Encode the **9 sections / 31 questions** from the workbook's Vendor SAQ sheet (confirm text against the sheet). Provide `emptySaq()` seeding the 31 questions grouped by section. Logic:
- `canEditSaq(project, user)` = `RiskCompliance` or Admin (**role-wide — R&C is an oversight function, no named assignment**, consistent with the R&C/GL audit conclusion).
- `saqComplete(project)` = every applicable question answered (`NA` allowed) **and** `outcome ∈ {Pass, Waived}` **and** `completedBy != null`.
- Outcome: R&C sets `Pass` / `Fail` / `Waived` (Waived = accepted risk with justification note). `Fail` blocks stage completion.

### A4 — Gate (`projectsStore.ts` + `lifecycle.ts`)
- Store actions (R&C/Admin-gated, audit + `lastActivityAt`): `setUsesExternalVendor`, `saveSaq`, `completeSaq` (stamps `completedBy`/`completedAt`, sets outcome).
- **Gate SupplierOversight → Completed:** if `isSaqRequired` and not `saqComplete` → block (both `TransitionButtons` disable + `advanceStage` throw), Admin override. Internal-only projects (`usesExternalVendor === false`) complete freely. Add a `supplierGateBlockReason`.
- **Restore honesty:** update the SupplierOversight `description` (softened in Phase 9) to accurately describe the now-implemented SAQ.

### A5 — UI
Mirror the gate panels. On the **SupplierOversight stage card** (+ compact Overview when `currentStage: SupplierOversight`):
- A **"Uses third-party AI vendor"** toggle (R&C/Gov), and when true, the **Vendor AI-SAQ panel**: the 31 questions grouped by 9 sections (Yes/No/NA + note), overall notes, and **Complete SAQ** (Pass / Fail / Waive-with-justification). R&C/Admin edit; others read-only. Internal-only → a clear "SAQ not required (internal-only)" state.

### A6 — Queue, notifications, CI, seeds
- **Queue:** R&C dashboard callout "N projects awaiting Vendor SAQ" (`currentStage: SupplierOversight` + `isSaqRequired` + not complete) — role-wide (no assignment). Deep-link filtered.
- **Notifications:** `saq-requested` (entering SupplierOversight with `usesExternalVendor` → TO R&C, role-wide) and `saq-completed` (→ CC Governance/PM).
- **CI:** add a **Supplier SAQ** column (Pass / Fail / Waived / Pending / N-A) on `/ci-portal`.
- **Seeds:** one project `usesExternalVendor: true` sitting in/near SupplierOversight with SAQ **Pending** (R&C demo), one **Waived**, and internal-only projects showing the exempt state; backfill Completed vendor projects with a passed SAQ.

## Part B — Remediation verification

### B1 — Re-check the audit gaps
Produce a short **closure matrix** in the report: for each gap the audits flagged (BA done in P8; the P9–P13 items), state **Closed / Partial / Deferred** with the implementing phase. Confirm specifically:
- Submit gate (DE/PM/M&S) — closed (P9).
- SupplierOversight copy — honest again (P13 restores).
- `highRiskProjects` — Tier3 (P9).
- M&S aging wiring (P9) + Use overlay (P11).
- Delivery slots DE/PM/M&S (P10).
- DE verification gate (P12).
- EHS assigned-only / Sponsor TO (P9).
- Oversight roles (R&C/GL) — confirm **no named assignment added** (correct).
- Enablement roles — confirm **untouched / out-of-scope** (correct).

### B2 — Deploy-readiness sweep
- No remaining `TODO(V3` that should be resolved; no dead code from the remediation; all nav/queues/filters resolve.
- **Reseed note:** confirm Admin → Clear All Local Data reseeds cleanly with all new fields (verification, operations, vendorSaq, delivery-slot ids) — call out that a live reset is needed post-deploy so persisted pre-remediation projects pick up new fields.

## Step 8 — Verify · Git (single push) · report
1. `npm run build` ✅ and `npm run test` ✅.
2. Manually: as **R&C**, on a third-party-vendor project in SupplierOversight, the stage **Complete** is blocked until the SAQ is completed (Pass/Waived); an internal-only project completes without an SAQ; the SAQ appears on the CI mirror and the R&C queue. Spot-check one action per remediated role (DE submit, PM review queue, M&S incident, DE verification, Sponsor/EHS gates).
3. Stage intended files **+ the `docs/refactor1/AUDIT-*.md`** → `git commit` (message above) → **`git push origin main`** → confirm Vercel deploy of Phases 9–13.
4. Write **`docs/refactor1/V3-PHASE-13_REPORT.md`**: SAQ model/content/gate/scoping, the B1 closure matrix, deploy-readiness sweep, push/deploy confirmation, anything skipped/flagged. Note the remediation sequence (9–13) is complete and deployed.
