# Demo Data Scenarios

The seed projects are crafted so a stakeholder clicking through the demo sees a coherent story, not random fill content. This document explains the story so any developer or AI generating seed data understands the narrative.

## The cast of seven projects

| # | Title | Submitter | Stage | Status | Story role |
|---|---|---|---|---|---|
| 1 | Service Ticket Triage Copilot | Maria Santos | Deployment | InProgress | **The headline demo.** Multi-tool stack actively being deployed. |
| 2 | Repair Time Prediction Model | Nico Cabangal | Development | InProgress | Shows Data Engineering owner action. |
| 3 | Knowledge Base QA Agent for Field Engineers | Maria Santos | Assessment | Submitted | Pending qualification — shows Governance Lead action. |
| 4 | Anomaly Detection on Tester Logs | Nico Cabangal | Development | OnHold (Blocked) | Shows risk / blocked path. |
| 5 | Automated UAT Report Generator | Chris Aguillon | Use | Completed (validated) | Closed project showing benefits validation. |
| 6 | Customer Sentiment Dashboard | Randy Asignar | Use | InProgress | Marketing group, single-tool stack. |
| 7 | Spare Parts Demand Forecast | Nikki Aberion | Improvement | Completed (validated) | Costa Rica, sustaining phase. |

## The journeys you can demo

### Journey A — "I'm a Submitter and I'm starting fresh"
1. Log in as **Maria Santos** (Submitter).
2. Click "Submit New Project" → wizard opens.
3. Fill in: title "Service Ticket Triage Copilot 2", use case "agent for field engineers", data sensitivity "Internal", existing tools include "SharePoint" and "Teams", skill "Intermediate".
4. See **3 combo recommendations**, top one is "Triage Agent Stack" at ~94%.
5. Click "Select this stack" — the Selected Stack Summary bar updates.
6. Click "Customise stack" — see the dialog with Copilot Studio as primary, SharePoint and Power Automate as add-ons. Try toggling Power BI on (becomes a green add-on).
7. Save. Continue to project. See the new project in the list.

This journey hits: wizard, recommendation engine, combo selection, customise dialog, project detail. Five of the seven mockups.

### Journey B — "I'm Governance Lead, qualify this submission"
1. Log in as **John Gicale** (Governance Lead).
2. Dashboard shows the indigo callout: "Pending qualification: N projects awaiting your review".
3. Open project **prj-058 — Knowledge Base QA Agent for Field Engineers**.
4. See it's at Assessment / InProgress. As Governance Lead you CAN act here.
5. Click "Mark Complete" — dialog opens for optional note. Note something like "Approved — clear business case".
6. Status changes to Qualified. The project auto-advances to Policy / NotStarted.
7. Audit log gains a new entry attributed to John Gicale.

This journey hits: dashboard role-aware callouts, role-based gating, stage transitions, audit log.

### Journey C — "I'm Data Engineering, ship Development"
1. Log in as **Nico Cabangal** (Data Engineering).
2. Open **prj-031 — Repair Time Prediction Model** (currently in Development).
3. As Data Engineering you ARE the primary owner of Development. Buttons are enabled.
4. Click "Mark Complete" on Development. Note "Model validated, MAE < 4 hours".
5. Project auto-advances to Deployment / NotStarted. The current stage card now shows AI Program Manager as primary owner, your buttons go disabled with the role-gate tooltip.
6. Switch role to **Randy Asignar** (AI Program Manager). The same project's buttons are now enabled. You see what handoff feels like.

This journey hits: role-gated UI, transition flow, the handoff moment.

### Journey D — "I'm a Sponsor, validate the win"
1. Log in as **Evan Gonzalez** (Sponsor).
2. Open **prj-019 — Automated UAT Report Generator**. It's already validated (sponsorValidated: true).
3. Open the "Benefits & Closure" tab. See the comparison: Expected 20 hrs/month vs Reported 24 hrs/month. Green check on validated.
4. Now open **prj-008 — Spare Parts Demand Forecast** to see another validated example, this time from Costa Rica.

This journey hits: benefits flow, the sponsor view.

### Journey E — "I'm an Admin, manage catalogs"
1. Log in as **Albert Arimbay** (Admin).
2. Visit Admin page.
3. Tour the Tools tab → 10 tools with edit/delete actions.
4. Tour the Trainings tab → 14 trainings; the Azure ML Bootcamp is in "Coming Soon" state.
5. Tour the Combos tab → 5 combos with their primary + add-on configurations.
6. Tour the Users tab → read-only list of the 9 seeded identities, with a note that user management will sync from Entra ID in production.
7. Show Demo Controls: "Reset Catalog to Seed", "Reset Projects to Seed", "Clear All Local Data" — all three require ConfirmDialog approval before executing.

This journey hits: catalog management, the demo reset mechanic.

## The dashboard tells a story

Without the user doing anything, the dashboard alone should convey:

- "We have AI traction" — 476 total, 218 in progress, 142 completed, 12,480 hours saved.
- "Japan is the most AI-active site by percentage" — 75% adoption despite small absolute numbers.
- "Cebu has the most projects in absolute terms" — 300 — but lowest adoption percentage at 16%, suggesting headroom.
- "PROGs leads completion rate" at 38%, "Marketing is small but engaged" at 31% adoption.
- "Copilot Studio is the most-used tool", "Power BI second, Power Automate third" — informs the Microsoft-stack tilt.

If a stakeholder takes a screenshot of just the dashboard, they should understand the program's shape and momentum.

## Recent Activity is the demo's heartbeat

Show 5 recent transitions with role + group context. These should appear realistic:

1. **Daniel R.** moved Repair Time Prediction to Deployment · 2 hours ago · PROGs
2. **Evan G.** validated benefits on UAT Report Generator · Yesterday · Sponsor
3. **John G.** qualified Sentiment Dashboard · 2 days ago · Governance Lead
4. **Jessica B.** flagged risk on Tester Log Anomaly · 3 days ago · Risk & Compliance
5. **Sophia C.** submitted Knowledge Base QA Agent · 3 days ago · Engineering

Mix of role types, mix of actions (move, validate, qualify, flag risk, submit), mix of group attribution. Notice these names include both seeded users (John, Jessica, Evan) and dashboard-only random names (Daniel, Sophia).

## Time anchoring

All timestamps anchor to a stable "demo today" rather than literal real-time. Use this constant pattern:

```ts
// src/data/seedProjects.ts
const DEMO_TODAY = new Date('2026-06-20T08:00:00Z');

function daysAgo(n: number): string {
  return new Date(DEMO_TODAY.getTime() - n * 86400000).toISOString();
}
```

`formatRelative()` uses `formatDistanceToNow` with `addSuffix: true` against the current real-world clock — so "2 hours ago" stays "2 hours ago" only if the user opens the demo on June 20, 2026. For long-lived demos, the relative labels drift. That's acceptable — the absolute timestamp in tooltips and audit logs is still meaningful.

For Phase 0, accept this drift. If demo dates need to always say "Yesterday", swap `formatRelative` to compute against `DEMO_TODAY` instead of `new Date()`. Leave a comment in `utils.ts` explaining the choice.

## "Reset Demo" mechanic

The Admin page exposes three reset actions. **All three are destructive and require a ConfirmDialog approval before executing** — the dialog states what will be wiped, warns the action cannot be undone, and offers Cancel + a destructive-variant confirm button.

1. **Reset catalog to seed** — re-imports `SEED_TOOLS`, `SEED_TRAININGS`, `SEED_COMBOS`. Useful when a stakeholder has messed with the catalog.
2. **Reset projects to seed** — re-imports `SEED_PROJECTS`. Clears any project the demo audience created.
3. **Clear all local data** — wipes all three persist keys from localStorage and reloads. The most aggressive option; the dialog wording for this one should be strongest.

These exist so the demo always starts in a known state. Between back-to-back stakeholder sessions, use "Clear all local data".

## Anti-patterns to avoid in seed content

- ❌ Lorem ipsum.
- ❌ Generic "Project A", "Project B" titles.
- ❌ Generic "User1", "User2" names.
- ❌ All projects at the same lifecycle stage.
- ❌ All projects in the same group/site.
- ❌ Submission text that's a single sentence — make problems specific and concrete.
- ❌ Round numbers everywhere (476, 12,480, 24, 32, 40 — use a mix; pure 500/1000/10000 feels fake).
- ❌ A flawless dashboard with all green KPIs. Include one OnHold and one Blocked to show the system handles non-happy paths.

## What "good demo data" feels like

If a stakeholder reads any single project's submission text, they should think:
- "This sounds like a real GCS use case."
- "This problem statement is specific enough that I could imagine a junior engineer writing it."
- "The expected outcome is measurable and reasonable."

Generic data kills demos. Specific, mildly-imperfect, recognisable-to-the-industry data sells them.
