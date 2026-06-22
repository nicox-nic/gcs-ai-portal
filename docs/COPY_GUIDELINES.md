# Copy Guidelines

Voice, tone, and label conventions for the GCS AI Project Portal.

## Voice

- **Plain, direct, professional.** This is an internal tool for working professionals. Not playful, not stiff.
- **Active voice.** "Submit project" not "Project submission". "Customise stack" not "Stack customisation".
- **British or American spelling?** **British** — "customise", "centralise", "behaviour". GCS is global; this convention matches the Governance Manual which uses British spelling consistently.
- **Sentence case for everything** — buttons, headings, labels. Exception: badges and uppercase eyebrows ("PRIMARY", "ADD-ON", "IN PROGRESS") which are explicitly all-caps for visual rhythm.

## Buttons

Buttons describe **what happens** when clicked, not what the UI is.

| ✅ Use | ❌ Avoid |
|---|---|
| "Submit project" | "Submit" (too generic) |
| "Save stack" | "Save changes" |
| "Customise stack" | "Edit tools" |
| "Continue to project" | "Next" |
| "Mark complete" | "Done" |
| "Mark blocked" | "Stop" |
| "Validate benefits" | "Approve" |
| "Open training" | "Click here" / "View" |
| "Resubmit" | "Try again" |
| "Reject project" | "Decline" |

Action names stay consistent across the entire flow:
- The button "Submit project" produces a toast: "Project submitted."
- The button "Customise stack" opens a dialog titled "Customise tool stack" and its save button says "Save stack."

## Buttons that gate transitions

When a user can act on a stage, show:
- "Start stage" (NotStarted → InProgress)
- "Mark complete" (InProgress → Completed)
- "Mark blocked" (InProgress → Blocked)
- "Resume" (Blocked → InProgress)
- "Advance to {next stage}" (Completed → next stage NotStarted)

When the user cannot act, show the same buttons but disabled, with the tooltip: *"Only {role} or supporting roles can act on this stage."*

## Toasts

Past tense, no exclamation marks, ≤ 6 words where possible. Optional secondary line with extra detail.

| Action | Toast |
|---|---|
| Submitter submits a project | "Project submitted." |
| Submitter saves a draft | "Draft saved." |
| User applies a combo | "Triage Agent Stack applied." |
| User saves the customised stack | "Stack saved." |
| User advances a stage | "Stage marked complete." |
| User reports benefits | "Benefits reported. Awaiting sponsor validation." |
| Sponsor validates | "Benefits validated." |
| Admin adds a tool | "Tool added to catalog." |
| Admin resets the catalog | "Catalog reset to seed data." |

Error toasts:
- "Couldn't save stack — primary tool is required."
- "Couldn't advance — this stage isn't ready yet."

Avoid "Success!" / "Error!" prefixes. The toast's color and icon convey the variant.

## Form labels

Singular nouns. Required marker is a red `*`. Hint text appears beneath the input, never above.

| ✅ Use | ❌ Avoid |
|---|---|
| "Project title" | "Title of project" |
| "Group" | "Which group" |
| "Site" | "Location" / "Office" |
| "Data sources" | "Where is your data" |
| "Data sensitivity" | "How sensitive is the data" |
| "Skill level available" | "How skilled is the team" |
| "Expected benefit (hours/month)" | "How much will this save" |

## Status labels

Use these exact strings everywhere status appears:

- `Draft` → "Draft"
- `Submitted` → "Submitted"
- `Qualified` → "Qualified"
- `InProgress` → "In Progress"
- `OnHold` → "On Hold"
- `Completed` → "Completed"
- `Rejected` → "Rejected"
- `Decommissioned` → "Decommissioned"
- `NotStarted` → "Not started" (sentence case in body, "NOT STARTED" in badge)
- `Blocked` → "Blocked"

`humanizeStatus(status)` handles the badge form (uppercase) and the body-text form (sentence case).

## Stage labels

Always humanized:
- `Assessment` → "Assessment"
- `Policy` → "Policy"
- `SupplierOversight` → "Supplier Oversight"
- `Development` → "Development"
- `Deployment` → "Deployment"
- `Use` → "Use"
- `Improvement` → "Improvement"
- `Decommissioning` → "Decommissioning"
- `Enablement` → "Enablement"

In stepper charts where space is tight, abbreviate: "Supplier", "Develop", "Deploy", "Improve", "Decom.".

## Role labels

Always humanized in display. Never show the code name.

| Code | Display |
|---|---|
| `Submitter` | "Submitter" |
| `BusinessAnalyst` | "Business Analyst" |
| `GovernanceLead` | "Governance Lead" |
| `RiskCompliance` | "Risk & Compliance" |
| `DataEngineering` | "Data Engineering" |
| `AIProgramManager` | "AI Program Manager" |
| `MaintenanceSustainability` | "Maintenance" (short) or "Maintenance & Sustainability" (full) |
| `Sponsor` | "Sponsor" |
| `Admin` | "Admin" |

In confined UI (badges in tables, cards), use short form for `Maintenance`. In headings, use full form.

## Empty states

Empty states explain what's missing and how to populate it.

| Where | Title | Body | Action |
|---|---|---|---|
| Projects list, no projects | "No projects yet" | "Be the first to submit an AI project idea." | "Submit project" |
| Projects list, filters return nothing | "No projects match your filters" | "Try clearing some filters or adjusting the search." | "Clear filters" |
| Training catalog, no results | "No trainings match" | "Try a different keyword or remove filters." | "Clear filters" |
| Project detail, no audit log | "No activity yet" | "Activity will appear here as the project progresses." | (none) |
| Project detail, no tool stack | "No tools selected" | "Choose tools from the recommendations or build your own stack." | "Customise stack" |
| Recommendation page, all scores below threshold | "No strong matches yet" | "Add more detail to your submission to get better recommendations." | "Back to submission" |

Never use "No data" — too generic. Always name what's missing.

## Error and failure messages

Errors say what happened and how to fix it. Errors never apologise.

| ✅ Use | ❌ Avoid |
|---|---|
| "Couldn't save stack — primary tool is required." | "Oops! Something went wrong." |
| "Project title can't be empty." | "Invalid input." |
| "Choose a group before continuing." | "Required field." |
| "This role can't act on the current stage." | "Permission denied." |
| "Data sensitivity exceeds what this tool supports." | "Tool unavailable." |

For network / unexpected errors: "Couldn't load. Try refreshing the page."

## Tooltip text

Plain, short, useful. Never restate the visible label.

| ✅ Use | ❌ Avoid |
|---|---|
| (tooltip on disabled "Mark complete") "Only AI Program Manager or supporting roles can act on Deployment." | "Disabled" |
| (tooltip on a tool icon) "Copilot Studio — Conversational AI by Microsoft" | "Tool" |
| (tooltip on stage circle) "Development — Completed by Nico Cabangal on 12 June" | "Done" |

## Demo-specific copy

The demo banner is the same on every page. It is the only place we explicitly say "demo":

> **DEMO MODE — Phase 0. Data stored locally in your browser. No backend connected.**

The login footer is the second place:

> Phase 0 — VM-hosted demo · No real backend · No real auth

Nowhere else in the UI should we apologise for being a demo or mention that things are "coming soon" — except the genuine "Coming Soon" trainings in the catalog, which use the `availableFromLabel` text from seed data.

## Recommendation engine rationale text

Engine-generated rationale strings follow this pattern:

> "{Tool name} is a strong fit for {primary use case from typicalUseCases[0]}. {Reason from top rule fired}."

Examples:
- "Copilot Studio is a strong fit for ticket triage. The submission emphasises a conversational agent for field engineers."
- "Power BI is a strong fit for dashboards and KPIs. The team already uses Power BI in their workflow."
- "Azure ML is a strong fit for predictive maintenance. The submission asks for failure forecasting."

Risk flags are full sentences:
- "Data sensitivity Confidential exceeds tool max Internal."
- "Requires Advanced skill — team has Intermediate skill."

## Capitalisation rules summary

- Headings: sentence case ("Recommended tool combos").
- Buttons: sentence case ("Save stack").
- Badges: UPPERCASE ("IN PROGRESS", "PRIMARY", "ADD-ON").
- Eyebrows / labels above sections: UPPERCASE with letter-spacing ("ALL TRAININGS").
- Names of stages in steppers: Title Case ("Assessment", "Supplier Oversight").
- Names of tools: as the vendor writes them ("Copilot Studio", "Power Automate", "Azure ML", "Microsoft 365 Copilot").
