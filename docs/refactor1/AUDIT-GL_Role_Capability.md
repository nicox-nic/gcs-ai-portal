# AUDIT-GL — Governance Lead Role Capability Findings

> Read-only audit against the GL responsibility matrix. **No code changes.**  
> Inspected: `lifecycle.ts` (Assessment/Policy/Improvement/Decommissioning), qualification + 2nd-review + assign + project-review gates, Decommissioning→Deactivated side-effect, dashboard callouts, notifications, Profile, `Project` types.  
> Date: 2026-07-09 · codebase post–Phase 8.  
> Compared to: BA (owned+gated), DE/PM (activity under-modeled), R&C (Assessment strong / Supplier empty; role-wide).

## 1. Summary verdict

| RACI tier | Verdict |
|-----------|---------|
| **A / R operational gates** | **Strongest role in the app.** GL owns Assessment (primary), shares qualification with R&C, shares 2nd-review with PM, assigns BA/EHS, logs Tier2/3 project reviews, cancels, and has qualification + idle queues plus broad notification CC/TO coverage. |
| **A late-lifecycle / Policy** | **Stage-only shells.** Policy, Improvement, and Decommissioning are GL-primary in `lifecycle.ts`, but there is **no** Manual/CAPA/retirement artifact — only stage advance. Decommissioning Complete → `Deactivated` is the one real retirement side-effect. |
| **I / oversight** | **Strong.** Portfolio dashboard (queues, pipeline, tiers), all-projects visibility, heavy notify presence. |
| **Systemic trio** | **Skip named `governanceLeadId`** — GL is a **role-wide governance function** (same conclusion as R&C). Queues/notifications for GL are already largely adequate. |

**Is GL the most first-class role?** **Yes on operational governance.** Its only material gaps are the **accountable-but-empty** Policy / Improvement / Decommissioning stages (and intentional non-act on DE/PM/R&C-owned stages).

---

## 2. Capability table

| # | GL responsibility | RACI | Status | Evidence | GL-reachable? | Notes / gap |
|---|-------------------|------|--------|----------|---------------|-------------|
| 1 | Submit/intake | — | **Missing** (role gate) | `SUBMIT_ROLES` = Submitter / BA / Admin (`SubmitProjectPage.tsx` L9 et al.) | **No** | Intentional. Seeds never use `usr-govlead` as `submitterId` (audit actor only) — **no contradiction** |
| 2 | Own & advance Assessment (A) | **A** | **Supported** | `primaryOwnerRole: 'GovernanceLead'` (`lifecycle.ts` L32–38); `canActOnStage` L124–128; Overview/Lifecycle transitions | **Yes** | Paired with qualification gate (#3) |
| 3 | Qualification decision | **A** | **Supported** | `REVIEWER_ROLES` / `QUALIFY_ROLES` include GL (`ProjectQualificationTab.tsx` L49; `projectsStore.ts` L74); Qualify / NQ / Cancel on `ForAssessment` | **Yes** | Shared equally with R&C (Gov A / R&C R in docs; code treats both as full reviewers) |
| 4 | 2nd-review approve / reject | (ops) | **Supported** | `SUBMISSION_REVIEW_ROLES` includes GL (`projectsStore.ts` L76–79); `StatusGateActions` `REVIEW_ROLES` L23 | **Yes** on `Submitted` | Shared with PM |
| 5 | Assign BA / EHS | (ops) | **Supported** | `canAssignBusinessAnalyst` includes GL (`baArtifacts.ts` L35–41); `EHS_ASSIGN_ROLES` includes GL (`projectsStore.ts` L81); header BA Select + approve-dialog EHS picker | **Yes** | — |
| 6 | `logProjectReview` (Tier2/3) | (Phase 5) | **Supported** | `PROJECT_REVIEW_ROLES` includes GL (`projectsStore.ts` L83–85); Overview `canLogReview` (`ProjectDetailTabs.tsx` L228–234) | **Yes** on Active Tier2/3 | Shared with PM |
| 7 | Own AI Policy (A) | **A** | **Partial** | GL primary for Policy (`lifecycle.ts` L41–47). **No** Manual / policy document surface in app | **Yes** stage advance; **No** policy artifact | Out-of-app / don’t over-weight (same as R&C #8) |
| 8 | Own AI Improvement (A) | **A** | **Partial** | GL primary (`lifecycle.ts` L86–92). Seed `prj-008` sits in Improvement with narrative audit only. **No** CAPA / change-request / CI affordance | **Yes** stage; **No** improvement artifact | Accountable-but-empty |
| 9 | Own AI Decommissioning (A) | **A** | **Partial** | GL primary (`lifecycle.ts` L95–101). Completing Decommissioning sets `status: 'Deactivated'` (`applyStatusSideEffects` `projectsStore.ts` L205–218) — real retirement mapping. **No** EOL checklist / data-disposal record | **Yes** stage → Deactivated; **No** retirement form | Stronger than empty shell because of status side-effect; still no owned artifact. Aging can also Deactivate independently |
| 10 | Governance oversight / portfolio | (oversight) | **Supported** | Qualification callout (`DashboardPage.tsx` L71–75 → ForAssessment); idle callout L124–132; KPI queues; status pipeline + tier distribution (`dashboardStats` / Dashboard). Projects list unfiltered by role | **Yes** | Adequate for Phase 0; no dedicated “governance health” view beyond existing charts |
| 11 | Support / act across lifecycle | A/oversight | **Partial** | GL **can** act: Assessment, Policy, Improvement, Decommissioning (primary). GL **cannot** `canActOnStage` on SupplierOversight, Development, Deployment, Use, Enablement (not primary/supporting). Can still **view** all stages/tabs | **View yes; act only on owned stages** | Framework A is stage-scoped — denying act on DE/PM/R&C stages is consistent. Oversight = view + gates (#3–6), not universal stage act |
| 12 | Named GL assignment | (org) | **Missing** (and **unwarranted**) | No `governanceLeadId` on `Project` | **N/A** | **Recommendation: do not add.** GL is a **role-wide governance function** (like R&C), not a per-project delivery lead (unlike BA). Role-wide qualify/review/notify is the right model |
| 13 | Notifications targeted to GL | I | **Supported** | TO: `submitted-for-assessment` (`govRisk`), `submitted-for-review` (`pmGov`). CC: qualified/NQ, approve/reject, project-review, aging, BA req/UAT events (`notificationRules.ts` L20–77). Default CC gov | **Yes** role-wide | Appropriate without named assignment. Optional gap: not TO on sponsor completed/disapproved (CC via owners path varies) |
| 14 | General visibility | — | **Supported** | Full nav except Admin/Submit; detail / Audit / CI / notifications | **Yes** | — |

---

## 3. Gaps & recommendations (Partial / Missing only)

### Systemic trio — **skip for GL** (oversight-role pattern)

| Item | Recommendation |
|------|----------------|
| Named `governanceLeadId` | **Do not build** — role-wide function (same as R&C) |
| Work queue | **Already covered** (qualification + idle). Optional later: Submitted-awaiting-review shared with PM |
| Notifications | **Already strong** role-wide; no assigned-lead targeting needed |

### GL-specific (accountable-but-empty stages)

| Item | Gap | Fix type |
|------|-----|----------|
| **#7 Policy** | Stage shell; no Manual | **Out-of-scope** or external link from Policy stage |
| **#8 Improvement** | No CAPA / change-management artifact | **Feature** (light) if Improvement must be demoable beyond stage advance |
| **#9 Decommissioning** | Side-effect to Deactivated exists; no EOL checklist | **Feature** (light) — retirement checklist before Complete, or accept side-effect as enough |
| **#11** | Cannot advance Development/Deployment/etc. | **By design** unless product wants Admin-like oversight act |

**Not gaps:** #2–6 gates, #10 portfolio, #13–14 visibility/notify, #1 submit exclusion.

---

## 4. Cross-role note (BA / DE / PM / R&C / GL)

With all five audits done, gaps cluster three ways:

1. **Delivery-role systemic** (named slot → owned work → queue → notify → CI): applies to **BA** (done Phase 8), and still open for **DE** / **PM** (`dataEngineerId` / `programManagerId`, build/verify/remediate or review/deploy queues).  
2. **Oversight-role** (role-wide, **no** named assignment): **R&C** and **GL** — qualification/review gates + queues/notifications are the right shape; don’t force BA-style assignment.  
3. **Accountable-but-empty stages:** Development (DE), Deployment activities (PM/DE), SupplierOversight/SAQ (R&C), Improvement/Decommissioning/Policy (GL) — meta says A, UI is mostly stage advance (BA Requirements/UAT is the exception that proves the pattern).

---

## 5. Open questions

1. **Checklist “GL = A everywhere” vs framework stage A:** Code follows **framework stage accountability** (DE Development, PM Deployment, R&C Supplier). Is that the intended product reading?
2. **Qualify A/R split:** Docs often cast GL as A and R&C as R; code gives both full `REVIEWER_ROLES` — keep parity or reserve Qualify button for GL only?
3. **Improvement / Decommissioning:** Worth Phase-next CAPA/EOL overlays, or leave as stage shells now that Deactivated mapping exists?
4. **Submitted-review queue for GL:** GL can approve/reject but has no “N Submitted awaiting review” callout (PM gap too) — shared queue or PM-only?
5. **Policy Manual:** Link-out from Policy stage enough for governance demo?

---

*End of audit. No implementation performed.*
