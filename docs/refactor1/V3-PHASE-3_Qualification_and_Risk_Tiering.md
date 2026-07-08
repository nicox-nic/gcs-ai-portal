# V3-PHASE-3 — Qualification + Risk Tiering (Governance Gate)

> **Cursor — read this fully before editing. Surgical refactor; Phases 0–2 are merged.**
> Standing rules:
> - Do **not** regenerate files. **Read each target file first**, then `str_replace`/surgical edits. If a target differs from what's described or a change would clobber a later fix, **stop and report**.
> - Read profiles from `profileStore`; read tool catalog from `catalogStore`.
> - Never `git add -A` blindly — stage intended files, report anything else modified.
> - End at green `npm run build` **and** `npm run test`.
> - **Git — NON-milestone phase → commit, do NOT push.** After green build+tests, `git commit -m "feat(qualification): AI readiness + qualification checklists + risk tiering [Phase 3]"`. **No push** — lands with the Phase 4 milestone deploy. (Note for later phases: the deploy branch is **`main`**, not `master`.)
> - Report to **`docs/refactor1/V3-PHASE-3_REPORT.md`**.

## Scope (V3 item 4 groundwork; AI Checklist encoded)
Build the **Governance qualification gate** for a `ForAssessment` project: the **AI Readiness** assessment, the **AI Qualification** checklist, **risk-tier** assignment, and **reward category** — then the decision transition. This **replaces the Phase-0 interim seam** (`Assessment Completed → Qualified`). **Risk drives tier** (Tier1=Low, Tier2=Medium, Tier3=High); Governance assigns it. Do **not** implement any "submitter-role auto-tier" rule (that older Data-team model is superseded).

## Read first
- `src/lib/projectStatus.ts` (graph already has `ForAssessment → Qualified | NotQualified`, `IdeaDraft/NotQualified/Rejected/EHSRejected → Cancelled`, `NotQualified → ForAssessment`).
- `src/stores/projectsStore.ts` — **the interim rule in `applyStatusSideEffects`** to remove, and where to add explicit actions.
- `src/types/index.ts` — `ReadinessAssessment`, `QualificationAssessment`, `ProjectTier`, `RewardCategory`, `RISK_BY_TIER`, and the `Project.tier/tierRationale/rewardCategory/qualification/readiness` fields (all added in Phase 0).
- `src/pages/ProjectDetailPage.tsx` + `src/components/project/ProjectDetailTabs.tsx` (tab shell — add a Qualification tab), `src/lib/lifecycle.ts` (`canActOnStage`, Assessment RACI), `src/lib/dashboardStats.ts` (`pendingQualification`), `src/data/seedProjects.ts`.

---

## Step 1 — Criteria constants (`src/lib/qualificationCriteria.ts`, new)
Encode the checklists **verbatim** from the AI Checklists workbook.

**AI Readiness** — 3 dimensions × 7 items, score 0/1, **≥4 per dimension = Met**, **all three Met to proceed**:
- **Feasibility** ("Can we realistically build, deploy, and operate this AI?"): `Required data is available, lawful, and appropriate` · `Data quality is sufficient for reliable outputs` · `Models and infrastructure are technically available` · `Internal skills exist to build or configure the solution` · `Integration with existing environment (e.g., M365) is feasible` · `Operational support is feasible (monitoring, retraining, incidents)` · `Aligned with AI Governance Policy and contractual obligations`
- **Viability** ("Does this make business sense and sustain over time?"): `Clear linkage to GCS strategic objectives` · `Business benefits are clearly defined and measurable (Cost Savings, FTE, etc.)` · `Total costs are understood` · `Expected value justifies total cost` · `Solution can scale without disproportionate cost growth` · `Long-term support is viable` · `Governance controls are maintainable across lifecycle`
- **Desirability** ("Do users and stakeholders actually want and accept this AI?"): `Addresses a real and validated user pain point` · `Provides clear value to end users` · `Fits into existing workflows (e.g., M365 tools)` · `Supports transparency and human oversight` · `Builds user trust and acceptance` · `Change impact (skills, roles, adoption) is manageable` · `No critical adoption barriers identified`

**AI Qualification:**
- **Section A – Primary (Determining) — ANY true ⇒ AI project (then do B + D):**
  - A1 *Learning or Adaptation* — uses machine/deep/reinforcement/statistical learning
  - A2 *Learning or Adaptation* — learns or improves performance from data or experience
  - A3 *Automated Reasoning / Decision Support* — inference, prediction, classification, recommendation, or optimization
  - A4 *Data-Driven Model Usage* — relies on trained models and training/validation/inference datasets
  - A5 *Perception / Language Processing* — interprets text, speech, images, video, or sensor data (NLP, OCR, CV)
  - A6 *Generative Capability* — generates new content using probabilistic/generative models
- **Section B – Supporting (non-determining; flags controls needed):** B1 uses third-party AI services/APIs · B2 includes training, fine-tuning, prompt engineering, or evaluation · B3 requires AI-specific risk controls (bias, explainability, drift, hallucination) · B4 requires human-in-the-loop oversight
- **Section C – Exclusions (check only if NO Section A criterion is met → treated as digital/automation/kaizen/IT = Not Qualified):** C1 static rule-based logic only (IF–THEN, no learning) · C2 deterministic scripts/workflow automation only · C3 traditional software calculations/reporting only · C4 dashboards/visualization without AI inference · C5 simple keyword search/filtering only
- **Section D – Risk Tier (with mandatory controls):**
  - **Low → Tier1**: internal use, no personal data, decision-support only / personal agent → *basic monitoring*
  - **Medium → Tier2**: impacts operations or employees; limited personal data → *risk assessment; human oversight; periodic review*
  - **High → Tier3**: customer impact, safety, legal, or sensitive personal data → *governance committee approval; enhanced controls; continuous monitoring*

**Reward categories:** `Kaizen` · `TeamProject` · `ManagementInitiative` · `Innovation`.

## Step 2 — Scoring & logic (`src/lib/qualificationLogic.ts`, new; unit-tested)
- `scoreReadiness(r: ReadinessAssessment)` → `{ feasibility:number; viability:number; desirability:number; feasibilityMet:boolean; viabilityMet:boolean; desirabilityMet:boolean; allMet:boolean }` (Met = total ≥ 4).
- `qualifiesAsAI(q: QualificationAssessment)` → `true` iff **any** Section A is true.
- `suggestTier(submission): RiskLevel` — **hint only** (clearly labelled): Restricted/Confidential data → High; Internal → Medium; Public → Low; nudge up for large `estimatedUsers` or customer-facing keywords. Governance may override.
- `canQualify(readiness, qualification, tier, rewardCategory)` → `true` iff `scoreReadiness.allMet && qualifiesAsAI && tier != null && rewardCategory != null`.

## Step 3 — Store actions (`src/stores/projectsStore.ts`)
- **Remove** the interim `Assessment Completed + ForAssessment → Qualified` rule from `applyStatusSideEffects` (drop its `TODO(V3 Phase 3)`). Leave the other seams.
- Add (each validates the status transition via the registry graph, appends an audit entry, and sets `lastActivityAt`):
  - `qualifyProject(projectId, { readiness, qualification, tier, tierRationale, rewardCategory }, actor, note)` — `ForAssessment → Qualified`; store the assessment data, `tier`, `tierRationale`, `rewardCategory`, `autoTiered:false`; also mark `stageStatus.Assessment = 'Completed'` and advance `currentStage` to `Policy` (`NotStarted`) for the governance-progress view. Guard with `canQualify`.
  - `rejectQualification(projectId, reason, actor)` — `ForAssessment → NotQualified`; persist the reason in the audit note.
  - `resubmitForAssessment(projectId, actor)` — `NotQualified → ForAssessment`.
  - `cancelProject(projectId, reason, actor)` — `→ Cancelled` (from `IdeaDraft`/`NotQualified`/`Rejected`/`EHSRejected` per graph).
- **Role gate:** qualify / reject allowed for `GovernanceLead`, `RiskCompliance`, `Admin` (RACI: Qualification A=Governance Lead, R=Risk & Compliance). Cancel: the submitter may cancel their own `IdeaDraft`; Governance/Risk/Admin may cancel post-assessment.

## Step 4 — Qualification UI (new tab on Project Detail)
Add a **"Qualification"** tab in `ProjectDetailTabs` (via `ProjectDetailPage`), visible for statuses in the assessment band (`ForAssessment`, `NotQualified`, `Qualified`, `QualifiedDraft`, and later gates as read-only history).
- **When `ForAssessment` and the current user is Governance/Risk/Admin →** the interactive review form:
  - **Readiness** — the three 7-item groups as checkboxes with live per-dimension totals + Met/Not-Met chips and an overall "all-met" indicator.
  - **Qualification** — Section A (6), B (4), C (5) as checkboxes, with a **live determination**: if any A → "Qualifies as AI project"; if no A → prompt Section C and show "Not an AI project (digital/automation/kaizen/IT)".
  - **Risk tier** — Section D radio (Low/Medium/High) showing each tier's triggers + mandatory controls, pre-selected to `suggestTier(...)` (labelled "suggested"), editable; plus a short `tierRationale` note.
  - **Reward category** — select.
  - **Decision buttons:** **Qualify** (enabled only when `canQualify`), **Not Qualified** (requires a reason), **Cancel project** (reason). Confirm via the existing dialog pattern.
- **When already decided →** a **read-only summary**: readiness scores per dimension, which A/B/C criteria were met, assigned tier + controls, reward category, decision, and who/when (from the audit log).
- **Other roles viewing `ForAssessment` →** read-only "awaiting Governance qualification" state (no action buttons), matching the existing stage-permission tooltip pattern.

## Step 5 — Governance queue (light)
Make the dashboard **"Pending qualification"** stat link to the projects list filtered to `ForAssessment` (reuse the existing status filter). No new page.

## Step 6 — Seed enrichment (`src/data/seedProjects.ts`)
So downstream phases have tiered data and the read-only summary is demoable:
- Populate `readiness`, `qualification`, `tier`, `tierRationale`, `rewardCategory` on the seeds that are `Qualified` / `Active` / `Completed` (spread across Tier1/Tier2/Tier3, with coherent Section-A/D answers).
- Leave **one** `ForAssessment` seed with empty assessment fields for the **live qualify demo**, and keep/add **one** `NotQualified` seed (with a rejection reason in its audit) to show the revise loop.

## Step 7 — Tests
Extend vitest: `scoreReadiness` thresholds (3/7 → Not Met, 4/7 → Met, all-met gate), `qualifiesAsAI` (no A → false, one A → true), `canQualify` guard combinations.

## Step 8 — Verify · Git · report
1. `npm run build` ✅ and `npm run test` ✅.
2. Manually: as **Governance Lead**, open the `ForAssessment` seed → Qualification tab → fill readiness (force a Not-Met to see Qualify disabled) → complete → pick a tier + reward → **Qualify** → status `Qualified`, tab shows read-only summary, Assessment stage marked complete. Try **Not Qualified** on another → revise → resubmit. As a **Submitter**, the tab is read-only.
3. `git commit` (message above). **No push.**
4. Write **`docs/refactor1/V3-PHASE-3_REPORT.md`**: per-file changes, the criteria module structure, the store actions + role gates as built, seed tier distribution, and anything skipped/flagged.
