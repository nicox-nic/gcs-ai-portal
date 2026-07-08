# V3-PHASE-5 — Per-Tier Development Overlay + Sponsor-Approval Closure

> **Cursor — read this fully before editing. Surgical refactor; Phases 0–4 are merged.**
> Standing rules:
> - Do **not** regenerate files. **Read each target file first**, then `str_replace`/surgical edits. If a target differs or a change would clobber a later fix, **stop and report**.
> - Never `git add -A` blindly — stage intended files, report anything else modified.
> - End at green `npm run build` **and** `npm run test`.
> - **Git — MILESTONE phase → commit AND push to `main`.** After green build+tests **and** the Step 8 verification, `git commit -m "feat(closure): per-tier development overlay + sponsor-approval closure [Phase 5]"` then **`git push origin main`** (Vercel deploy — confirm in the report). Never force-push.
> - Report to **`docs/refactor1/V3-PHASE-5_REPORT.md`**.

## Scope (V3 item 4 completion + closure)
Two things, both **light overlays** on the existing model — no new stages, no per-tier sub-workflows:
- **A. Per-tier development overlay** on the `Active` phase — tier display, tier-aware stack ownership (finishing the Phase-4 TODO), tier-specific development guidance, and a "separate project review" captured as an audit entry (Tier2/Tier3).
- **B. Sponsor-approval closure** — `Active → ForSponsorApproval → Completed | Disapproved`, absorbing today's benefits-reporting/validation step. **`Completed` arrives only from sponsor approval.**

## V3 statuses (already in the graph)
`Active → ForSponsorApproval | Idle` · `ForSponsorApproval → Completed | Disapproved` · `Disapproved → Active | ForSponsorApproval`. (Idle is Phase 6.)

## Read first
- `src/lib/projectStatus.ts`, `src/stores/projectsStore.ts` (existing `reportBenefits` / `validateBenefits` — **`validateBenefits` will be superseded**; `activateProjectFields`).
- `src/components/project/StatusGateActions.tsx` (extend the switch), `src/components/project/ProjectDetailTabs.tsx` (`ProjectOverviewTab`, `ProjectBenefitsTab`, Tool Selection edit gate), `src/pages/ProjectDetailPage.tsx` (`showBenefitsTab`).
- `src/types/index.ts` (`ProjectTier`, `RISK_BY_TIER`, `sponsorDecision`/`sponsorDecisionNote`, `sponsorId`), `src/lib/lifecycle.ts` (Use stage, sponsor/PM/BA RACI).
- `src/components/common/StatusBadge.tsx` + wherever tier could show (`ProjectHeaderCard`, `ProjectsListPage`), `src/lib/dashboardStats.ts` (`hoursSaved` uses `sponsorValidated`), `src/data/seedProjects.ts`, `src/data/seedRoles.ts` (Sponsor user).

---

## A. Per-tier development overlay

### A1 — Tier display (`src/components/common/TierBadge.tsx`, new + tier meta)
Add tier meta: `Tier1 → { label:'Self-build', risk:'Low' }`, `Tier2 → { label:'Collaborative', risk:'Medium' }`, `Tier3 → { label:'Team-led', risk:'High' }`, each with a distinct token palette (reuse existing tokens; e.g. Tier1 teal / Tier2 amber / Tier3 coral-red). `TierBadge` renders "Tier N · {label}". Show it on `ProjectHeaderCard`, the `ProjectsListPage` row, and (compact) on the dashboard where tier is relevant. Null tier → no badge.

### A2 — Tier-aware stack ownership (finish Phase-4 TODO)
Add `getStackOwnerRoles(tier): Role[]` in `src/lib/tiering.ts` (new):
- `Tier1` → submitter (owner) + `DataEngineering` + `Admin` (self-build)
- `Tier2` → `DataEngineering` + `AIProgramManager` + `BusinessAnalyst` + `Admin` (collaborative)
- `Tier3` → `AIProgramManager` + `DataEngineering` + `Admin` (team-led; submitter hands-off)
Replace the flat Phase-4 tool-selection/customise gate with a tier-aware `canOwnStack(project, user)` (Tier1 also allows the submitter). Remove the `// TODO(V3 Phase 5)` marker.

### A3 — Tier & Development card (`ProjectOverviewTab`)
For `Active`+ projects, add a compact **"Tier & Development"** card: tier badge + risk, the development approach, **who develops** (from `getStackOwnerRoles`), and short tier guidance —
- Tier1: self-build; **annual review** reminder note.
- Tier2: collaborative build with **PM/BA** involvement; project review checkpoint.
- Tier3: **PM/team-led** build; project review checkpoint.

### A4 — "Separate project review" (Tier2/Tier3)
Add `logProjectReview(projectId, note, actor)` — appends an **audit entry** tagged as a project review (no status/stage change), available for Tier2/Tier3 while `Active`, gated to `AIProgramManager` / `GovernanceLead` / `Admin`. Surface a **"Log project review"** button + the review entries in the Tier & Development card. *(The mock notification for this arrives in Phase 6 — leave a `// TODO(V3 Phase 6): emit notification` note.)*

---

## B. Sponsor-approval closure

### B1 — Store actions (`src/stores/projectsStore.ts`)
Add (graph-validated, role-gated, audit + `lastActivityAt`):
| Action | Transition | Roles |
|--------|-----------|-------|
| `submitForSponsorApproval(projectId, { reportedBenefitHours, sponsorId? }, actor)` | `Active → ForSponsorApproval` (guard: benefit hours reported); assigns `sponsorId` if provided | submitter, DataEngineering, AIProgramManager, Admin |
| `sponsorApprove(projectId, actor, note)` | `ForSponsorApproval → Completed`; set `sponsorDecision:'Approved'`, `sponsorValidated:true`; mark `stageStatus.Use:'Completed'` | Sponsor (esp. the assigned `sponsorId`), Admin |
| `sponsorDisapprove(projectId, reason, actor)` | `ForSponsorApproval → Disapproved`; set `sponsorDecision:'Disapproved'`, `sponsorDecisionNote` | same |
| `reviseAfterDisapproval(projectId, actor)` | `Disapproved → Active` | owner roles |

**Supersede `validateBenefits`:** completion now happens via `sponsorApprove` (which sets `sponsorValidated:true`, keeping the dashboard `hoursSaved` calc intact). Remove the standalone `validateBenefits` call path (or leave the function but stop using it — report which). Keep `reportBenefits` for entering hours while `Active`.

### B2 — Closure UI
- Extend **`StatusGateActions`**: `Active` + owner → **Submit for sponsor approval** (with sponsor picker if `sponsorId` unset; disabled until benefit hours reported); `ForSponsorApproval` + Sponsor/Admin → **Approve** / **Disapprove** (reason); `Disapproved` + owner → **Revise & resubmit**.
- **`ProjectBenefitsTab`** becomes the closure surface: while `Active`, the owner reports benefit hours (existing `reportBenefits`); at `ForSponsorApproval`, show expected vs reported for the sponsor; at `Completed`, a read-only **closure summary** (reported hours, sponsor decision + who/when, tier).
- **`showBenefitsTab`**: include `Active` (so hours can be reported before closure) alongside the existing statuses.

---

## Step 7 — Seeds (`src/data/seedProjects.ts`)
- Ensure an **Active Tier1** seed exists (self-build demo) plus the existing Active Tier2/Tier3.
- Add one **`ForSponsorApproval`** seed (benefit hours reported, `sponsorId` assigned) → sponsor-approval demo.
- Ensure **Completed** seeds carry `sponsorDecision:'Approved'`, `sponsorValidated:true`, and `reportedBenefitHours` (closure summary + `hoursSaved`).
- Optionally one **`Disapproved`** seed to show the revise loop.
Confirm a **Sponsor** persona exists in `seedRoles`; if the closure demo needs an assigned sponsor, wire it.

## Step 8 — Tests
Extend vitest: `submitForSponsorApproval` blocked until hours reported; `sponsorApprove` → `Completed` + `sponsorValidated:true`; `canOwnStack` per tier (Tier3 excludes a bare submitter, Tier1 includes the submitter).

## Step 9 — Verify · Git (milestone) · report
1. `npm run build` ✅ and `npm run test` ✅.
2. Manually: open an **Active Tier1** project → Tier & Development card shows self-build + annual-review note; a bare submitter can own the stack. Open an **Active Tier3** → PM/team-led, submitter cannot edit stack; **Log project review** appends an audit entry. Report benefit hours → **Submit for sponsor approval** → `ForSponsorApproval` → log in as **Sponsor** → **Approve** → `Completed` with closure summary; and **Disapprove** → `Disapproved` → revise.
3. `git commit` (message above) → **`git push origin main`** → confirm Vercel deploy.
4. Write **`docs/refactor1/V3-PHASE-5_REPORT.md`**: per-file changes, tier meta + `getStackOwnerRoles`, closure actions + what happened to `validateBenefits`, seed additions, push/deploy confirmation, anything skipped/flagged.
