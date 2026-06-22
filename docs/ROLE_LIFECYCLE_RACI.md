# Role × Lifecycle RACI

Maps the 9 roles to the 9 AI Process Model stages. Drives the `canActOnStage(role, stage)` function in `src/lib/lifecycle.ts`. Source: GCS AI Governance Manual + AI Governance Framework deck.

## The 9 stages in order

```
Assessment → Policy → SupplierOversight → Development → Deployment → Use → Improvement → Decommissioning
                                                                                              ↑
                                                Enablement (cross-cutting — always active)  ┘
```

`Enablement` is **not in the sequence**. It runs throughout. Projects never have `currentStage === 'Enablement'`.

## Stage definitions

| Stage | What happens | Entry criteria | Exit criteria |
|---|---|---|---|
| **Assessment** | Qualify the AI use case. Run AI Qualification Checklist, Readiness Review, Risk & Impact assessment. | Submitter has submitted the form. | Governance Lead approves, rejects, or defers. |
| **Policy** | Confirm or update the policy controls that apply to this project. Determine the AI risk tier. | Project Qualified. | Policy controls documented and approved. |
| **SupplierOversight** | Evaluate vendor / third-party for AI SAQ compliance, NDAs, security review. | Policy controls approved. | Suppliers approved or alternatives identified. |
| **Development** | Build the solution. Data prep, model dev, validation, traceability. | Suppliers cleared. | Solution passes validation. |
| **Deployment** | Pre-prod validation, control implementation, user training, formal release. | Development complete. | Solution live in production. |
| **Use** | Day-to-day operation. Performance monitoring, feedback, incident response. | Production release. | Project is delivering value as expected, or moves to Improvement. |
| **Improvement** | Address issues, drift, new requirements. Implement enhancements via change management. | Use surfaces issues / enhancement requests. | Changes deployed; loops back to Use. |
| **Decommissioning** | Retire the AI solution. Close data, governance, and operational obligations. | Tool no longer needed / obsolete / unacceptable risk. | Solution removed; final audit complete. |
| **Enablement** | AI Awareness & Literacy, Communications, Rewards & Recognition. Cross-cutting. | Always active. | Never ends. |

## RACI matrix

R = Responsible (does the work), A = Accountable (owns the outcome), C = Consulted, I = Informed.

For the gating logic, **Responsible + Accountable** are the "primary owner + supporting roles" who can advance the stage. Consulted roles see the stage but cannot transition it. Informed roles see audit logs only.

| Stage | Submitter | BA | GovLead | RiskComp | DataEng | AIPM | MaintSus | Sponsor | Admin |
|---|---|---|---|---|---|---|---|---|---|
| Assessment | I | R | **A** | R | I | I | I | C | C |
| Policy | I | I | **A** | R | I | I | I | C | C |
| SupplierOversight | I | I | C | **A** | R | R | I | I | C |
| Development | I | R | I | I | **A** | R | I | I | C |
| Deployment | I | R | I | I | R | **A** | R | I | C |
| Use | I | I | I | R | I | I | **A** | C | C |
| Improvement | I | R | **A** | I | R | I | R | I | C |
| Decommissioning | I | I | **A** | R | I | I | R | I | C |
| Enablement | C | R | I | I | I | **A** | I | I | C |

### Primary owner per stage (for `getStageMeta`)

```ts
{
  Assessment:           { primaryOwnerRole: 'GovernanceLead',           supportingRoles: ['BusinessAnalyst', 'RiskCompliance'] },
  Policy:               { primaryOwnerRole: 'GovernanceLead',           supportingRoles: ['RiskCompliance'] },
  SupplierOversight:    { primaryOwnerRole: 'RiskCompliance',           supportingRoles: ['AIProgramManager', 'DataEngineering'] },
  Development:          { primaryOwnerRole: 'DataEngineering',          supportingRoles: ['BusinessAnalyst', 'AIProgramManager'] },
  Deployment:           { primaryOwnerRole: 'AIProgramManager',         supportingRoles: ['MaintenanceSustainability', 'DataEngineering', 'BusinessAnalyst'] },
  Use:                  { primaryOwnerRole: 'MaintenanceSustainability', supportingRoles: ['RiskCompliance'] },
  Improvement:          { primaryOwnerRole: 'GovernanceLead',           supportingRoles: ['DataEngineering', 'MaintenanceSustainability', 'BusinessAnalyst'] },
  Decommissioning:      { primaryOwnerRole: 'GovernanceLead',           supportingRoles: ['MaintenanceSustainability', 'RiskCompliance'] },
  Enablement:           { primaryOwnerRole: 'AIProgramManager',         supportingRoles: ['BusinessAnalyst'] },
}
```

## `canActOnStage(role, stage)` rules

Return `true` if any of:
- `role === 'Admin'`
- `role === stage.primaryOwnerRole`
- `stage.supportingRoles.includes(role)`

Otherwise `false`. UI uses this to enable/disable buttons.

## Allowed transitions

From a given `(stage, status)`, what can the user transition to? Driven by `getAllowedTransitions(currentStage, currentStageStatus)`.

| From status | Allowed → status | Allowed → next stage | Notes |
|---|---|---|---|
| NotStarted | InProgress | — | "Start this stage" |
| InProgress | Completed, Blocked | — | "Complete" or "Mark blocked" |
| Completed | — | next stage's NotStarted | "Advance to {next stage}" |
| Blocked | InProgress, NotStarted | — | "Resume" or "Reset" |

Special cases:
- Completed Decommissioning has no next stage. Returns empty array.
- Enablement is not in the sequential flow — it has its own status independent of the others.

## Project-status side effects

When a stage transitions, the **project-level status** may change:

| Stage transition | Project status change |
|---|---|
| Assessment → Completed (first time) | `Submitted` → `Qualified` |
| Any stage → InProgress, project status `Qualified` | → `InProgress` |
| Use → Completed | → `Completed` |
| Decommissioning → Completed | → `Decommissioned` |
| Any → Blocked, project not yet `OnHold` | (UI offers "Also set project to OnHold") |
| Assessment → never (special: Governance Lead "Reject" action) | → `Rejected` |

`advanceStage` applies these automatically. The UI does not need separate buttons.

## UI patterns

### When a button is disabled

If `canActOnStage(currentUser.role, stage) === false`, render the transition button:
- `opacity: 0.5`
- `cursor: not-allowed`
- Wrap in a Tooltip: `"Only {humanizeRole(stage.primaryOwnerRole)} or supporting roles can act on this stage."`

The button is still visible — disabling tells the user they're looking at the right thing but lack permission. Hiding would be confusing.

### "Mark Rejected" action

Special case for Assessment stage only. Only the GovernanceLead role (or Admin) sees a "Reject project" button. Clicking opens a Dialog requiring a rejection reason. Sets project status to `Rejected`, leaves Assessment at whatever status it was.

### Cross-stage emergency actions

Risk & Compliance can flag any project as high-risk at any time (recorded in audit log, sets a project-level `riskLevel: 'High'` — out of scope for Phase 0 unless prompt explicitly asks for it).

## Demo scenario by role

A reviewer should be able to log in as each role and find something to do. Seed projects are designed so that:

| Role | Project to look at | What they can do |
|---|---|---|
| Submitter (Maria) | prj-058 (her Knowledge Base QA), prj-042 | Track her submissions, customise stacks. |
| Business Analyst (Chris) | prj-019 (his Automated UAT Report Gen) | Support Assessment, see his closed wins. |
| Governance Lead (John) | prj-058 (Submitted, awaiting qualification) | Qualify or reject. |
| Risk & Compliance (Jessica) | prj-027 (Anomaly Detection, OnHold) | Resume Supplier review. |
| Data Engineering (Nico) | prj-031 (Repair Time Prediction, Development) | Mark Development Complete. |
| AI Program Manager (Randy) | prj-042 (Service Ticket Triage, Deployment) | Mark Deployment Complete. |
| Maintenance (Nikki) | prj-008 (Spare Parts Demand, Improvement) | Iterate on the running solution. |
| Sponsor (Evan) | prj-019, prj-008 (Completed, validated) | Already validated; see history. Also prj-042 — view-only at this stage. |
| Admin (Albert) | n/a — uses Admin page | Manage catalogs, reset demo data. |
