# GCS AI Project Portal — Cursor Prompt 9

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

## Prompt 9 — Recommendation Engine, Results Page, and Customise Stack Dialog

```
Continue building the GCS AI Project Portal demo.

This is the most differentiating capability. Build it in three parts.

**References:**
- **MOCKUP-RECOMMENDATIONS** for the results page (combos section, selected stack bar, individual rankings, alternatives, footer).
- **MOCKUP-CUSTOMISE-STACK** for the dialog.

### PART A — Recommendation Engine

`src/lib/recommendationEngine.ts`:

Export TWO functions:

```ts
export function recommendTools(
  submission: Submission, tools: Tool[], trainings: Training[]
): { top: Recommendation[]; alternatives: Recommendation[] };

export function recommendCombos(
  submission: Submission, combos: ToolCombo[]
): ToolCombo[]; // sorted by score; top 3 are shown as "Recommended Combos"
```

`recommendTools` rules (transparent scoring 0–100):
1. Keyword matching on `useCase + problem + goal`:
   - "chatbot" / "agent" / "Q&A" / "answer" → Copilot Studio +30, M365 Copilot +20
   - "dashboard" / "report" / "visualize" / "kpi" → Power BI +35
   - "automate" / "workflow" / "approval" / "routing" → Power Automate +30, Logic Apps +20
   - "predict" / "forecast" / "anomaly" / "model" → Azure ML +35, Azure AI Foundry +25
   - "form" / "app" / "intake" → Power Apps +30
   - "search" / "knowledge base" / "documents" → Azure AI Search +30, SharePoint +20
2. Skill-level penalty: submitter skill < tool's required → −10 per rank gap, capped −25.
3. Data sensitivity penalty: submission.dataSensitivity > tool.maxDataSensitivity → −40 AND add a riskFlag.
4. Existing tools bonus: tool.name in submission.existingTools → +10.
5. Integration target bonus: "SharePoint" → +10 SharePoint; "Teams" → +5 Copilot Studio / M365 Copilot.

For each tool, populate `rulesFired` (short human-readable strings) and `riskFlags`. Convert raw score to confidence 0–1. Sort descending. Return `top` = ranks 1–3 with score > 30; `alternatives` = ranks 4–5.

`recommendCombos` rules: for each ToolCombo, score against bestForKeywords (each match +25), skill compatibility (penalty if combo.skillLevelRequired > submission.skillLevelAvailable), and data sensitivity compatibility. Return combos sorted descending by score.

### PART B — Recommendation Page

`src/pages/RecommendationPage.tsx`:

1. Top row: "← Back to submission" link, then title "Tool Recommendations" with subtitle "Based on your submission for **{project title}**". Right side: "Submitted for review" green pill + primary "Continue to Project" button.

2. **Submission summary bar** — collapsed by default. Single white card with 4 inline summary items separated by 24px: Use case · Sensitivity · Skill · Est. benefit. Right side: "View full submission" with chevron-down.

3. **Recommended Tool Combos section** — top section above individual rankings:
   - Section header with Stack2 icon (16px indigo) + "Recommended Tool Combos" + subtitle "— pre-built stacks that work well together for your use case".
   - 3-column grid of combo cards. The SELECTED combo gets:
     - 2px indigo border, light indigo box-shadow.
     - "Selected Stack" badge at the top-left (indigo background, white text, check icon).
     - Primary button replaced with disabled-style indigo "✓ Stack selected".
   - Other combo cards: 0.5px tertiary border, ghost "Select this stack" button.
   - Each combo card shows:
     - Combo name (12px, weight 600) + sub-label "Best fit · 94% match" or "Lower complexity · 71% match".
     - List of tools, vertically stacked rows. Primary tool row has indigo background `#EEEDFE` with a PRIMARY badge (white text on indigo). Add-on rows have secondary background with "+ ADD-ON" badge (white text on tertiary `#888780`) and a small role label aligned right ("Knowledge store", "Routing & alerts", etc.).
     - Description paragraph.
     - Risk flag alert if any (warning style, orange `#FEF3EC` background).
   - On click "Select this stack": call `projectsStore.applyCombo(projectId, comboId)` which replaces toolStack with the combo's tools.

4. **Selected Stack Summary bar** — indigo banner `#EEEDFE` with 1.5px indigo border, padding 14px 16px, sits between the combos section and the individual tools. Contains:
   - Label "Your selected tool stack" with layers icon.
   - Chips: primary tool (filled indigo), "+", each add-on (white bg, indigo border, indigo text), separated by indigo "+" markers.
   - On the right: "You can update your stack any time from the project detail page." + ghost "Customise stack" button that opens the dialog (PART C).

5. **Individual Tool Rankings** section:
   - Header: sparkles icon + "Individual Tool Rankings" + subtitle "— toggle add-ons to customise your stack".
   - 3-column grid for top 3:
     - Rank 1 = primary: 2px indigo border, "#1 Primary" badge, confidence pill in indigo `#EEEDFE`/`#3C3489`, indigo confidence bar. Footer shows "Set as primary tool" status pill (green `#F0FBF6` bg, `#A8DFC8` border, `#0F6E56` text, with CircleCheckFilled icon).
     - Ranks 2 & 3 when toggled on as add-ons: 1.5px green border `#1D9E75`, "#2 Add-on ✓" / "#3 Add-on ✓" badge in green, confidence in green pill, green confidence bar. Footer: green pill saying "Added to stack" + small red "Remove" link.
     - Ranks 2 & 3 when NOT in stack: gray styling, "Add to stack" button with plus icon.
   - Below the top 3, an "Alternatives — toggle to add to your stack" section with 2 compact cards (ranks 4–5). Each has a small "+ Add to stack" button.

6. **Footer card**: shield icon + "Your stack is saved automatically. You can update it any time from the project detail page." + primary "Continue to Project" button on the right.

### PART C — Customise Stack Dialog

`src/components/dialogs/CustomiseStackDialog.tsx`:

Opens from the "Customise stack" button in the Selected Stack Summary bar AND from the Project Detail header. Match **MOCKUP-CUSTOMISE-STACK** exactly.

Structure:

1. **Dialog header** (border-bottom):
   - Title "Customise Tool Stack" with layers icon.
   - Subtitle: "{Project title} — select one primary tool and any number of add-ons."
   - × close button.

2. **Body** — 2-column grid (left flex-1, right 260px):

   **Left — Tool catalog** (border-right, padding 16px, scrollable):
   - Filter row: search input (flex-1) + "All categories" select.
   - Tools grouped by category (uppercase section labels in tertiary 10px). Categories: Conversational AI, Automation, Content Management, Analytics, ML Platform.
   - Tool row visual states:
     - **Primary selected**: 2px indigo border, indigo bg `#EEEDFE`, "PRIMARY" pill on the right + small filled indigo circle with white check.
     - **Add-on selected**: 1.5px green border, green bg `#F0FBF6`, "ADD-ON" pill on the right + filled green circle with white check.
     - **Unselected**: 0.5px tertiary border, plain bg, empty circle on the right.
     - **Skill gap warning** (e.g. Azure ML when submitter skill is Basic): orange-tinted border `#F9C89B`, light orange bg `#FEF9F0`, "Skill gap" inline badge next to the tool name, opacity 0.8. Still selectable.
   - Each tool row layout: 30×30 icon tile (rounded, tinted bg matching the tool's icon color) + name (weight 500) + sub-line "{category} · {requiredSkillLevel} · {maxDataSensitivity}".
   - Clicking a row:
     - If unselected → adds as add-on (green state).
     - If add-on → promotes to primary (replaces existing primary which becomes an add-on, OR demotes to unselected if it was already the primary).
     - Right-click or "Set as primary" menu on the row provides explicit promote action.

   **Right — Current Stack summary** (background secondary, padding 16px):
   - Header row: layers icon + "Current Stack" + count badge (indigo circle with white number).
   - Section "PRIMARY" (10px uppercase tertiary): single tool card with 1.5px indigo border, 26×26 icon tile, tool name + category, PRIMARY pill.
   - Section "ADD-ONS": each add-on as a row with 22×22 icon tile, name + role label (Knowledge store / Routing / etc.), × remove button. The role label is editable inline (text input that appears on click). Defaults to empty string.
   - "How to choose" hint box (white bg, 0.5px tertiary border): info icon + heading + two arrow-prefixed lines explaining Primary vs Add-on.
   - "Trainings for this stack" (margin-top auto so it sits at the bottom): list of training rows for tools currently in the stack. Each row links out.

3. **Dialog footer** (border-top):
   - Left: ghost "Cancel" button (discards changes).
   - Right: "{N} tools selected" muted label + primary "✓ Save Stack" button.

On Save: call `projectsStore.updateToolStack(projectId, stack)`. Validates exactly one entry with role 'primary'. Toast confirmation.
```

---
