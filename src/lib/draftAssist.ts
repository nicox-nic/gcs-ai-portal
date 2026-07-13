// Draft-assist helpers for submission wizard free-text fields.
// Advisory only — no governance weight. Callers must accept/dismiss explicitly.

import { tryCallLLM, type LlmMessage } from '@/lib/llm'

export type DraftAssistKind = 'background' | 'objective'

const SYSTEM_PROMPTS: Record<DraftAssistKind, string> = {
  background:
    'Rewrite the user draft into a clear, concise Project Background. Preserve the user facts. Do not invent details, numbers, or scope. Return only the rewritten text with no preamble or quotes.',
  objective:
    'Rewrite the user draft as a SMART Objective (Specific, Measurable, Achievable, Relevant, Time-bound) using only facts present in the draft. Do not invent details, numbers, or scope. Return only the rewritten text with no preamble or quotes.',
}

/** Empty / whitespace-only drafts cannot be improved. */
export function canRequestDraftAssist(value: string): boolean {
  return value.trim().length > 0
}

export function buildDraftAssistMessages(
  kind: DraftAssistKind,
  draft: string,
): LlmMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPTS[kind] },
    { role: 'user', content: draft },
  ]
}

/**
 * Requests an improved draft. Returns null on empty input or LLM failure.
 * Does not pass a model — server env OPENAI_MODEL decides.
 */
export async function requestDraftAssist(
  kind: DraftAssistKind,
  draft: string,
): Promise<string | null> {
  if (!canRequestDraftAssist(draft)) return null
  return tryCallLLM(buildDraftAssistMessages(kind, draft), { maxTokens: 400 })
}

/** Accept replaces the field; dismiss / unavailable leave it unchanged. */
export function applyDraftAssistDecision(
  currentValue: string,
  suggestion: string | null,
  decision: 'accept' | 'dismiss' | 'unavailable',
): string {
  if (decision === 'accept' && suggestion !== null && suggestion.trim().length > 0) {
    return suggestion
  }
  return currentValue
}
