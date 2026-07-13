# REMEDIATION PROMPT — Submission → Review Flow & Checklist Alignment

## Purpose

This prompt implements a set of governance-approved changes surfaced by the audit
`docs/prompts/refactor3/AUDIT-SubmissionReview_ChecklistAlignment.md`. Every change below
was explicitly decided by the product owner; the decision trail is recorded and is
not to be reinterpreted. Where a change depends on a fact about the codebase that
isn't yet known, this prompt tells you to **investigate and report first**, not
guess.

**Scope is Submission stage + Review/Qualification stage only.** Do not touch RACI,
Vendor SAQ, the Manual submission form fields, the Tier 1/2/3 delivery reversal, or
any low-priority audit item. Explicit out-of-scope list is at the bottom — read it.

---

## Working rules (follow exactly)

- **Read the current contents of every file before editing it.** The audit's line
  numbers are a starting reference and may be stale — locate the real symbol/block
  in the current file and edit that. Never trust a line number blindly.
- **Use `str_replace` for edits. Do not regenerate or rewrite whole files.**
- **If you hit a conflict, ambiguity, or something that contradicts this prompt,
  STOP and report it in the phase report — do not improvise a resolution.**
- **One commit per phase.** Use the commit messages given. Push all commits together
  only at the very end, after the final phase passes.
- **After every phase that changes code: run `npm run build` and `npm run test`
  (vitest). Both must be green before moving to the next phase.** If a phase breaks
  a spec that asserted old behavior, update that spec to match the new intended
  behavior (documented per-phase below) — do not delete coverage.
- Produce exactly one report file at the end (see "Output" section). Do not create
  other files.

---

## Settled decisions this prompt implements

For reference — these are the approved decisions driving the phases:

1. **Risk tier and delivery-ownership tier become two separate fields.** Delivery
   tier is assigned by DE with **zero influence** from the qualification risk tier.
   The `ProjectTier` type name stays as-is for now (no rename) — only the auto-write
   coupling is removed.
2. **`project.tier` is left unset/null after qualification.** Any UI that reads it
   shows **"Not yet assigned"** until DE assigns a delivery tier in the Assessment
   stage.
3. **Readiness checklist becomes purely informational at Review.** Failing a
   readiness dimension no longer blocks Qualify. Reward-category selection stays
   freely selectable. Readiness scores and Met/Not-Met badges still display.
4. **Cancel sends a notification alert**, mirroring the Not Qualified pattern.
5. **Project ID is generated on draft creation** (current behavior per the audit —
   verify and keep; do not move it to Submit).
6. **Manual submission form fields are untouched** this pass.

---

## Phase 0 — Pre-flight (read-only, no commit)

1. Confirm the working tree is clean and `npm run build` + `npm run test` are green
   *before* any change. Record the baseline spec count.
2. Open and read the current contents of each file the audit cited so your later
   edits target real current code, not stale lines:
   - `src/stores/projectsStore.ts`
   - `src/lib/qualificationLogic.ts`
   - `src/lib/qualificationCriteria.ts`
   - `src/lib/projectStatus.ts`
   - `src/lib/tiering.ts`
   - `src/lib/baArtifacts.ts`
   - `src/lib/verification.ts`
   - `src/lib/notificationRules.ts`
   - `src/types/index.ts`
   - `src/components/project/ProjectQualificationTab.tsx`
   - `src/components/project/ProjectDetailTabs.tsx`
   - `src/data/seedProjects.ts`
3. If any of these has materially diverged from what the audit describes, note the
   divergence in the report's Phase 0 section and adjust your approach — but do not
   change scope.

---

## Phase 1 — Investigate `project.tier` consumers (READ-ONLY, report, no code change)

Before decoupling anything, determine what actually depends on `project.tier`.

1. Find **every** read of `project.tier` / the `ProjectTier` type across the
   codebase (audit named `tiering.ts`, `baArtifacts.ts`, `verification.ts`,
   `ProjectDetailTabs.tsx`, and the `RISK_BY_TIER` / `TIER_BY_RISK` mapping in
   `projectStatus.ts` — confirm this list is complete, add any others you find).
2. Classify each consumer into exactly one bucket:
   - **(A) Gates-on-delivery-tier** — genuinely needs a *delivery-ownership* tier to
     be set to function (visibility/behavior depends on who builds it: Self-build /
     Collaborative / Team-led).
   - **(B) Incidental-read** — reads `tier` but doesn't actually require
     delivery-ownership semantics; it was just reading a field that happened to be
     populated.
   - **(C) Risk-mapping** — reads `project.tier` only to infer *risk* (because of the
     old risk↔tier coupling). These should later read `qualification.riskTier`
     directly instead.
3. Produce a classification table in the report: consumer (file:line) → bucket →
   one-line justification → what it should do when `tier` is null.

**STOP CONDITION — read carefully.** If the investigation reveals *either* of the
following, **do not proceed to Phase 2**. Stop, write the Phase 1 report, and await a
follow-up decision:
- Any consumer would hard-crash or produce corrupt state on a null `tier` in a way
  that cannot be resolved by a graceful "Not yet assigned" (display) or waiting/
  locked (gate) state; **or**
- Any business logic *fundamentally requires* a delivery tier to be set at
  qualification time, which would contradict the decision to decouple.

If neither condition is triggered, proceed to Phase 2.

*(No commit for Phase 1 — it's investigation only. Its findings go in the final
report.)*

---

## Phase 2 — Decouple risk tier from delivery tier

Goal: risk tier and delivery tier are independent; `project.tier` is null after
qualification.

1. **Remove the auto-write.** In the qualification flow (audit points to
   `setRisk` around `src/stores/projectsStore.ts:388-391` and the
   `RISK_BY_TIER`/`TIER_BY_RISK` mapping at `src/lib/projectStatus.ts:161-170`),
   selecting a Section D risk tier must **no longer write `project.tier`**. Risk tier
   is stored only in `qualification.riskTier`.
2. **Redirect risk-mapping consumers (bucket C from Phase 1).** Any code that read
   `project.tier` to infer risk must read `qualification.riskTier` directly.
3. **Graceful null handling.** For every display or gate consumer (buckets A and any
   display in B), handle a null `tier`:
   - Display consumers show **"Not yet assigned"**.
   - Gate consumers (bucket A) enter a waiting/locked state until a delivery tier is
     assigned, consistent with the Phase 1 findings.
4. **Do not rename `ProjectTier`.** Keep the type name. Keep `RISK_BY_TIER` /
   `TIER_BY_RISK` definitions if they're still used elsewhere for legitimate
   risk↔label display, but they must no longer be the mechanism that couples the two
   at qualification.
5. Confirm `qualification.riskTier` (audit: `src/types/index.ts:91`) remains the sole
   home of the Low/Medium/High risk classification.

**Specs:** update any spec asserting that picking a risk tier sets `project.tier`.
Add a spec asserting that after qualification, `project.tier` is null/unset and
`qualification.riskTier` holds the risk value.

Build + test gate. **Commit:** `refactor(review): decouple risk tier from delivery tier; tier null after qualification`

---

## Phase 3 — Seed data reflects null delivery tier pre-assessment

Now that `project.tier` is only set by DE in Assessment, seed data should reflect
that so the "Not yet assigned" state is demonstrable.

1. Report the current (status × `tier`) distribution across `src/data/seedProjects.ts`.
2. Establish the lifecycle cutoff: DE assigns the delivery tier **during the
   Assessment stage, post-qualification** (per existing design). Determine, from the
   status model, which seed projects are at/just-past Qualification but **before**
   the Assessment delivery-tier step.
3. For those pre-assessment projects, set `tier` to null/unset so "Not yet assigned"
   is visible in the demo. **Leave `tier` populated** for seed projects that have
   already progressed through the Assessment delivery-tier assignment (their DE
   would have set it).
4. This is a seed-data-only change. Do **not** touch Manual-form field data or any
   other field.

**Specs:** if any spec depends on a specific seed project's `tier`, update it to the
new value.

Build + test gate. **Commit:** `chore(seed): null delivery tier for pre-assessment seed projects`

---

## Phase 4 — Readiness becomes informational at Review

Goal: readiness no longer gates Qualify or constrains reward category, but still
displays.

1. **Remove the `allMet` gate.** In `src/lib/qualificationLogic.ts` (audit:
   `canQualify` requires `allMet` at ~`85-90`; `allMet` computed at ~`40`), remove
   the all-three-dimensions-Met requirement from the Qualify gate. Failing one or
   more readiness dimensions must **not** block Qualify.
2. **Remaining gate.** The Qualify gate is now the Qualification Criteria — Section A
   "any true" (`qualifiesAsAI`, audit ~`44-46`, used by `canQualify` ~`86-87`) plus
   the reviewer's action in the UI. Keep that.
3. **Reward category stays free.** Confirm nothing constrains the reward-category
   dropdown based on readiness. If any such constraint exists, remove it. (Audit
   found selection already unrestricted — verify and preserve.)
4. **Keep readiness displaying.** Per-dimension totals, the <4/≥4 Met/Not-Met badges,
   and the dimension breakdown must still render — they are now informational only.
   Trace every use of `allMet`: keep display uses, remove only the gate use.

**Specs:** update any spec asserting "Not Met blocks Qualify" or "all dimensions must
be Met to Qualify." Add a spec asserting Qualify is allowed with a dimension Not Met
(gated only by `qualifiesAsAI` + reviewer action), and a spec asserting reward
category is freely selectable regardless of readiness outcome.

Build + test gate. **Commit:** `refactor(review): readiness checklist informational only; does not gate qualify`

---

## Phase 5 — Cancel notification parity

Goal: cancelling on review notifies the submitter, like Not Qualified does.

1. In `cancelProject` (audit: `src/stores/projectsStore.ts:810-849`), add a
   notification call mirroring the Not Qualified pattern (audit: recipients at
   `src/lib/notificationRules.ts:44-46`, `138`; Not Qualified notify in-store around
   `728/738/760`). Recipient: **submitter**; CC: **governance**, matching the
   existing Not Qualified recipient rule.
2. If `src/lib/notificationRules.ts` has no rule entry for cancellation, add one
   consistent with the existing rules' shape. Reuse the existing notify mechanism —
   do not invent a new one.

**Specs:** add a spec asserting `cancelProject` triggers a notification to the
submitter (mock/toast counts, consistent with how the Not Qualified notification is
tested).

Build + test gate. **Commit:** `feat(review): send notification alert on project cancellation`

---

## Phase 6 — Project ID timing (verify; likely no-op)

Decision: Project ID is generated **on draft creation**. The audit (1.7) found the ID
is already generated at create time (`src/stores/projectsStore.ts:400`,
`id: \`prj-${nanoid(6)}\``).

1. Verify current behavior: the ID is assigned when the project/draft is created, not
   deferred to Submit.
2. **If current behavior already matches the decision (ID on draft creation), make no
   change** and state "confirmed already correct, no change" in the report.
3. Only if it somehow does *not* match, align it to draft-creation.

*(No commit unless an actual change was required.)*

---

## Phase 7 — Report & push

1. Write the report to `docs/refactor1/REMEDIATION-01_SubmissionReview_ChecklistAlignment.md`
   with this structure:

```markdown
# Remediation: Submission → Review Flow & Checklist Alignment

Date: <today>
Scope: Submission + Review/Qualification only.
Baseline spec count: <N before> → Final spec count: <N after>

## Phase 0 — Pre-flight
(baseline build/test status; any file divergence from the audit)

## Phase 1 — project.tier consumer investigation
| Consumer (file:line) | Bucket (A/B/C) | Justification | Behavior when tier is null |
|---|---|---|---|
...
STOP condition triggered? Yes/No. (If yes, explain and note phases 2–3 were not run.)

## Phase 2 — Tier decoupling
(what changed, file:line, before→after behavior)

## Phase 3 — Seed data
(status×tier distribution before; which projects nulled; which kept and why)

## Phase 4 — Readiness informational
(allMet gate removal, remaining gate, reward-selection confirmation, display preserved)

## Phase 5 — Cancel notification
(notify call added, rule added if any, recipients)

## Phase 6 — Project ID timing
(verification result; change or no-change)

## Build & Test
(per-phase build/test results; final green confirmation; specs added/updated)

## Anything that required a STOP / judgment call
(list, or "none")
```

2. After the report is written and the final phase is green, **push all commits
   together** in one deploy.

---

## OUT OF SCOPE — do not touch (even if you notice something)

- **Manual submission form fields** — no field additions, no unification with the
  Assisted intake, no mock-data changes to Manual-form data.
- **RACI sheet, Vendor SAQ** — separate future pass.
- **Tier 1/2/3 delivery reversal** (Self-led / Collaborative / Data-team-builds
  renumbering) — separate future pass. This prompt only *decouples* tier; it does
  **not** renumber delivery tiers.
- **Low-priority audit items**, all deferred: 1.3 (duplicate-check Cancel/Update
  options), 2.4 (tool-stack timing at Accept), 4.3 (exclusion auto-terminate), and
  4.4's truncated Low-risk controls text.
- **Reward-category constraints** — reward selection stays free; do not add
  readiness-based or tier-based restrictions.
- **Renaming `ProjectTier`** — leave the type name as-is.

If any out-of-scope item appears to block an in-scope change, STOP and report rather
than expanding scope.
