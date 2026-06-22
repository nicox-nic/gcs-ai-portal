# GCS AI Project Portal — Cursor Prompt 12

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

## Prompt 12 — Admin Page (Catalog Management)

> **No mockup tab exists for the Admin page** — this is intentional. The Admin page is a straightforward CRUD interface built from shadcn/ui Table, Dialog, Tabs, Input, Label, Select, and Checkbox primitives, following the patterns in `docs/COMPONENT_PATTERNS.md`. The visual reference is the rest of the app's tone: neutral palette, dense layout, indigo accent, 0.5px borders, sentence-case labels. Match the topbar/sidebar shell from any other authenticated page.

```
Continue building the GCS AI Project Portal demo.

Build the Admin page. Only the Admin role can access it (ProtectedRoute already enforces this; if a non-admin somehow hits the URL, render "Access Denied").

`src/pages/AdminPage.tsx`:

Tabs at the top:

**Tab 1 — Tools**
- Header row with "Add Tool" button (opens a Dialog with form fields matching the **full Tool type** — name, category, vendor, description, typicalUseCases (comma-separated → array), requiredSkillLevel, maxDataSensitivity, trainingIds (multi-checkbox sourced from **`catalogStore.trainings`** — the current catalog, not the seed file), gettingStartedUrl, lastReviewed (date), iconHint).
- Table columns are a subset for readability: Name, Category, Vendor, Required Skill, Max Data Sensitivity, # Linked Trainings (**computed from `trainingIds.length`** — not a stored field), Last Reviewed, Actions (Edit / Delete).
- Edit opens the dialog pre-filled. Delete asks confirmation via ConfirmDialog.
- All mutations dispatch to `catalogStore`.

**Tab 2 — Trainings**
- Same pattern. Columns: Title, Provider, Format, Duration, Skill Level, # Linked Tools (**computed from `toolIds.length`**), Availability, Actions.
- Form fields include: title, provider, format, durationHours, skillLevel, toolIds (multi-checkbox sourced from **`catalogStore.tools`**), url, description, availability (Available / ComingSoon), availableFromLabel (only shown when availability === 'ComingSoon').

**Tab 3 — Combos**
- New tab. Header with "Add Combo" button.
- Table: Name, Primary Tool (resolved from `primaryToolId`), # Add-ons (**computed from `addOnToolIds.length`**), Match Score, Skill Required, Actions.
- Add/Edit dialog: name, description, primaryToolId (Select sourced from **`catalogStore.tools`**), addOnToolIds (multi-checkbox sourced from **`catalogStore.tools`**, excluding whichever tool is currently chosen as primary), addOnRoles (text input per selected add-on, keyed by tool), matchScore (number 0-100), bestForKeywords (comma-separated input that parses to array), skillLevelRequired (Select), riskFlags (multi-line input).

**Tab 4 — Users (read-only)**
- Table of all SEED_USERS so a reviewer can see seeded identities. Columns: Display Name, Role (RoleBadge), Group (GroupBadge), Site, Department.
- Note above: "User management is read-only in Phase 0. In production, users will be synced from Azure Entra ID."

**Tab 5 — Demo Controls**
- Three cards with big buttons. **All three are destructive and require a ConfirmDialog before executing** — the dialog states what will be wiped, that the action cannot be undone, and offers Cancel + a destructive-variant confirm button.
  - "Reset Catalog to Seed" → ConfirmDialog → `catalogStore.resetCatalog()` (resets tools, trainings, AND combos).
  - "Reset Projects to Seed" → ConfirmDialog → `projectsStore.resetProjects()`.
  - "Clear All Local Data" → ConfirmDialog (worded most strongly, since this is the most destructive) → wipes all three persist keys from localStorage and reloads the page.
- Each card has a short paragraph explaining the action and a warning that it can't be undone.

Use shadcn components (Dialog, Input, Label, Textarea, Select, Checkbox). Validate required fields inline. Toasts on every successful action.
```

---
