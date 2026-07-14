import type {
  DraftAssistInput,
  DraftAssistKind,
  LlmOperationId,
  ProviderMessage,
} from './types'

export type OperationDefinition<TInput> = {
  id: LlmOperationId
  maxCompletionTokens: number
  temperature?: number
  /** Max characters for primary text fields (enforced in validation phase). */
  maxInputChars: number
  buildMessages: (input: TInput) => ProviderMessage[]
  parseInput: (raw: unknown) => TInput | null
}

const DRAFT_ASSIST_SYSTEM: Record<DraftAssistKind, string> = {
  background:
    'Rewrite the user draft into a clear, concise Project Background. Preserve the user facts. Do not invent details, numbers, or scope. Return only the rewritten text with no preamble or quotes.',
  objective:
    'Rewrite the user draft as a SMART Objective (Specific, Measurable, Achievable, Relevant, Time-bound) using only facts present in the draft. Do not invent details, numbers, or scope. Return only the rewritten text with no preamble or quotes.',
}

const DRAFT_KINDS = new Set<DraftAssistKind>(['background', 'objective'])

function parseDraftAssistInput(raw: unknown): DraftAssistInput | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>
  const keys = Object.keys(obj)
  if (keys.some((k) => k !== 'kind' && k !== 'draft')) return null
  if (typeof obj.kind !== 'string' || !DRAFT_KINDS.has(obj.kind as DraftAssistKind)) {
    return null
  }
  if (typeof obj.draft !== 'string') return null
  return { kind: obj.kind as DraftAssistKind, draft: obj.draft }
}

export const draftAssistOperation: OperationDefinition<DraftAssistInput> = {
  id: 'draft_assist',
  maxCompletionTokens: 400,
  maxInputChars: 8_000,
  buildMessages: (input) => [
    { role: 'system', content: DRAFT_ASSIST_SYSTEM[input.kind] },
    { role: 'user', content: input.draft },
  ],
  parseInput: parseDraftAssistInput,
}

/**
 * Server-side allowlist. `intake_coaching` is intentionally absent (Slice 1 blocked).
 * Add future operations here without restoring a generic messages[] path.
 */
export const OPERATION_REGISTRY: Record<
  LlmOperationId,
  OperationDefinition<DraftAssistInput>
> = {
  draft_assist: draftAssistOperation,
}

export function isRegisteredOperation(value: unknown): value is LlmOperationId {
  return typeof value === 'string' && value in OPERATION_REGISTRY
}
