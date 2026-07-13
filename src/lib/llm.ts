// src/lib/llm.ts
// Single entry point for LLM operations. Callers must fall back on failure.
// Clients send operation + structured input only — never messages[] or system prompts.

export type LlmOperationId = 'draft_assist'

export type DraftAssistOperationInput = {
  kind: 'background' | 'objective'
  draft: string
}

export type OperationInputMap = {
  draft_assist: DraftAssistOperationInput
}

export class LlmError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'LlmError'
    this.status = status
  }
}

export type CallOperationOptions = {
  signal?: AbortSignal
}

/**
 * Calls a registered server-side LLM operation.
 * The server owns prompts, model, and token ceilings.
 */
export async function callOperation<K extends LlmOperationId>(
  operation: K,
  input: OperationInputMap[K],
  opts: CallOperationOptions = {},
): Promise<string> {
  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, input }),
    signal: opts.signal,
  })

  if (!res.ok) {
    throw new LlmError(`LLM request failed (${res.status})`, res.status)
  }

  const data = (await res.json()) as { text?: unknown }
  if (typeof data?.text !== 'string') {
    throw new LlmError('LLM response missing text.')
  }
  return data.text
}

/** Graceful degradation: returns null instead of throwing. */
export async function tryCallOperation<K extends LlmOperationId>(
  operation: K,
  input: OperationInputMap[K],
  opts: CallOperationOptions = {},
): Promise<string | null> {
  try {
    return await callOperation(operation, input, opts)
  } catch {
    return null
  }
}
