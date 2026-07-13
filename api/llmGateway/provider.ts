import type { LlmProvider, ProviderCompleteOptions, ProviderMessage } from './types'

function stripEnvQuotes(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  const trimmed = value.replace(/^["']|["']$/g, '').trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/** OpenAI Chat Completions adapter — the only provider implementation for now. */
export function createOpenAIProvider(env: {
  apiKey: string
  model: string
}): LlmProvider {
  return {
    async complete(messages: ProviderMessage[], opts: ProviderCompleteOptions) {
      try {
        const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.apiKey}`,
          },
          body: JSON.stringify({
            model: env.model,
            messages,
            max_completion_tokens: opts.maxCompletionTokens,
            ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
          }),
          signal: opts.signal,
        })

        const data = (await upstream.json()) as {
          choices?: Array<{ message?: { content?: unknown } }>
        }

        if (!upstream.ok) {
          return { ok: false as const, status: upstream.status }
        }

        const text = data?.choices?.[0]?.message?.content
        if (typeof text !== 'string') {
          return { ok: false as const, status: 502 }
        }
        return { ok: true as const, text }
      } catch (error) {
        const timedOut =
          error instanceof Error &&
          (error.name === 'AbortError' || error.name === 'TimeoutError')
        return { ok: false as const, status: timedOut ? 504 : 502, timedOut }
      }
    },
  }
}

/**
 * Provider selection seam. Env-driven; default OpenAI.
 * Azure OpenAI (or others) can register here later without changing the gateway contract.
 */
export function resolveProvider(env: NodeJS.ProcessEnv = process.env): LlmProvider | null {
  const providerId = (env.LLM_PROVIDER ?? 'openai').toLowerCase()
  if (providerId !== 'openai') {
    // Unknown providers are not silently accepted — seam exists, adapters not built yet.
    return null
  }

  const apiKey = env.OPENAI_API_KEY
  const model = stripEnvQuotes(env.OPENAI_MODEL)
  if (!apiKey || !model) return null

  return createOpenAIProvider({ apiKey, model })
}

export function isGatewayEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = (env.LLM_GATEWAY_ENABLED ?? '').trim().toLowerCase()
  return raw === 'true' || raw === '1' || raw === 'yes'
}
