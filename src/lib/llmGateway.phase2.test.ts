import { afterEach, describe, expect, it, vi } from 'vitest'
import { draftAssistOperation } from '../../api/llmGateway/operations'
import { handleLlmPost, methodNotAllowed } from '../../api/llmGateway/handlePost'
import { MAX_BODY_BYTES } from '../../api/llmGateway/limits'
import * as providerMod from '../../api/llmGateway/provider'

afterEach(() => {
  vi.restoreAllMocks()
})

function env(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env,
    LLM_GATEWAY_ENABLED: 'true',
    OPENAI_API_KEY: 'test-key',
    OPENAI_MODEL: 'gpt-test',
    ...overrides,
  }
}

function postRaw(raw: string): Request {
  return new Request('http://localhost/api/llm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost',
    },
    body: raw,
  })
}

function postJson(body: unknown): Request {
  return postRaw(JSON.stringify(body))
}

describe('handleLlmPost Phase 2 limits', () => {
  it('rejects oversized bodies', async () => {
    const huge = 'x'.repeat(MAX_BODY_BYTES + 1)
    const res = await handleLlmPost(postRaw(huge), env())
    expect(res.status).toBe(413)
  })

  it('rejects over-long draft input', async () => {
    const draft = 'y'.repeat(draftAssistOperation.maxInputChars + 1)
    const res = await handleLlmPost(
      postJson({
        operation: 'draft_assist',
        input: { kind: 'background', draft },
      }),
      env(),
    )
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/length/i)
  })

  it('enforces operation token ceiling regardless of client max_tokens', async () => {
    const complete = vi.fn(async (_messages, opts: { maxCompletionTokens: number }) => {
      expect(opts.maxCompletionTokens).toBe(draftAssistOperation.maxCompletionTokens)
      return { ok: true as const, text: 'ok' }
    })
    vi.spyOn(providerMod, 'resolveProvider').mockReturnValue({ complete })

    const res = await handleLlmPost(
      postJson({
        operation: 'draft_assist',
        input: { kind: 'background', draft: 'short' },
        max_tokens: 99_999,
        temperature: 1.9,
        model: 'client-override',
      }),
      env(),
    )
    expect(res.status).toBe(200)
    expect(complete).toHaveBeenCalledOnce()
  })

  it('returns 405 for disallowed methods', () => {
    const res = methodNotAllowed()
    expect(res.status).toBe(405)
    expect(res.headers.get('Allow')).toBe('GET, POST')
  })
})
