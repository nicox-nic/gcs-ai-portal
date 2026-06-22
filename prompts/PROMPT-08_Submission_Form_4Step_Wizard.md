# GCS AI Project Portal — Cursor Prompt 8

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

## Prompt 8 — Submission Form (4-Step Wizard)

```
Continue building the GCS AI Project Portal demo.

Build the submission wizard.

**Reference: MOCKUP-SUBMISSION-WIZARD.** Match the stepper, two-column layout (form left ~60%, progress checklist + tips + post-submit explainer on the right ~320px), and the visual states of locked steps.

`src/pages/SubmitProjectPage.tsx`:

1. Top section:
   - "← Back to Dashboard" link.
   - PageHeader: title "Submit New AI Project", subtitle "Complete all 4 steps to submit your AI initiative for review and tool recommendations."

2. **Stepper card** — full-width, padding 16px 20px. 4 steps arranged horizontally with connector lines between them:
   - Each step: a 28px circle (32px if active) + a stacked label below — bold step name + a thin descriptive line.
   - State 1 (completed): solid indigo circle with white check, label indigo.
   - State 2 (active): light indigo bg, 2px indigo border, number in indigo. Label primary, sub-label tertiary.
   - State 3 (locked): neutral background, 1.5px tertiary border, gray number. Label tertiary.
   - Connector lines between steps: indigo behind active step, tertiary `#E2E0D8` ahead.
   - Step names and sub-labels:
     - 1 — **Basics** · "Title, group, site"
     - 2 — **Use Case** · "Problem, goal, outcome"
     - 3 — **Data** · "Sources, sensitivity"
     - 4 — **Readiness** · "Skills, tools, integrations"

3. **Two-column layout below stepper**:

   **Left column — Form card** (background white, border 0.5px tertiary, radius large, padding 20px). For each step, show its section with a small numbered circle next to the section title (same state colors as the stepper). Steps not yet active show a locked placeholder: gray background, lock icon (20px tertiary), text "Complete Step {prev} to unlock".

   - **Step 1 — Basics:** Project Title (full-width), Group (Select: Engineering / Field / PROGs / Marketing) + Site (Select: Cebu / Costa Rica / Japan / Korea), Department (text) + Target Users (text). Required fields marked with red asterisk.
   - **Step 2 — Use Case:** Use Case (short text), Problem (textarea), Goal (textarea), Expected Outcome (textarea), Expected Benefit (number — "estimated hours saved per month").
   - **Step 3 — Data:** Data Sources (textarea), Data Sensitivity (Select), Data Access Status (Select).
   - **Step 4 — Readiness:** Skill Level Available (Select), Existing Tools (multi-checkbox over SEED_TOOLS names + "Other" text), Integration Targets (multi-checkbox: SharePoint, Teams, Outlook, Dynamics, Snowflake, Power BI, Custom DB, Other).
   - **Footer row** (border-top, padding-top 16px): "← Back" on the left (disabled on step 1, slight opacity 0.5). On the right: "Save Draft" (ghost) + "Next: {nextStepName}" (primary indigo, with arrow). On step 4 the primary button changes to "Submit & See Recommendations".

   **Right column — three stacked cards** (width 320px, gap 12px):

   - **Progress Checklist** — list of completable items with green filled check (CircleCheckFilled, color `#1D9E75`) or empty circle (gray). Items update live as form fields are filled. Items:
     - Project title
     - Group & site
     - Department
     - Target users
     - Use case description
     - Data sources
     - Technical readiness
   - **Tips for a better recommendation** — small lightbulb icon (color `#BA7517`) + heading. 4 bulleted tips with indigo arrow markers (→). Tips: "Be specific about the problem you're solving, not just the solution you want." / "Mention the data you have access to and its format (Excel, SharePoint, SQL, etc.)." / "Include any tools your team already uses — it helps match you to the right stack." / "Estimate hours saved per month — even a rough guess helps justify the project."
   - **What happens after you submit?** — indigo tinted card (`#EEEDFE` background, `#CECBF6` border). Heading with info icon. Numbered explainer (1/2/3 in small white circles on indigo): "You'll see your top 3 tool recommendations instantly." / "Your project goes to the Governance Lead for qualification review." / "You'll be notified when it's approved to proceed to development."

4. **On submit (step 4 → Submit)**:
   1. `projectsStore.createProject({...})`
   2. Run `recommendTools(submission, tools, trainings)` (see Prompt 9 for the engine)
   3. Run `recommendCombos(submission, combos)` (see Prompt 9)
   4. `projectsStore.setRecommendations(projectId, top, alternatives, recommendedComboIds)`
   5. `projectsStore.submitProject(projectId)`
   6. Navigate to `/projects/:id/recommendations`
   7. Success toast.

5. If current role can't submit (not Submitter / BusinessAnalyst / Admin) redirect to dashboard with a toast.
```

---
