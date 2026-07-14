import { afterEach, describe, expect, it, vi } from 'vitest'
import { callOperation, LlmError, tryCallOperation } from '@/lib/llm'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('callOperation', () => {
  it('returns text from a well-formed 200 { text } response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ text: 'hello from gateway' }),
      }),
    )

    const text = await callOperation('draft_assist', {
      kind: 'background',
      draft: 'hi',
    })
    expect(text).toBe('hello from gateway')
    expect(fetch).toHaveBeenCalledWith(
      '/api/llm',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('sends operation + input only (no messages[] / system / model)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: 'ok' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await callOperation('draft_assist', {
      kind: 'objective',
      draft: 'Reduce triage time.',
    })

    const init = fetchMock.mock.calls[0]?.[1] as { body?: string }
    const body = JSON.parse(init.body ?? '{}') as Record<string, unknown>
    expect(body).toEqual({
      operation: 'draft_assist',
      input: { kind: 'objective', draft: 'Reduce triage time.' },
    })
    expect(body).not.toHaveProperty('messages')
    expect(body).not.toHaveProperty('model')
    expect(body).not.toHaveProperty('max_tokens')
  })

  it('throws LlmError with the status on a non-OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'rate limited' }),
      }),
    )

    await expect(
      callOperation('draft_assist', { kind: 'background', draft: 'hi' }),
    ).rejects.toSatisfy(
      (err: unknown) =>
        err instanceof LlmError && err.status === 429 && /429/.test(err.message),
    )
  })
})

describe('tryCallOperation', () => {
  it('returns null on failure rather than throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: 'LLM gateway is disabled.' }),
      }),
    )

    await expect(
      tryCallOperation('draft_assist', { kind: 'background', draft: 'hi' }),
    ).resolves.toBeNull()
  })
})
