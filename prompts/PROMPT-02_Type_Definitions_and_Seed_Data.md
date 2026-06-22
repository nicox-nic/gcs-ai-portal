# GCS AI Project Portal — Cursor Prompt 2

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

## Prompt 2 — Type Definitions and Seed Data

```
Continue building the GCS AI Project Portal demo.

Create the type definitions and seed data so the rest of the app has a stable contract to build against. Key design decision: the portal supports MULTI-TOOL stacks (a primary tool plus optional add-ons), not single-tool selection. This shapes the types and seed data throughout.

1. In `src/types/index.ts`, define and export these TypeScript types:

   - `Role` — union of: 'Submitter' | 'BusinessAnalyst' | 'GovernanceLead' | 'RiskCompliance' | 'DataEngineering' | 'AIProgramManager' | 'MaintenanceSustainability' | 'Sponsor' | 'Admin'
   - `Group` — union of: 'Engineering' | 'Field' | 'PROGs' | 'Marketing'
   - `Site` — union of: 'Cebu' | 'Costa Rica' | 'Japan' | 'Korea'
   - `User` — { id: string; displayName: string; role: Role; group: Group; site: Site; department: string }
   - `LifecycleStage` — union: 'Assessment' | 'Policy' | 'SupplierOversight' | 'Development' | 'Deployment' | 'Use' | 'Improvement' | 'Decommissioning' | 'Enablement'
   - `StageStatus` — 'NotStarted' | 'InProgress' | 'Completed' | 'Blocked'
   - `RiskLevel` — 'Low' | 'Medium' | 'High'
   - `ProjectStatus` — 'Draft' | 'Submitted' | 'Qualified' | 'InProgress' | 'OnHold' | 'Completed' | 'Rejected' | 'Decommissioned'
   - `SkillLevel` — 'None' | 'Basic' | 'Intermediate' | 'Advanced'
   - `DataSensitivity` — 'Public' | 'Internal' | 'Confidential' | 'Restricted'
   - `TrainingFormat` — 'Self-paced' | 'Instructor-led' | 'Workshop' | 'Video'
   - `TrainingAvailability` — 'Available' | 'ComingSoon'
   - `Tool` — { id: string; name: string; category: string; vendor: string; description: string; typicalUseCases: string[]; requiredSkillLevel: SkillLevel; maxDataSensitivity: DataSensitivity; trainingIds: string[]; gettingStartedUrl: string; lastReviewed: string; iconHint: string }
     - `iconHint` is a lucide icon name (e.g. "message-chatbot", "files", "arrows-shuffle", "chart-bar", "brain") used by ToolStackChips to render a consistent icon per tool.
   - `Training` — { id: string; title: string; provider: string; format: TrainingFormat; durationHours: number; skillLevel: SkillLevel; toolIds: string[]; url: string; description: string; availability: TrainingAvailability; availableFromLabel?: string }
   - `ToolCombo` — { id: string; name: string; description: string; primaryToolId: string; addOnToolIds: string[]; addOnRoles: Record<string, string>; matchScore: number; bestForKeywords: string[]; skillLevelRequired: SkillLevel; riskFlags: string[] }
     - `addOnRoles` maps `toolId` to a short role label like "Knowledge store", "Routing & alerts", "LLM layer", "Triage metrics".
   - `Submission` — { useCase: string; problem: string; goal: string; targetUsers: string; expectedOutcome: string; dataSources: string; dataSensitivity: DataSensitivity; dataAccessStatus: 'Available' | 'NeedAccess' | 'Unknown'; skillLevelAvailable: SkillLevel; existingTools: string[]; integrationTargets: string[]; estimatedUsers: number; expectedBenefitHours: number }
   - `ToolStackEntry` — { toolId: string; role: 'primary' | 'supporting'; usageNote?: string }
   - `Recommendation` — { toolId: string; rank: number; confidence: number; rationale: string; riskFlags: string[]; rulesFired: string[] }
   - `StageTransition` — { id: string; projectId: string; fromStage: LifecycleStage | null; toStage: LifecycleStage; fromStatus: StageStatus | null; toStatus: StageStatus; actorUserId: string; actorRole: Role; timestamp: string; note: string }
   - `Project` — { id: string; title: string; submitterId: string; sponsorId: string | null; group: Group; site: Site; department: string; status: ProjectStatus; currentStage: LifecycleStage; stageStatus: Record<LifecycleStage, StageStatus>; submission: Submission; recommendations: Recommendation[]; alternativeRecommendations: Recommendation[]; recommendedComboIds: string[]; toolStack: ToolStackEntry[]; createdAt: string; updatedAt: string; auditLog: StageTransition[]; reportedBenefitHours: number | null; sponsorValidated: boolean }

2. In `src/data/seedOrg.ts`, export org-level constants used by the dashboard:
   - `GROUP_HEADCOUNT: Record<Group, number>` — { Engineering: 150, Field: 420, PROGs: 980, Marketing: 16 }
   - `SITE_HEADCOUNT: Record<Site, number>` — { Cebu: 1820, 'Costa Rica': 310, Japan: 250, Korea: 112 }

3. In `src/data/seedRoles.ts`, export `SEED_USERS: User[]` with one representative user per Role (9 users). Use these names exactly (they appear in the mockups):
   - Submitter: Maria Santos
   - BusinessAnalyst: Chris Aguillon
   - GovernanceLead: John Gicale
   - RiskCompliance: Jessica Buhay
   - DataEngineering: Nico Cabangal
   - AIProgramManager: Randy Asignar
   - MaintenanceSustainability: Nikki Aberion
   - Sponsor: Evan Gonzalez
   - Admin: Albert Arimbay
   Assign each user a plausible group and site (e.g. John Gicale → PROGs/Cebu, Evan Gonzalez → PROGs/Cebu, Nico Cabangal → PROGs/Cebu, Maria Santos → Engineering/Cebu).

4. In `src/data/seedTools.ts`, export `SEED_TOOLS: Tool[]` with these 10 tools:
   - Power Apps (Low-code, iconHint "device-mobile")
   - Power Automate (Automation, iconHint "arrows-shuffle")
   - Power BI (Analytics, iconHint "chart-bar")
   - SharePoint (Content Management, iconHint "files")
   - Copilot Studio (Conversational AI, iconHint "message-chatbot")
   - Microsoft 365 Copilot (AI Assistant, iconHint "brand-office")
   - Azure AI Foundry (ML Platform, iconHint "brain")
   - Azure AI Search (Search & Retrieval, iconHint "search")
   - Azure Machine Learning (ML Platform, iconHint "brain")
   - Azure Logic Apps (Automation, iconHint "sitemap")
   All have vendor "Microsoft". Realistic descriptions, typical use cases (3–4 each), `lastReviewed: '2026-06-01'`, plausible Microsoft Learn URLs. Set `requiredSkillLevel` and `maxDataSensitivity` realistically (e.g. Power Apps Basic/Internal; Azure ML Advanced/Restricted; SharePoint Basic/Internal).

5. In `src/data/seedTrainings.ts`, export `SEED_TRAININGS: Training[]` with ~14 trainings including:
   - "Build a Copilot Studio Agent in 60 Min" (Self-paced, 3h, Intermediate, → Copilot Studio)
   - "Power Automate Fundamentals" (Video, 2h, Basic, → Power Automate)
   - "SharePoint for AI Builders" (Self-paced, 1.5h, Basic, → SharePoint)
   - "Conversational AI with Power Platform" (Workshop, 4h, Intermediate, → Copilot Studio + Power Apps)
   - "Power BI Fundamentals for Service Teams" (Self-paced, 2h, Basic, → Power BI)
   - "Power BI Advanced: DAX, Dataflows & AI Visuals" (Video, 3h, Intermediate, → Power BI + Azure ML)
   - "Power Apps Canvas Apps Fundamentals" (Self-paced, 3h, Intermediate, → Power Apps)
   - "Azure ML for Predictive Maintenance" (Video, 4h, Advanced, → Azure ML + Azure AI Foundry)
   - "Azure AI Search: Semantic Retrieval at Scale" (Video, 5h, Advanced, → Azure AI Search + Azure AI Foundry)
   - "Getting Started with M365 Copilot for Business Teams" (Instructor-led, 8h, Intermediate, → M365 Copilot)
   - "AI Governance & Responsible AI Practices" (Workshop, 6h, Intermediate, toolIds [] — applies to all)
   - "Introduction to AI for Non-Technical Employees" (Self-paced, 2.5h, Basic, toolIds [] — literacy track)
   Plus one with `availability: 'ComingSoon'`:
   - "Azure ML Engineering Bootcamp" (Instructor-led, 12h, Advanced, → Azure ML, `availableFromLabel: 'Coming Q3 2026'`)
   The remaining trainings: any plausible Microsoft Learn entries. Mix providers between "Microsoft Learn" and "GCS Internal".

6. In `src/data/seedCombos.ts`, export `SEED_COMBOS: ToolCombo[]` with at least 5 combos:
   - "Triage Agent Stack" — primary Copilot Studio, add-ons SharePoint ("Knowledge store") + Power Automate ("Routing & alerts"). Match score 94. bestForKeywords: ["triage", "ticket", "agent", "Q&A"]. SkillRequired: Intermediate.
   - "Lightweight Automation" — primary Power Automate, add-on Power BI ("Triage metrics"). Match score 71. bestForKeywords: ["automate", "workflow", "routing"].
   - "AI-Powered Search" — primary Azure AI Search, add-ons Azure AI Foundry ("LLM layer") + SharePoint ("Data source"). Match score 68. bestForKeywords: ["search", "knowledge base", "retrieval"]. SkillRequired: Advanced. riskFlags: ["Requires Advanced skill level"].
   - "Predictive Insights" — primary Azure ML, add-on Power BI ("Visualisation"). Match score 65. bestForKeywords: ["predict", "forecast", "anomaly"]. SkillRequired: Advanced.
   - "Document Q&A" — primary M365 Copilot, add-on SharePoint ("Document corpus"). Match score 58. bestForKeywords: ["document", "Q&A", "summarise"].

7. In `src/data/seedProjects.ts`, export `SEED_PROJECTS: Project[]` with 7 sample projects spanning groups, sites, and lifecycle stages. Use these titles for realism:
   - "Service Ticket Triage Copilot" (Maria Santos, PROGs/Cebu, currentStage Deployment, status InProgress, toolStack = Copilot Studio (primary) + SharePoint + Power Automate, recommendedComboIds: ["triage-agent-stack"])
   - "Repair Time Prediction Model" (Nico Cabangal, PROGs/Cebu, status InProgress, toolStack Azure ML primary + Power BI add-on)
   - "Knowledge Base QA Agent for Field Engineers" (Maria Santos, Engineering/Cebu, status Submitted, no toolStack yet)
   - "Anomaly Detection on Tester Logs" (Nico Cabangal, Engineering/Cebu, status OnHold)
   - "Automated UAT Report Generator" (Chris Aguillon, Engineering/Cebu, status Completed, validated, reportedBenefitHours 24)
   - "Customer Sentiment Dashboard" (Randy Asignar, Marketing/Cebu, status InProgress, toolStack Power BI primary)
   - "Spare Parts Demand Forecast" (Nikki Aberion, Field/Costa Rica, status Completed, validated, reportedBenefitHours 32)
   
   Each must have a complete `submission`, 2–3 recommendations + 1–2 alternatives, realistic `stageStatus` reflecting `currentStage`, and an `auditLog` with 3–6 StageTransition entries showing the history.

Make the seed data feel realistic and demo-impressive — a reviewer should see immediate value.
```

---
