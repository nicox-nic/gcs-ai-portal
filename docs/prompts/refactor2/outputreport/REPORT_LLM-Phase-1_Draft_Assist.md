# REPORT — LLM Phase 1: Draft-Assist on Submission Wizard

## Summary

Draft-assist ("Improve with AI") added on the manual submission wizard **Problem** and **Goal** fields (mapped to Project Background / SMART Objective prompts). Model selection moved to server env `OPENAI_MODEL`. `.gitignore` hardened for `.env` files. Build and vitest gates passed. Existing flows unchanged when LLM is unavailable.

## Task 0 — `.gitignore`

**Before:** ignored `*.local` only (covers `.env.local`); plain `.env` was committable.

**After:** added:

```
# Local env files (never commit real secrets)
.env
.env.*
!.env.example
```

Kept existing `*.local`. No `.env.example` / `.env.sample` existed. No real `.env` was tracked in git (`git ls-files` empty for `.env*`).

## Task 1 — Server-side model

### `api/llm.ts`
- After messages validation: `const model = body.model ?? process.env.OPENAI_MODEL`
- If falsy → `500` with `OPENAI_MODEL is not configured on the server and no model was supplied.`
- Upstream request uses resolved `model` (no hardcoded fallback)
- `GET` health check, API key check, and other error paths unchanged

### `src/lib/llm.ts`
- Removed `DEFAULT_MODEL` placeholder and TODO
- When caller omits `model`, request body has **no** `model` key (server fills from `OPENAI_MODEL`)
- `callLLM` / `tryCallLLM` / `LlmError` otherwise unchanged

### Docs
- `docs/llm/SETUP.md` documents `OPENAI_API_KEY` + `OPENAI_MODEL` (Prod/Preview/Dev, no `VITE_` prefix)
- Recommended value noted: `gpt-5.6-luna` (human pastes exact string from OpenAI docs)
- README proxy blurb updated to mention both env vars

## Task 2 — Draft-assist UI

| Item | Detail |
|---|---|
| Component wired | `WizardFormFields.tsx` step 2 (Use Case) |
| Fields | `form.problem` ← Project Background assist; `form.goal` ← SMART Objective assist |
| UI labels | Left as **Problem** / **Goal** (existing copy); prompts use Background/Objective semantics |
| Control | `DraftAssistControl` — outline `xs` button with Sparkles / spinner |
| Empty guard | **Disabled** button + hint: "Write a first draft, then improve it" |
| Suggestion UI | Inline indigo panel under the field; **Accept** writes via `onChange`; **Dismiss** clears panel only |
| Failure | `tryCallLLM` → `null` → `toast.message('AI assist is unavailable right now')`; field untouched |
| Model | Not passed from client — server `OPENAI_MODEL` |
| Governance | None — advisory text only |

Helpers live in `src/lib/draftAssist.ts` (testable without RTL; repo has no `@testing-library/react`).

## Tests

| | Before | After |
|---|---|---|
| Spec files | 16 | 17 |
| Specs | 88 | **98** |

Coverage (`src/lib/draftAssist.test.ts` + updated `llm.test.ts`):
- Accept updates value; dismiss leaves unchanged; null/unavailable leaves unchanged
- Empty-field guard; `requestDraftAssist` does not call LLM when empty
- Outgoing `callLLM` body omits `model` when unspecified

## Gates

- `npm run build` — passed
- `npm run test` — 98 passed

## Manual steps remaining (human)

1. Set `OPENAI_MODEL` in Vercel (Prod/Preview/Dev) alongside `OPENAI_API_KEY` (recommended starting point: `gpt-5.6-luna` — confirm exact id on platform.openai.com/docs/models).
2. Redeploy; locally `vercel env pull .env.local` then `vercel dev`.

## Not forced / notes

- No Testing Library in the repo — UI accept/dismiss covered via pure helpers used by `DraftAssistControl`, matching the ConfirmDialog unit-test style.
- Field labels not renamed to "Project Background"/"Objective" to avoid silent copy churn; mapping documented above.
- Unrelated `docs/` deletes / `docs/prompts/` moves on the branch were **not** included in this commit.
