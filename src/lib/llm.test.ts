import { afterEach, describe, expect, it, vi } from 'vitest'
import { callLLM, LlmError, tryCallLLM } from '@/lib/llm'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('callLLM', () => {
  it('returns the assistant message content on a well-formed 200 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'hello from proxy' } }],
        }),
      }),
    )

    const text = await callLLM([{ role: 'user', content: 'hi' }])
    expect(text).toBe('hello from proxy')
    expect(fetch).toHaveBeenCalledWith(
      '/api/llm',
      expect.objectContaining({ method: 'POST' }),
    )
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

    await expect(callLLM([{ role: 'user', content: 'hi' }])).rejects.toSatisfy(
      (err: unknown) =>
        err instanceof LlmError && err.status === 429 && /429/.test(err.message),
    )
  })
})

describe('tryCallLLM', () => {
  it('returns null on failure rather than throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'server' }),
      }),
    )

    await expect(tryCallLLM([{ role: 'user', content: 'hi' }])).resolves.toBeNull()
  })
})
