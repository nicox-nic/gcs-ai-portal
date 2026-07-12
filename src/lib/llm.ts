// src/lib/llm.ts
// Single entry point for all LLM calls in the app. Callers must wrap usage
// in try/catch and fall back to existing rule-based behavior on failure.

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LlmOptions {
  model?: string
  maxTokens?: number
  temperature?: number
}

// TODO(model): confirm the correct OpenAI model string before shipping any
// real feature. This placeholder is intentionally NOT a valid production
// choice — it must be reviewed against the current OpenAI model list/pricing.
export const DEFAULT_MODEL = 'MODEL_TO_BE_CONFIRMED'

export class LlmError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'LlmError'
    this.status = status
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
  })

  if (!res.ok) {
    throw new LlmError(`LLM request failed (${res.status})`, res.status)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>
  }
  const text = data?.choices?.[0]?.message?.content
  if (typeof text !== 'string') {
    throw new LlmError('LLM response missing content.')
  }
  return text
}

// Optional convenience: returns null instead of throwing, for callers that
// want a simple "use it if it works, otherwise skip" pattern.
export async function tryCallLLM(
  messages: LlmMessage[],
  opts: LlmOptions = {},
): Promise<string | null> {
  try {
    return await callLLM(messages, opts)
  } catch {
    return null
  }
}
