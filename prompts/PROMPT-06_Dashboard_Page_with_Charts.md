# GCS AI Project Portal — Cursor Prompt 6

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

## Prompt 6 — Dashboard Page with Charts

```
Continue building the GCS AI Project Portal demo.

Build the Dashboard page — the landing experience after login.

**Reference: MOCKUP-DASHBOARD.** Match the layout, chart types, and section order exactly.

`src/pages/DashboardPage.tsx` — shown here from the Governance Lead view for reference; behavior is role-aware.

Layout in this exact order:

1. **PageHeader row** — title "Dashboard", subtitle "Welcome back, {firstName}. Here's what's happening across GCS AI projects." Right side: a small role pill ("Governance Lead view" — uses humanizeRole) + primary "Submit New Project" button (visible only to allowed roles).

2. **4 KPI cards** (grid-cols-4, gap 10px). Each card: icon (14px) + label (11px, muted) on top, large number (22px, weight 500), small context line (10px, tertiary).
   - Total Projects — count of all projects. Context: "Across all stages"
   - In Progress — count where status === 'InProgress'. Context: "Active builds"
   - Completed — count where status === 'Completed'. Context: "Validated by sponsor"
   - Hours Saved — sum of reportedBenefitHours across validated projects, formatted with thousands separator. Context: "Per month, reported"

3. **Role-aware callout strip** (only renders for certain roles):
   - GovernanceLead → "Pending qualification: N projects awaiting your review" (indigo strip `#EEEDFE`)
   - Sponsor → "Awaiting your validation: N projects" (uses `EAF3DE` green tint)
   - RiskCompliance → "High-risk projects: N" (uses `FCEBEB` red tint)
   - Otherwise: hidden.

4. **Two-chart row** (grid-cols-2, gap 12px):
   - **Projects by Lifecycle Stage** — bar chart (recharts BarChart), x-axis stages abbreviated ("Assess", "Policy", "Supplier", "Develop", "Deploy", "Use", "Improve", "Decom."), y-axis count. Indigo bars `#534AB7`.
   - **Completion Rate by Group** — horizontal bar showing % completed-out-of-submitted per group. Each row shows the group name, the percentage, then "X of Y" in muted text. Colors match GroupBadge palette (Engineering indigo, PROGs green, Field blue-gray, Marketing pink). Sort descending by percentage.

5. **Two-chart row** (grid-cols-2, gap 12px):
   - **AI Adoption by Group** — horizontal bars. Compute as `projectCount / GROUP_HEADCOUNT[group]`. Each row: group name, percentage, "X of Y" in muted text. Same color palette as Completion Rate.
   - **AI Adoption by Location** — horizontal bars. Compute as `projectCount / SITE_HEADCOUNT[site]`. Sort descending. Use distinct site colors: Japan `#C53030`, Korea `#2B6CB0`, Costa Rica `#1D9E75`, Cebu `#B58A2D`.

6. **Two-chart row** (grid-cols-2, gap 12px):
   - **Top Recommended Tools** — horizontal bars, top 6 tools by count of projects where the tool appears as primary in `toolStack`. Indigo bars. Label width 100px, counts right-aligned with width 30px.
   - **Top Contributors** — vertical list of the 5 users with the most projects (counted as either submitter or stack member). Each row: rank number (gold/silver/bronze for top 3 using colors `#BA7517` / `#888780` / `#B07D4A`), 24px circular avatar with initials and role-colored background, display name (weight 500) + group label below (10px, muted), count (weight 500) on the right. **The sub-label below each name is the user's GROUP, not their role.**

7. **Recent Activity** (full-width card at the bottom):
   - Title "Recent Activity" with "Last 5 transitions" muted on the right.
   - 5 rows showing the latest StageTransition entries across all projects, newest first.
   - Each row: 22px avatar with role-colored initials → main line ("**Daniel R.** moved **Repair Time Prediction** to Deployment", project title colored `#185FA5`) → sub-line (relative time · group label, 10px muted). Sub-label is the actor's group, matching the Top Contributors pattern.

All numbers must come from live state via selectors — never hardcoded. Use `useMemo` for derived calculations.

Visual quality bar: spacing 10–12px between cards, soft chart gridlines, no chart junk, tooltips on hover. This is the first screen stakeholders see — make it look intentional.
```

---
