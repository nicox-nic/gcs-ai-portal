# V3-PHASE-8 — Business Analyst Delivery Involvement (Requirements + UAT)

> **Cursor — read this fully before editing. Surgical feature phase; Phases 0–7 are merged (1.0 is live).**
> Standing rules:
> - Do **not** regenerate files. **Read each target file first**, then `str_replace`/surgical edits. If a target differs or a change would clobber a fix, **stop and report**.
> - Never `git add -A` blindly — stage intended files, report anything else modified.
> - End at green `npm run build` **and** `npm run test`.
> - **Git — MILESTONE phase → commit AND push to `main`.** After green build+tests **and** the Step 9 verification, `git commit -m "feat(ba): BA assignment + gated requirements & UAT artifacts + work queue [Phase 8]"` then **`git push origin main`** (Vercel deploy — confirm in report). Never force-push.
> - Report to **`docs/refactor1/V3-PHASE-8_REPORT.md`**.

## Why
The BA audit (`AUDIT-BA_Role_Capability.md`) found the BA is *Responsible* (RACI) for **Requirements Definition** (Development) and **UAT** (Deployment) but the app only lets it advance the stage generically — no owned artifacts. This phase makes BA involvement **explicit, visible, and enforced**, without changing the ISO stage machine's structure. Pattern = a **light role-owned overlay** on the existing Development and Deployment stages (like the Phase-5 tier overlay).

## Confirmed design decisions
- **Assignment keystone:** a project has an assigned **Business Analyst** (`businessAnalystId`); the two artifacts, the work queue, and notifications all key off it.
- **Gate strength:** **hard gate** — the artifact must be BA-signed-off before its stage can Complete. **Admin can override** (demo flexibility). **Tier1 = optional/self-attest; Tier2 & Tier3 = mandatory.**
- **Artifact richness:** **lightweight-structured** (a short editable item list + sign-off), not a test/requirements-management tool.
- **Assign when:** Governance assigns the BA at **qualification** (picker on the Qualification tab), editable later by Governance/PM.

## Read first
- `src/types/index.ts` (`Project`, `Role`), `src/data/seedRoles.ts` (`usr-ba`), `src/data/seedProjects.ts`.
- `src/lib/lifecycle.ts` (`canActOnStage`, `getAllowedTransitions`, Development/Deployment meta), `src/stores/projectsStore.ts` (`advanceStage`, `applyStatusSideEffects`, `qualifyProject`, `submitForSponsorApproval`).
- `src/components/project/ProjectDetailTabs.tsx` (`ProjectLifecycleTab`, `TransitionButtons`, `ProjectOverviewTab`), `src/components/project/ProjectQualificationTab.tsx` (BA picker at qualify), `src/components/project/StatusGateActions.tsx`.
- `src/lib/tiering.ts` (tier → mandatory vs optional), `src/lib/notificationRules.ts`, `src/pages/DashboardPage.tsx` + `src/lib/dashboardStats.ts` (role callouts), `src/lib/ciPortalAdapter.ts` (`toRecord`, `CiPortalRecord`), `src/pages/ProfilePage.tsx`.

---

## Step 1 — Data model
- `Project.businessAnalystId: string | null`.
- `RequirementItem = { id: string; text: string; priority: 'Must'|'Should'|'Could' }`.
- `RequirementsArtifact = { items: RequirementItem[]; notes: string; confirmedBy: string | null; confirmedAt: string | null }`.
- `UatCase = { id: string; description: string; result: 'Pass'|'Fail'|'Untested' }`.
- `UatArtifact = { cases: UatCase[]; outcome: 'Pass'|'Fail'|'Pending'; notes: string; signedOffBy: string | null; signedOffAt: string | null }`.
- `Project.requirements: RequirementsArtifact | null` and `Project.uat: UatArtifact | null` (null until started).
- Reseed defaults (see Step 7). Keep everything nullable so existing seeds stay valid.

## Step 2 — Assignment
- **Qualification tab (`ProjectQualificationTab`):** add a **Business Analyst picker** (from users with role `BusinessAnalyst`) in the qualify form; store `businessAnalystId` via `qualifyProject` (extend its payload). Not required to qualify, but surface a "no BA assigned" hint.
- Store action **`assignBusinessAnalyst(projectId, baUserId | null, actor)`** — Governance/PM/Admin — editable after qualification (small control on the project header or Overview). Audit + `lastActivityAt`.
- Show the assigned BA on `ProjectHeaderCard` (name + role badge), and a "Business Analyst" column in the CI mirror (Step 6).

## Step 3 — Requirements artifact + gate (Development)
- **`src/lib/baArtifacts.ts`** (new, unit-tested): `requirementsComplete(project)` = artifact has ≥1 item **and** `confirmedBy != null`; `isBaGateMandatory(project)` = tier is Tier2/Tier3; helper `canEditRequirements(project, user)` = user is the assigned BA (or Admin).
- **UI** on the Development stage card in `ProjectLifecycleTab` (and a compact mirror on Overview when `currentStage === 'Development'`): a **Requirements** panel —
  - Assigned BA (or Admin) edits: add/remove/edit requirement items (text + priority), notes, then **Confirm requirements** (stamps `confirmedBy`/`confirmedAt`).
  - Tier1: a single **"Self-attest requirements"** shortcut instead of the full ceremony (still records a confirm).
  - Everyone else: read-only summary + confirmed state.
- **Hard gate:** block the Development stage `Complete` transition unless `requirementsComplete` (or Tier1 self-attested), **except Admin override**. Enforce in **both** places: `getAllowedTransitions`/`TransitionButtons` (hide/disable Complete with a reason tooltip) **and** the store `advanceStage` (throw if gate unmet and actor ≠ Admin). Store actions: `saveRequirements`, `confirmRequirements`.

## Step 4 — UAT artifact + gate (Deployment)
- In `baArtifacts.ts`: `uatPassed(project)` = `uat.outcome === 'Pass'` **and** `signedOffBy != null`; `canEditUat(project, user)` = assigned BA (or Admin).
- **UI** on the Deployment stage card (+ Overview mirror when `currentStage === 'Deployment'`): a **UAT** panel — assigned BA adds acceptance cases, marks each Pass/Fail, sets overall outcome, and **Signs off** (stamps `signedOffBy`/`signedOffAt`). Tier1: self-attest shortcut. Others read-only.
- **Hard gate:** block the Deployment stage `Complete` unless `uatPassed` (or Tier1 self-attest), except Admin override — enforced in `TransitionButtons` **and** `advanceStage`. A **Fail** outcome blocks completion and the panel points to remediation (Data Engineering's job). Store actions: `saveUat`, `signOffUat`.
- **Optional stronger link (implement it):** `submitForSponsorApproval` additionally requires `uatPassed` for Tier2/Tier3 (Tier1 exempt) — so a project can't close without having passed acceptance. Guard + clear message.

## Step 5 — BA work queue + notifications
- **Dashboard callout** for `BusinessAnalyst` (mirror the Governance/EHS/Sponsor pattern): "N projects need your requirements" (assigned-BA + `currentStage Development` + not yet confirmed) and "N need your UAT sign-off" (assigned-BA + `currentStage Deployment` + not passed), deep-linking to `/projects` filtered. Add the needed counts to `dashboardStats` (`baRequirementsQueue`, `baUatQueue`) scoped to the current user as BA.
- **Profile → My Entries:** add an "Assigned to me (BA)" section (`businessAnalystId === currentUser.id`) alongside the existing submitter list.
- **Notifications (`notificationRules.ts`):** add kinds `requirements-requested` (emitted when a project enters Development with an assigned BA) and `uat-requested` (enters Deployment) → **TO the assigned BA**, CC Governance/PM; and `requirements-confirmed` / `uat-signed-off` → TO the primary owner (DataEngineering/PM), CC Governance. Emit from the relevant `advanceStage`/confirm/sign-off paths. (This finally makes the BA a real notification recipient.)

## Step 6 — CI mirror
Add to `CiPortalRecord` / `toRecord`: **Business Analyst** (assigned BA display name), **Requirements** (Confirmed / Pending / —), **UAT** (Pass / Fail / Pending / —). Show the columns on `/ci-portal`.

## Step 7 — Seeds (`src/data/seedProjects.ts`)
Make it demoable immediately:
- Assign `usr-ba` (Chris Aguillon) as `businessAnalystId` on several Active/qualified+ projects across tiers.
- One **Active Tier2/Tier3 in `currentStage: Development`** with requirements **not yet confirmed** → live "BA confirms requirements → Development can complete" demo.
- One **Active in `currentStage: Deployment`** with UAT **pending** → live "BA runs + signs off UAT" demo, plus one with a **Fail** to show the block.
- Completed seeds: backfill confirmed requirements + passing UAT so history is coherent.
- A Tier1 project showing the self-attest shortcut.

## Step 8 — Tests
Extend vitest: `requirementsComplete` / `uatPassed` truth tables; `isBaGateMandatory` (Tier1 false, Tier2/3 true); `advanceStage` throws on Development-Complete without confirmed requirements for Tier2 (and allows Admin override); `submitForSponsorApproval` blocked without passing UAT for Tier3.

## Step 9 — Verify · Git (milestone) · report
1. `npm run build` ✅ and `npm run test` ✅.
2. Manually, as **BusinessAnalyst (`usr-ba`)**: dashboard shows the two BA queues; open a Tier2 Development project → the Development Complete button is **blocked** until you add requirements + **Confirm** → then DE/PM/BA can complete the stage. Open a Deployment project → add UAT cases, a **Fail** blocks completion, flip to **Pass** + **Sign off** → completion unblocks. Confirm a **non-assigned** BA sees read-only. As **Governance**, assign/reassign the BA. Check the BA notifications, the CI-mirror columns, and Admin override.
3. `git commit` (message above) → **`git push origin main`** → confirm Vercel deploy.
4. Write **`docs/refactor1/V3-PHASE-8_REPORT.md`**: data-model additions, the two gates (where enforced), assignment flow, BA queue/notifications, CI columns, seed setup, push/deploy confirmation, anything skipped/flagged — and note this closes audit items #4, #7, #9, and #10/#11 for the BA.
