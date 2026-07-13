import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleLlmGet, handleLlmPost } from '../../api/llmGateway/handlePost'
import * as providerMod from '../../api/llmGateway/provider'
import { resetRateLimitStoreForTests } from '../../api/llmGateway/rateLimit'

afterEach(() => {
  vi.restoreAllMocks()
  resetRateLimitStoreForTests()
})

function env(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env,
    LLM_GATEWAY_ENABLED: 'true',
    OPENAI_API_KEY: 'test-key',
    OPENAI_MODEL: 'gpt-test',
    LLM_ALLOWED_ORIGINS: 'http://localhost',
    ...overrides,
  }
}

function postJson(body: unknown): Request {
  return new Request('http://localhost/api/llm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost',
    },
    body: JSON.stringify(body),
  })
}

describe('Phase 4 sanitized responses + health lockdown', () => {
  it('success returns { text } only', async () => {
    vi.spyOn(providerMod, 'resolveProvider').mockReturnValue({
      complete: async () => ({ ok: true as const, text: 'clean' }),
    })
    const res = await handleLlmPost(
      postJson({
        operation: 'draft_assist',
        input: { kind: 'background', draft: 'x' },
      }),
      env(),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ text: 'clean' })
  })

  it('upstream error returns sanitized generic error (no payload passthrough)', async () => {
    vi.spyOn(providerMod, 'resolveProvider').mockReturnValue({
      complete: async () => ({ ok: false as const, status: 429 }),
    })
    const res = await handleLlmPost(
      postJson({
        operation: 'draft_assist',
        input: { kind: 'background', draft: 'x' },
      }),
      env(),
    )
    expect(res.status).toBe(429)
    const body = (await res.json()) as Record<string, unknown>
    expect(body).toEqual({ error: 'LLM request failed.', status: 429 })
    expect(JSON.stringify(body)).not.toMatch(/choices|api.?key|Bearer/i)
  })

  it('health endpoint discloses only { ok } when gateway is disabled', async () => {
    const res = handleLlmGet(env({ LLM_GATEWAY_ENABLED: 'false' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})
