# Audit: Development Phase & Tier 1/2/3 Delivery Lanes

Date: 2026-07-13
Scope: Post-Qualification development phase through Completed. Read-only, evidence-cited.
Starting state: after Submission→Review remediation (risk/delivery tier decoupled; project.tier null after qualification).

## Section 1 — Development phase existence & routing
| Item | Status | Evidence (file:line) | Notes |
|---|---|---|---|
| 1.1 Distinct post-qualification development path before Completed | Supported | Stages `src/lib/lifecycle.ts:19-28`, `59-74`; after qualify advances to Policy `src/stores/projectsStore.ts:706-711`; status spine Qualified→…→Active→ForSponsorApproval→Completed `src/lib/projectStatus.ts:128-137` | Qualified projects leave Assessment for Policy / SupplierOversight / Development / Deployment / Use, then closure statuses. Distinct from Review/Qualification UI. |
| 1.2 Routing by delivery tier (`project.tier`) in development | Partial | Stack ownership `src/lib/tiering.ts:44-86`; BA gates `src/lib/baArtifacts.ts:10-56`; verification `src/lib/verification.ts:3-5`; sponsor pre-check `src/stores/projectsStore.ts:1249-1257`; PM review `src/stores/projectsStore.ts:1203-1205`; UI panels on Development/Deployment `src/components/project/ProjectDetailTabs.tsx:456-463` | Same ISO stage sequence for all tiers. Behavior differs by tier (gates, stack owners, project review) — not separate swimlane stage graphs. |
| 1.3 Null `project.tier` entering/progressing development | Divergent (fail-open) | `isBaGateMandatory` / `canCompleteDevelopment` `src/lib/baArtifacts.ts:10-45`; `isVerificationMandatory` `src/lib/verification.ts:3-5`; `canOwnStack` null path `src/lib/tiering.ts:81-84`; `getStackOwnerRoles` default `52-54`; `logProjectReview` rejects non-Tier2/3 `src/stores/projectsStore.ts:1203-1205`; qualify leaves `tier: null` `src/stores/projectsStore.ts:690-691` | Null tier: BA/verification gates **non-mandatory** (same as Tier1 fail-open); submitter may own stack; stage Complete allowed without requirements/UAT/verification. Separate PM `logProjectReview` blocked until Tier2/3. |

## Section 2 — Delivery-tier assignment mechanism
| Item | Status | Evidence (file:line) | Notes |
|---|---|---|---|
| 2.1 Post-qualification delivery-tier assignment action/UI | Missing | Qualify forces `tier: null` `src/stores/projectsStore.ts:690-694`; `QualifyPayload` has no delivery tier `96-104`; no `assignTier` / set-tier store action in `projectsStore` API `130-173` | **Not present.** Seeds for later statuses hard-code `tier` via `assessmentBundle` (`src/data/seedProjects.ts:251-274`); no runtime DE assignment control found. |
| 2.2 `suggestTier` / similar helper wiring | Partial | Risk suggest `suggestTier` `src/lib/qualificationLogic.ts:49-73`, wired as review hint `src/components/project/ProjectQualificationTab.tsx:268-269`; delivery map `suggestProjectTier` `src/lib/qualificationLogic.ts:75-76` | `suggestTier` → **RiskLevel** only (qualification UI). `suggestProjectTier` maps risk→`ProjectTier` via `TIER_BY_RISK` but has **no UI/store call sites** (definition only). Unused for delivery assignment. |
| 2.3 DE auto-tiering; `desiredInvolvement`; Tier-2 disagreement/escalation | Missing | `autoTiered` field always set `false` `src/types/index.ts:303`, `src/stores/projectsStore.ts:368`, `694`; no `desiredInvolvement` in `src/lib/submissionWizard.ts` (grep: none); no disagreement/escalation symbols found | Field `autoTiered` exists but never set true — no DE self-submission auto-tiering. `desiredInvolvement` **Not present**. Tier-2 disagreement/escalation **Not present**. |

## Section 3 — Tier 1 lane
| Item | Status | Evidence (file:line) | Notes |
|---|---|---|---|
| 3.1 Single develop step, no accept/reject before closure | Partial | Tier1: gates non-mandatory `src/lib/baArtifacts.ts:10-45`, `src/lib/verification.ts:3-5`; self-attest UI `src/components/project/BaDeliveryPanels.tsx:244-252`; still walks Policy→…→Development→Deployment→Use then sponsor `src/lib/lifecycle.ts:19-28`, `src/components/project/StatusGateActions.tsx:253-265` | No mandatory Accept/Reject gate for Tier1 (matches diagram intent). Not a single named “develop tool & update entry” step — shared multi-stage lifecycle; optional requirements/UAT/verification panels still appear. |
| 3.2 Annual-review concept for active Tier1 | Missing | Guidance copy only `src/lib/tiering.ts:18-19` (“Schedule an annual review…”) | **Not present** as a workflow, status, or scheduled action — text only. |
| 3.3 Idle / Deactivation linkage for Tier1 | Partial | Aging for Active/Idle `src/lib/aging.ts:21-43`; transitions Active→Idle, Idle→Deactivated `src/lib/projectStatus.ts:134-139` | Idle/Deactivation **exists** and applies to Active projects generally — **not** gated or exclusive to Tier1. |

## Section 4 — Tier 2 lane
| Item | Status | Evidence (file:line) | Notes |
|---|---|---|---|
| 4.1 Elicit requirements for Tier 2 | Partial | `RequirementsPanel` on Development stage `src/components/project/ProjectDetailTabs.tsx:456-457`; confirm `src/stores/projectsStore.ts:1861+`; mandatory when Tier2/3 `src/lib/baArtifacts.ts:10-45` | Requirements elicitation exists and is **mandatory to complete Development** for Tier2/3. Same panel also shown for Tier1 (optional/self-attest) — not a Tier2-only swimlane. |
| 4.2 Exactly one Accept/Reject gate; reject→revise, accept→co-develop | Divergent | Confirm (no Reject outcome) `src/components/project/BaDeliveryPanels.tsx:254-260`; UAT Pass/Fail `289+`, Fail remediates `449-451`; Deployment also needs UAT+verification `src/lib/baArtifacts.ts:52-56` | No formal Accept/Reject decision after elicit. Requirements are confirm-only. UAT Fail can loop via rework, but Deployment adds a **second** mandatory gate (UAT+verification) for Tier2 — not “exactly one” gate then co-develop. |
| 4.3 Co-develop & update distinct from Tier1 develop | Partial | Same Development stage for all tiers `src/lib/lifecycle.ts:59-65`; Tier2 stack owners include BA/PM `src/lib/tiering.ts:48-49` vs Tier1 submitter `46-47` | Differentiation is **role ownership / gate strictness**, not a separate “co-develop” stage or step name. |
| 4.4 PM management + separate project review | Supported | `logProjectReview` Tier2/3 only when Active `src/stores/projectsStore.ts:1192-1205`; UI `src/components/project/ProjectDetailTabs.tsx:239-245`, `403`; guidance `src/lib/tiering.ts:26-28` | Separate project-review note for Active Tier2/3 by PM/Gov/Admin. |

## Section 5 — Tier 3 lane
| Item | Status | Evidence (file:line) | Notes |
|---|---|---|---|
| 5.1 Elicit requirements for Tier 3 | Partial | Same as Tier2: `isBaGateMandatory` includes Tier3 `src/lib/baArtifacts.ts:10-11`; Requirements on Development `src/components/project/ProjectDetailTabs.tsx:456-457` | Present and mandatory for Development Complete; not a Tier3-exclusive elicit step. |
| 5.2 Two Accept/Reject gates (elicit→gate→develop→gate→update) | Divergent | Tier2 and Tier3 share identical BA/verification mandate `src/lib/baArtifacts.ts:10-11`, `src/lib/verification.ts:3-5`; sponsor check same `src/stores/projectsStore.ts:1249-1257` | **No Tier3-only second gate.** Diagram wants two sequential Accept/Reject gates; code uses the same Tier2/3 gate pattern (requirements + UAT/verification), not two distinct Accept/Reject decisions with Tier3-specific structure. |
| 5.3 Develop project + subsequent update entry | Partial | Development then Deployment stages `src/lib/lifecycle.ts:59-74`; panels `src/components/project/ProjectDetailTabs.tsx:456-463` | Stages exist (build then deploy/validate). No labeled “Update Entry” step after a second Accept. |
| 5.4 PM management + separate project review | Supported | Same as 4.4: `logProjectReview` for Tier3 `src/stores/projectsStore.ts:1203-1205`; `TIER_META` Tier3 PM-led `src/lib/tiering.ts:30-36` | |

## Section 6 — Convergence & closure
| Item | Status | Evidence (file:line) | Notes |
|---|---|---|---|
| 6.1 All tiers converge on submit for sponsor approval | Supported | `StatusGateActions` Active → Submit for sponsor approval `src/components/project/StatusGateActions.tsx:253-265`; `submitForSponsorApproval` `src/stores/projectsStore.ts:1236-1298`; Active→ForSponsorApproval `src/lib/projectStatus.ts:134` | Single closure-submit path for Active projects regardless of tier (Tier2/3 add UAT/verification preconditions). |
| 6.2 Sponsor approval → Completed | Supported | `sponsorApprove` sets `Completed` `src/stores/projectsStore.ts:1301-1347`; transition allowed `src/lib/projectStatus.ts:135` | |
| 6.3 Sponsor role/stage mapping | Supported | Role `Sponsor` in `src/types/index.ts:8`; `canSponsorDecide` used in approve `src/stores/projectsStore.ts:1304-1307`; status `ForSponsorApproval` `src/lib/projectStatus.ts:135`; UI Approve/Disapprove `src/components/project/StatusGateActions.tsx:268-279` | Closure approval is a **project status** gate with Sponsor role, not a separate ISO lifecycle stage named Sponsor. |

## Section 7 — Development-phase Update/Cancel
| Item | Status | Evidence (file:line) | Notes |
|---|---|---|---|
| 7.1 Update/Cancel during development (distinct from review cancel) | Missing | Cancel allowed sources: IdeaDraft/NotQualified/ForAssessment (+ Rejected/EHSRejected) `src/lib/projectStatus.ts:124-133`; Active only → ForSponsorApproval \| Idle `134`; Cancel UI on qualification tab only `src/pages/ProjectDetailPage.tsx:263-265` / `ProjectQualificationTab`; no development Update/Cancel control in `StatusGateActions` | **Not present** as a development-phase decision. Review-stage cancel exists; Active/in-development Cancel to Cancelled is not in the transition matrix. |
| 7.2 Cancel→Cancelled; Update→re-enter development | Missing | `cancelProject` `src/stores/projectsStore.ts:811-853`; `reviseAfterDisapproval` is for sponsor **Disapproved** → Active `1393+`, `src/lib/projectStatus.ts:136` | Cancel→Cancelled works only from allowed pre-Active statuses. No general “Update” that re-enters the development lane mid-build. Closest: revise after sponsor disapproval (out of diagram’s develop Update/Cancel). |

## Section 8 — Completion gating vs. tier (current behavior)
| Item | Status | Evidence (file:line) | Notes |
|---|---|---|---|
| 8.1 How Development/Deployment completion is gated by tier | Supported (documented) | `isBaGateMandatory` Tier2\|Tier3 `src/lib/baArtifacts.ts:10-11`; `canCompleteDevelopment` `42-45`; `canCompleteDeployment` needs UAT+verification when mandatory `52-56`; `isVerificationMandatory` `src/lib/verification.ts:3-5`; UI disables Complete `src/components/project/ProjectDetailTabs.tsx:158-165` | Tier1: Complete allowed without BA/verification. Tier2/3: Development Complete needs confirmed requirements; Deployment Complete needs Pass UAT + Pass verification (Admin override). |
| 8.2 Null tier at each completion gate (fail-open) | Supported (documented) | Null → `isBaGateMandatory` false `src/lib/baArtifacts.ts:10-11`; `canCompleteDevelopment`/`Deployment` return true for non-Admin when not mandatory `42-55`; `isVerificationMandatory` false `src/lib/verification.ts:3-5` | **Fail-open:** null tier treated like Tier1 — gates **non-mandatory**; stage Complete not locked. |
| 8.3 Diagram Accept/Reject gates vs code | Partial | Requirements confirm (no Reject) `BaDeliveryPanels.tsx:254-260`; UAT/verification Pass/Fail outcomes `types` `205`, `221`; `logProjectReview` is note-only, not a stage gate `src/stores/projectsStore.ts:1192-1233` | Pass/Fail on UAT/verification loosely resemble Accept/Reject with remediable Fail. No Accept/Reject decision nodes matching the diagram’s elicit→gate→develop structure. `logProjectReview` ≠ gate. |

## Section 9 — Tier numbering vs. diagram (flag only)
| Item | Status | Evidence (file:line) | Notes |
|---|---|---|---|
| 9.1 Current meaning of Tier1/2/3 in code | — (report) | `TIER_META` `src/lib/tiering.ts:13-37`: Tier1 **Self-build**, Tier2 **Collaborative**, Tier3 **Team-led** (PM/team; submitter hands-off); `getStackOwnerRoles` `44-55`; `canOwnStack` Tier1 submitter / Tier3 excludes bare submitter `65-72`; BA/verification heavier on Tier2/3 `baArtifacts.ts:10-11` | Ascending effort: Tier1 lightest → Tier3 heaviest. Residual comment maps tiers 1:1 to risk `src/types/index.ts:50-51` (historical coupling; delivery assignment no longer auto-written from risk). |
| 9.2 Numbering vs diagram ascending-complexity | Supported (match) | Diagram: Tier1 lightest / no gate, Tier3 heaviest / two gates; Code: Tier1 Self-build / non-mandatory gates, Tier3 Team-led / mandatory gates `src/lib/tiering.ts:13-37`, `src/lib/baArtifacts.ts:10-11` | Current code numbering **matches** the diagram’s Tier1=lightest → Tier3=heaviest ordering (not inverted). Prompt’s “believed opposite” belief is **not** what current `TIER_META` / gate logic show. **No fix applied** (flag only). |

## Open Questions / Ambiguities Found
- Whether Policy / SupplierOversight / tool-stack Submitted→Active are “in” the diagram’s development swimlanes or adjacent connectors (C/D) — code has a longer pre-Active spine than the crop’s develop→sponsor sketch.
- Diagram Tier2 “one gate” vs code’s requirements gate **plus** Deployment UAT+verification for the same Tier2/3 mandate — unclear if UAT/verification are meant to be the diagram’s Accept/Reject or separate ISO controls.
- Tier2 vs Tier3 gate **count** in code is identical (`isBaGateMandatory`); only stack-ownership and copy differ — diagram expects an extra Tier3 gate; classification as Divergent assumes diagram text is authoritative.
- No runtime delivery-tier assignment: seed projects past Qualified carry hard-coded `tier`, while newly qualified projects stay null and fail-open — demo vs live-path inconsistency.
- “Annual review” for Tier1 is guidance-only; Idle/Deactivation is global aging, not Tier1-specific — linkage to the diagram note is weak.
- Development-phase Update/Cancel from connector C: **Not present** for Active/in-development; only pre-Active cancel paths remain after the prior remediation.
