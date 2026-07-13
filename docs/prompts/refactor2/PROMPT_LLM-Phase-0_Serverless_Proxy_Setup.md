# LLM Phase 0 — Serverless OpenAI Proxy Setup

## Goal

Add a serverless proxy so the app can call the OpenAI API without ever exposing the API key in the client bundle. This phase sets up **infrastructure only** — no user-facing LLM feature yet. The app must continue to build and behave exactly as it does today; nothing in `src/` that already works should change behavior.

The deliverable is:
1. A Vercel serverless function at `api/llm.ts` that proxies chat-completion requests to OpenAI, reading the key from a server-side env var.
2. A single centralized client service `src/lib/llm.ts` that the rest of the app will use (and that specs can mock).
3. A lightweight health check to verify wiring end-to-end without spending tokens.
4. Vitest coverage that mocks the service so the suite stays green with no live network calls.

---

## Working rules (read before editing)

- **Do not regenerate or overwrite existing files wholesale.** Read the current contents of any file you touch first, then edit with `str_replace`.
- If you find a **conflict** with existing code, config, or conventions — stop, do not guess, and report it in your `.md` report instead of forcing a change.
- Match the existing project conventions (TypeScript strict, existing lint/format setup, existing import style).
- Do **not** hardcode any OpenAI model name. The model is supplied by the caller (see below). A `DEFAULT_MODEL` constant is defined but explicitly marked as needing confirmation — leave the placeholder value and the `TODO` comment intact.
- Do **not** add the OpenAI SDK dependency unless the project already uses it; use `fetch` inside the function (Node 18+ / Vercel runtime has global `fetch`).
- Keep the "works without an LLM" guarantee: nothing added here may become a hard dependency for existing flows.

---

## Step 1 — Create the serverless function

Create a new file **`api/llm.ts`** at the **repository root** (sibling to `src/`, `package.json`, and `vite.config.ts` — **not** inside `src/`). Vercel automatically deploys files under `/api` as serverless functions for Vite projects; no extra config is needed to register the route.

```ts
// api/llm.ts
// Serverless proxy to the OpenAI API. The API key lives ONLY here (server-side),
// read from process.env — it is never shipped to the browser bundle.

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LlmRequestBody {
  model?: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
}

// GET /api/llm — health check. Confirms the function is deployed and whether
// the key is configured, WITHOUT calling OpenAI or revealing the key value.
export function GET(_request: Request) {
  const keyConfigured = Boolean(process.env.OPENAI_API_KEY);
  return new Response(JSON.stringify({ ok: true, keyConfigured }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// POST /api/llm — forwards a chat-completion request to OpenAI.
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'OPENAI_API_KEY is not configured on the server.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: LlmRequestBody;
  try {
    body = (await request.json()) as LlmRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages[] is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: body.model,
        messages: body.messages,
        max_tokens: body.max_tokens ?? 1000,
        ...(body.temperature !== undefined ? { temperature: body.temperature } : {}),
      }),
    });

    const data = await upstream.json();
    // Pass through OpenAI's status so the client can distinguish rate limits,
    // auth errors, etc. from a healthy 200.
    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Upstream LLM request failed.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

If the project already has an `api/` folder with a different function style (e.g. `export default function handler(req, res)`), **do not mix styles blindly** — report what you found and match the existing convention, adapting the logic above accordingly.

---

## Step 2 — Create the centralized client service

Create **`src/lib/llm.ts`**. This is the ONLY place the rest of the app talks to the proxy. It must be trivially mockable in tests and must throw a typed error on failure so callers can fall back to existing rule-based behavior.

```ts
// src/lib/llm.ts
// Single entry point for all LLM calls in the app. Callers must wrap usage
// in try/catch and fall back to existing rule-based behavior on failure.

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// TODO(model): confirm the correct OpenAI model string before shipping any
// real feature. This placeholder is intentionally NOT a valid production
// choice — it must be reviewed against the current OpenAI model list/pricing.
export const DEFAULT_MODEL = 'MODEL_TO_BE_CONFIRMED';

export class LlmError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'LlmError';
  }
}

export async function callLLM(
  messages: LlmMessage[],
  opts: LlmOptions = {},
): Promise<string> {
  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      messages,
      max_tokens: opts.maxTokens ?? 1000,
      temperature: opts.temperature,
    }),
  });

  if (!res.ok) {
    throw new LlmError(`LLM request failed (${res.status})`, res.status);
  }

  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string') {
    throw new LlmError('LLM response missing content.');
  }
  return text;
}

// Optional convenience: returns null instead of throwing, for callers that
// want a simple "use it if it works, otherwise skip" pattern.
export async function tryCallLLM(
  messages: LlmMessage[],
  opts: LlmOptions = {},
): Promise<string | null> {
  try {
    return await callLLM(messages, opts);
  } catch {
    return null;
  }
}
```

---

## Step 3 — Vitest coverage

Add a spec (e.g. `src/lib/llm.test.ts`) that mocks `fetch` and verifies:
- `callLLM` returns the assistant message content on a well-formed 200 response.
- `callLLM` throws `LlmError` (with the status) on a non-OK response.
- `tryCallLLM` returns `null` on failure rather than throwing.

Use the project's existing vitest patterns. Mock global `fetch` — do **not** make real network calls. This keeps the full suite green offline.

---

## Step 4 — SPA routing check (important)

The app uses react-router v6, so there is likely a rewrite that sends all routes to `index.html`. Verify that **`/api/*` requests are NOT swallowed by the SPA catch-all rewrite**:

- Inspect `vercel.json` (create it only if needed).
- Vercel serves `/api` functions before user rewrites in the normal case, but a broad catch-all can still interfere depending on how it's written.
- If a catch-all rewrite exists, ensure it excludes `/api` (e.g. via a negative-lookahead source such as `/((?!api/).*)` routed to `/index.html`, or by confirming the existing config already leaves `/api` alone).
- Report exactly what you found in `vercel.json` and whether any change was required. **Do not** restructure existing rewrites beyond what's needed to protect `/api`.

---

## Step 5 — Env var + local dev documentation (do NOT set secrets yourself)

You cannot set Vercel dashboard secrets. Instead, document the manual steps clearly in the report and in a short section appended to the project README (or a new `docs/llm/SETUP.md`):

1. In Vercel: Project → Settings → Environment Variables → add `OPENAI_API_KEY` for Production, Preview, and Development. Redeploy afterward.
2. Local dev: `vercel link` once, then `vercel env pull .env.local` to fetch the key, and run `vercel dev` (serves the frontend + `/api` functions together).
3. Confirm `.env.local` (and any `.env*` containing secrets) is gitignored. If it is not, report it — do not commit any key.

Do **not** invent or place any real key value anywhere.

---

## Verification gate

Before finishing:
- `npm run build` must pass cleanly.
- `npm run test` (vitest) must pass, including the new specs.
- Report the total spec count before and after.

If either gate fails, stop and report the failure with the exact error output rather than working around it.

---

## Report

Write a markdown report to **`docs/llm/REPORT_LLM-Phase-0_Serverless_Proxy_Setup.md`** covering:
- Files created/modified (with the reason for each).
- Exact contents of `vercel.json` before and after, and whether `/api` was already protected from the SPA rewrite.
- Whether an existing `api/` convention was found and how you matched it.
- Build result and vitest result (spec count before/after).
- The manual env-var steps that remain for the human to complete.
- Anything you stopped on rather than forcing.

---

## Commit

Make a **single commit** for this phase once both gates pass. Suggested message:

```
feat(llm): add serverless OpenAI proxy + centralized llm client service

- api/llm.ts: server-side proxy (key from process.env, health GET, proxy POST)
- src/lib/llm.ts: single client entry point (callLLM/tryCallLLM, LlmError)
- vitest coverage with mocked fetch
- protect /api from SPA catch-all rewrite
- infra only; no user-facing LLM feature; existing flows unchanged
```

Do not push. Leave the commit local for review, consistent with the established workflow.
