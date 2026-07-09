# AUDIT-MS — Maintenance & Sustainability Role Capability Findings

> Read-only audit against the M&S responsibility matrix. **No code changes.**  
> Inspected: `lifecycle.ts` (Use primary + Deployment/Improvement/Decommissioning support), Phase-6 aging/reactivate/notify, dashboard callouts, full `src/` grep for incident/monitor/drift/metric/sla/sustain, Profile, `Project` types.  
> Date: 2026-07-09 · codebase post–Phase 8.  
> Compared to: BA (owned+gated), DE/PM (activity under-modeled), R&C/GL (oversight role-wide), accountable-but-empty stages.

## 1. Summary verdict

| RACI tier | Verdict |
|-----------|---------|
| **A AI Use** | **Meta only.** M&S is correctly `primaryOwnerRole` for Use and can advance the stage, but there is **no Use-phase content** (no monitoring, incidents, feedback, metrics, drift, compliance surface). |
| **R checklist Use activities** | **Missing** across the board — Performance/Behavior, Incident, Feedback, Dashboard & Metrics, Drift. |
| **C / Supporting** | **Supported** for Deployment, Improvement, Decommissioning stage actions when current. |
| **I / ops hooks** | **Missing.** M&S is **not** in aging notification `owners`, **not** in idle dashboard callout, **not** in `reactivateProject` roles — despite Use = live operations and Phase 6 being the only “keep live projects healthy” machinery. |

**How thin vs other roles?** **Thinnest Accountable role.** GL/R&C have real gates; BA has owned artifacts; DE/PM at least have stack/review ops. **The entire AI Use phase is unmodeled content** — stage shell + narrative description, same “empty theater” pattern as R&C Supplier Oversight (and worse: the one existing post-go-live system, aging, bypasses M&S).

---

## 2. Capability table

| # | M&S responsibility | RACI | Status | Evidence | M&S-reachable? | Notes / gap |
|---|--------------------|------|--------|----------|----------------|-------------|
| 1 | Submit/intake | — | **Missing** (role gate) + **seed contradiction** | `SUBMIT_ROLES` excludes M&S (`SubmitProjectPage.tsx` L9 et al.). Seed `prj-008` has `submitterId: 'usr-maint'` (`seedProjects.ts` ~L941) | **No** via `/submit` as M&S | Same DE/PM-style contradiction: seed author, UI blocked |
| 2 | Own & advance AI Use (A) | **A** | **Partial** | `primaryOwnerRole: 'MaintenanceSustainability'` (`lifecycle.ts` L77–83); description cites monitoring/feedback/incidents; `canActOnStage` true; Overview/Lifecycle transitions | **Yes** stage; **No** Use content | Accountable-but-empty |
| 3 | Performance & Behavior Monitoring (R) | **R** | **Missing** | No monitoring artifact/status/thresholds in types, stores, or UI. Grep hits are narrative only (lifecycle text, seed notes, readiness criterion copy) | **No** | — |
| 4 | Incident Detection & Reporting (R) | **R** | **Missing** | No incident log/type/action. “Incident” appears only in seed problem statements / EHS safety brief narrative | **No** | — |
| 5 | Feedback & Reporting (R) | **R** | **Missing** | No Use-phase feedback capture surface for M&S | **No** | Sponsor benefits reporting is closure, not M&S ops feedback |
| 6 | Dashboard & Metrics (R) | **R** | **Missing** | Portfolio `DashboardPage` is governance KPIs (all roles). **No** operational live-project health dashboard owned by M&S | **Yes** see portfolio dash; **No** ops metrics surface | Distinct from checklist “Dashboard & Metrics” |
| 7 | Model Drift Monitoring | R (conflict) | **Missing** | No drift surface. Use supporting = R&C only (`lifecycle.ts` L83) — **DE not on Use** (DE audit #11). Framework → M&S; checklist → DE; code → neither | **No** | **RACI-vs-code conflict** unresolved |
| 8 | Compliance Checks support (Use) | C | **Missing** | R&C audit: no compliance checklist. M&S cannot participate in a surface that doesn’t exist; can only share Use stage with R&C | **No** shared compliance UI | — |
| 9 | Aging / idle hook (Phase 6) | (ops) | **Missing** for M&S | `reactivateProject`: Admin / Gov / closure owner / stack owner — **not** M&S (`projectsStore.ts` L1649–1653; `StatusGateActions` L88–93). Idle callout: Gov / PM / Admin only (`DashboardPage.tsx` L124–127). Aging notify `owners` = submitter + DE + PM — **not** M&S (`notificationRules.ts` L22–25, L57–62) | **No** as M&S role (unless also submitter/stack owner) | Largest ops miss: health machinery exists, wired away from Use owner |
| 10 | Support Deploy / Improve / Decom | supporting | **Supported** | M&S in `supportingRoles`: Deployment L74, Improvement L92, Decommissioning L101 | **Yes** when those stages current | — |
| 11 | Sustainability / SLA / supportability | (goals) | **Missing** | No SLA / MTTR / supportability fields or tracking | **No** | Framework KPI “meantime to support” unmodeled |
| 12 | Named M&S assignment | (org) | **Missing** | No `maintenanceOwnerId` / ops-owner on `Project` | **N/A** | **Recommendation: treat as delivery-adjacent — named operational owner is warranted** (unlike R&C/GL). Live-project ownership is per-solution, not a single org-wide function |
| 13 | Find M&S work (queue) | (workflow) | **Missing** | `RoleCallout` has Gov, EHS, Risk, Sponsor, BA, idle(Gov/PM/Admin) — **no M&S branch** (`DashboardPage.tsx` L71–144). Profile: My Entries if submitter; no “Assigned to me (M&S)” | **No** | — |
| 14 | Notifications targeted to M&S | I | **Missing** (by role) | `recipientsFor` never includes `MaintenanceSustainability`. Aging/activation go to `owners` (submitter/DE/PM) | **Only if** M&S is project submitter | Never informed as Use owner when projects go live or idle |
| 15 | General visibility | — | **Supported** | Full nav except Admin/Submit; detail / Audit / CI / notifications open | **Yes** | Can watch; cannot operate |

---

## 3. Gaps & recommendations (Partial / Missing only)

### Systemic (named slot / queue / notify)

| Item | Gap | Fix type | Call |
|------|-----|----------|------|
| **#12 Named M&S** | No ops owner field | **Data-model + UI** | **Build named assignment** — M&S is closer to BA/DE (owns a live solution) than to R&C/GL (governance function) |
| **#13 Work queue** | No M&S callout | **Feature** | Live Active/Use projects; idle/aging; incidents (if built) |
| **#14 Notifications** | Never TO/CC as M&S | **Role-gate** | TO assigned M&S (or all M&S) on `approved`/`ehs-approved` (go-live), aging-*, reactivated |

### M&S-specific (Use phase + aging)

| Item | Gap | Fix type |
|------|-----|----------|
| **#2–6 Use content** | Empty Use stage | **Feature** — see §4 minimum overlay |
| **#7 Drift** | Unowned / unmodeled | **Product decision** then feature; put M&S and/or DE on Use supporting |
| **#8 Compliance support** | Depends on R&C compliance surface | Shared with RC audit #7 |
| **#9 Aging hook** | M&S excluded from reactivate / idle callout / aging TO | **Role-gate** — highest-ROI quick win without new artifacts |
| **#1 Submit** | Seed `usr-maint` submitter vs UI block | **Role-gate** or fix seed |
| **#11 SLA/sustain** | Unmodeled KPIs | Defer unless Use overlay expands |

**Not gaps:** #10 supporting stages; #15 visibility.

---

## 4. Use-phase verdict

### Is AI Use “empty theater”?

**Yes — same class as Supplier Oversight (R&C audit).**  
Lifecycle meta and description promise monitoring, feedback, and incident response; the app only offers **Start / Complete / Advance** on Use. Seeds show M&S in audit notes (“Monitoring adoption…”) with no interactive surface.

### Minimum to make M&S real (build vs defer)

| Priority | Piece | Why |
|----------|-------|-----|
| **P0 (reuse Phase 6)** | Add M&S to idle callout + `reactivateProject` + aging `recipientsFor` TO | Health machinery already exists; Use owner should own it |
| **P0** | Named `maintenanceOwnerId` (or ops owner) + Profile “Assigned to me” + go-live notify | Makes live ownership first-class |
| **P1** | Lightweight **health status** on Active/Use (Healthy / Watch / Incident) editable by assigned M&S | Visible ops state without a full observability stack |
| **P1** | **Incident log** (date, severity, note, open/closed) on project | Covers checklist Incident R |
| **P2** | Drift / metrics / SLA | Only if demo needs depth beyond health+incidents |

**Recommendation:**  
- **Do not defer P0** if M&S must be a demoable persona — today logging in as `usr-maint` has almost nothing role-specific to do.  
- **Defer P2** metrics/SLA.  
- Pattern: Phase-8-style light overlay on Use + wire existing aging, not a new subsystem.

---

## 5. Open questions

1. **Drift ownership:** Framework → M&S; checklist → DE; `lifecycle.ts` Use supporting → R&C only. Who should own drift in the portal?
2. **Named M&S vs role-wide:** Single `usr-maint` persona — still recommend named assignment for multi-project realism, or role-wide TO for all M&S users until staffing grows?
3. **Should M&S complete Use** before sponsor closure, or is Use stage largely ceremonial while `Active` status + aging carry the ops story?
4. **Submit contradiction:** Add M&S to `SUBMIT_ROLES`, or change `prj-008` submitter away from `usr-maint`?
5. **Idle attention ownership:** Product intent for idle callout is Gov/PM today — should M&S become primary, shared, or remain governance-only?

---

*End of audit. No implementation performed.*
