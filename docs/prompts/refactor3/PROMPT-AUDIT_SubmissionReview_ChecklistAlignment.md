# AUDIT PROMPT — Submission → Review Flow & Checklist Alignment

## Purpose (read this first)

This is a **read-only audit**, not a remediation task. You are checking whether the
existing `gcs-ai-portal` codebase's Submission and Review stages match a set of
governance ground-truth documents (transcribed in full below, since they exist only
as diagrams/spreadsheets outside this repo — you cannot fetch them yourself).

**Rules — follow exactly:**

- Do **not** modify, refactor, "fix", or regenerate any application code or file.
- Do **not** create any file other than the single report specified in "Output format" below.
- Every finding must cite an exact file path and line number (or line range). No
  file:line citation → the finding doesn't go in the report.
- If a mechanism does not exist, write **"Not present"**. Do not infer intent, do not
  assume something is "probably stubbed somewhere," do not guess.
- If something is ambiguous or you're unsure how to classify it, put it in the
  "Open Questions / Ambiguities" section at the end rather than forcing a Supported/
  Missing verdict.
- This prompt does not ask for recommendations or proposed fixes. Do not include
  them. Remediation (if any) will be scoped in a separate follow-up prompt after
  this report is reviewed.
- Scope is **Submission stage + Review/Qualification stage only**. Do not audit
  RACI, Vendor SAQ, training catalog, admin, or any other area even if you notice
  something — leave it alone, it's out of scope for this pass.

---

## Ground truth source 1 — Submission Flow

(Transcribed from governance diagram `Manual_and_AI_Assisted_Project_Submission.png`)

### AI-Assisted path

1. `START` → `CREATE NEW SESSION`
   — Note on diagram: *"submitter can create one session at a time. Sessions are
   saved in the session history."*
2. → `SHOW GUIDE QUESTIONS`, covering:
   - **WHAT**: short/detailed description of the idea, current process
   - **WHY**: rationale, pain points/opportunity
   - **HOW**: proposed AI tool and solution
   - **WHO**: high-level affected teams or users
3. → `INPUT DETAILS`
   — Note on diagram: *"inputted details will be used in building AI use case."*
4. → `TOOL/PROJECT EXISTS?` decision:
   - **YES** → `UPDATE/CANCEL` decision:
     - `CANCELLED` → `END`
     - `UPDATE` → `UPDATE USE CASE` → feeds into the `SUBMIT/SAVE AS DRAFT` decision (step 6)
     - When YES, diagram specifies: *"system to show all related projects: PROJECT
       NAME, ID, STATUS, SUBMITTER, SIMILARITY REASON"*
   - **NO** → `SUGGEST USE CASE BASED ON DETAILS`
     — Note: *"Allow users to accept, recreate, edit AI suggestions."*
     → feeds into the `SUBMIT/SAVE AS DRAFT` decision (step 6)
5. (parallel note) Manual entry path — see below — also feeds into step 6.
6. `SUBMIT/SAVE AS DRAFT` decision:
   - **SAVE AS DRAFT** → `SET STATUS TO 'IDEA DRAFT'`
     — Note: *"Entry added to 'User Profile' > 'My Entries'."* Loops back to allow
     further editing (`UPDATE USE CASE`).
   - **SUBMIT** → `SET STATUS TO 'FOR ASSESSMENT'`
     — Note: *"If submitted, system to auto-generate project ID."*

### Manual Entry path

— Diagram notes this path is for: *"already submitted/completed AI projects"* and
*"users familiar with consultation process and prefer to input manually."*

1. `START` → `ADD NEW PROJECT`
2. → `FILL IN USE CASE FORM`, with fields:
   - Background/Use Case
   - Problem
   - Objective/Goal
   - Business Value
   - Expected Benefit (Cost Savings in USD/FTE)
3. → converges into the same `SUBMIT/SAVE AS DRAFT` decision as the AI-assisted path (step 6 above).

---

## Ground truth source 2 — Review Flow

(Transcribed from governance diagram `Project_Review.png`, which is a zoomed section
of the same master flow as `GCS_AI_Governance__Process_Flow_V3.jpg`)

1. `REVIEW ENTRY` → `ACCEPT/REJECT` decision.
2. **REJECT** path → `SET STATUS TO 'NOT QUALIFIED'` → `SEND EMAIL ALERT`
   (To: Submitter, CC: N/A).
3. **ACCEPT** path → `SET STATUS TO 'QUALIFIED'`
   — Diagram note: *"IF ACCEPT: INCLUDE APPLICABLE TOOL STACK; REWARD CATEGORY
   (KAIZEN, TEAM PROJECT, MGT INITIATIVE, INNOVATION)."*
4. The Accept/Reject decision is explicitly annotated with two criteria blocks:

   **I. AI Readiness Criteria**
   — *"WHERE SCORE IS BASED ON FEASIBILITY, VISIBILITY, DESIRABILITY"* (diagram
   says "Visibility" here; the source checklist spreadsheet uses "Viability" — see
   Ground truth source 4. Treat "Viability" as correct; note the diagram's label
   as a documentation inconsistency, do not resolve it in code.)
   - IF SCORE < 4 → **NOT MET** (Kaizen)
   - IF SCORE ≥ 4 → **MET** (Team Project, Mgt Initiative, Innovation)

   **II. AI Qualification Criteria**
   - IF ANY PRIMARY QUALIFICATION IS TRUE →
     THEN check Supporting Indicators →
     THEN check AI Risk Classification →
     THEN assign AI Risk Tier:
       - **Tier 1**: Low Risk (Kaizen)
       - **Tier 2**: Medium Risk (Team Project, Mgt Initiative, Innovation)
       - **Tier 3**: High Risk (same reward categories as Tier 2, per diagram note)
   - IF PRIMARY QUALIFICATION IS FALSE →
     THEN check Exclusion Criteria →
     THEN provide a **'Not Qualified' reason**

5. Separately, the reviewed entry also has its own `UPDATE/CANCEL` sub-flow
   (distinct from the Accept/Reject decision above):
   - **CANCEL** → `SET STATUS TO 'CANCELLED'` → `SEND EMAIL ALERT` → `END`
     — Note: *"If cancelled, entry is locked; [submitter must] use [this] to submit
     another entry."*
   - **UPDATE** → `REVISE ENTRY` → `SUBMIT` → `SET STATUS TO 'FOR ASSESSMENT'`
     (loops back into assessment)

---

## Ground truth source 3 — AI Qualification Checklist

(Verbatim structure from `AI_Checklists_1.xlsx`, sheet "AI Qualification Checklist")

### Section A — Primary AI Qualification Criteria (Determining)

| No. | Criteria |
|---|---|
| A1 | Learning or Adaptation — Uses machine learning, deep learning, reinforcement learning, or statistical learning techniques |
| A2 | Learning or Adaptation — Learns or improves performance based on data or experience |
| A3 | Automated Reasoning or Decision Support — Performs inference, prediction, classification, recommendation, or optimization |
| A4 | Data-Driven Model Usage — Relies on trained models and training/validation/inference datasets |
| A5 | Perception or Language Processing — Interprets text, speech, images, video, or sensor data (NLP, OCR, CV) |
| A6 | Generative Capability — Generates new content using probabilistic or generative models |

**Gating rule:** If **any** of A1–A6 is Yes → proceed as an AI Project → go to
Section B **and** Section D. If **none** are met → go to Section C.

### Section B — Supporting Indicators (Non-Determining — focuses on controls needed)

| No. | Indicator |
|---|---|
| B1 | Uses third-party AI services or APIs |
| B2 | Includes model training, fine-tuning, prompt engineering, or evaluation |
| B3 | Requires AI-specific risk controls (bias, explainability, drift, hallucination) |
| B4 | Requires human-in-the-loop oversight or monitoring |

**Rule:** Non-gating/informational. After Section B → proceed to Section D.

### Section C — Exclusion Check

| No. | Exclusion |
|---|---|
| C1 | Static rule-based logic only (IF–THEN, no learning) |
| C2 | Deterministic scripts or workflow automation only |
| C3 | Traditional software calculations or reporting tools only |
| C4 | Dashboards or visualization without AI inference |
| C5 | Simple keyword search or filtering only |

**Rule:** If applicable → *"Initiative is treated as digital, automation, kaizen,
or IT projects. End of Assessment."* (Never reaches Section D.)

### Section D — AI Risk Tier Classification

| Risk Tier | Trigger Characteristics | Required Controls |
|---|---|---|
| Low | Internal use, no personal data, decision support only. Personal use (personal agent) | Treated as digital/automation/kaizen/personal-agent/IT project. Basic monitoring |
| Medium | Impacts operations or employees; limited personal data | Risk assessment; human oversight; periodic review |
| High | Customer impact, safety, legal, or sensitive personal data | Governance committee approval; enhanced controls; continuous monitoring |

---

## Ground truth source 4 — AI Readiness Checklist

(Verbatim structure from `AI_Checklists_1.xlsx`, sheet "AI Readiness Checklist")

Header notes on the sheet: *"AI Use Case Assessment – Feasibility, Viability,
Desirability"*; *"Scoring: 0 = No | 1 = Yes"*; *"Total: < 4 = Not Met | ≥ 4 = Met."*
(The sheet contains example filled-in scores for demonstration — focus on the
**structure and scoring logic**, not the specific demo values.)

### A. Feasibility — *"Can we realistically build, deploy, and operate this AI?"*
- Required data is available, lawful, and appropriate
- Data quality is sufficient for reliable outputs
- Models and infrastructure are technically available
- Internal skills exist to build or configure the solution
- Integration with existing environment (e.g., M365) is feasible
- Operational support is feasible (monitoring, retraining, incidents)
- Aligned with AI Governance Policy and contractual obligations
- **Feasibility Total** (sum of the above, each 0 or 1)

### B. Viability — *"Does this make business sense and sustain over time?"*
- Clear linkage to GCS strategic objectives
- Business benefits are clearly defined and measurable (Cost Savings, FTE, etc.)
- Total costs are understood
- Expected value justifies total cost
- Solution can scale without disproportionate cost growth
- Long-term support is viable
- Governance controls are maintainable across lifecycle
- **Viability Total** (sum of the above, each 0 or 1)

### C. Desirability — *"Do users and stakeholders actually want and accept this AI?"*
- Addresses a real and validated user pain point
- Provides clear value to end users
- Fits into existing workflows (e.g., M365 tools)
- Supports transparency and human oversight
- Builds user trust and acceptance
- Change impact (skills, roles, adoption) is manageable
- No critical adoption barriers identified
- **Desirability Total** (sum of the above, each 0 or 1)

**Scoring rule as written on the sheet:** each dimension (Feasibility, Viability,
Desirability) is totaled **separately**, and each total is judged against the same
threshold: **< 4 = Not Met, ≥ 4 = Met**. The sheet does not show a single combined
score across all three dimensions — report exactly what the codebase does here,
since this is a known open question, not an assumption to confirm.

---

## What to check in the codebase

For every item below, report one status: **Supported / Partial / Missing /
Divergent**, with file:line evidence. "Divergent" means something is implemented
but does something different from the ground truth (explain how).

### Section 1 — Submission flow implementation

1.1 Is there a session/draft concept distinct from a final submitted entry,
    matching "sessions saved in session history"?
1.2 Are the four guide questions (WHAT/WHY/HOW/WHO) present in the submission
    wizard, and do they map to the fields described?
1.3 Is there a "tool/project exists" duplicate/similarity check before
    submission? Does it surface Project Name, ID, Status, Submitter, and
    Similarity Reason?
1.4 Is there an AI-generated "suggested use case" step with accept/recreate/edit
    options, separate from the manual use-case form?
1.5 Does the Manual Entry path exist as a distinct route/component from the
    AI-assisted path, with its own form fields (Background/Use Case, Problem,
    Objective/Goal, Business Value, Expected Benefit)?
1.6 Do both paths converge on the same Save-as-Draft vs. Submit decision?
1.7 Status transitions: does Save-as-Draft set status to `Idea Draft` and file
    it under a "My Entries" view? Does Submit set status to `For Assessment` and
    auto-generate a project ID?

### Section 2 — Review flow implementation

2.1 Is there a Review Entry screen/action distinct from the submission views,
    gated to the appropriate role?
2.2 Is there an explicit Accept/Reject decision point, and do Accept/Reject set
    status to `Qualified`/`Not Qualified` respectively?
2.3 On Reject, is a "Not Qualified" reason captured, and is some notification
    mechanism triggered to the submitter? (Toast-only counts as evidence — Phase
    0 scope allows mock notifications. Report what exists; don't require literal
    email.)
2.4 On Accept, is a tool stack attached and a reward category (Kaizen/Team
    Project/Mgt Initiative/Innovation) assigned?
2.5 Is there an Update/Cancel/Revise sub-flow on a reviewed entry, separate from
    the Accept/Reject decision? Does Cancel lock the entry (status `Cancelled`)
    and does Revise route back through `For Assessment`?

### Section 3 — Readiness Checklist implementation

3.1 Does the codebase model Feasibility / Viability / Desirability as three
    separate scored dimensions, each with the individual assessment items listed
    in Ground truth source 4 (not paraphrased substitutes)?
3.2 Is each item scored 0/1, and is each dimension totaled separately?
3.3 Is the < 4 / ≥ 4 Met/Not-Met threshold applied **per-dimension**, matching
    the worksheet, or is it collapsed into a single combined score? Report
    exactly what you find.
3.4 Does a "Not Met" readiness outcome map to a Kaizen-only path, and "Met"
    unlock Team Project/Mgt Initiative/Innovation, as shown in the diagram?

### Section 4 — Qualification Checklist implementation

4.1 Are the 6 Primary Qualification criteria (A1–A6) modeled individually, with
    "any true → proceed" gating logic?
4.2 Are the 4 Supporting Indicators (B1–B4) modeled as non-gating/informational
    fields?
4.3 Are the 5 Exclusion Criteria (C1–C5) modeled, with a path to "treated as
    digital/automation/kaizen/IT project, end of assessment" when Primary
    Qualification is false and an exclusion applies?
4.4 Is the AI Risk Tier (Section D: Low/Medium/High, with the specific trigger
    characteristics and required controls text) modeled as a field on the
    project, distinct from any other "tier" concept in the codebase?
4.5 **Terminology check only — do not change anything.** Does any code, type, or
    UI label use the word "Tier" in a way that could be confused between this
    Section D risk tier and any other tiering concept in the app (e.g., a
    delivery-ownership tier)? Just flag file:line. No fix, no opinion on which
    should change.

---

## Suggested starting points (unverified — confirm before citing)

These are recalled from past sessions and may be stale. Confirm each actually
exists and reflects current content before citing it; do not assume:

- `src/pages/*` for submission wizard / review screens
- `src/lib/lifecycle.ts` for stage-gating logic
- `src/stores/projectsStore.ts` for status transitions and project state
- `src/lib/roles.ts` for role constants
- `docs/refactor1/RECON-01_Codebase_Reconnaissance.md` for prior recon notes
  (useful context, but re-verify against current code — it may predate later
  phases)

---

## Output format

Produce **exactly one file**: `docs/prompts/refactor3/outputreport/AUDIT-SubmissionReview_ChecklistAlignment.md`

Structure:

```markdown
# Audit: Submission → Review Flow & Checklist Alignment

Date: <today's date>
Scope: Submission stage + Review/Qualification stage only
Method: Read-only, evidence-cited. No code changes made.

## Section 1 — Submission Flow
| Item | Status | Evidence (file:line) | Notes |
|---|---|---|---|
| 1.1 ... | Supported/Partial/Missing/Divergent | path:line | ... |
(repeat for 1.1–1.7)

## Section 2 — Review Flow
(same table format, 2.1–2.5)

## Section 3 — Readiness Checklist
(same table format, 3.1–3.4)

## Section 4 — Qualification Checklist
(same table format, 4.1–4.5)

## Open Questions / Ambiguities Found
- (anything you weren't sure how to classify, with reasoning)
```

**Final reminders:**
- Do not modify any application code.
- Do not create any file other than the report above.
- If you cannot find a mechanism, write "Not present" — do not infer intent.
- No recommendations, no proposed fixes — audit findings only.
