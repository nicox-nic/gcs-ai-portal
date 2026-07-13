# LLM Phase 1 — Draft-Assist on Submission Wizard Free-Text Fields

## Goal

Deliver the first user-facing LLM feature: an optional **"Improve with AI"** affordance next to the submission wizard's free-text fields (**Project Background** and **Objective**). It takes whatever the user has drafted and returns a clearer version — a well-formed Project Background, or the Objective rewritten as a SMART goal — as an **editable suggestion the user explicitly accepts or dismisses**. It never auto-overwrites, never invents facts, and carries no governance weight.

This phase also completes two pieces of groundwork:
- A `.gitignore` hardening fix (small, first).
- Moving the model choice into a **server-side env var** so it lives in exactly one place instead of a placeholder constant.

Work on the existing `feature/openai-llm-provider` branch. The app must stay green and every existing flow must behave exactly as before; if the LLM is unavailable, the wizard works exactly as it does today.

---

## Working rules (read before editing)

- **Read current file contents before editing. Edit with `str_replace`. Do not regenerate or overwrite files wholesale.**
- If you hit a **conflict** with existing code/config/conventions, **stop and report it** in the `.md` report — do not force a change or guess.
- Match existing conventions: TypeScript strict, existing lint/format, existing UI stack (shadcn/Radix components, `sonner` for toasts, Tailwind), existing wizard state management.
- Do **not** hardcode a model name anywhere in `src/`. The model comes from the server env (see Task 1).
- Preserve the "works without an LLM" guarantee: draft-assist is purely additive. On any failure or missing key, the field is left untouched and the wizard is unaffected.
- Do **not** invent or place any real API key or secret anywhere.

---

## Task 0 — Harden `.gitignore` (do first)

`.env.local` is already ignored via `*.local`, but a plain `.env` (which could hold a real key) is currently committable. Fix it:

- Ensure `.gitignore` ignores `.env` and all `.env*` files, while still allowing any example file to be committed. Add (or reconcile with existing entries):

```
# Local env files (never commit real secrets)
.env
.env.*
!.env.example
```

- If an example file exists under a different name (e.g. `.env.sample`), keep whatever the project already uses and add the matching negation instead. Report what you found and what you changed.
- If a real `.env` with secrets is already tracked in git, **do not delete it silently** — stop and report it so the human can rotate the key and untrack it.

---

## Task 1 — Move model selection to a server-side env var

**`api/llm.ts`** — resolve the model in priority order and fail clearly if none is available:

- Compute `const model = body.model ?? process.env.OPENAI_MODEL;`
- If `model` is falsy, return a 500 with a clear message (`OPENAI_MODEL is not configured on the server and no model was supplied.`). Do **not** fall back to a hardcoded string.
- Read the current file first and slot this in without disturbing the existing health-check `GET`, the key check, or the error handling.

**`src/lib/llm.ts`** — the model now lives server-side, so:

- Remove the `DEFAULT_MODEL = 'MODEL_TO_BE_CONFIRMED'` placeholder.
- Make `model` in `LlmOptions` optional (it already is) and, in `callLLM`, **omit the `model` field from the request body entirely when the caller doesn't supply one** — so the server fills it from `OPENAI_MODEL`. Do not send `model: undefined`.
- Keep `callLLM`, `tryCallLLM`, and `LlmError` otherwise unchanged.
- Update `src/lib/llm.test.ts` so no spec references the removed constant, and add/adjust a spec asserting that when no model is passed, the outgoing request body has **no** `model` key.

**Docs** — update `docs/llm/SETUP.md` (and the README pointer if it lists env vars) to document `OPENAI_MODEL` alongside `OPENAI_API_KEY`: same three Vercel environments (Prod/Preview/Dev), also pulled into `.env.local` via `vercel env pull`, **no `VITE_` prefix** (it must stay server-side). Note the recommended value is `gpt-5.6-luna` (cost-tier model suited to lightweight text assist) and that the human should paste the exact model string from platform.openai.com/docs/models. Do not set the value yourself.

---

## Task 2 — Draft-assist feature

### Where
Locate the submission wizard step(s) containing the **Project Background** and **Objective** free-text inputs. Read the current component(s) first to learn the field names, the wizard's state/update mechanism, and the existing form styling. Do not restructure the wizard — add to it.

### Behavior
For each of the two fields, add an unobtrusive **"Improve with AI"** control (e.g. a small button/icon near the field label or below the textarea, styled with existing components):

1. **Disabled/guarded when the field is empty** — you can't improve nothing. Either disable the control or show a brief inline hint ("Write a first draft, then improve it"). Choose whichever fits the existing UX and note the choice.
2. **On click:** call `tryCallLLM(...)` from `src/lib/llm.ts` with:
   - a **system message** instructing the model to rewrite the user's draft into a clear, concise [Project Background | SMART Objective], preserving the user's facts, **not inventing details, numbers, or scope**, and returning only the rewritten text with no preamble;
   - a **user message** containing the current field value.
   - Do not pass a `model` — let the server env decide.
3. **Loading state:** show a spinner/disabled state on the control while in flight.
4. **Present the result as a suggestion, not a replacement:** show the returned text in a way the user can review, then **Accept** (replaces the field value, which remains fully editable) or **Dismiss** (field untouched). A small inline panel, popover, or diff-style preview is fine — match existing patterns. **Never auto-overwrite the field.**
5. **Failure / LLM unavailable:** `tryCallLLM` returns `null` → show a brief, non-blocking notice (a `sonner` toast such as "AI assist is unavailable right now" is fine) and leave the field exactly as it was. No errors thrown to the user, no wizard disruption.

### Constraints
- This is advisory text only — **no governance semantics**, no tiering/qualification logic, no writes to submission state beyond the field value the user accepts.
- Keep prompts small and the request cheap (this is the Luna-tier use case).
- Do not block wizard navigation or submission on anything AI-related.

---

## Task 3 — Tests (vitest)

Mock `src/lib/llm.ts` (or the underlying `fetch`) — **no live network calls**. Cover:
- Accepting a suggestion updates the target field's value.
- Dismissing a suggestion leaves the field unchanged.
- A `null` return from `tryCallLLM` (failure path) leaves the field unchanged and does not throw.
- The empty-field guard (control disabled or guarded as implemented).
- (From Task 1) request body omits `model` when none is supplied.

Use existing testing-library / vitest patterns already in the repo.

---

## Verification gate

Before finishing:
- `npm run build` passes cleanly.
- `npm run test` passes, including new specs. Report spec count before (88) and after.

If either gate fails, **stop and report** with exact error output — do not work around it.

---

## Report

Write the report to **`docs/prompts/refactor2/outputreport/REPORT_LLM-Phase-1_Draft_Assist.md`**, covering:
- `.gitignore` before/after, and whether any real `.env` was found tracked.
- The `api/llm.ts` model-resolution change and the `src/lib/llm.ts` cleanup (placeholder removed, model-omission behavior).
- Which wizard component(s)/fields were modified and the empty-field guard choice.
- How the suggestion UI presents Accept/Dismiss, and how failure degrades.
- Build result and vitest result (88 → N).
- The remaining manual step: human sets `OPENAI_MODEL` in Vercel + `.env.local`.
- Anything you stopped on rather than forcing.

---

## Commit

Single commit on `feature/openai-llm-provider` once both gates pass. Suggested message:

```
feat(llm): draft-assist on wizard Background/Objective + env-based model config

- gitignore: ignore .env / .env.* (keep example)
- api/llm.ts: resolve model from body ?? OPENAI_MODEL (no hardcoded fallback)
- src/lib/llm.ts: remove model placeholder; omit model when caller unspecified
- wizard: optional "Improve with AI" on Project Background & Objective
  (editable suggestion, accept/dismiss, graceful degrade, no governance weight)
- vitest coverage with mocked llm service
```

Do not push. Leave the commit local for review.
