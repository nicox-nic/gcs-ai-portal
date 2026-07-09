# AUDIT-REMAINING — Sponsor, EHS & Enablement-side roles

> Read-only audit. **No code changes.**  
> Confirms Sponsor / EHS as built; assesses Enablement-framework roles; synthesises coverage across all `Role` values.  
> Date: 2026-07-09 · codebase post–Phase 8 (`c9ff0fa` / `e6486b5`).  
> Inputs: this inspection + `AUDIT-{BA,DE,PM,RC,GL,MS}_Role_Capability.md` (BA file is pre–Phase 8; **BA status below uses Phase 8 report**).

---

## 1. Sponsor — confirmation

| # | Check | Result | Evidence |
|---|--------|--------|----------|
| 1 | Gated into `sponsorApprove` / `sponsorDisapprove`; reachable on `ForSponsorApproval` | **Yes** | UI: `canSponsor` → `StatusGateActions.tsx` L87, buttons L259–272; store: `sponsorApprove` L1154–1160 via `canSponsorDecide` |
| 2 | Assigned `sponsorId` vs role-wide | **Prefer assigned** | `canSponsorAct` L50–55 and `canSponsorDecide` L251–258: Admin always; if `sponsorId` set → only that Sponsor; if blank → any Sponsor (demo fallback). Seeds: almost all `usr-sponsor`; `prj-058` / `prj-068` have `sponsorId: null` |
| 3 | Work queue + deep-link | **Yes** | `RoleCallout` Sponsor + `awaitingValidation` (`DashboardPage.tsx` L95–102 → `/projects?status=ForSponsorApproval` L157–158). Count is **global** `ForSponsorApproval`, not filtered to `currentUser.id` (`dashboardStats.ts` L224) — fine with one seed Sponsor |
| 4 | Notifications | **Partial** | TO on `sponsor-approval-requested` = assigned + all Sponsors (`notificationRules.ts` L47–50). On `completed` / `disapproved`: TO = `owners` (submitter+DE+PM), **CC = sponsor only** (L52–54) — Sponsor is informed, not primary TO |
| 5 | Can Sponsor submit? | **No** (and should not) | `SUBMIT_ROLES` = Submitter / BA / Admin only. Intentional gate role |

**Overall: Supported.** No build required for demo. Optional polish: TO Sponsor on completed/disapproved; filter queue by `sponsorId === currentUser.id` if multi-Sponsor seeds appear.

---

## 2. EHS — confirmation

| # | Check | Result | Evidence |
|---|--------|--------|----------|
| 1 | Gated into `ehsApprove` / `ehsReject`; reachable on `ForEHSReview` | **Yes** | UI: `EHS_ROLES` L24, `canEhs` L82, buttons L214+; store: `EHS_ACTION_ROLES` = EHS/Admin (`projectsStore.ts` L82, L930–978) |
| 2 | Conditional gate | **Yes** | `approveSubmission`: `ehsCoordinatorId` set → `ForEHSReview` + `ehs-review-requested`; blank → `Active` (`projectsStore.ts` L833–886) |
| 3 | Never submits / qualifies / reviews stack | **Confirmed** | Not in `SUBMIT_ROLES`, `REVIEWER_ROLES` / `QUALIFY_ROLES`, or `SUBMISSION_REVIEW_ROLES` |
| 4 | Work queue + deep-link | **Yes** | EHS callout `pendingEhsReview` (`DashboardPage.tsx` L79–86 → `/projects?status=ForEHSReview` L153–154) |
| 5 | Notifications | **Yes** | TO on `ehs-review-requested` = assigned + all EHS (L39–42); CC on approve/reject (L44–46) |
| 6 | Named vs role-wide act | **Named routes; role-wide acts** | `ehsCoordinatorId` drives status + notify. **Unlike Sponsor**, store/UI do **not** require `actor.id === ehsCoordinatorId` — any EHS (or Admin) may approve/reject. Only one seed EHS (`usr-ehs`) |

**Overall: Supported.** EHS is the gate role that already has named assignment. Optional: mirror Sponsor and restrict act to assigned coordinator when set (demo has one EHS, so low urgency).

---

## 3. Enablement roles — existence & verdict

### App `Role` union (`types/index.ts` L1–11)

```
Submitter | BusinessAnalyst | GovernanceLead | RiskCompliance |
DataEngineering | AIProgramManager | MaintenanceSustainability |
Sponsor | EHS | Admin
```

**Framework Enablement roles with no app `Role`:** Awareness & AI Literacy · Communications / Marketing & Communications · Rewards & Recognition (Excellence & Engagement / Employee Enablement). None appear in `SEED_USERS`.

### What exists instead

| Surface | What it is | Who owns it |
|---------|------------|-------------|
| Lifecycle stage `Enablement` | Cross-cutting meta in `LIFECYCLE_STAGES` (`lifecycle.ts` L104–110); **excluded** from `SEQUENTIAL_LIFECYCLE_STAGES` (L18–19) | Primary: `AIProgramManager`; supporting: `BusinessAnalyst` — stage act only if somehow `currentStage === Enablement` (unusual in seeds) |
| `rewardCategory` | Qualification / CI metadata (`Kaizen` / `TeamProject` / …) | Set by Gov/Risk at qualify — **not** a Rewards role |
| Training Catalog `/trainings` | Browseable catalog for all roles; Admin CRUD | **Admin** owns content; no Literacy/Awareness role |
| Group `Marketing` | Org group enum, not a role | — |

No Awareness content CMS, no recognition points engine, no Comms workflow.

### Per-framework-role verdict

| Framework role | In app? | Verdict |
|----------------|---------|---------|
| Awareness & AI Literacy | No | **Out-of-scope** for per-project portal — leave as org program; Trainings catalog is enough demo proxy |
| Communications / M&C | No | **Out-of-scope** — not a project workflow actor |
| Rewards & Recognition | No | **Leave as metadata** — `rewardCategory` at qualify/CI is sufficient; do **not** invent a Rewards role |

**Do not build Enablement-role parity with delivery roles.**

---

## 4. C1 — Role → coverage matrix

| Role | Archetype | Overall | Biggest gap |
|------|-----------|---------|-------------|
| Submitter | delivery (intake) | **Supported** | None material — intake + My Entries; no gate duties |
| BusinessAnalyst | delivery | **Supported** (post–Phase 8) | Soft: ROI/consult on live ForAssessment still thin |
| DataEngineering | delivery | **Partial** | No named DE / queue; build/verify/remediate/drift Missing |
| AIProgramManager | delivery + oversight | **Partial** | No Submitted-review / Deployment queue; Deployment A = stage shell |
| MaintenanceSustainability | delivery (ops) | **Missing** (content) / **Partial** (meta) | Use empty; aging bypasses M&S |
| GovernanceLead | oversight | **Supported** | Policy / Improvement / Decom = stage shells only |
| RiskCompliance | oversight | **Partial** | Vendor AI-SAQ absent; Supplier Oversight empty |
| Sponsor | gate | **Supported** | Minor: CC-only on completed/disapproved |
| EHS | gate | **Supported** | Act not restricted to assigned coordinator |
| Admin | (platform) | **Supported** | N/A — override + catalog admin |

*Enablement framework roles:* **not in union** — out-of-scope (see §3).

---

## 5. C2 — Submit-gate contradiction (definitive)

`SUBMIT_ROLES` = `['Submitter', 'BusinessAnalyst', 'Admin']`  
(`SubmitProjectPage.tsx` L9, `ManualSubmitPage.tsx` L23, `AssistedIntakePage.tsx` L24, `ProjectsListPage.tsx` L35, `DashboardPage.tsx` L34, `Sidebar.tsx` L36)

| Seed user | Role | Appears as `submitterId` | In `SUBMIT_ROLES`? | Projects |
|-----------|------|--------------------------|--------------------|----------|
| `usr-data` | DataEngineering | Yes | **No** | `prj-031`, `prj-027`, `prj-063`, `prj-067`, `prj-072` |
| `usr-pm` | AIProgramManager | Yes | **No** | `prj-051` |
| `usr-maint` | MaintenanceSustainability | Yes | **No** | `prj-008` |
| `usr-submitter` | Submitter | Yes | Yes | (many) — OK |
| `usr-ba` | BusinessAnalyst | Yes | Yes | (many) — OK |

**Definitive contradiction list:** **DataEngineering, AIProgramManager, MaintenanceSustainability.**

No seed uses Sponsor, EHS, GL, R&C, or Admin as `submitterId`.

**Fix as one defect:** either expand `SUBMIT_ROLES` to include DE/PM/M&S, or reassign those seed `submitterId`s to `usr-submitter` / `usr-ba`.

---

## 6. Open questions

1. **Submit gate:** Expand roles vs fix seeds — product intent?
2. **EHS act restriction:** Should assigned `ehsCoordinatorId` bind approve/reject the way `sponsorId` does?
3. **Sponsor on closure outcome:** Should Sponsor be TO (not only CC) on `completed` / `disapproved`?
4. **Enablement stage:** Keep as cross-cutting metadata only, or ever make it a real `currentStage` with PM-owned content?
5. **BA audit file:** Refresh `AUDIT-BA_Role_Capability.md` to post–Phase 8 so C1 sources stay consistent.
