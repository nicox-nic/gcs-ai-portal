# LLM proxy setup

Serverless OpenAI proxy for the portal. The API key and model stay server-side — never use a `VITE_` prefix for these vars (that would expose them in the client bundle).

## Vercel (production / preview / development)

1. Open the project in Vercel → **Settings** → **Environment Variables**.
2. Add for **Production**, **Preview**, and **Development**:
   - `OPENAI_API_KEY` — your OpenAI secret key
   - `OPENAI_MODEL` — model id string (recommended for draft-assist: `gpt-5.6-luna`; paste the exact string from [OpenAI models](https://platform.openai.com/docs/models))
3. Redeploy so `/api/llm` picks up the variables.

Health check (no tokens spent): `GET /api/llm` → `{ "ok": true, "keyConfigured": true|false }`.

## Local development

Vite alone (`npm run dev`) does **not** serve `/api/*`. Use Vercel’s local runtime:

```bash
vercel link          # once per machine/clone
vercel env pull .env.local
vercel dev           # frontend + /api/llm together
```

`.env.local` (and `.env` / `.env.*`) are gitignored. Do not commit API keys. `!.env.example` is allowed if you add an example file without secrets.

## Client usage

Import from `src/lib/llm.ts` only (`callLLM` / `tryCallLLM`). Do not pass a `model` from feature code unless you intentionally override — omit it so the server fills `OPENAI_MODEL`. Callers must fall back to existing rule-based / manual behavior on failure.
