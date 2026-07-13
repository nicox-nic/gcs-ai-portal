# REMEDIATION PROMPT — Development Phase: Tier Assignment, Fail-Closed Gating & Tier-Differentiated Gates

## Purpose

This prompt implements the **FIX-NOW** items from
`docs/prompts/refactor3/outputreport/GAP-Analysis_DevelopmentPhase_DiagramVsCode.md`,
based on the audit `AUDIT-DevelopmentPhase_TierLanes.md`. These are surgical
behavioral fixes that make the delivery tier actually change outcomes in the
development phase. They **deliberately do not restructure the lifecycle** into the
diagram's three-swimlane model — that structural refactor is explicitly DEFERRED.

Every change is owner-approved; the decisions are listed below and are not to be
reinterpreted. Where a change depends on a codebase fact this prompt can't be certain
of (exact stage/status names, transition points), the prompt tells you to **confirm
first and STOP if the assumption is wrong** — do not guess.

---

## Working rules (follow exactly)

- **Read the current contents of every file before editing it.** Audit line numbers
  are a starting reference and may be stale — locate the real symbol and edit that.
- **Use `str_replace`. Do not regenerate or rewrite whole files.**
- **Do NOT add new lifecycle statuses or new ISO stages.** These fixes must layer onto
  the *existing* status/stage model. If any change appears to require a new status or
  stage, **STOP and report it** — that means it belongs to the deferred structural
  refactor, not here.
- **One commit per phase**, using the messages given. Push all commits together only
  at the end, after the final phase is green.
- **After every code-changing phase: run `npm run build` and `npm run test`. Both must
  be green before the next phase.** Update specs that assert old behavior; add specs
  for new behavior as directed. Never delete coverage.
- If you hit a conflict, ambiguity, or something contradicting this prompt, **STOP and
  report** — do not improvise.
- Produce exactly one report file (see "Output"). No other new files.

---

## Owner-approved decisions this prompt implements

1. **Delivery-tier assignment action.** A manual assignment of `project.tier`
   (Tier1/Tier2/Tier3) on a **Qualified** project, actioned by **Data Engineer (DE),
   Admin, or Governance Lead**. **No risk-based default** — the picker starts
   unset; `suggestProjectTier` must NOT be wired as a default. Tier is editable while
   the project is Qualified (pre-development) and locks once development begins.
2. **Fail-closed gating.** A Qualified project **cannot enter development** (cannot
   advance past Qualified) until `project.tier` is assigned. Replaces the current
   fail-open behavior for the entry transition.
3. **Tier-differentiated Accept/Reject gates.** Tier 1 = **no** mandatory gate; Tier 2
   = **one** mandatory PM Accept/Reject gate; Tier 3 = **two**. Reject routes back to a
   revise state; Accept advances. **Keep existing UAT/verification Pass/Fail as
   separate ISO controls — do not conflate them with these gates.**
   - Gate 1 (Tier 2 **and** Tier 3): acceptance of elicited requirements, gating
     progression out of the requirements/development step.
   - Gate 2 (Tier 3 **only**): acceptance **after Development completes, before
     Deployment**.
   - Gate reviewer role: **PM** (with **Admin** able to act as well), consistent with
     the diagram's "PM-managed" note.
4. **Development-phase Cancel.** A simple **Active → Cancelled** transition, reusing the
   existing `cancelProject` action and the cancellation notification added in the prior
   remediation. (The fuller "Update re-enters the lane mid-build" is DEFERRED — do not
   build it.)
5. **Stale comment cleanup.** Remove/replace the tier-is-1:1-with-risk comment at
   `src/types/index.ts:50-51`, since risk and delivery tier are decoupled.

---

## Phase 0 — Pre-flight & assumption check (read-only, no commit)

Before any change, confirm the model this prompt assumes, and STOP if it doesn't hold.

1. Confirm a clean-enough working tree and green baseline (`npm run build` +
   `npm run test`); record baseline spec count.
2. **Confirm the entry transition for fail-closed.** Identify the exact
   status/stage transition that represents a Qualified project "entering development"
   (the first advancement after `Qualified`). Report it. Decision #2 will gate *this*
   transition on `project.tier !== null`.
3. **Confirm gate placement is possible without new statuses.** Verify that:
   - Gate 1 can be implemented as a mandatory acceptance layered on the existing
     requirements/Development step (e.g., an acceptance flag + decision record + gating
     the existing "complete/advance" action), and
   - Gate 2 (Tier 3) can be layered at the existing Development→Deployment boundary.
   If either genuinely requires a **new status/stage** to model the reject-loop, **STOP
   and report** — that portion is deferred, not in scope.
4. **Confirm reject-loop can reuse existing revise/rework mechanics** (similar to how
   UAT Fail remediates today) rather than needing new statuses. Report the mechanism
   you'll reuse.
5. Report any divergence from the audit's description before proceeding.

If Phase 0 surfaces a blocking assumption failure, STOP with a report and implement
nothing.

---

## Phase 1 — Delivery-tier assignment action

Goal: DE/Admin/Governance Lead can manually set `project.tier` on a Qualified project.

1. Add a store action (e.g., `assignDeliveryTier(projectId, tier, actor)`) that sets
   `project.tier` to a chosen `ProjectTier` (Tier1/Tier2/Tier3). Guard it to
   **DE, Admin, Governance Lead** only (use existing role constants; report the exact
   set used). Reject the call for other roles.
2. Allow assignment/editing only while the project is **Qualified** (pre-development).
   Once development has begun, the tier is locked — the action must refuse to change it
   and report why.
3. **No risk-based default.** The picker/initial value is unset; the DE selects
   manually. Do **not** call `suggestProjectTier` to prefill. (Leave that helper in
   place, unused, as it is now.)
4. Add UI on the project detail for a Qualified project: a tier selector (Tier1/2/3
   with their `TIER_META` labels) visible/interactive only to DE/Admin/Governance Lead,
   showing "Not yet assigned" until set. Record the assignment in the audit/history
   trail consistent with how other actions are logged.

**Specs:** assignment sets `project.tier`; role guard allows DE/Admin/GovLead and blocks
others; assignment blocked once past Qualified.

Build + test gate. **Commit:** `feat(assessment): DE/Admin/GovLead delivery-tier assignment on qualified projects`

---

## Phase 2 — Fail-closed entry gating

Goal: a Qualified project cannot advance into development until a delivery tier is set.

1. Gate the entry transition identified in Phase 0: if `project.tier` is null, the
   advancement out of `Qualified` is **blocked**. The store action must refuse, and the
   UI advance control must be disabled with a clear reason ("Assign a delivery tier
   before this project can proceed").
2. This replaces fail-open **only for the entry transition**. Do not change unrelated
   gate behavior in this phase.
3. Verify the two nulled seed projects (prj-061 Qualified, prj-070 QualifiedDraft) now
   correctly show as blocked-until-tiered, demonstrating the assignment→unblock flow
   end to end with Phase 1.

**Specs:** advancing a null-tier Qualified project is blocked; assigning a tier then
allows advancement.

Build + test gate. **Commit:** `feat(lifecycle): fail-closed — block development entry until delivery tier assigned`

---

## Phase 3 — Tier-differentiated Accept/Reject gates

Goal: Tier 1 has no mandatory gate; Tier 2 has one; Tier 3 has two. This is the fix for
the Tier 2 == Tier 3 defect.

1. **Model the gate as a mandatory PM acceptance checkpoint** layered on the existing
   stages (per Phase 0 findings): an acceptance state + decision record (accepted /
   rejected + reason + actor), gating the existing stage-complete/advance action. Do
   **not** introduce new statuses.
2. **Gate 1 — Tier 2 and Tier 3:** acceptance of the elicited requirements. Progression
   out of the requirements/Development step requires PM (or Admin) **Accept**.
   **Reject** returns the requirements to an editable/revise state (reuse existing
   rework mechanics) and blocks progression until re-accepted.
3. **Gate 2 — Tier 3 only:** a second PM (or Admin) Accept/Reject **after Development
   completes, before Deployment**. Reject routes back to development revise; Accept
   allows Deployment to proceed.
4. **Tier 1:** no mandatory gate — unchanged.
5. **Keep UAT/verification Pass/Fail as separate ISO controls.** These are distinct from
   the new Accept/Reject gates; do not merge, rename, or route them into the new gate
   logic.
6. **Reviewer role:** PM, with Admin able to act. Use existing role constants; report the
   set used. (The existing note-only `logProjectReview` may be reused as the record
   mechanism or left as-is — report what you did; do not repurpose it into the gate if
   that muddies its meaning.)
7. **Seed data backfill:** for existing seed projects already **past** a gate's stage
   (e.g., Tier 2/3 projects already in Deployment/Active/Completed), mark the relevant
   gate(s) **Accepted** in seed data so existing demos don't become blocked. Report
   which seeds were backfilled.

**Specs:** Tier 1 completes development with no gate; Tier 2 blocked until Gate 1
accepted; Tier 3 blocked until both gates accepted; Reject returns to revise and
re-blocks; UAT/verification behavior unchanged.

Build + test gate. **Commit:** `feat(review): tier-differentiated PM accept/reject gates (T2 one, T3 two)`

---

## Phase 4 — Development-phase Cancel

Goal: an Active project can be cancelled, mirroring the diagram's development Cancel.

1. Add the **Active → Cancelled** transition to `STATUS_TRANSITIONS`.
2. Expose a Cancel control in the development/Active UI, reusing the existing
   `cancelProject` action.
3. Reuse the **cancellation notification** added in the prior remediation (submitter,
   CC governance). No new notification machinery.
4. Do **not** build "Update re-enters the lane" — out of scope (deferred).

**Specs:** an Active project can be cancelled → Cancelled; cancellation notification
fires.

Build + test gate. **Commit:** `feat(lifecycle): allow cancellation of active projects`

---

## Phase 5 — Stale comment cleanup

1. At `src/types/index.ts:50-51`, remove/replace the comment describing `ProjectTier`
   as 1:1 with `RiskLevel`, since risk and delivery tier are now decoupled. Replace with
   an accurate one-line description (delivery-ownership tier, assigned by DE
   post-qualification, independent of risk). No behavioral change.

Build + test gate (if the comment change is the only change, build/test simply
re-confirm green). **Commit:** `docs(types): correct stale ProjectTier/RiskLevel coupling comment`

---

## Phase 6 — Report & push

Write `docs/prompts/refactor3/outputreport/REMEDIATION-02_DevelopmentPhase_TierGates.md`:

```markdown
# Remediation: Development Phase — Tier Assignment, Fail-Closed & Tier Gates

Date: <today>
Scope: FIX-NOW items from the development-phase gap analysis. No structural refactor.
Baseline spec count: <N> → Final: <N>

## Phase 0 — Pre-flight & assumption check
(entry transition identified; gate placement feasible without new statuses? reject-loop mechanism reused; any STOP)

## Phase 1 — Tier assignment action
(store action, role guard set used, UI, lock-after-qualified, no risk default)

## Phase 2 — Fail-closed entry gating
(which transition gated; seed prj-061/prj-070 verified)

## Phase 3 — Tier-differentiated gates
(gate model used; Gate 1 T2+T3 placement; Gate 2 T3 placement; reviewer roles; UAT/verification kept separate; seed backfill list)

## Phase 4 — Development cancel
(transition added; notification reused)

## Phase 5 — Comment cleanup

## Build & Test
(per-phase build/test; specs added/updated; final green)

## STOP / judgment calls
(anything deferred, blocked, or decided in-flight; or "none")
```

Then push all commits together.

---

## OUT OF SCOPE — do not touch

- **The structural three-swimlane refactor** (DEFER items in the gap analysis): distinct
  per-tier step graphs, first-class named steps (Develop Tool / Co-Develop / Develop
  Project / Update Entry / Elicit Requirements as stages), new statuses for reject-loops,
  Tier-1-specific annual-review workflow, Tier-1-scoped idle/deactivation, and
  "Update re-enters the lane mid-build."
- **The tier reversal** — already effectively in place; do not renumber tiers.
- **UAT/verification semantics** — leave as separate ISO controls; do not fold into the
  new gates.
- **Submission/Review stages, RACI, Vendor SAQ** — out of scope.
- **Adding new lifecycle statuses or stages** — if anything seems to need one, STOP and
  report; it's deferred.

If any out-of-scope item appears to block an in-scope change, STOP and report rather
than expanding scope.
