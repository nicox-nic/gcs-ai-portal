import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleLlmPost } from '../../api/llmGateway/handlePost'
import { isAllowedOrigin } from '../../api/llmGateway/origin'
import * as providerMod from '../../api/llmGateway/provider'
import {
  checkRateLimit,
  resetRateLimitStoreForTests,
} from '../../api/llmGateway/rateLimit'

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

function postJson(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request('http://localhost/api/llm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

describe('origin check', () => {
  it('allows configured Origin', () => {
    const req = postJson({ operation: 'draft_assist' })
    expect(isAllowedOrigin(req, env())).toBe(true)
  })

  it('rejects disallowed Origin', () => {
    const req = postJson(
      { operation: 'draft_assist' },
      { Origin: 'https://evil.example' },
    )
    expect(isAllowedOrigin(req, env())).toBe(false)
  })
})

describe('handleLlmPost Phase 3 abuse controls', () => {
  it('rejects disallowed origin with 403', async () => {
    const res = await handleLlmPost(
      postJson(
        {
          operation: 'draft_assist',
          input: { kind: 'background', draft: 'x' },
        },
        { Origin: 'https://evil.example' },
      ),
      env(),
    )
    expect(res.status).toBe(403)
  })

  it('rejects requests over the rate limit', async () => {
    for (let i = 0; i < 20; i += 1) {
      expect(checkRateLimit('10.0.0.1', 1_000).allowed).toBe(true)
    }
    expect(checkRateLimit('10.0.0.1', 1_000).allowed).toBe(false)

    vi.spyOn(providerMod, 'resolveProvider').mockReturnValue({
      complete: async () => ({ ok: true as const, text: 'ok' }),
    })

    // Exhaust via handleLlmPost using the same IP header.
    resetRateLimitStoreForTests()
    for (let i = 0; i < 20; i += 1) {
      const res = await handleLlmPost(
        postJson(
          {
            operation: 'draft_assist',
            input: { kind: 'background', draft: `d${i}` },
          },
          { 'x-forwarded-for': '203.0.113.9' },
        ),
        env(),
      )
      expect(res.status).toBe(200)
    }
    const limited = await handleLlmPost(
      postJson(
        {
          operation: 'draft_assist',
          input: { kind: 'background', draft: 'over' },
        },
        { 'x-forwarded-for': '203.0.113.9' },
      ),
      env(),
    )
    expect(limited.status).toBe(429)
  })

  it('returns 504 when the provider times out; client path can degrade to null', async () => {
    vi.spyOn(providerMod, 'resolveProvider').mockReturnValue({
      complete: async () => ({ ok: false as const, status: 504, timedOut: true }),
    })

    const res = await handleLlmPost(
      postJson({
        operation: 'draft_assist',
        input: { kind: 'background', draft: 'slow' },
      }),
      env(),
    )
    expect(res.status).toBe(504)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/timed out/i)
  })
})
