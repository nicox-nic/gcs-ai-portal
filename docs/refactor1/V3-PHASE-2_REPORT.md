# V3-PHASE-2 Report — Dual Intake + Assisted Builder

> Executed from `docs/refactor1/V3-PHASE-2_Dual_Intake_and_Assisted_Builder.md`.  
> Verification: `npm run build` ✅ · `npm run test` ✅ (6 specs)  
> Git: **milestone** — committed and pushed to **`origin/main`** (repo default is `main`, not `master`).

## Route changes

| Path | Page |
|------|------|
| `/submit` | Mode chooser (`SubmitProjectPage`) |
| `/submit/manual` | Existing 4-step wizard (`ManualSubmitPage`) |
| `/submit/assisted` | Guided WHAT/WHY/HOW/WHO builder (`AssistedIntakePage`) |

Sidebar / list / dashboard “New Project” links still point at `/submit` (chooser). Recommendation “Back to submission” also goes to `/submit`.

## Duplicate detection

- Module: `src/lib/duplicateDetection.ts`
- Threshold: **`DUPLICATE_SIMILARITY_THRESHOLD = 0.25`** (Jaccard)
- Alternate gate: **`DUPLICATE_MIN_SHARED_TOKENS = 3`**
- Returns top 3 matches with `{ project, score, sharedTokens }`
- Spec: `src/lib/duplicateDetection.test.ts`

## Generator interface (as built)

```ts
export interface UseCaseInput {
  what: string; why: string; how: string; who: string
  profileDefaults: { skillLevelAvailable; existingTools; integrationTargets }
}
export interface GeneratedUseCase { title; useCase; problem; goal; expectedOutcome; dataSources; existingTools; integrationTargets; targetUsers; estimatedUsers }
export interface UseCaseGenerator { generate(input: UseCaseInput): Promise<GeneratedUseCase> }
export const deterministicUseCaseGenerator: UseCaseGenerator
```

Deterministic template assembly only — async Promise for future LLM swap. No external API calls.

## Per-file summary

### New
| File | Change |
|------|--------|
| `src/lib/duplicateDetection.ts` | Jaccard duplicate finder |
| `src/lib/duplicateDetection.test.ts` | 3 unit tests |
| `src/lib/useCaseGenerator.ts` | Deterministic `UseCaseGenerator` |
| `src/pages/ManualSubmitPage.tsx` | Wizard moved from `/submit` |
| `src/pages/AssistedIntakePage.tsx` | Guided intake + dup panel + editable preview |
| `docs/refactor1/V3-PHASE-2_REPORT.md` | This report |

### Updated
| File | Change |
|------|--------|
| `src/pages/SubmitProjectPage.tsx` | Chooser (Manual / AI-assisted) |
| `src/lib/submissionWizard.ts` | `estimatedUsers` field; real value in `buildSubmission` |
| `src/components/submission/WizardFormFields.tsx` | Estimated users input on Step 1 |
| `src/routes/AppRoutes.tsx` | `/submit/manual`, `/submit/assisted` |
| `src/types/index.ts` | optional `intakeMode?: 'manual' \| 'assisted'` |
| `src/stores/projectsStore.ts` | `createProject` accepts/stores `intakeMode` |
| `src/data/seedProjects.ts` | seeds default `intakeMode: 'manual'` |
| `src/pages/ProfilePage.tsx` | “AI-assisted” badge on My Entries |

## Interim recommendations

- Manual submit still generates recommendations and routes to `/recommendations`, with `// TODO(V3 Phase 4): relocate tool selection to post-qualification`.
- Assisted path does **not** generate recommendations — Save draft → `/profile`; Submit for assessment → project detail (`ForAssessment`).

## Push / deploy

- Branch pushed: **`main`** (prompt said `master`; remote HEAD is `main`).
- Expected Vercel deploy from the GitHub integration on `nicox-nic/gcs-ai-portal`.

## Skipped / flagged

1. Assisted preview defaults `dataSensitivity: Internal`, `dataAccessStatus: Unknown`, `expectedBenefitHours: 10` so `buildSubmission` stays valid — user can edit title/problem/etc.; full data/readiness editing remains on the manual path.
2. Duplicate check uses `what` as both title and goal corpus for the candidate (guided answers don’t have a separate goal yet) — works for seed near-duplicates like triage wording.
3. No status-graph / `projectStatus.ts` / `applyStatusSideEffects` changes.
4. Profiles still read via `getProfileDefaults` only (not `currentUser`).
