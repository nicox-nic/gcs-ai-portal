# LLM proxy setup (Phase 0)

Infrastructure only — no user-facing LLM feature yet. The OpenAI API key must never appear in the client bundle.

## Vercel (production / preview)

1. Open the project in Vercel → **Settings** → **Environment Variables**.
2. Add `OPENAI_API_KEY` for **Production**, **Preview**, and **Development**.
3. Redeploy so the serverless function at `/api/llm` picks up the variable.

Health check (no tokens spent): `GET /api/llm` → `{ "ok": true, "keyConfigured": true|false }`.

## Local development

Vite alone (`npm run dev`) does **not** serve `/api/*`. Use Vercel’s local runtime:

```bash
vercel link          # once per machine/clone
vercel env pull .env.local
vercel dev           # frontend + /api/llm together
```

`.env.local` is gitignored via the `*.local` pattern. Do not commit API keys.

## Client usage

Import from `src/lib/llm.ts` only (`callLLM` / `tryCallLLM`). Callers must fall back to existing rule-based behavior on failure. Confirm `DEFAULT_MODEL` before shipping any real feature.
