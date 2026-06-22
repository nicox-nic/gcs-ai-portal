# GCS AI Project Portal — Cursor Prompt 13

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

## Prompt 13 — Polish, README, and Demo Walkthrough

```
Final pass on the GCS AI Project Portal demo. Polish and document.

1. **Visual polish across the app**
   - Consistent spacing: `p-5` (20px) on page containers, `gap-3` (12px) between cards, `space-y-5` between major sections.
   - Subtle motion: cards lift on hover (`transition-shadow hover:shadow-md`), buttons have transition.
   - Dark text on white, muted text uses `text-zinc-500` or `text-muted-foreground`, primary accent indigo `#534AB7`.
   - Tables use `text-sm`, sticky header on tall tables.
   - One example loading skeleton in the dashboard chart area on first hydration.

2. **Accessibility quick wins**
   - Every icon-only button has an `aria-label`.
   - Form labels properly associated.
   - Color is never the only signal — pair badges with text.
   - shadcn dialogs trap focus by default.

3. **404 page** — `src/pages/NotFoundPage.tsx`: friendly centered message + "Back to Dashboard" button.

4. **README.md** at project root with:
   - Title, one-paragraph description.
   - Stack list.
   - Scripts (`npm install`, `npm run dev`, `npm run build`).
   - "Demo Mode" callout: no backend, no real auth, all data in localStorage.
   - Folder structure listing.
   - **Walkthrough script** (numbered, presenter-ready):
     1. Open `/login`, choose the **Submitter** role (Maria Santos).
     2. From dashboard, click "Submit New Project". Walk through the 4-step wizard. Use a use case like "Service ticket triage agent for field engineers".
     3. See the recommendations page — call out:
        - The 3 Recommended Combos at the top with primary + add-ons.
        - The Selected Stack Summary bar.
        - The Individual Tool Rankings showing primary (indigo) and add-ons (green) clearly differentiated.
        - Click "Customise stack" to show the dialog.
     4. Continue to project detail. Show the tool stack chips in the header, the lifecycle stepper, and the role-gated current stage actions.
     5. Switch role (top-right) to **Governance Lead** (John Gicale). Open the same project's Lifecycle tab — advance Assessment from InProgress to Completed.
     6. Switch to **Data Engineering** (Nico Cabangal). Advance Development.
     7. Switch to **Sponsor** (Evan Gonzalez). Open a Completed project (e.g. "Spare Parts Demand Forecast") and validate benefits.
     8. Switch to **Admin** (Albert Arimbay). Show Tools, Trainings, Combos, Users (read-only), and Demo Controls. Mention that all three Demo Controls require ConfirmDialog approval.
     9. Visit Training Catalog as Submitter — show "Recommended for you" strip lighting up based on Maria's project stack, plus the "Coming soon" card state.
   - **Future section** explaining what changes in production:
     - PostgreSQL replaces localStorage.
     - Azure Entra ID SSO replaces the role picker.
     - Azure OpenAI augments the rule-based recommendation engine.
     - Azure Blob Storage replaces local file references.
     - Real LMS integration replaces the manually-curated training catalog.

5. **Final build check**
   - Run `npm run build` and resolve all TypeScript errors.
   - Run `npm run dev` and click through every page, every role, every action.
   - Verify localStorage persistence: refresh the page; projects and catalog still there, auth still active.

Deliver a demo a reviewer can click through without instruction and feel confident this team can ship the real thing.
```

---

## Sequencing and Demo Checkpoints

- **Prompts 1–3** — foundation. Project builds cleanly, stores hydrate from seed on first load.
- **Prompts 4–6** — clickable shell with mock auth and dashboard. **Demo checkpoint #1.**
- **Prompts 7–9** — headline capability (lifecycle + recommendation engine + multi-tool stack + customise dialog). **Demo checkpoint #2.**
- **Prompts 10–12** — full workflow (project tracking, training catalog, admin). **Demo checkpoint #3 — full demo-ready.**
- **Prompt 13** — polish + README. Don't skip — the walkthrough script is what sells the demo.

**Tips for Cursor:**
- At the start of each session, open the mockup screenshots referenced in the prompt as image tabs — Cursor will use them as visual context.
- Open the relevant Zustand store and seed data files as tabs when running Prompts 8+.
- Run `npm run build` after each prompt to catch type errors before moving on.
- When a prompt produces messy output, fix the single most important issue first — don't try to rewrite everything in one follow-up.
