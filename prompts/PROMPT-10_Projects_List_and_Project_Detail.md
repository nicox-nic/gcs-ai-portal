# GCS AI Project Portal — Cursor Prompt 10

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

## Prompt 10 — Projects List and Project Detail with Lifecycle Tracker

```
Continue building the GCS AI Project Portal demo.

Build the project tracking experience.

### PART A — Projects List

`src/pages/ProjectsListPage.tsx`:

1. PageHeader: "Projects" / "All AI initiatives across GCS". Right action: "New Project" button (visible to allowed roles).
2. Filter bar: Search (title), Status select, Stage select, Group select, Site select, "My Projects" toggle (filters to projects where the user is submitter or sponsor, or where their role is primary owner of the current stage).
3. Table columns: Title (linked, with a thin progress bar under it showing stageProgress.pct), Submitter, Group, Site, Current Stage, Stage Status, Overall Status, Tool Stack (uses ToolStackChips, compact mode showing only primary + count of add-ons like "Copilot Studio +2"), Updated (relative time).
4. Empty state when filters return nothing.

### PART B — Project Detail

**Reference: MOCKUP-PROJECT-DETAIL.** Match the header card, lifecycle stepper, and tab layout.

`src/pages/ProjectDetailPage.tsx`:

1. "← Back to Projects" link.

2. **Project header card** (white bg, 0.5px tertiary border, radius large, padding 16px 20px):
   - Top row: project title (17px, weight 600) + status badge + current stage badge (indigo `#EEEDFE`/`#3C3489`). Right side: ghost "Edit" button + primary "Customise Stack" button (opens CustomiseStackDialog from Prompt 9).
   - Metadata sub-row (11px, muted, gap 16px): User icon + submitter name · Briefcase icon + sponsor name · Building icon + "{Group} · {Site}" · Calendar icon + created date · Hash icon + project id.
   - **Tool stack row**: small "Tool stack:" label + ToolStackChips (the rich version with primary in filled indigo, add-ons as green outline chips, separated by gray "+").
   - **Overall progress bar**: small row with "Overall progress" label + "X of 8 stages complete · NN%". Below: 5px gradient bar (green→indigo), width = pct.

3. **Lifecycle Stages card** (white bg, padding 16px 20px):
   - Header: route icon + "Lifecycle Stages" + (margin-left auto) a small legend with 4 colored dots: Completed (green), In Progress (amber), Not Started (gray), Blocked (red).
   - **Horizontal stepper row** with all 8 sequential stages (Assessment → Decommissioning). Each stage:
     - Top: 28px circle (32px if currently active, with a 4px soft outer glow `rgba(239,159,39,0.15)`). Completed = solid green `#1D9E75` with white check. InProgress = amber-tinted bg `#FBEDD8` with 2.5px amber border `#EF9F27` and a Play icon. NotStarted = neutral bg, 1.5px gray border, step number. Blocked = red.
     - Connector lines on either side of each circle: green if behind/completed, gray if ahead.
     - Below circle: stage label (9px, weight 500, colored to match state) + status text (9px).
   - **Enablement chip** below the stepper, separated by thin horizontal lines on both sides: star icon (amber) + "Enablement (cross-cutting) — active throughout all stages".

4. **Tabs card** (white bg, radius large, overflow hidden):
   - Tab bar with light secondary background. Active tab has white bg + 2px indigo bottom border. Tabs:
     - **Overview** (default active)
     - **Lifecycle**
     - **Recommendations**
     - **Benefits & Closure**
     - **Audit Log** (with a small indigo count badge)

   **Overview tab content** — 2-column layout (flex-1 + 300px):

   *Left (border-right):*
   - Collapsible sections (chevron-down indigo when open, chevron-right gray when closed):
     - **Basics** — 2-column grid of label/value pairs: Group, Site, Department, Target users, Est. users, Est. benefit.
     - **Use Case** — narrative text with Problem / Goal / Expected outcome subsections.
     - **Data & Technical Readiness** — collapsed by default, shows "(collapsed)" hint.
   - **Current Stage Actions** section (border-top, padding-top 14px):
     - Header: amber Play icon + "Current Stage Actions — {stageName}" + small "In Progress" badge.
     - Action panel (secondary bg, radius medium, padding 12px):
       - Row "Primary owner" → RoleBadge for the stage's primaryOwnerRole.
       - Row "Supporting roles" → small RoleBadges in a flex row.
       - Info banner (indigo `#EEEDFE` bg, `#CECBF6` border): "You are viewing as {currentRole}. Only {primaryRole} and supporting roles can advance this stage." Only shows when current user CAN'T act.
     - Two ghost buttons: "Mark Blocked" + "Mark Complete". Both disabled (opacity 0.5, cursor not-allowed) when current user can't act. When current user CAN act, buttons are enabled and clicking opens a small Dialog requesting optional note, then calls `advanceStage(...)`.

   *Right column (padding 16px, vertical stack with separators):*
   - **Recent Activity** card: header with "View all →" link to Audit Log tab. List of last 4 transitions. Each row: 20px avatar (role-colored initials) + "{Actor first name} {action}" + sub-line "{relative time} · {actor role}".
   - **Tool Stack** card (border-top, padding-top 12px): vertical list of chips matching the format inside the CustomiseStackDialog summary (PRIMARY indigo, ADD-ON green, role label on the right).
   - **Recommended Trainings** card (border-top): header with "View catalog →" link. List of trainings linked to tools currently in the stack. Each row: title + sub-line "{format} · {duration}h" + external link icon.

   **Lifecycle tab content**:
   - For each of the 9 stages: a Card showing stage name + primaryOwnerRole + supporting RoleBadges + StageStatus badge.
   - For the current stage: also show the allowed transitions from `getAllowedTransitions(...)`, each as a button. Disabled with tooltip "Only {primaryOwnerRole} or supporting roles can act on this stage." if current role isn't allowed.
   - Clicking a button → small Dialog for optional note → `advanceStage(...)`.

   **Recommendations tab content**:
   - Read-only view of the stored recommendations and combos. Same visual style as the Recommendation page but with a primary "Re-open Customise Stack" button that opens the dialog.

   **Benefits & Closure tab content**:
   - Visible only when status is 'Completed' OR currentStage in ['Use', 'Improvement', 'Decommissioning'].
   - If current user is submitter: input "Reported benefit hours per month" + "Submit for sponsor validation" button → `reportBenefits(projectId, hours)`.
   - If current user matches sponsorId: show reported value + "Validate" button → `validateBenefits`.
   - Always show a comparison bar: Expected vs Reported benefit hours, side by side.

   **Audit Log tab content**:
   - Full table, newest first. Columns: Timestamp (absolute + relative), Actor (name + RoleBadge), From → To (stage and status), Note.
```

---
