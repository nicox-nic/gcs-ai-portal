# Seed Data Reference — GCS AI Project Portal

Canonical seed data for `src/data/seed*.ts` files. When generating seed data, copy from this document rather than inventing values. Names, IDs, and content here are intentional — they create a coherent demo narrative.

## Org constants (`seedOrg.ts`)

```ts
export const GROUP_HEADCOUNT: Record<Group, number> = {
  Engineering: 150,
  Field: 420,
  PROGs: 980,
  Marketing: 16,
};

export const SITE_HEADCOUNT: Record<Site, number> = {
  Cebu: 1820,
  'Costa Rica': 310,
  Japan: 250,
  Korea: 112,
};
```

## Users (`seedRoles.ts`)

```ts
export const SEED_USERS: User[] = [
  { id: 'usr-submitter', displayName: 'Maria Santos',  role: 'Submitter',                  group: 'Engineering', site: 'Cebu',       department: 'Field Service Engineering' },
  { id: 'usr-ba',         displayName: 'Chris Aguillon', role: 'BusinessAnalyst',            group: 'PROGs',       site: 'Cebu',       department: 'Business Analysis' },
  { id: 'usr-govlead',    displayName: 'John Gicale',    role: 'GovernanceLead',             group: 'PROGs',       site: 'Cebu',       department: 'AI Governance' },
  { id: 'usr-risk',       displayName: 'Jessica Buhay',  role: 'RiskCompliance',             group: 'PROGs',       site: 'Cebu',       department: 'Risk & Compliance' },
  { id: 'usr-data',       displayName: 'Nico Cabangal',  role: 'DataEngineering',            group: 'PROGs',       site: 'Cebu',       department: 'Data Engineering' },
  { id: 'usr-pm',         displayName: 'Randy Asignar',  role: 'AIProgramManager',           group: 'PROGs',       site: 'Cebu',       department: 'AI Program Management' },
  { id: 'usr-maint',      displayName: 'Nikki Aberion',  role: 'MaintenanceSustainability',  group: 'Field',       site: 'Costa Rica', department: 'Operations Sustainability' },
  { id: 'usr-sponsor',    displayName: 'Evan Gonzalez',  role: 'Sponsor',                    group: 'PROGs',       site: 'Cebu',       department: 'GCS Leadership' },
  { id: 'usr-admin',      displayName: 'Albert Arimbay', role: 'Admin',                      group: 'PROGs',       site: 'Cebu',       department: 'Platform Admin' },
];
```

Names are intentional. Several reflect real Teradyne employees mentioned in the source documentation. Do not change these.

## Tools (`seedTools.ts`)

All vendor `"Microsoft"`. All `lastReviewed: '2026-06-01'`. Format:

```ts
{
  id: 'tool-copilot-studio',
  name: 'Copilot Studio',
  category: 'Conversational AI',
  vendor: 'Microsoft',
  description: 'Build, deploy, and manage copilots for customer-facing and internal use cases. Supports custom topics, knowledge sources, and Power Automate flows.',
  typicalUseCases: ['Q&A agents', 'Ticket triage', 'Knowledge retrieval', 'Internal help desks'],
  requiredSkillLevel: 'Intermediate',
  maxDataSensitivity: 'Internal',
  trainingIds: ['trn-copilot-1', 'trn-power-platform-conv'],
  gettingStartedUrl: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/',
  lastReviewed: '2026-06-01',
  iconHint: 'message-chatbot',
},
```

Full list (10 tools):

| id | name | category | requiredSkill | maxDataSens | iconHint |
|---|---|---|---|---|---|
| `tool-power-apps` | Power Apps | Low-code | Basic | Internal | `device-mobile` |
| `tool-power-automate` | Power Automate | Automation | Intermediate | Internal | `arrows-shuffle` |
| `tool-power-bi` | Power BI | Analytics | Basic | Internal | `chart-bar` |
| `tool-sharepoint` | SharePoint | Content Management | Basic | Internal | `files` |
| `tool-copilot-studio` | Copilot Studio | Conversational AI | Intermediate | Internal | `message-chatbot` |
| `tool-m365-copilot` | Microsoft 365 Copilot | AI Assistant | Basic | Internal | `brand-office` |
| `tool-azure-ai-foundry` | Azure AI Foundry | ML Platform | Advanced | Confidential | `brain` |
| `tool-azure-ai-search` | Azure AI Search | Search & Retrieval | Advanced | Confidential | `search` |
| `tool-azure-ml` | Azure Machine Learning | ML Platform | Advanced | Confidential | `brain` |
| `tool-azure-logic-apps` | Azure Logic Apps | Automation | Advanced | Confidential | `sitemap` |

## Trainings (`seedTrainings.ts`)

14 trainings, including one `ComingSoon`:

| id | title | provider | format | dur | skill | toolIds | availability |
|---|---|---|---|---|---|---|---|
| `trn-copilot-1` | Build a Copilot Studio Agent in 60 Min | Microsoft Learn | Self-paced | 3 | Intermediate | `[tool-copilot-studio]` | Available |
| `trn-power-automate-1` | Power Automate Fundamentals | Microsoft Learn | Video | 2 | Basic | `[tool-power-automate]` | Available |
| `trn-sharepoint-1` | SharePoint for AI Builders | Microsoft Learn | Self-paced | 1.5 | Basic | `[tool-sharepoint]` | Available |
| `trn-power-platform-conv` | Conversational AI with Power Platform | GCS Internal | Workshop | 4 | Intermediate | `[tool-copilot-studio, tool-power-apps]` | Available |
| `trn-power-bi-1` | Power BI Fundamentals for Service Teams | Microsoft Learn | Self-paced | 2 | Basic | `[tool-power-bi]` | Available |
| `trn-power-bi-2` | Power BI Advanced: DAX, Dataflows & AI Visuals | Microsoft Learn | Video | 3 | Intermediate | `[tool-power-bi, tool-azure-ml]` | Available |
| `trn-power-apps-1` | Power Apps Canvas Apps Fundamentals | Microsoft Learn | Self-paced | 3 | Intermediate | `[tool-power-apps]` | Available |
| `trn-azure-ml-1` | Azure ML for Predictive Maintenance | Microsoft Learn | Video | 4 | Advanced | `[tool-azure-ml, tool-azure-ai-foundry]` | Available |
| `trn-azure-search-1` | Azure AI Search: Semantic Retrieval at Scale | Microsoft Learn | Video | 5 | Advanced | `[tool-azure-ai-search, tool-azure-ai-foundry]` | Available |
| `trn-m365-copilot-1` | Getting Started with M365 Copilot for Business Teams | GCS Internal | Instructor-led | 8 | Intermediate | `[tool-m365-copilot]` | Available |
| `trn-governance-1` | AI Governance & Responsible AI Practices | GCS Internal | Workshop | 6 | Intermediate | `[]` | Available |
| `trn-literacy-1` | Introduction to AI for Non-Technical Employees | GCS Internal | Self-paced | 2.5 | Basic | `[]` | Available |
| `trn-logic-apps-1` | Azure Logic Apps for Enterprise Integration | Microsoft Learn | Video | 3 | Advanced | `[tool-azure-logic-apps]` | Available |
| `trn-azure-ml-bootcamp` | Azure ML Engineering Bootcamp | GCS Internal | Instructor-led | 12 | Advanced | `[tool-azure-ml]` | **ComingSoon**, availableFromLabel: `"Coming Q3 2026"` |

Descriptions for each: 1-2 sentences describing what the learner will build/know after completion. Be concrete (not "learn about X" but "build a working Y").

## Tool Combos (`seedCombos.ts`)

5 combos:

```ts
{
  id: 'combo-triage-agent',
  name: 'Triage Agent Stack',
  description: 'The most complete triage solution. Copilot Studio handles conversations, SharePoint stores KB articles, Power Automate routes escalations.',
  primaryToolId: 'tool-copilot-studio',
  addOnToolIds: ['tool-sharepoint', 'tool-power-automate'],
  addOnRoles: {
    'tool-sharepoint': 'Knowledge store',
    'tool-power-automate': 'Routing & alerts',
  },
  matchScore: 94,
  bestForKeywords: ['triage', 'ticket', 'agent', 'Q&A', 'help desk', 'chatbot'],
  skillLevelRequired: 'Intermediate',
  riskFlags: [],
},
{
  id: 'combo-lightweight-automation',
  name: 'Lightweight Automation',
  description: 'Good for rule-based ticket routing and dashboarding. Simpler to deploy but less conversational.',
  primaryToolId: 'tool-power-automate',
  addOnToolIds: ['tool-power-bi'],
  addOnRoles: { 'tool-power-bi': 'Triage metrics' },
  matchScore: 71,
  bestForKeywords: ['automate', 'workflow', 'routing', 'approval'],
  skillLevelRequired: 'Basic',
  riskFlags: [],
},
{
  id: 'combo-ai-search',
  name: 'AI-Powered Search',
  description: 'Best for high-volume semantic search over large corpora. Pairs Azure AI Search retrieval with an LLM layer for grounded answers.',
  primaryToolId: 'tool-azure-ai-search',
  addOnToolIds: ['tool-azure-ai-foundry', 'tool-sharepoint'],
  addOnRoles: {
    'tool-azure-ai-foundry': 'LLM layer',
    'tool-sharepoint': 'Data source',
  },
  matchScore: 68,
  bestForKeywords: ['search', 'knowledge base', 'retrieval', 'documents', 'semantic'],
  skillLevelRequired: 'Advanced',
  riskFlags: ['Requires Advanced skill level'],
},
{
  id: 'combo-predictive-insights',
  name: 'Predictive Insights',
  description: 'For forecasting failures, anomaly detection, and demand prediction. Pairs a trained ML model with Power BI visualisation.',
  primaryToolId: 'tool-azure-ml',
  addOnToolIds: ['tool-power-bi'],
  addOnRoles: { 'tool-power-bi': 'Visualisation' },
  matchScore: 65,
  bestForKeywords: ['predict', 'forecast', 'anomaly', 'model', 'demand'],
  skillLevelRequired: 'Advanced',
  riskFlags: ['Requires Advanced skill level', 'Data sensitivity may exceed limits'],
},
{
  id: 'combo-document-qa',
  name: 'Document Q&A',
  description: 'Quick wins on summarising and querying internal documents. Best inside Microsoft 365 environments.',
  primaryToolId: 'tool-m365-copilot',
  addOnToolIds: ['tool-sharepoint'],
  addOnRoles: { 'tool-sharepoint': 'Document corpus' },
  matchScore: 58,
  bestForKeywords: ['document', 'Q&A', 'summarise', 'office', 'report'],
  skillLevelRequired: 'Basic',
  riskFlags: [],
},
```

## Projects (`seedProjects.ts`)

7 projects telling a coherent demo story. Each must have a realistic `submission`, 2-3 `recommendations`, 1-2 `alternativeRecommendations`, `stageStatus` consistent with `currentStage`, and a populated `auditLog` (3-6 entries).

### 1. Service Ticket Triage Copilot — flagship demo project
- id: `prj-042`
- submitter: Maria Santos (Engineering, Cebu)
- sponsor: Evan Gonzalez
- group: PROGs · site: Cebu · department: "Customer Service Ops"
- status: `InProgress` · currentStage: `Deployment`
- stageStatus: Assessment/Policy/SupplierOversight/Development all `Completed`; Deployment `InProgress`; Use/Improvement/Decommissioning `NotStarted`
- toolStack: Copilot Studio (primary) + SharePoint (Knowledge store) + Power Automate (Routing & alerts)
- recommendedComboIds: `['combo-triage-agent']`
- reportedBenefitHours: null
- sponsorValidated: false
- Submission: triage agent for field engineers; problem is 30-40% of time spent triaging tickets; goal to reduce by 60%; data sensitivity Internal; skill Intermediate; integration targets SharePoint + Teams; estimatedUsers 120; expectedBenefitHours 40.

### 2. Repair Time Prediction Model
- id: `prj-031`
- submitter: Nico Cabangal · sponsor: Evan Gonzalez
- group: PROGs · site: Cebu
- status: `InProgress` · currentStage: `Development`
- toolStack: Azure ML (primary) + Power BI (Visualisation)
- recommendedComboIds: `['combo-predictive-insights']`
- expectedBenefitHours: 80, reportedBenefitHours: null

### 3. Knowledge Base QA Agent for Field Engineers
- id: `prj-058`
- submitter: Maria Santos · sponsor: null (not yet qualified)
- group: Engineering · site: Cebu
- status: `Submitted` · currentStage: `Assessment` (status `InProgress`)
- toolStack: empty (not yet selected)
- recommendedComboIds: `['combo-document-qa', 'combo-ai-search']`
- recommendations stored, awaiting governance qualification

### 4. Anomaly Detection on Tester Logs
- id: `prj-027`
- submitter: Nico Cabangal · sponsor: Evan Gonzalez
- group: Engineering · site: Cebu
- status: `OnHold` · currentStage: `Development` (status `Blocked`)
- toolStack: Azure ML (primary) + Azure AI Foundry (LLM layer)
- Audit log includes a "Mark Blocked" transition with note about data access

### 5. Automated UAT Report Generator — completed, validated
- id: `prj-019`
- submitter: Chris Aguillon · sponsor: Evan Gonzalez
- group: Engineering · site: Cebu
- status: `Completed` · currentStage: `Use` (all earlier stages Completed; Use Completed; Improvement NotStarted)
- toolStack: Power Automate (primary) + SharePoint (Output location)
- reportedBenefitHours: 24
- sponsorValidated: true

### 6. Customer Sentiment Dashboard
- id: `prj-051`
- submitter: Randy Asignar · sponsor: Evan Gonzalez
- group: Marketing · site: Cebu
- status: `InProgress` · currentStage: `Use` (Development + Deployment Completed)
- toolStack: Power BI (primary)
- reportedBenefitHours: null

### 7. Spare Parts Demand Forecast — completed, validated, Costa Rica
- id: `prj-008`
- submitter: Nikki Aberion · sponsor: Evan Gonzalez
- group: Field · site: Costa Rica
- status: `Completed` · currentStage: `Improvement`
- toolStack: Azure ML (primary) + Power BI (Visualisation)
- reportedBenefitHours: 32
- sponsorValidated: true

## Dashboard contributors (random names, not seeded users)

Top Contributors on the dashboard shows users by AI project count. Use these names — they intentionally are NOT in `SEED_USERS` because they represent the broader population:

| Rank | Name | Group | Count |
|---|---|---|---|
| 1 | Daniel Reyes | PROGs | 18 |
| 2 | Sophia Chen | Engineering | 14 |
| 3 | Marcus Okafor | PROGs | 11 |
| 4 | Aiko Tanaka | Engineering | 9 |
| 5 | Liam Park | Field | 7 |

Sub-label under each name is the **Group**, not the role. This is intentional (a user might have many roles via projects, but only one group).

## Dashboard KPIs (target values)

Pre-calculated so the dashboard tells a story even before user-created projects:

| KPI | Value | Sub-label |
|---|---|---|
| Total Projects | 476 | Across all stages |
| In Progress | 218 | Active builds |
| Completed | 142 | Validated by sponsor |
| Hours Saved | 12,480 | Per month, reported |

These are pre-aggregated demo numbers; the live count from `projects.length` would only be 7 in seed data. Show the headline numbers from constants AND show the live counts side by side, or have a "Demo headline" toggle. Simpler approach: derive from live state but pad with `DEMO_HISTORICAL_TOTAL = 469` (etc) constants. Pick one and be consistent.

## Stage distribution for the bar chart

Roughly (used to size demo bars; live state computes the actual counts):

```
Assessment: 72
Policy: 32
SupplierOversight: 28
Development: 64
Deployment: 40
Use: 52
Improvement: 16
Decommissioning: 8
```

## Tool usage distribution (Top Recommended Tools chart)

```
Copilot Studio: 142
Power BI: 103
Power Automate: 88
Azure ML: 68
Power Apps: 57
M365 Copilot: 42
```

Bar widths are relative to the top bar.

## Site adoption percentages (AI Adoption by Location chart)

| Site | Projects | Headcount | % |
|---|---|---|---|
| Japan | 188 | 250 | 75% |
| Korea | 36 | 112 | 32% |
| Costa Rica | 66 | 310 | 21% |
| Cebu | 300 | 1,820 | 16% |

Japan leads because it has the highest engineering density per headcount. Cebu has the most projects in absolute terms but the lowest percentage — that's a deliberate dashboard insight.

## Group adoption percentages (AI Adoption by Group chart)

| Group | Projects | Headcount | % |
|---|---|---|---|
| PROGs | 321 | 980 | 33% |
| Marketing | 5 | 16 | 31% |
| Engineering | 45 | 150 | 30% |
| Field | 105 | 420 | 25% |
