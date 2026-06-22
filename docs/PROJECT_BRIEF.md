# GCS AI Project Portal — Project Brief

## What we're building

A web portal where Teradyne Global Customer Service (GCS) employees can submit AI project ideas, receive recommended tool stacks, browse curated trainings, and track each project through a governed lifecycle. This is the **Phase 0 demo** — a frontend-only React app that proves the concept before backend work begins.

## Why

GCS has rapidly growing AI adoption across customer service engineering, predictive maintenance, repair analytics, chatbots, and decision-support tools. Right now there is no single place where:

- An employee can submit an AI idea and get told *which tools to use*.
- Governance can see the pipeline of AI projects across stages.
- Sponsors can validate the actual benefit delivered after a project closes.
- Risk and Compliance can see where high-risk projects are concentrated.

The existing **CI (Continuous Improvement) Portal** handles general project intake, but it is not AI-aware — it cannot recommend tools, gate stages by AI-specific governance roles, or surface AI-specific risks like data sensitivity or skill gaps. This portal **complements the CI Portal**; it does not replace it.

## Anchor in the GCS AI Governance Framework

The portal is the operational implementation of the GCS AI Governance Manual (ISO 42001-based). Every screen maps back to a section of that manual:

- **Submission flow** → AI Assessment (Qualification + Readiness + Risk).
- **Project lifecycle tracker** → the 9-stage AI Process Model.
- **Tool recommendation engine** → Supplier & Third-Party Oversight (approved tools only) + Development guidance.
- **Training catalog** → AI Awareness & Literacy.
- **Sponsor validation** → Benefits realisation in the Use stage.
- **Admin** → catalog management for the Governance team.

If a design decision conflicts with the Governance Manual, the manual wins.

## Who uses it (9 roles)

| Role | Primary action |
|---|---|
| Submitter | Submit ideas, track their own projects, report benefits |
| Business Analyst | Refine submissions, support qualification |
| Governance Lead | Qualify projects, oversee gates, run improvement |
| Risk & Compliance | Risk assessment, supplier sign-off |
| Data Engineering | Build models and pipelines (Development stage) |
| AI Program Manager | Coordinate deployment and releases |
| Maintenance & Sustainability | Operate solutions post-deployment |
| Sponsor | Approve at qualification + validate benefits at closure |
| Admin | Manage tool/training/combo catalogs |

Demo uses one named seed user per role — see `SEED_DATA_REFERENCE.md`.

## The headline capability: the recommendation engine

When a submitter describes their use case, the portal returns:

1. **Three recommended tool combos** — pre-built stacks like "Triage Agent Stack" (Copilot Studio + SharePoint + Power Automate) that work well together for a class of use case.
2. **Individual tool rankings** — top 3 plus 2 alternatives, with confidence scores, transparent rules that fired, and linked trainings.
3. **A composable stack** — submitter can pick a combo as-is, swap pieces, or build from scratch in the Customise Stack dialog. The result is always shaped as `toolStack: [{ primary }, { addon }, { addon }, ...]`.

This is the demo's wow moment. The engine is hybrid: deterministic rules drive ~80% of the score (transparent and explainable), with an LLM layer planned for future fuzzy matching. In Phase 0 the engine is rules-only.

## Phase 0 scope (what this demo includes)

- All 7 mockup screens implemented as routes.
- 9 seed users, 10 seed tools, ~14 seed trainings, 5 seed combos, 7 seed projects spanning stages.
- All 9 lifecycle stages with role-based gating.
- Rule-based recommendation engine returning combos + individual tools.
- localStorage persistence (no real backend).
- Mock "login as role" picker (no real auth).
- Admin page for catalog CRUD.

## Out of scope for Phase 0

- Real Azure deployment.
- Real Entra ID SSO.
- LLM-based recommendation (rules only for now).
- CI Portal integration.
- LMS integration (training catalog is manually curated).
- Real notifications (toasts only).
- Multi-language (English only).
- Mobile-native; responsive web only.

## What "production" looks like later

Knowing the future shape keeps Phase 0 honest:

- **Hosting**: Azure App Service or Static Web App.
- **Auth**: Azure Entra ID SSO replaces the role picker. `IAuthProvider` interface swaps from mock to MSAL.
- **Storage**: PostgreSQL (Azure DB) replaces localStorage. Repository interfaces in `src/lib/`.
- **Files**: Azure Blob Storage. `IFileStore` interface.
- **LLM**: Azure OpenAI augments the rules engine. `ILlmProvider` interface — engine swaps at runtime by feature flag.
- **Catalogs**: Tools and trainings sync nightly from Microsoft Learn API + Teradyne LMS.

Every place Phase 0 stubs an external dependency, it must do so behind an interface so the swap is mechanical.

## Demo audience and success criteria

- Audience: GCS AI Governance Committee + IT sponsors.
- Setting: 20-minute walkthrough.
- Success: stakeholders click through the demo themselves on a shared link and immediately understand the multi-tool stack model, the role-based lifecycle gating, and the recommendation engine. No explanation needed for the basics.

## Names you'll see throughout

- **GCS** — Global Customer Service (Teradyne division).
- **CI Portal** — the existing Continuous Improvement intake tool.
- **AIMS** — AI Management System (ISO 42001 term).
- **AI Process Model** — the 9-stage lifecycle (Assessment → Decommissioning + Enablement cross-cutting).
- **Stars of AI Space** — the existing rewards & recognition program (not in scope for this portal).
- **Champion Circle** — the rewards program from the Governance Manual.

## One-paragraph elevator pitch

GCS AI Project Portal is the operational front-end for Teradyne's GCS AI governance program. Employees submit AI ideas; the portal recommends pre-vetted Microsoft tool stacks, routes the project through a 9-stage governance lifecycle with role-based gates, and tracks benefits from idea to retirement. Phase 0 is a frontend-only React demo that proves the multi-tool stack model and the role-gated lifecycle on a single VM, ahead of full Azure deployment in Phase 1.
