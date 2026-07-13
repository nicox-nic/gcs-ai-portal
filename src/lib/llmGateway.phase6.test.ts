import { describe, expect, it } from 'vitest'
import { createCorrelationId } from '../../api/llmGateway/correlation'

describe('correlation id scaffold', () => {
  it('creates opaque non-PII ids with llm_ prefix', () => {
    const a = createCorrelationId()
    const b = createCorrelationId()
    expect(a).toMatch(/^llm_/)
    expect(b).toMatch(/^llm_/)
    expect(a).not.toBe(b)
  })
})
