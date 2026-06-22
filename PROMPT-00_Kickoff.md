# PROMPT 00 — Kickoff (read first, run before PROMPT-01)

Use this as your **first message to Cursor** in a brand-new chat, before running PROMPT-01. It tells Cursor about the project, the documentation files, the mockup reference, and the conventions to apply throughout the work.

---

## Copy-paste this into Cursor as your first prompt

```
You are helping me build a frontend-only React demo called the "GCS AI Project Portal" — an internal tool for Teradyne's Global Customer Service division. This will be a Phase 0 demo (no backend, no real auth) that I'll then evolve into a production app on Azure.

Before generating any code, do the following:

1. Read these files in order. They are short and contain the entire context you need:
   - .cursorrules (you will have already loaded this automatically — confirm by quoting one rule from it)
   - docs/PROJECT_BRIEF.md
   - docs/DESIGN_TOKENS.md
   - docs/DATA_MODEL.md
   - docs/ROLE_LIFECYCLE_RACI.md
   - docs/RECOMMENDATION_ENGINE_SPEC.md
   - docs/SEED_DATA_REFERENCE.md
   - docs/COMPONENT_PATTERNS.md
   - docs/COPY_GUIDELINES.md
   - docs/DEMO_DATA_SCENARIOS.md
   - README.md

2. Also open and inspect the file mockups/MOCKUP-GCS-AI-Portal.html. This is a self-contained reference for what every screen should look like. It has 7 tabs across the top:
   - MOCKUP-LOGIN
   - MOCKUP-DASHBOARD
   - MOCKUP-SUBMISSION-WIZARD
   - MOCKUP-RECOMMENDATIONS
   - MOCKUP-CUSTOMISE-STACK
   - MOCKUP-PROJECT-DETAIL
   - MOCKUP-TRAINING-CATALOG
   Each prompt I send you will reference one or more of these by name. Treat the mockup HTML as a visual reference only — do not paste raw HTML/CSS into React code. Translate every layout to React + Tailwind + shadcn/ui components.

3. Once you've read those, summarize back to me, in 8 short bullets:
   - The product in one line.
   - The stack you will use.
   - The four hardest rules from .cursorrules.
   - The names of the 7 mockup tabs.
   - The 8 sequential lifecycle stages in order, plus Enablement called out separately as cross-cutting (not in the sequence).
   - The 9 user roles.
   - The persistence strategy and its key.
   - One thing you would clarify with me before starting.

4. Do not write any code yet. Wait for me to send PROMPT-01.

Use the answer to that summary as confirmation that the context loaded correctly. If anything is missing or ambiguous, ask me before we begin.
```

## Expected response from Cursor

Cursor should respond with an 8-bullet summary roughly matching:

1. **Product**: Frontend-only React demo of the GCS AI Project Portal — an internal portal for submitting, governing, and tracking AI projects across Teradyne's GCS division.
2. **Stack**: Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui + Zustand + React Router v6 + lucide-react + recharts + date-fns + nanoid.
3. **Four hardest rules**: No backend (localStorage only); Azure-from-day-one interfaces; Design tokens are authoritative — no raw hex; exactly one primary in every toolStack.
4. **Mockups**: MOCKUP-LOGIN, MOCKUP-DASHBOARD, MOCKUP-SUBMISSION-WIZARD, MOCKUP-RECOMMENDATIONS, MOCKUP-CUSTOMISE-STACK, MOCKUP-PROJECT-DETAIL, MOCKUP-TRAINING-CATALOG.
5. **Stages**: 8 sequential stages — Assessment → Policy → SupplierOversight → Development → Deployment → Use → Improvement → Decommissioning. Enablement is the 9th but cross-cutting — always active throughout, never the `currentStage` of any project.
6. **Roles**: Submitter, BusinessAnalyst, GovernanceLead, RiskCompliance, DataEngineering, AIProgramManager, MaintenanceSustainability, Sponsor, Admin.
7. **Persistence**: Zustand with `persist` middleware writing to localStorage. Three keys: `gcs-ai-portal-auth`, `gcs-ai-portal-catalog`, `gcs-ai-portal-projects`.
8. **One clarifying question**: (varies — common ones: "Should I scaffold the project at the current working directory or in a subfolder?", "Which Node version are you on?" (any current LTS or Node 22/24 works for Vite + React 18), "Do you want me to commit after each prompt?")

## If Cursor's summary is wrong

Stop and correct. Don't move to PROMPT-01 until the summary aligns. Common drift to watch for:

- Suggests a different state library (Redux, Jotai) → wrong.
- Suggests a UI kit other than shadcn/ui (MUI, Chakra) → wrong.
- Misses the "exactly one primary in toolStack" invariant → ask it to re-read DATA_MODEL.md.
- Confuses roles with stages → ask it to re-read ROLE_LIFECYCLE_RACI.md.

## After Cursor confirms

Answer its clarifying question with your actual setup (typically: "scaffold in current dir, yes; whichever Node you have installed — Node 20, 22, or 24 all work; no auto-commit"), then paste **PROMPT-01_Project_Setup_and_Folder_Structure.md** in a new message.
