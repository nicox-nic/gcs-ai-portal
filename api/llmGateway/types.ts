// Provider-neutral message shape used after the server builds prompts.
// Not accepted from the browser.

export type ProviderMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** Registered gateway operations. Add new ops here — never reopen generic messages[]. */
export type LlmOperationId = 'draft_assist'

export type DraftAssistKind = 'background' | 'objective'

export type DraftAssistInput = {
  kind: DraftAssistKind
  draft: string
}

export type OperationInputById = {
  draft_assist: DraftAssistInput
}

export type ProviderCompleteResult =
  | { ok: true; text: string }
  | { ok: false; status: number; timedOut?: boolean }

export type ProviderCompleteOptions = {
  maxCompletionTokens: number
  temperature?: number
  signal?: AbortSignal
}

export interface LlmProvider {
  complete(
    messages: ProviderMessage[],
    opts: ProviderCompleteOptions,
  ): Promise<ProviderCompleteResult>
}
