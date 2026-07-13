# LLM Phase 2 — Investigation: Tool Stack, Accept Flow, Risk Tier, Reward Category

## Purpose

**Read-only investigation. Make NO code changes.** Produce an evidence-cited map of how the app currently handles the "applicable tool stack" and reward-category assignment, so the next prompt can embed an LLM-based tool-stack recommender at the correct point in the governance flow.

Per the governance workflow, the tool stack is a **post-acceptance, reviewer-side** action: a project is scored (readiness), qualified (risk tier assigned: Tier 1 low/Kaizen, Tier 2 medium, Tier 3 high), then reviewed and **accepted/rejected** — and only *on accept* does the flow "include applicable tool stack" and assign a reward category (Kaizen / Team Project / Mgt Initiative / Innovation). The intake wizard's UI copy ("you'll see your top 3 tool recommendations instantly") appears to describe intake-time behavior that may **contradict** this. This investigation resolves that contradiction against the actual code.

---

## Rules

- **Do not modify, create, or delete any file** except the single report at the end.
- Read actual file contents. **Cite evidence** as `path:line` (or `path` + symbol name) for every claim.
- Where something does **not** exist, say so explicitly — "no match found for X" is a valuable answer.
- Do not infer from UI copy or comments what the code does; verify in the logic itself.
- If a question can't be answered from the code, mark it **UNKNOWN** rather than guessing.

---

## Questions to answer

### A. Tool catalog
1. Does a defined catalog/list of tools exist anywhere in `src/`? (Search for e.g. `tool`, `toolStack`, `catalog`, `recommend`, `stack`.) Give the file, the data shape (type/interface), and a short excerpt of the entries.
2. Is the catalog tied to anything — risk tier, reward category, department, data sensitivity, project type? Or is it a flat list?
3. How many tools, and what fields does each tool record carry?

### B. Recommendation logic (the "top 3")
4. Is there any recommendation logic in the code — a function that selects/ranks tools for a project? Where, and what does it key off (which project fields)?
5. Is that logic **wired** to anything (rendered in a component, called on submit, called on accept), or is it **dead/unused**? Cite the call sites, or state there are none.
6. The intake Step 1 panel says "top 3 tool recommendations instantly." Is that copy backed by real logic anywhere, or is it currently just static text? Show what (if anything) renders recommendations in the intake/wizard path.

### C. Accept / reject flow
7. Where in the code does a reviewer accept or reject a project? (Governance Lead / qualification review path.) Give the component(s) and the state/store action(s) that perform the status transition.
8. What exactly happens on **accept** today — what fields change on the project object, what status it moves to, and whether anything tool- or reward-related happens there now.
9. Is there a natural place in the accept flow (a handler, a modal, a post-accept view) where a tool-stack suggestion could be surfaced for the reviewer to confirm? Describe it; don't build it.

### D. Risk tier & qualification
10. Where is the **risk tier** (Tier 1/2/3) assigned in code, and where is it stored on the project object? Is `suggestTier()` (or similar) the source? Cite it.
11. At the moment of acceptance, **is the risk tier already available** on the project object? (i.e., does tiering happen before accept?) This determines whether a tier-aware recommender can read it.
12. Where do the qualification criteria / readiness score live in code (feasibility/visibility/desirability; primary qualification; exclusion criteria)? Are these values persisted on the project?

### E. Reward category
13. Is the **reward category** (Kaizen / Team Project / Mgt Initiative / Innovation) assigned anywhere in code today? By what logic, and at what point?
14. Is reward-category assignment coupled to the tool stack (same step/handler) or independent? The workflow bundles them in the "IF ACCEPT" box — confirm whether the code does too, or whether they're separate concerns.

### F. Data model
15. Show the project/submission type/interface (the main object). Identify which fields already exist that a tool-stack recommendation would read from (problem, goal, data sources, target users, tier, department, etc.), and whether there's any existing field to **store** an assigned tool stack or reward category.

---

## Report

Write **one** file: `docs/prompts/refactor2/outputreport/REPORT_LLM-Phase-2_Investigation_Tool_Stack.md`, structured by the sections above (A–F), with:
- A one-paragraph **summary** at the top answering the core question: *does a tool-stack recommender exist, is it wired, and where does/should tool-stack assignment happen relative to accept?*
- Every claim backed by `path:line` evidence.
- An explicit list of anything marked **UNKNOWN** or **not found**.
- A short **"implications for building"** note: given what exists, would a Phase 2 recommender be *augmenting* existing logic or *building from scratch*, and what's the cleanest insertion point at the accept step.

No commit needed — this is read-only. If you accidentally touched anything, revert it and note that in the report.
