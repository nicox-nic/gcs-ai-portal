// Draft-assist helpers for submission wizard free-text fields.
// Advisory only — no governance weight. Callers must accept/dismiss explicitly.
// System prompts live server-side (api/llmGateway/operations.ts) — not here.

import { tryCallOperation } from '@/lib/llm'

export type DraftAssistKind = 'background' | 'objective'

/** Empty / whitespace-only drafts cannot be improved. */
export function canRequestDraftAssist(value: string): boolean {
  return value.trim().length > 0
}

/**
 * Requests an improved draft via the draft_assist gateway operation.
 * Returns null on empty input or LLM failure.
 */
export async function requestDraftAssist(
  kind: DraftAssistKind,
  draft: string,
): Promise<string | null> {
  if (!canRequestDraftAssist(draft)) return null
  return tryCallOperation('draft_assist', { kind, draft })
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
