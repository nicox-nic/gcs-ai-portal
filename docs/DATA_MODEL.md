# Data Model — GCS AI Project Portal

All types live in `src/types/index.ts`. This document is the rationale for each field. When in doubt, the type definitions in code win — this document explains *why* fields exist.

## Enums and union types

### Role (9 values)
```ts
type Role = 'Submitter' | 'BusinessAnalyst' | 'GovernanceLead' | 'RiskCompliance'
          | 'DataEngineering' | 'AIProgramManager' | 'MaintenanceSustainability'
          | 'Sponsor' | 'Admin';
```
Used everywhere role-based gating applies. Humanized via `humanizeRole(role)` for display.

### Group (4 values)
```ts
type Group = 'Engineering' | 'Field' | 'PROGs' | 'Marketing';
```
Org-level rollup used in dashboard charts and project headers. PROGs is the largest group (980 headcount).

### Site (4 values)
```ts
type Site = 'Cebu' | 'Costa Rica' | 'Japan' | 'Korea';
```
Physical office locations. Cebu is the primary site (1,820 headcount).

### LifecycleStage (9 values)
```ts
type LifecycleStage = 'Assessment' | 'Policy' | 'SupplierOversight' | 'Development'
                    | 'Deployment' | 'Use' | 'Improvement' | 'Decommissioning'
                    | 'Enablement';
```
Maps directly to the 9-stage AI Process Model in the Governance Manual. `Enablement` is **cross-cutting** — projects do not flow through it; it is always-on. The other 8 form a sequence.

### StageStatus (4 values)
```ts
type StageStatus = 'NotStarted' | 'InProgress' | 'Completed' | 'Blocked';
```
Each stage has independent status. Transitions are constrained — see `getAllowedTransitions` in `lifecycle.ts`.

### ProjectStatus (8 values)
```ts
type ProjectStatus = 'Draft' | 'Submitted' | 'Qualified' | 'InProgress'
                   | 'OnHold' | 'Completed' | 'Rejected' | 'Decommissioned';
```
Overall project state. Distinct from individual stage status. Computed transitions:
- `Draft` → `Submitted` on submission.
- `Submitted` → `Qualified` when Assessment is Completed.
- `Qualified` → `InProgress` when any stage after Assessment moves to InProgress.
- `InProgress` → `Completed` when Use becomes Completed.
- `Completed` → `Decommissioned` when Decommissioning becomes Completed.
- Any → `OnHold` if Maintenance & Sustainability or Sponsor pauses the project.
- Any → `Rejected` if Governance Lead rejects at qualification.

### RiskLevel (3 values)
```ts
type RiskLevel = 'Low' | 'Medium' | 'High';
```

### SkillLevel (4 values)
```ts
type SkillLevel = 'None' | 'Basic' | 'Intermediate' | 'Advanced';
```
Used both on tools (`requiredSkillLevel`) and submissions (`skillLevelAvailable`). Recommendation engine penalises mismatch.

### DataSensitivity (4 values)
```ts
type DataSensitivity = 'Public' | 'Internal' | 'Confidential' | 'Restricted';
```
Used both on tools (`maxDataSensitivity`) and submissions (`dataSensitivity`). Recommendation engine **excludes** tools where submission sensitivity exceeds tool max.

### TrainingFormat (4 values)
```ts
type TrainingFormat = 'Self-paced' | 'Instructor-led' | 'Workshop' | 'Video';
```

### TrainingAvailability (2 values)
```ts
type TrainingAvailability = 'Available' | 'ComingSoon';
```
Trainings in `ComingSoon` state render as dashed-border cards in the catalog and cannot be opened. They show `availableFromLabel` text instead.

## Entity types

### User

```ts
interface User {
  id: string;                  // 'usr-001' etc
  displayName: string;         // "John Gicale"
  role: Role;
  group: Group;
  site: Site;
  department: string;          // "Risk & Compliance Ops"
}
```

One seed user per role (9 total). In production, comes from Entra ID — `email`, `department`, `manager` fields will be added.

### Tool

```ts
interface Tool {
  id: string;                       // 'tool-copilot-studio'
  name: string;                     // "Copilot Studio"
  category: string;                 // "Conversational AI"
  vendor: string;                   // "Microsoft" (always, in Phase 0)
  description: string;
  typicalUseCases: string[];        // ["Q&A agents", "Ticket triage", "Knowledge retrieval"]
  requiredSkillLevel: SkillLevel;
  maxDataSensitivity: DataSensitivity;
  trainingIds: string[];            // Links to Training.id
  gettingStartedUrl: string;        // Microsoft Learn or internal doc
  lastReviewed: string;             // ISO date
  iconHint: string;                 // lucide icon name: "message-chatbot", "files", ...
}
```

`iconHint` is critical — `ToolStackChips` and the Customise Stack dialog both read it to render a consistent icon per tool. Mapping is intentional, not random. Approved values:

| Tool | iconHint |
|---|---|
| Copilot Studio | `message-chatbot` |
| Power Apps | `device-mobile` |
| Power Automate | `arrows-shuffle` |
| Power BI | `chart-bar` |
| SharePoint | `files` |
| M365 Copilot | `brand-office` |
| Azure AI Foundry | `brain` |
| Azure AI Search | `search` |
| Azure ML | `brain` |
| Azure Logic Apps | `sitemap` |

### Training

```ts
interface Training {
  id: string;                            // 'trn-001'
  title: string;
  provider: string;                      // "Microsoft Learn" | "GCS Internal"
  format: TrainingFormat;
  durationHours: number;
  skillLevel: SkillLevel;
  toolIds: string[];                     // Empty array = applies to all tools
  url: string;
  description: string;
  availability: TrainingAvailability;
  availableFromLabel?: string;           // "Coming Q3 2026" — only for ComingSoon
}
```

### ToolCombo

```ts
interface ToolCombo {
  id: string;
  name: string;                          // "Triage Agent Stack"
  description: string;
  primaryToolId: string;                 // exactly one
  addOnToolIds: string[];                // 0..n
  addOnRoles: Record<string, string>;    // toolId -> role label e.g. "Knowledge store"
  matchScore: number;                    // 0..100 baseline; engine adjusts
  bestForKeywords: string[];             // ["triage", "ticket", "agent", "Q&A"]
  skillLevelRequired: SkillLevel;
  riskFlags: string[];                   // ["Requires Advanced skill level"]
}
```

A combo is a **pre-built tool stack** with semantic role labels per add-on. When a submitter clicks "Select this stack", `applyCombo()` replaces the project's `toolStack` with the combo's primary + add-ons, preserving each add-on's role label as `usageNote`.

### Submission

```ts
interface Submission {
  useCase: string;                       // short text
  problem: string;                       // textarea
  goal: string;                          // textarea
  targetUsers: string;                   // "Field engineers"
  expectedOutcome: string;
  dataSources: string;                   // "ServiceNow tickets, SharePoint KB"
  dataSensitivity: DataSensitivity;
  dataAccessStatus: 'Available' | 'NeedAccess' | 'Unknown';
  skillLevelAvailable: SkillLevel;       // skill of the implementing team
  existingTools: string[];               // tools already in the team's workflow
  integrationTargets: string[];          // ["SharePoint", "Teams", "Outlook", ...]
  estimatedUsers: number;
  expectedBenefitHours: number;          // hours saved per month, submitter estimate
}
```

The submission is the **input to the recommendation engine**. Every field above is read by `recommendTools` or `recommendCombos`. Adding a field means updating the engine; removing one means updating the wizard.

### ToolStackEntry

```ts
interface ToolStackEntry {
  toolId: string;
  role: 'primary' | 'supporting';        // exactly one entry has 'primary'
  usageNote?: string;                    // "Knowledge store", "Routing & alerts"
}
```

The smallest unit of the model. A project's `toolStack` is `ToolStackEntry[]`. Invariant: exactly one entry has `role === 'primary'`. `updateToolStack()` throws if violated.

### Recommendation

```ts
interface Recommendation {
  toolId: string;
  rank: number;                          // 1..5
  confidence: number;                    // 0..1
  rationale: string;                     // human-readable, 1-2 sentences
  riskFlags: string[];                   // ["Data sensitivity exceeds tool max"]
  rulesFired: string[];                  // ["Use case 'agent' → +30", ...]
}
```

The engine produces both `top` (ranks 1-3) and `alternatives` (ranks 4-5). Both arrays are stored on the project.

### StageTransition

```ts
interface StageTransition {
  id: string;                            // 'trn-prj042-001'
  projectId: string;
  fromStage: LifecycleStage | null;      // null for initial creation
  toStage: LifecycleStage;
  fromStatus: StageStatus | null;
  toStatus: StageStatus;
  actorUserId: string;
  actorRole: Role;
  timestamp: string;                     // ISO
  note: string;                          // optional reason
}
```

Append-only. `auditLog` on a project is `StageTransition[]`, newest last. Render newest-first in the UI.

### Project (the central entity)

```ts
interface Project {
  id: string;                            // 'prj-042'
  title: string;
  submitterId: string;
  sponsorId: string | null;              // null until qualification
  group: Group;
  site: Site;
  department: string;
  status: ProjectStatus;
  currentStage: LifecycleStage;          // never 'Enablement'
  stageStatus: Record<LifecycleStage, StageStatus>;
  submission: Submission;
  recommendations: Recommendation[];     // top ranks 1-3
  alternativeRecommendations: Recommendation[];  // ranks 4-5
  recommendedComboIds: string[];         // ordered by score
  toolStack: ToolStackEntry[];           // user's selected stack
  createdAt: string;                     // ISO
  updatedAt: string;                     // ISO
  auditLog: StageTransition[];
  reportedBenefitHours: number | null;   // null until submitter reports
  sponsorValidated: boolean;             // true after sponsor signs off
}
```

## Invariants the code must enforce

1. **Exactly one primary in `toolStack`.** `updateToolStack` validates.
2. **`currentStage` is never `Enablement`.** Enablement is cross-cutting.
3. **All 9 stages have a `stageStatus` entry.** Initialise all to `NotStarted` on create.
4. **`auditLog` only grows.** Never edit or remove past transitions.
5. **`sponsorValidated` requires `reportedBenefitHours !== null`.** Sponsor cannot validate before submitter reports.
6. **Recommendation engine output is stored once per submission.** Re-running the engine appends a new audit entry but does not silently overwrite stored recommendations.

## Persistence keys

| Store | localStorage key |
|---|---|
| Auth | `gcs-ai-portal-auth` |
| Catalog (tools + trainings + combos) | `gcs-ai-portal-catalog` |
| Projects | `gcs-ai-portal-projects` |
| UI (in-memory only) | n/a |

## Future fields (Phase 1, not in Phase 0)

These are NOT in the Phase 0 schema but plan for them:

- `User.email`, `User.entraOid`, `User.manager`.
- `Project.attachments: FileRef[]`.
- `Project.realm: 'Cebu' | 'CostaRica' | 'Japan' | 'Korea' | 'Global'`.
- `Tool.approvedForRealms: Realm[]`.
- `Recommendation.llmGenerated: boolean` once LLM augmentation is added.
- `Submission.attachments`.

Do not pre-build these in Phase 0. Just keep the door open in interface design.
