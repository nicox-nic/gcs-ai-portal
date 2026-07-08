# V3-PHASE-2 — Dual Intake + Duplicate Detection + AI-Assisted Use-Case Builder

> **Cursor — read this fully before editing. Surgical refactor; Phases 0–1 are merged.**
> Standing rules:
> - Do **not** regenerate files. **Read each target file first**, then `str_replace`/surgical edits. If a target differs from what's described or a change would clobber a later fix, **stop and report**.
> - Read profiles from **`profileStore`** (via `getProfileDefaults`), never from `currentUser`.
> - Never `git add -A` blindly — stage intended files, report anything else modified.
> - End at green `npm run build` **and** `npm run test`.
> - **Git — MILESTONE phase → commit AND push.** After green build+tests **and** the manual verification in Step 8, `git commit -m "feat(intake): dual intake + duplicate detection + AI-assisted use-case builder [Phase 2]"` then `git push origin master` (triggers the Vercel deploy — note it in the report). Never force-push or rewrite history.
> - Write the report to **`docs/refactor1/V3-PHASE-2_REPORT.md`**.

## Scope (V3 items 2 & 3)
Give intake **two modes** — a **manual** path (today's wizard, realigned) and an **AI-assisted** path (guided WHAT/WHY/HOW/WHO → duplicate check → generated, editable use case). Fix the `estimatedUsers` hardcode. **No status-graph changes** — reuse the existing `createProject` (→ `IdeaDraft`) and `submitProject` (→ `ForAssessment`).

> **Interim note — do NOT "fix" this now:** the manual submit currently generates tool recommendations immediately and routes to `/recommendations`. V3 moves tool selection to *after* qualification, but the qualification + tool-selection screens are Phases 3–4. **Keep the current submit→recommendations behavior working** so this deploy is coherent, and leave a `// TODO(V3 Phase 4): relocate tool selection to post-qualification` marker where recommendations are triggered.

## Read first
- `src/routes/AppRoutes.tsx`, `src/components/layout/Sidebar.tsx` (the "New Project" link), `src/components/layout/Topbar.tsx`.
- `src/pages/SubmitProjectPage.tsx`, `src/lib/submissionWizard.ts`, and the wizard components (`WizardFormFields`, `WizardStepper`, `SubmissionWizardSidebar`).
- `src/stores/projectsStore.ts` (`createProject`, `submitProject`, `CreateProjectInput`), `src/stores/profileStore.ts` (`getProfileDefaults`), `src/stores/catalogStore.ts`.
- `src/types/index.ts` (`Submission`, `Project`), `src/pages/ProfilePage.tsx` ("My Entries").
- `src/data/seedProjects.ts` (corpus for duplicate detection).

---

## Step 1 — Fix `estimatedUsers` + realign the manual wizard
- Add `estimatedUsers` to `WizardFormState` / `EMPTY_WIZARD_FORM` (string in form, coerced to number), collect it in the appropriate step (the "who/target users" area — Step 1 or Step 4), and add it to `validateWizardStep`.
- In `buildSubmission`, **replace the hardcoded `estimatedUsers: 50`** with the captured value (`Number(form.estimatedUsers) || 0`). Remove the `// TODO(V3 Phase 2)` marker.
- Add the field to `WizardFormFields`. Keep the wizard's 4-step shape and existing validation otherwise.

## Step 2 — Intake chooser + routes
- Make **`/submit`** a lightweight **mode chooser**: two cards — **Manual entry** and **AI-assisted** — matching the app's visual language. Manual → `/submit/manual`; AI-assisted → `/submit/assisted`.
- Move the existing wizard page to route **`/submit/manual`** (the page component can stay; just re-point the route). Update the Sidebar/Topbar "New Project" links to `/submit` (the chooser). Verify no other link hard-codes the old `/submit`→wizard assumption.

## Step 3 — Duplicate detection (`src/lib/duplicateDetection.ts`, new)
Pure module (unit-tested):
- `findSimilarProjects(candidate: { title; problem; goal }, projects: Project[], opts?): SimilarMatch[]`.
- Tokenize `title + problem + goal`: lowercase, strip punctuation, drop tokens `< 4` chars and a small stopword list. Similarity = **Jaccard** `|A∩B| / |A∪B|`.
- Return matches above a **tunable threshold constant** (default `0.25`, or `≥ 3` shared significant tokens), top 3, each with `{ project, score, sharedTokens }`.
- `SimilarMatch` should expose enough to render **name, ID, status, submitter, and the similarity reason** (shared tokens).
- Add a small vitest spec (identical text → high score; disjoint → 0; threshold filters).

## Step 4 — Use-case generator (`src/lib/useCaseGenerator.ts`, new)
Deterministic now, **LLM-swappable later** (decision: mock generator, ready for an API):
```ts
export interface UseCaseInput { what: string; why: string; how: string; who: string; profileDefaults: {...} }
export interface GeneratedUseCase {
  title: string; useCase: string; problem: string; goal: string; expectedOutcome: string
  dataSources: string; existingTools: string[]; integrationTargets: string[]
  targetUsers: string; estimatedUsers: number
}
export interface UseCaseGenerator { generate(input: UseCaseInput): Promise<GeneratedUseCase> }
export const deterministicUseCaseGenerator: UseCaseGenerator
```
- The deterministic impl assembles fields by template from the four answers (derive a title from `what`; `problem` from `why`; `goal`/`expectedOutcome` from `what`+`why`; map `how` and `profileDefaults` into data/tools/integrations; `who` into target users + `estimatedUsers`). Keep it **`async` returning a resolved Promise** so an LLM adapter is a drop-in later.
- Add a top-of-file comment: *"Deterministic mock. Swap in an LLM-backed `UseCaseGenerator` (Anthropic API) later without touching callers."* Do **not** call any external API.

## Step 5 — AI-assisted session page (`src/pages/AssistedIntakePage.tsx`, new; route `/submit/assisted`)
A guided, page-local flow (no new store — session is lightweight; it ends by creating a draft):
1. **Guided questions** grouped WHAT / WHY / HOW / WHO, pre-filled where possible from `getProfileDefaults(currentUser.id)`. Keep it simple (stepped form or sectioned form; conversational styling optional).
2. **Duplicate check** — on continue, run `findSimilarProjects` over live projects. If matches exist, show a panel listing each match's **name · ID · status · submitter · why it's similar**, with actions **Proceed anyway** / **Edit my answers** (and a link to open a match). No matches → continue silently.
3. **Generate & preview** — call `deterministicUseCaseGenerator.generate(...)`; render the generated fields in an **editable** preview so the user can accept, tweak, or **Regenerate**.
4. **Finish** — two buttons mirroring the manual wizard: **Save as draft** → `createProject(...)` (status `IdeaDraft`), and **Submit for assessment** → `createProject` then `submitProject` (→ `ForAssessment`). Build the `Submission` via the same `buildSubmission` shape so both paths converge. Toast + navigate to the new project (or `/profile`).

## Step 6 — Tag intake origin
- Add optional `intakeMode?: 'manual' | 'assisted'` to `Project` and `CreateProjectInput`; set it in `createProject` (default `'manual'`, `'assisted'` from the assisted page). Reseed defaults to `'manual'`.
- In **`ProfilePage` → My Entries**, show a small badge for assisted-origin drafts (this is the "AI-assisted session history" surface). Keep it subtle.

## Step 7 — Keep interim recommendations coherent
Confirm the manual submit path still generates recommendations and routes to `/recommendations` (unchanged), with the `// TODO(V3 Phase 4)` marker added. The assisted path does **not** generate recommendations (tool selection is post-qualification) — it ends at draft/assessment as in Step 5.

---

## Step 8 — Verify · Git (milestone) · report
1. `npm run build` ✅ and `npm run test` ✅ (including the new duplicate-detection spec).
2. Manually verify:
   - `/submit` shows the chooser; **Manual** → wizard now asks for estimated users and stores the real value (not 50).
   - **AI-assisted** → answer WHAT/WHY/HOW/WHO → a near-duplicate of a seeded project triggers the similarity panel (name/ID/status/submitter/reason) → generate → edit → **Save as draft** creates an `IdeaDraft` that appears in Profile → My Entries with the assisted badge; **Submit for assessment** creates a `ForAssessment` project.
3. `git commit` (message above) → **`git push origin master`** → confirm Vercel deploy triggered.
4. Write **`docs/refactor1/V3-PHASE-2_REPORT.md`**: per-file changes, the chosen duplicate-detection threshold, the generator interface as built, route changes, the push/deploy confirmation, and anything skipped or flagged.
