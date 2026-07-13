import { isRegisteredOperation, OPERATION_REGISTRY } from './operations'
import { isGatewayEnabled, resolveProvider } from './provider'
import type { DraftAssistInput, LlmOperationId } from './types'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  extraHeaders?: HeadersInit,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  })
}

export type GatewayRequestBody = {
  operation?: unknown
  input?: unknown
  messages?: unknown
  model?: unknown
  max_tokens?: unknown
  temperature?: unknown
}

/**
 * Phase 1: operation allowlist + kill-switch + provider seam.
 * Rejects the legacy generic messages[] proxy contract.
 */
export async function handleLlmPost(
  request: Request,
  env: NodeJS.ProcessEnv = process.env,
): Promise<Response> {
  if (!isGatewayEnabled(env)) {
    return jsonResponse(503, { error: 'LLM gateway is disabled.' })
  }

  let body: GatewayRequestBody
  try {
    body = (await request.json()) as GatewayRequestBody
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body.' })
  }

  // Reject legacy generic OpenAI-proxy shape (messages[]).
  if (body.messages !== undefined) {
    return jsonResponse(400, {
      error: 'Generic messages[] requests are not allowed. Use a registered operation.',
    })
  }

  if (!isRegisteredOperation(body.operation)) {
    return jsonResponse(400, {
      error: 'Unknown or missing operation. Use a registered operation id.',
    })
  }

  const operationId = body.operation as LlmOperationId
  const definition = OPERATION_REGISTRY[operationId]
  const parsedInput = definition.parseInput(body.input)
  if (!parsedInput) {
    return jsonResponse(400, { error: 'Invalid input for operation.' })
  }

  const provider = resolveProvider(env)
  if (!provider) {
    return jsonResponse(503, { error: 'LLM provider is not configured.' })
  }

  const messages = definition.buildMessages(parsedInput as DraftAssistInput)
  const result = await provider.complete(messages, {
    maxCompletionTokens: definition.maxCompletionTokens,
    temperature: definition.temperature,
  })

  if (!result.ok) {
    return jsonResponse(result.status >= 400 ? result.status : 502, {
      error: 'LLM request failed.',
      status: result.status,
    })
  }

  return jsonResponse(200, { text: result.text })
}

export function handleLlmGet(env: NodeJS.ProcessEnv = process.env): Response {
  // Phase 1: still returns config booleans when enabled path is used later;
  // Phase 4 locks disclosure when disabled.
  if (!isGatewayEnabled(env)) {
    return jsonResponse(200, { ok: true })
  }
  const keyConfigured = Boolean(env.OPENAI_API_KEY)
  const modelConfigured = Boolean(
    env.OPENAI_MODEL?.replace(/^["']|["']$/g, '').trim(),
  )
  return jsonResponse(200, { ok: true, keyConfigured, modelConfigured })
}
