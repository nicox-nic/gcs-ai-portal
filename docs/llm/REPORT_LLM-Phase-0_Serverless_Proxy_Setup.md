# REPORT — LLM Phase 0: Serverless OpenAI Proxy Setup

## Summary

Infrastructure-only OpenAI proxy wired for Vercel. No user-facing LLM feature; existing demo flows unchanged. Build and vitest gates passed.

## Files created / modified

| Path | Action | Reason |
|---|---|---|
| `api/llm.ts` | Created | Serverless proxy: `GET` health check, `POST` chat-completions forwarder; key from `process.env.OPENAI_API_KEY` only |
| `src/lib/llm.ts` | Created | Centralized client (`callLLM` / `tryCallLLM` / `LlmError` / `DEFAULT_MODEL` placeholder) |
| `src/lib/llm.test.ts` | Created | Vitest coverage with mocked `fetch` (no live network) |
| `vercel.json` | Modified | SPA catch-all rewrite now excludes `/api/*` |
| `docs/llm/SETUP.md` | Created | Manual env-var and local `vercel dev` steps |
| `docs/llm/REPORT_LLM-Phase-0_Serverless_Proxy_Setup.md` | Created | This report |
| `README.md` | Modified | Short pointer under Deploy → OpenAI proxy |

## `vercel.json` — before / after

**Before:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**After:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

`/api` was **not** previously protected: the catch-all `/(.*)` would have competed with serverless routes depending on rewrite evaluation. Changed only the rewrite `source` to a negative-lookahead form so SPA fallback leaves `/api/*` alone. No other rewrite restructuring.

## Existing `api/` convention

No `api/` folder existed. Used the prompt’s Web-standard `export function GET` / `export async function POST` style with `Request` / `Response` (no OpenAI SDK; `fetch` only).

## Build & vitest

| Gate | Before | After |
|---|---|---|
| Spec files | 15 | 16 |
| Specs | 85 passed | 88 passed (+3 in `llm.test.ts`) |
| `npm run build` | (baseline assumed green) | Passed (`tsc -b` + `vite build`) |

### Note adapted for project TS config

`tsconfig.app.json` enables `erasableSyntaxOnly`. The prompt’s `constructor(message, readonly status?)` parameter property is illegal under that flag (`TS1294`). `LlmError` was written with an explicit `readonly status?: number` field assignment instead — same public API, gate-compatible.

## Manual steps remaining (human)

1. **Vercel:** Project → Settings → Environment Variables → add `OPENAI_API_KEY` for Production, Preview, and Development → redeploy.
2. **Local:** `vercel link` once, then `vercel env pull .env.local`, run `vercel dev` (not plain `vite` alone) so `/api/llm` is served.
3. Confirm key never committed. Details: `docs/llm/SETUP.md`.

## Gitignore / secrets

- `.env.local` is covered by existing `.gitignore` pattern `*.local`.
- Plain `.env` is **not** currently gitignored. Reported only — not changed in this phase. Do not place real keys in a tracked `.env`.

## Conflicts / items not forced

1. **`.cursorrules` “No backend”** — Explicitly overridden by this prompt for `api/llm.ts` + client wrapper only.
2. **`.cursorrules` `ILlmProvider` Azure-from-day-one interface** — README still documents a future `ILlmProvider`; this phase ships the prompt’s concrete `callLLM` service only (no interface wrapper invented). Call sites in later phases can sit behind an interface if desired.
3. **`DEFAULT_MODEL = 'MODEL_TO_BE_CONFIRMED'`** — Left intact with TODO as required; not a production model string.
4. **Unrelated working-tree churn** — Branch also has many `docs/` deletes + `docs/prompts/` untracked moves from prior work. Those were **not** included in the Phase 0 commit.

## Commit

Single local commit (not pushed):

```
feat(llm): add serverless OpenAI proxy + centralized llm client service
```
