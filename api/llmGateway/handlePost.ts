import { isBodyWithinLimit, MAX_BODY_BYTES } from './limits'
import { isRegisteredOperation, OPERATION_REGISTRY } from './operations'
import { isAllowedOrigin, PROVIDER_TIMEOUT_MS } from './origin'
import { isGatewayEnabled, resolveProvider } from './provider'
import { checkRateLimit, clientIpFromRequest } from './rateLimit'
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
 * Operation allowlist + kill-switch + provider seam + request limits +
 * IP rate limit + origin check + upstream timeout.
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

  if (!isAllowedOrigin(request, env)) {
    return jsonResponse(403, { error: 'Origin not allowed.' })
  }

  const ip = clientIpFromRequest(request)
  const rate = checkRateLimit(ip)
  if (!rate.allowed) {
    return jsonResponse(
      429,
      { error: 'Rate limit exceeded.' },
      { 'Retry-After': String(rate.retryAfterSec) },
    )
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
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)
  let result
  try {
    result = await provider.complete(messages, {
      maxCompletionTokens: definition.maxCompletionTokens,
      temperature: definition.temperature,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }

  if (!result.ok) {
    const status = result.timedOut ? 504 : result.status >= 400 ? result.status : 502
    return jsonResponse(status, {
      error: result.timedOut ? 'LLM provider timed out.' : 'LLM request failed.',
      status,
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
