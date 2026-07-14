import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyDraftAssistDecision,
  canRequestDraftAssist,
  requestDraftAssist,
} from '@/lib/draftAssist'
import * as llm from '@/lib/llm'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('canRequestDraftAssist', () => {
  it('guards empty and whitespace-only fields', () => {
    expect(canRequestDraftAssist('')).toBe(false)
    expect(canRequestDraftAssist('   ')).toBe(false)
    expect(canRequestDraftAssist('first draft')).toBe(true)
  })
})

describe('applyDraftAssistDecision', () => {
  it('accepting a suggestion updates the target field value', () => {
    expect(
      applyDraftAssistDecision('old draft', 'improved draft', 'accept'),
    ).toBe('improved draft')
  })

  it('dismissing a suggestion leaves the field unchanged', () => {
    expect(
      applyDraftAssistDecision('old draft', 'improved draft', 'dismiss'),
    ).toBe('old draft')
  })

  it('unavailable / null suggestion leaves the field unchanged and does not throw', () => {
    expect(
      applyDraftAssistDecision('old draft', null, 'unavailable'),
    ).toBe('old draft')
    expect(() =>
      applyDraftAssistDecision('old draft', null, 'unavailable'),
    ).not.toThrow()
  })
})

describe('requestDraftAssist', () => {
  it('returns null without calling the gateway when the field is empty', async () => {
    const spy = vi.spyOn(llm, 'tryCallOperation').mockResolvedValue('should not run')
    await expect(requestDraftAssist('background', '  ')).resolves.toBeNull()
    expect(spy).not.toHaveBeenCalled()
  })

  it('returns null when tryCallOperation fails (null) and leaves callers able to keep the field', async () => {
    vi.spyOn(llm, 'tryCallOperation').mockResolvedValue(null)
    const draft = 'Engineers waste time triaging tickets.'
    await expect(requestDraftAssist('background', draft)).resolves.toBeNull()
    expect(applyDraftAssistDecision(draft, null, 'unavailable')).toBe(draft)
  })

  it('calls draft_assist operation with structured input (no client system message)', async () => {
    const spy = vi.spyOn(llm, 'tryCallOperation').mockResolvedValue('rewritten')
    await requestDraftAssist('objective', 'Reduce triage time.')
    expect(spy).toHaveBeenCalledWith('draft_assist', {
      kind: 'objective',
      draft: 'Reduce triage time.',
    })
  })

  it('returns the improved text when tryCallOperation succeeds', async () => {
    vi.spyOn(llm, 'tryCallOperation').mockResolvedValue('Clear Project Background text.')
    await expect(
      requestDraftAssist('background', 'messy notes about the problem'),
    ).resolves.toBe('Clear Project Background text.')
  })
})
