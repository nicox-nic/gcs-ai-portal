# AUDIT PROMPT — Development Phase & Tier 1/2/3 Delivery Lanes

## Purpose (read this first)

This is a **read-only audit**, not a remediation task. It checks whether the
`gcs-ai-portal` codebase's **development/delivery phase** — the stages a project
goes through *after* it is Qualified and *before* it reaches Completed — matches the
governance master process flow (`GCS_AI_Governance__Process_Flow_V3.jpg`), whose
development section is transcribed in full below.

This is a **separate phase** from the Submission → Review audit/remediation already
completed. Do not re-audit submission or review; assume that work is done. Start
where a project becomes **Qualified** and stop at **Completed**.

**Rules — follow exactly:**

- Do **not** modify, refactor, "fix", or regenerate any application code or file.
- Do **not** create any file other than the single report specified in "Output".
- Every finding must cite an exact file path and line number (or range). No file:line
  citation → the finding doesn't go in the report.
- If a mechanism does not exist, write **"Not present"**. Do not infer intent, do not
  assume it's "probably stubbed somewhere," do not guess.
- Where you're unsure how to classify something, put it in "Open Questions /
  Ambiguities" rather than forcing a verdict.
- **No recommendations, no proposed fixes.** Findings only. Remediation will be scoped
  separately after this report is reviewed.
- This audit runs against the codebase *as it currently stands after the
  Submission→Review remediation* (risk/delivery tier decoupled; `project.tier` null
  after qualification). Take that current state as your starting point.

---

## IMPORTANT — do not act on the known pending tier reversal

A tier renumbering is **planned but NOT yet done**, and is out of scope for this
audit. Do not implement it, and do not let it color your findings. The plan (for your
awareness only) is to renumber the delivery tiers so that:

- **Tier 1 = Self-led** (lightest)
- **Tier 2 = Collaborative**
- **Tier 3 = Data-team-builds** (heaviest)

The master process flow (ground truth below) already uses that ascending-complexity
ordering. The current codebase is believed to use the **opposite** numbering. Your
job is to **report the current code numbering/semantics and flag any mismatch against
the diagram** — not to change it. Treat the diagram's ordering as the documented
target and simply record where code diverges.

---

## Ground truth — Development phase (transcribed from the master flow's tier section)

A Qualified project enters a development phase routed by its **delivery tier**. Each
tier is a distinct swimlane with a distinct path. All three converge on a single
closure step. Flow connectors labeled `C` and `D` link to adjacent diagram sections
(entry from review; a Tier-1 branch) that are out of scope here — note them if the
code references equivalent transitions, but don't chase them.

### Shared entry / update-cancel

- A qualified/in-development project has an **UPDATE / CANCEL** decision available
  (connector `C` feeds into it):
  - **CANCEL** → ends the project (consistent with the Cancelled path).
  - **UPDATE** → routes back into the development lane so the entry can be revised.
  (The exact re-entry wiring is not fully legible in the crop — verify against code
  and note if ambiguous.)

### TIER 1 lane (lightest — no development gate)

- `DEVELOP TOOL & UPDATE ENTRY` → `SUBMIT FOR SPONSOR APPROVAL FOR CLOSURE`.
- **No Accept/Reject gate** in this lane.
- Note on diagram: *"ACTIVE TIER 1 PROJECTS UNDERGO ANNUAL REVIEW; SEE IDLE &
  DEACTIVATION PROCESS."* (The Idle & Deactivation process itself is a separate phase
  — out of scope; just note whether an annual-review / idle / deactivation concept
  exists and is tied to Tier 1.)
- Connector `D` exits after the develop step (links elsewhere — out of scope).

### TIER 2 lane (collaborative — PM-managed, one gate)

- `ELICIT PROJECT REQUIREMENTS` → `ACCEPT / REJECT`:
  - **REJECT** → loops back (toward elicit requirements / revise).
  - **ACCEPT** → `CO-DEVELOP & UPDATE ENTRY`.
- `CO-DEVELOP PROJECT` feeds into `CO-DEVELOP & UPDATE ENTRY`.
- `CO-DEVELOP & UPDATE ENTRY` → `SUBMIT FOR SPONSOR APPROVAL FOR CLOSURE`.
- Note on diagram: *"ACTIVE TIER 2 PROJECTS ARE MANAGED BY PM WITH THEIR SEPARATE
  PROJECT REVIEW."*

### TIER 3 lane (heaviest — PM-managed, two gates)

- `ELICIT REQUIREMENTS` → `ACCEPT / REJECT` (first gate):
  - **REJECT** → loops back.
  - **ACCEPT** → `DEVELOP PROJECT`.
- `DEVELOP PROJECT` → `ACCEPT / REJECT` (**second** gate):
  - **REJECT** → loops back.
  - **ACCEPT** → `UPDATE ENTRY`.
- `UPDATE ENTRY` → `SUBMIT FOR SPONSOR APPROVAL FOR CLOSURE`.
- Note on diagram: *"ACTIVE TIER 3 PROJECTS ARE MANAGED BY PM WITH THEIR SEPARATE
  PROJECT REVIEW."*

### Convergence / closure

- All three lanes converge on `SUBMIT FOR SPONSOR APPROVAL FOR CLOSURE`.
- Sponsor approval for closure → project reaches **Completed**.
  (The internal mechanics of sponsor approval may overlap with an existing Sponsor
  role/stage — report what exists; the sponsor-approval sub-flow's finer detail can
  be a later pass if it's large.)

### Delivery-tier ordering implied by the diagram

Ascending tier number = ascending effort/oversight:
- **Tier 1** = single self-serve develop step, no gate, annual review → lightest.
- **Tier 2** = elicit + one accept/reject + co-develop, PM-managed → middle.
- **Tier 3** = elicit + two accept/reject gates + develop, PM-managed → heaviest.

---

## What to check in the codebase

For every item, report one status — **Supported / Partial / Missing / Divergent** —
with file:line evidence. "Divergent" = implemented but behaves differently from the
diagram (explain how).

### Section 1 — Development phase existence & routing

1.1 Is there a development/delivery phase in the lifecycle that is distinct from the
    Review/Qualification stage and from Completed — i.e., stages a Qualified project
    passes through before closure?
1.2 Is a project routed into different behavior based on its **delivery tier**
    (`project.tier`) once it enters development? Where is that routing?
1.3 Given the current decoupled state (`project.tier` null after qualification), what
    happens when a null-tier project tries to enter/progress the development phase?
    Report the actual behavior (blocked, proceeds as lowest tier, no-op, etc.).

### Section 2 — Delivery-tier assignment mechanism (critical)

2.1 Is there **any** action/UI by which a delivery tier is assigned to a project
    after qualification (e.g., a DE assignment control in the Assessment stage)? If
    yes, cite it. If no, state **"Not present."**
2.2 Does a `suggestTier()` (or similarly named) helper exist from the earlier
    data-team-tiering work? Is it wired to any UI/action, or is it an unused helper?
2.3 Are the earlier tiering design elements present: DE self-submissions auto-tiering,
    a `desiredInvolvement` field in the submission wizard, Tier-2 disagreement/
    escalation handling? Report presence and location for each (Supported/Partial/
    Missing) — this establishes what the assignment mechanism currently is, if any.

### Section 3 — Tier 1 lane

3.1 Is a Tier-1 project's development path a single "develop tool & update entry"
    step with **no** accept/reject gate before closure?
3.2 Is there an annual-review concept tied to active Tier-1 projects?
3.3 Is there any linkage to an Idle / Deactivation process for Tier-1 (existence
    only — the process itself is out of scope)?

### Section 4 — Tier 2 lane

4.1 Is there an "elicit requirements" step for Tier 2?
4.2 Is there exactly **one** accept/reject gate, with reject looping back to
    revise/re-elicit and accept proceeding to co-development?
4.3 Is there a "co-develop & update entry" step distinct from Tier-1's develop step?
4.4 Are Tier-2 projects associated with PM management and a separate project review?

### Section 5 — Tier 3 lane

5.1 Is there an "elicit requirements" step for Tier 3?
5.2 Are there **two** accept/reject gates (elicit → gate → develop → gate → update
    entry), with each reject looping back?
5.3 Is there a "develop project" step and a subsequent "update entry" step?
5.4 Are Tier-3 projects associated with PM management and a separate project review?

### Section 6 — Convergence & closure

6.1 Do all three tier lanes converge on a single "submit for sponsor approval for
    closure" step?
6.2 Does sponsor approval for closure transition the project to **Completed**?
6.3 Is there an existing Sponsor role/stage this closure approval maps to, or is
    closure handled some other way? Report what exists.

### Section 7 — Development-phase Update/Cancel

7.1 Is there an Update/Cancel decision available during the development phase
    (distinct from the review-stage cancel already audited)?
7.2 Does Cancel during development end the project (Cancelled), and does Update route
    back into the development lane?

### Section 8 — Completion gating vs. tier (ground truth for later remediation)

*(Context: the Submission→Review remediation left BA-gate/DE-verification
**non-mandatory** when tier is null — "fail open." A later remediation will change
this to "fail closed." This section only **documents current behavior**; do not
change anything.)*

8.1 How is completion of the development/deployment stages currently gated by tier?
    Cite `baArtifacts.ts` (BA sign-off) and `verification.ts` (DE verification) and
    describe the current tier-conditional logic.
8.2 With `project.tier` null, confirm the current behavior at each completion gate
    (mandatory / non-mandatory / locked). This is the "fail-open" state to be
    documented precisely.
8.3 Do the diagram's per-tier **Accept/Reject gates** (Tier 2's one gate, Tier 3's
    two gates) correspond to anything in code (e.g., `logProjectReview`, stage
    approvals), or are they Not present?

### Section 9 — Tier numbering / semantics vs. diagram (FLAG ONLY — do not change)

9.1 Report the **current** meaning of Tier1/Tier2/Tier3 in code (which tier = self-
    led / collaborative / data-team-builds), citing `tiering.ts` (`TIER_META`,
    `getStackOwnerRoles`, `canOwnStack`) and anywhere tier drives behavior.
9.2 State plainly whether the current code numbering **matches or is inverted**
    relative to the diagram's ascending-complexity ordering (Tier1 lightest → Tier3
    heaviest). Flag as Divergent if inverted. **Do not fix** — this is the known
    pending reversal.

---

## Suggested starting points (unverified — confirm before citing)

Recalled from prior sessions; may be stale. Confirm each exists and reflects current
content before citing:

- `src/lib/lifecycle.ts` — stage/gate definitions
- `src/lib/projectStatus.ts` — `STATUS_TRANSITIONS`, status labels
- `src/lib/tiering.ts` — `TIER_META`, `getStackOwnerRoles`, `canOwnStack`, and any
  `suggestTier`
- `src/lib/baArtifacts.ts` — BA gate (`isBaGateMandatory`, `canCompleteDevelopment/
  Deployment`)
- `src/lib/verification.ts` — DE verification (`isVerificationMandatory`)
- `src/stores/projectsStore.ts` — stage transitions, `logProjectReview`,
  `cancelProject`, assessment/tiering actions
- `src/components/project/ProjectDetailTabs.tsx`, `ProjectDetailPage.tsx` — stage UI,
  tier card, review controls
- `src/lib/submissionWizard.ts` / wizard components — `desiredInvolvement`
- `src/data/seedProjects.ts` — how seeded projects populate development-stage /
  `assessmentBundle` / tier fields
- `docs/prompts/refactor3/outputreport/` — prior audit/remediation reports for context
  (re-verify against current code)

---

## Output format

Produce **exactly one file**:
`docs/prompts/refactor3/outputreport/AUDIT-DevelopmentPhase_TierLanes.md`

Structure:

```markdown
# Audit: Development Phase & Tier 1/2/3 Delivery Lanes

Date: <today>
Scope: Post-Qualification development phase through Completed. Read-only, evidence-cited.
Starting state: after Submission→Review remediation (risk/delivery tier decoupled; project.tier null after qualification).

## Section 1 — Development phase existence & routing
| Item | Status | Evidence (file:line) | Notes |
(1.1–1.3)

## Section 2 — Delivery-tier assignment mechanism
(2.1–2.3)

## Section 3 — Tier 1 lane
(3.1–3.3)

## Section 4 — Tier 2 lane
(4.1–4.4)

## Section 5 — Tier 3 lane
(5.1–5.4)

## Section 6 — Convergence & closure
(6.1–6.3)

## Section 7 — Development-phase Update/Cancel
(7.1–7.2)

## Section 8 — Completion gating vs. tier (current behavior)
(8.1–8.3)

## Section 9 — Tier numbering vs. diagram (flag only)
(9.1–9.2)

## Open Questions / Ambiguities Found
- (anything you couldn't cleanly classify, with reasoning)
```

**Final reminders:**
- Do not modify any application code.
- Do not create any file other than the report above.
- If a mechanism is absent, write "Not present" — do not infer intent.
- No recommendations, no fixes. Findings only.
- Do not implement the tier reversal; only flag the numbering mismatch (Section 9).

---

## OUT OF SCOPE (do not audit or touch)

- Submission and Review/Qualification stages (already done).
- The tier **reversal** itself (flag mismatch only, per Section 9).
- The **Idle & Deactivation** process internals (note existence/linkage only).
- The **sponsor-approval** sub-flow internals if extensive (note the transition to
  Completed; deeper detail can be a later pass).
- RACI and Vendor SAQ sheets.
- Any code change of any kind.
