import { isBodyWithinLimit, MAX_BODY_BYTES } from './limits'
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

export function methodNotAllowed(): Response {
  return jsonResponse(
    405,
    { error: 'Method not allowed.' },
    { Allow: 'GET, POST' },
  )
}

/**
 * Operation allowlist + kill-switch + provider seam + request limits.
 * Rejects the legacy generic messages[] proxy contract.
 * Client max_tokens / temperature / model are ignored — server sets ceilings.
 */
export async function handleLlmPost(
  request: Request,
  env: NodeJS.ProcessEnv = process.env,
): Promise<Response> {
  if (!isGatewayEnabled(env)) {
    return jsonResponse(503, { error: 'LLM gateway is disabled.' })
  }

  let rawText: string
  try {
    rawText = await request.text()
  } catch {
    return jsonResponse(400, { error: 'Invalid request body.' })
  }

  if (!isBodyWithinLimit(rawText, MAX_BODY_BYTES)) {
    return jsonResponse(413, { error: 'Request body too large.' })
  }

  let body: GatewayRequestBody
  try {
    body = JSON.parse(rawText) as GatewayRequestBody
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

  const draftAssistInput = parsedInput as DraftAssistInput
  if (draftAssistInput.draft.length > definition.maxInputChars) {
    return jsonResponse(400, { error: 'Input exceeds maximum allowed length.' })
  }

  const provider = resolveProvider(env)
  if (!provider) {
    return jsonResponse(503, { error: 'LLM provider is not configured.' })
  }

  // Token ceiling is owned by the operation definition — never from the client body.
  const messages = definition.buildMessages(draftAssistInput)
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
