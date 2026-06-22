# GCS AI Project Portal — Cursor Prompt 7

> **Context:** This prompt is part of a sequence. See the Mockup Reference Guide below before starting.

---

## Mockup Reference Guide

Keep the mockup file (`MOCKUP-GCS-AI-Portal.html`) open in your browser while running this prompt. The table below maps mockup tab names to prompts:

| Mockup Tab Name | Used in Prompt |
|---|---|
| MOCKUP-LOGIN | Prompt 4 |
| MOCKUP-DASHBOARD | Prompt 6 |
| MOCKUP-SUBMISSION-WIZARD | Prompt 8 |
| MOCKUP-RECOMMENDATIONS | Prompt 9 |
| MOCKUP-CUSTOMISE-STACK | Prompt 9 |
| MOCKUP-PROJECT-DETAIL | Prompt 10 |
| MOCKUP-TRAINING-CATALOG | Prompt 11 |

---

## Prompt 7 — Lifecycle Module and Role-Based Stage Gating

```
Continue building the GCS AI Project Portal demo.

Create the lifecycle reference module that defines the 9 stages, who can act on each, and what transitions are allowed.

`src/lib/lifecycle.ts`:

1. Export `LIFECYCLE_STAGES: { stage: LifecycleStage; label: string; order: number; description: string; primaryOwnerRole: Role; supportingRoles: Role[] }[]` with these 9 entries (matches the GCS AI Governance Manual mapping):
   - Assessment — primary GovernanceLead, supporting [BusinessAnalyst, RiskCompliance]
   - Policy — primary GovernanceLead, supporting [RiskCompliance]
   - SupplierOversight — primary RiskCompliance, supporting [AIProgramManager, DataEngineering]
   - Development — primary DataEngineering, supporting [BusinessAnalyst, AIProgramManager]
   - Deployment — primary AIProgramManager, supporting [MaintenanceSustainability, DataEngineering, BusinessAnalyst]
   - Use — primary MaintenanceSustainability, supporting [RiskCompliance]
   - Improvement — primary GovernanceLead, supporting [DataEngineering, MaintenanceSustainability, BusinessAnalyst]
   - Decommissioning — primary GovernanceLead, supporting [MaintenanceSustainability, RiskCompliance]
   - Enablement — primary AIProgramManager, supporting [BusinessAnalyst] (cross-cutting; always available)

2. Export helpers:
   - `getStageMeta(stage)` — returns the entry.
   - `canActOnStage(role, stage): boolean` — true if role is primaryOwner, in supportingRoles, or is Admin.
   - `nextStage(currentStage)` — next in sequence Assessment → Policy → ... → Decommissioning. Enablement is excluded from sequential flow.
   - `getAllowedTransitions(currentStage, currentStageStatus): { toStage, toStatus, label }[]`:
     - NotStarted → InProgress
     - InProgress → Completed OR Blocked
     - Completed → next stage's NotStarted (if not at last stage)
     - Blocked → InProgress OR NotStarted
   - `stageProgress(project): { completed: number; total: number; pct: number }` — counts non-Enablement stages with status Completed; total 8.

3. Update `projectsStore.advanceStage`:
   - Validate `canActOnStage(actor.role, stage)` — throw if not allowed.
   - Validate the transition is in `getAllowedTransitions`.
   - Update `stageStatus[stage]`, optionally update `currentStage` (when starting a new stage), update `status` if appropriate:
     - When Assessment first reaches Completed → status 'Qualified'
     - When any stage moves to InProgress on a 'Qualified' project → 'InProgress'
     - When Use becomes Completed → 'Completed'
     - When Decommissioning Completes → 'Decommissioned'
   - Append a StageTransition to auditLog with timestamp, actor, note.

Keep this module pure and well-typed. The UI in Prompt 10 relies on these helpers.
```

---
