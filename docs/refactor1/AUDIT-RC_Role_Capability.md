# AUDIT-RC — Risk & Compliance Role Capability Findings

> Read-only audit against the R&C responsibility matrix. **No code changes.**  
> Inspected: qualification gate, readiness/risk-tier UI, `lifecycle.ts` (SupplierOversight / Use / Decommissioning), full `src/` grep for supplier/vendor/SAQ, notifications, dashboard callouts, Profile, `Project` types.  
> Date: 2026-07-09 · codebase post–Phase 8.  
> Compared to: BA (Phase 8 owned+gated), DE/PM (activity-level under-modeled).

## 1. Summary verdict

| RACI tier | Verdict |
|-----------|---------|
| **R Assessment (Qualify / Readiness / Risk tier)** | **Strong.** R&C is in `REVIEWER_ROLES` / `QUALIFY_ROLES`, can complete readiness + qualification + Section D risk tier, Qualify / Not-Qualify, and has a **qualification work-queue callout** deep-linking to `ForAssessment`. |
| **A Supplier Oversight + Vendor AI-SAQ** | **Weak / Missing content.** R&C is correctly `primaryOwnerRole` for SupplierOversight and can advance the stage, but there is **no vendor/SAQ artifact, supplier record, or gate** — only the ISO stage shell (description text mentions AI SAQ). |
| **R Compliance Checks (Use) / Policy Manual** | **Missing** as in-app affordances (Use = stage support only; Policy = org-level / out-of-app). |
| **I / queues beyond qualification** | **Partial.** TO on `submitted-for-assessment`; no supplier/compliance queues or events. Secondary “high-risk” callout exists but means Idle/Blocked, not risk-tier High. |

**vs BA / DE / PM:** R&C is **closer to BA on Assessment** (real gate + queue) than DE/PM are on their activity-level A/R. R&C is **closer to DE/PM on Supplier Oversight** — Accountable in meta, empty in content. The parked **Vendor AI-SAQ is confirmed absent**; that is the decisive R&C-specific gap.

---

## 2. Capability table

| # | R&C responsibility | RACI | Status | Evidence | R&C-reachable? | Notes / gap |
|---|--------------------|------|--------|----------|----------------|-------------|
| 1 | Submit/intake | — | **Missing** (role gate) | `SUBMIT_ROLES` = Submitter / BA / Admin only (`SubmitProjectPage.tsx` L9 et al.) | **No** | Intentional for a governance role. Seeds do **not** use `usr-risk` as `submitterId` (only audit actor) — **no DE/PM-style contradiction** |
| 2 | Qualification (R) | **R** | **Supported** | `REVIEWER_ROLES` includes `RiskCompliance` (`ProjectQualificationTab.tsx` L49); `QUALIFY_ROLES` same (`projectsStore.ts` L74); interactive qualify / NQ / cancel on `ForAssessment` | **Yes** | Expected Supported — confirmed |
| 3 | Readiness Review (R) | **R** | **Supported** | Same tab: Feasibility / Viability / Desirability editable when `canReview` (`ProjectQualificationTab.tsx` L264–267, readiness toggles) | **Yes** | — |
| 4 | Risk & Impact Assessment (R) | **R** | **Partial** | Risk = **Section D** `riskTier` Low/Medium/High + controls blurb (`qualificationCriteria.ts` `RISK_TIER_OPTIONS` L89–110; `QualificationAssessment.riskTier` in `types` L91). Maps to project `tier`. **No** separate risk-assessment form (impact/mitigations/controls artifact) | **Yes** for Section D; **No** fuller Manual “risk assessment form” | Depth gap vs Manual wording |
| 5 | Supplier & Third-Party Oversight (A) | **A** | **Partial** | `primaryOwnerRole: 'RiskCompliance'` (`lifecycle.ts` L50–56); description cites “AI SAQ compliance”; `canActOnStage` true; Overview/Lifecycle transitions when stage current | **Yes** stage advance; **No** supplier content | A without owned artifact — same pattern as DE Development / PM Deployment depth gaps |
| 6 | Vendor AI-SAQ (31Q) | **A/R** | **Missing** | Grep `src/`: **no** SAQ questionnaire, supplier entity, per-project supplier/vendor field, or SAQ gate. Hits are only: `Tool.vendor` (catalog), lifecycle **description** string, seed narrative (“Vendor SLA…”, contracts), training copy mentioning supplier oversight | **No** | **Definitive: no SAQ feature exists today** |
| 7 | Compliance Checks (Use, R) | **R** | **Missing** | Use supporting includes R&C (`lifecycle.ts` L83) → can advance Use stage. **No** compliance checklist, periodic-review action, or compliance status field | **Yes** stage only; **No** compliance surface | Checklist R not modeled |
| 8 | Policy — the Manual (R) | **R** | **Missing** (in-app) | Policy stage: Gov primary, R&C supporting (`lifecycle.ts` L41–47). No policy document / Manual surface in app | **Yes** stage support; **No** Manual artifact | Treat as org-level / out-of-scope for Phase 0 unless product wants an in-app policy link |
| 9 | Support Assessment / Use / Decommissioning | supporting | **Supported** | Assessment supporting L38; Use L83; Decommissioning L101. Stage actions when current | **Yes** | Assessment *qualification* is stronger than supporting (see #2) — dual path |
| 10 | Qualification work queue | (workflow) | **Supported** | `RiskCompliance` + `pendingQualification` callout (`DashboardPage.tsx` L87–91) → `/projects?status=ForAssessment` (L150–152). KPI queue row also lists ForAssessment | **Yes** | Less acute systemic gap than DE/PM — R&C already has this |
| 11 | Supplier / compliance work queue | (workflow) | **Missing** | No callout for `currentStage: SupplierOversight` or compliance-due. Secondary R&C callout = `highRiskProjects` = Idle **or** any stage Blocked (`dashboardStats.ts` L246–250) — **not** risk-tier High | **No** for SAQ/compliance; **misleading** “high-risk” label | Rename or retarget if kept |
| 12 | Named R&C assignment | (org) | **Missing** | No `riskComplianceId` on `Project` (only `businessAnalystId`). CI has no R&C column | **N/A** | **Role-wide governance function** is a reasonable model (unlike BA lead-builder); assignment less critical than for BA/DE/PM |
| 13 | Notifications targeted to R&C | I | **Partial** | TO: `submitted-for-assessment` → `govRisk` (`notificationRules.ts` L20, L29–30). `qualified` / `not-qualified` → TO submitter, CC **Gov only** (L31–33) — **R&C not CC’d**. No supplier/compliance kinds | **Yes** for new assessments; **weak** after decision | Role-wide TO is appropriate if no named assignment |
| 14 | General visibility | — | **Supported** | Full nav except Admin/Submit; detail / Audit / CI / notifications open | **Yes** | — |

---

## 3. Gaps & recommendations (Partial / Missing only)

### Systemic (shared trio — less acute for R&C)

| Item | Gap | Fix type | Note |
|------|-----|----------|------|
| **#12 Named R&C** | No per-project assignee | Optional **data-model** | Prefer **role-wide** access unless multi-R&C staffing needs assignment |
| **#11 Queues** | No SupplierOversight / compliance queue | **Feature** | Qualification queue (#10) already works; add supplier queue **if** SAQ ships |
| **#13 Notifications** | Not CC on qualify decisions; no supplier events | **Role-gate** | CC R&C on qualified/NQ; emit SAQ events if built |

### R&C-specific

| Item | Gap | Fix type |
|------|-----|----------|
| **#4 Risk & Impact depth** | Section D tier only vs Manual “risk assessment form” | **Feature** (light) — impact/mitigation notes + controls checklist, or accept Section D as demo stand-in |
| **#5–6 Supplier A + Vendor AI-SAQ** | Stage shell only; **zero** SAQ implementation | **Feature** — see §4 |
| **#7 Compliance Checks** | No Use-phase compliance affordance | **Feature** — periodic compliance checklist R&C owns on Active/Use |
| **#8 Policy Manual** | No in-app Manual | **Out-of-scope** or link-out — don’t over-weight |
| **#11 highRisk callout** | Counts Idle/Blocked, not Tier3/High | **Fix** — rename or filter by `tier === 'Tier3'` / `riskTier === 'High'` |

**Not gaps:** #2 Qualification, #3 Readiness, #9 supporting stages, #10 qualification queue, #14 visibility. #1 submit exclusion looks intentional.

---

## 4. Vendor SAQ verdict

### Does any SAQ / supplier assessment feature exist today?

**No.** Confirmed by repo-wide search:

| What exists | What does **not** exist |
|-------------|-------------------------|
| ISO stage `SupplierOversight` with R&C as primary | Supplier / vendor **entity** or `Project.supplierId` |
| Lifecycle description mentioning “AI SAQ” | 31-question SAQ form / store / UI |
| Catalog `Tool.vendor` (Microsoft, etc.) | Per-project SAQ artifact or completion gate |
| Narrative seed titles (“Vendor SLA…”) | SAQ status on CI mirror |

### If building it (enough to decide build vs defer)

| Concern | Suggested shape (not implementing) |
|---------|-------------------------------------|
| **Model** | Optional `suppliers[]` or single `vendorAssessment` on `Project`; `SaqArtifact` = answers to 9 sections / 31 items + `completedBy` / `completedAt` / outcome Pass|Fail|Waived |
| **Ownership** | R&C edits/signs (Admin override); PM/DE supporting view |
| **UI** | Panel on SupplierOversight stage (Lifecycle + Overview), pattern = Phase-8 BA Requirements/UAT |
| **Gate** | Hard-gate SupplierOversight → Completed until SAQ Pass/Waived for projects that use external AI vendors (Tier2/3 or flag “uses third-party AI”); Tier1 / internal-only exempt |
| **Queue / notify** | Dashboard: “N projects need SAQ”; TO R&C on enter SupplierOversight; CI column SAQ status |
| **Effort** | Medium — larger than BA Requirements (31Q), similar pattern to Phase 8 |

**Recommendation for product:**  
- **Build** if Supplier Oversight must be demoable as R&C’s signature A (today the stage is empty theater).  
- **Keep deferred** if Assessment qualification is the Phase-0 R&C story and SAQ is a later compliance module — but then **soften** the lifecycle description so it doesn’t claim AI SAQ compliance that isn’t in the app.

---

## 5. Open questions

1. **Is Section D risk tier enough** to stand in for the Manual’s “risk assessment form,” or is a separate impact/mitigation artifact required?
2. **SAQ scope:** Every project with SupplierOversight, or only when `toolStack` / submission flags third-party AI?
3. **Named R&C vs role-wide:** Single `usr-risk` persona makes role-wide correct — change only if multiple R&C users appear?
4. **`highRiskProjects` callout:** Keep as Idle/Blocked attention, or retarget to High risk-tier / Tier3?
5. **Policy Manual:** Link to external GCS AI Governance Manual from Policy stage, or leave out-of-app entirely?
6. **RACI-vs-code:** Assessment primary owner is GovernanceLead, but R&C shares the qualify gate equally — is that the intended A/R split (Gov A, R&C R)?

---

*End of audit. No implementation performed.*
