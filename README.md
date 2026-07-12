# GCS AI Project Portal — Phase 0 Demo

Frontend-only React demo of an internal portal for Teradyne's Global Customer Service (GCS) division. Built ahead of Phase 1 Azure deployment.

Employees submit AI project ideas; the portal recommends pre-vetted Microsoft tool stacks, routes each project through a 9-stage governance lifecycle with role-based gates, and tracks the project from idea to retirement. The portal is the operational front-end for the GCS AI Governance Manual (ISO 42001).

## Stack

- **Build / dev**: Vite + TypeScript
- **UI**: React 18 + Tailwind CSS + shadcn/ui + lucide-react
- **State**: Zustand with `persist` middleware (localStorage)
- **Routing**: React Router v6
- **Charts**: recharts
- **Utilities**: date-fns, nanoid

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Click any role card on the login screen. Demo data is seeded on first load.

```bash
npm run build      # type-check + production build
npm run preview    # preview production build
```

## Demo mode

> **No backend. No real auth. All data in localStorage.**

Phase 0 is a clickable prototype. The login screen is a role picker — there is no Entra ID, no API, and no server. Projects, catalog entries, and session state persist in your browser until you clear them via Admin → Demo controls.

## Folder structure

```
src/
├── components/
│   ├── layout/           AppShell, Sidebar, Topbar, PageHeader, DemoBanner
│   ├── common/           StatusBadge, RoleBadge, GroupBadge, EmptyState, ToolStackChips
│   ├── dashboard/        KpiCard, LifecycleStageChart, chart skeleton
│   ├── admin/            Catalog CRUD tabs, form dialogs, AdminDataTable
│   ├── trainings/        Training catalog cards and recommended strip
│   ├── project/          Lifecycle stepper, detail tabs, header card
│   ├── submission/       Wizard stepper and form fields
│   ├── recommendations/  Combo cards, rankings, stack summary
│   ├── dialogs/          CustomiseStackDialog, ConfirmDialog, AdvanceStageDialog
│   └── ui/               shadcn/ui generated components
├── pages/                One file per route
├── stores/               authStore, projectsStore, catalogStore, uiStore
├── hooks/                useDashboardStats, useFilteredProjects, useHydrationReady
├── data/                 seedRoles, seedTools, seedTrainings, seedCombos, seedProjects
├── lib/                  recommendationEngine, lifecycle, trainingCatalog, interfaces
├── types/                index.ts (all type definitions)
└── routes/               AppRoutes, ProtectedRoute
```

`docs/` at the repo root contains design and context documentation referenced during development.

## Demo walkthrough (presenter script)

Recommended sequence for stakeholder demos (~12 minutes). Have `mockups/MOCKUP-GCS-AI-Portal.html` open in a second window for reference.

1. **Login** — Open `/login`, choose the **Submitter** role (Maria Santos). Highlight: 9 distinct roles, no real auth, everything client-side.
2. **Submit** — From the dashboard, click **Submit New Project**. Walk through the 4-step wizard. Use case: *"Service ticket triage agent for field engineers"*. Submit.
3. **Recommendations** — Call out:
   - The 3 **Recommended Combos** at the top with primary + add-ons.
   - The **Selected Stack Summary** bar.
   - **Individual Tool Rankings** — primary (indigo) vs add-ons (green) clearly differentiated.
   - Click **Customise stack** to open the two-panel dialog.
4. **Project detail** — Show tool stack chips in the header, the lifecycle stepper, and role-gated current-stage actions on the Lifecycle tab.
5. **Governance handoff** — Switch role (top-right) to **Governance Lead** (John Gicale). Open the same project's Lifecycle tab — advance **Assessment** from In Progress to Completed.
6. **Data Engineering** — Switch to **Data Engineering** (Nico Cabangal). Advance **Development**.
7. **Sponsor validation** — Switch to **Sponsor** (Evan Gonzalez). Open a Completed project (e.g. *Spare Parts Demand Forecast*) and validate benefits.
8. **Admin** — Switch to **Admin** (Albert Arimbay). Tour Tools, Trainings, Combos, Users (read-only), and **Demo Controls**. All three reset actions require ConfirmDialog approval.
9. **Training catalog** — Switch back to **Submitter** (Maria Santos). Visit Training Catalog — the **Recommended for you** strip lights up based on Maria's project stack. Show the **Coming soon** card for Azure ML Bootcamp.
10. **Dashboard refresh** — Return to the dashboard. The newly submitted project from step 2 appears in lifecycle counts and recent activity.

## Key concepts

### Multi-tool stack model

Every project has a `toolStack: ToolStackEntry[]`. Exactly one entry has `role: 'primary'`; the rest are `role: 'supporting'` (rendered as add-ons). The recommendation engine returns both individual tool rankings and pre-built `ToolCombo` stacks; both feed the same `toolStack` shape.

### Role-based lifecycle gating

Nine lifecycle stages × nine user roles. `canActOnStage(role, stage)` in `src/lib/lifecycle.ts` enforces who can advance a stage. UI buttons are disabled with explanatory tooltips when the current user lacks permission. See `docs/ROLE_LIFECYCLE_RACI.md` for the full matrix.

### Azure-from-day-one interfaces

Every external dependency lives behind a TypeScript interface in `src/lib/`. Phase 0 ships stub implementations. Phase 1 swaps stubs for real Azure services without touching call sites.

| Interface | Phase 0 impl | Phase 1 impl |
|---|---|---|
| `IAuthProvider` | Mock role-picker | MSAL / Entra ID |
| `ILlmProvider` | Returns canned text | Azure OpenAI |
| `IFileStore` | Returns object URLs from base64 | Azure Blob Storage |
| `IProjectRepository` | Zustand + localStorage | PostgreSQL |

## Resetting demo data

The Admin page (Albert Arimbay only) has three reset controls — each requires confirmation:

- **Reset catalog to seed** — restores tools, trainings, and combos.
- **Reset projects to seed** — restores the 7 demo projects.
- **Clear all local data** — wipes auth, catalog, and projects from localStorage and reloads.

Between stakeholder sessions, run **Clear all local data** so each session starts fresh.

## Future: what changes in production

| Area | Phase 0 | Production |
|---|---|---|
| Persistence | localStorage via Zustand | **PostgreSQL** (Azure Database for PostgreSQL) |
| Authentication | Role picker on login | **Azure Entra ID SSO** with AD group → role mapping |
| Recommendations | Rule-based engine in `lib/` | **Azure OpenAI** augments scoring and rationale |
| File attachments | Local / stub URLs | **Azure Blob Storage** |
| Training catalog | Manually curated in Admin | **Real LMS integration** (learning paths synced from source) |

Additional Phase 1 scope: Azure App Service hosting, CI Portal integration, email via Azure Communication Services, audit log export to Azure Monitor.

## Documentation

| Document | Purpose |
|---|---|
| `docs/PROJECT_BRIEF.md` | What the portal is and who uses it. |
| `docs/DESIGN_TOKENS.md` | Color palette, type scale, spacing, component patterns. |
| `docs/DATA_MODEL.md` | TypeScript types and field-by-field rationale. |
| `docs/SEED_DATA_REFERENCE.md` | Canonical seed users, tools, trainings, combos, projects. |
| `docs/RECOMMENDATION_ENGINE_SPEC.md` | Engine algorithm, scoring rules, worked examples. |
| `docs/ROLE_LIFECYCLE_RACI.md` | Role × stage matrix, transition rules, demo journeys. |
| `docs/COMPONENT_PATTERNS.md` | Reusable UI patterns and when to use shadcn vs custom. |
| `docs/COPY_GUIDELINES.md` | Voice, button labels, toast messages, empty states. |
| `docs/DEMO_DATA_SCENARIOS.md` | The narrative behind the seed data. |

## Deploy to Vercel

This is a static Vite + React SPA. `vercel.json` configures the build and client-side routing rewrites.

1. Push the repo to GitHub (see below).
2. In [Vercel](https://vercel.com), **Add New Project** → import `nicox-nic/gcs-ai-portal`.
3. Use defaults: **Framework** Vite, **Build Command** `npm run build`, **Output Directory** `dist`.
4. Deploy. All routes (`/dashboard`, `/projects/:id`, etc.) work via SPA fallback.

Local production check: `npm run build && npm run preview`.

### OpenAI proxy (optional, infra only)

A Vercel serverless function at `/api/llm` keeps `OPENAI_API_KEY` server-side. Existing demo flows do not depend on it. Setup steps (Vercel env var + `vercel dev` for local): see [`docs/llm/SETUP.md`](docs/llm/SETUP.md).

## Status

Phase 0 demo. Not production-ready. No real data. No real auth. Safe to share with internal stakeholders only.

For questions: contact the GCS AI Governance team.
