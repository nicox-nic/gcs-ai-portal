# Report: Provider-Neutral LLM Gateway Hardening

Date: 2026-07-14  
Scope: Harden `api/llm.ts` + `src/lib/llm.ts` against Slice 0 FAIL gaps without re-enabling the live path.  
Baseline: 111 tests → Final: **129** tests (build green).

## Phase 0 — Recon

- Prior contract: `POST` accepted `{ model?, messages[], max_tokens?, temperature? }` → OpenAI; client `callLLM` / `tryCallLLM`.
- Sole feature caller of `@/lib/llm`: `src/lib/draftAssist.ts` (kinds `background` / `objective`). No other non-test callers.
- No other code depended on generic `messages[]` beyond that path + tests.
- Auth: SPA has client-side role picker only — **no server identity**. True authn/identity-correlation deferred to Phase-1 auth.
- `vercel.json`: SPA rewrite only; **no** `headers` / Deployment Protection config in repo.
- Proceeded with operation-specific contract (no STOP).

## New operation contract

```json
{ "operation": "draft_assist", "input": { "kind": "background"|"objective", "draft": "<string>" } }
```

- Generic `messages[]` → **400**.
- Only registered op today: `draft_assist`. Registry structured for later ops (`intake_coaching` **not** added).
- Server owns system prompts (`api/llmGateway/operations.ts`), model (`OPENAI_MODEL`), and token ceiling (`maxCompletionTokens: 400`).
- Client: `callOperation` / `tryCallOperation` (`src/lib/llm.ts`) — no client system messages.

## Controls added (file:line)

| Control | Where |
|---|---|
| Kill-switch `LLM_GATEWAY_ENABLED` (default off → 503) | `api/llmGateway/provider.ts:73-76`, `handlePost.ts:66-67` |
| Operation allowlist + server prompts | `api/llmGateway/operations.ts:39-59`, `handlePost.ts:110-118` |
| Provider seam (`LlmProvider` / OpenAI adapter / `LLM_PROVIDER`) | `api/llmGateway/types.ts:33-38`, `provider.ts:10-71` |
| Reject generic `messages[]` | `handlePost.ts:103-107` |
| Body size cap (`MAX_BODY_BYTES` 32768) | `limits.ts:2-7`, `handlePost.ts:92-94` |
| Input length cap (`maxInputChars` 8000) | `operations.ts:42`, `handlePost.ts:124-128` |
| Server token ceiling (ignore client `max_tokens`) | `handlePost.ts:136-141` |
| Method guard 405 | `handlePost.ts:44-49`, `api/llm.ts:11-24` |
| Per-IP in-memory rate limit (20/min) | `rateLimit.ts:13-42`, `handlePost.ts:74-82` |
| Origin/Referer check (`LLM_ALLOWED_ORIGINS`) | `origin.ts:7-51`, `handlePost.ts:70-72` |
| Upstream timeout 25s → 504 | `origin.ts:54`, `provider.ts:45-49`, `handlePost.ts:139-156` |
| Sanitized `{ text }` / `{ error, status }` (no upstream JSON passthrough) | `provider.ts:36-44`, `handlePost.ts:149-160` |
| Health `{ ok }` only when disabled | `handlePost.ts:163-168` |
| Correlation id scaffold (`X-Correlation-Id`, body `correlationId`) — **not** user identity | `correlation.ts:9-14`, `handlePost.ts:22-32,64` |

## Gateway remains DISABLED

- Default: `LLM_GATEWAY_ENABLED` unset/false → all `POST` return `503 { error: "LLM gateway is disabled." }` before provider calls.
- Re-enabling is a **separate deliberate step** and still requires resolving human BLOCKED items from the Slice 0 audit (provider approval, content-classification policy, retention/logging review).
- This work does **not** re-add or require `OPENAI_API_KEY` for the disabled default path.

## Explicit deferrals

- **True authentication + user-identity correlation** → Phase-1 auth system. Correlation ids are opaque scaffolding only.
- **`intake_coaching` operation** → not added (Slice 1 still blocked).
- **Azure OpenAI adapter** → seam only (`resolveProvider`); not built.
- Recommend enabling **Vercel Deployment Protection** as the interim real gate while the SPA has no server identity.

## Platform / operational (not closed by this PR)

- Enable **Vercel Deployment Protection** (Preview/Production as appropriate).
- Confirm platform body-size / function timeout defaults for `api/llm`.
- Confirm platform WAF/rate protections (in-memory limit is per-isolate only).
- Set `LLM_ALLOWED_ORIGINS` to production app origin(s) before enabling.
- Review Vercel + provider **log retention** for prompt bodies (policy).
- When intentionally enabling: set `LLM_GATEWAY_ENABLED=true`, `OPENAI_API_KEY`, `OPENAI_MODEL`, and resolve BLOCKED policy items first.

## Commits

1. `feat(llm): operation-specific gateway contract + provider seam + kill-switch`
2. `feat(llm): request validation, body/input caps, token ceiling, method guard`
3. `feat(llm): per-IP rate limit, origin check, upstream timeout`
4. `feat(llm): sanitized responses + health-endpoint lockdown`
5. `refactor(llm): rewire client + draft-assist to operation contract`
6. `feat(llm): request correlation id scaffold (identity deferred to Phase 1)`
