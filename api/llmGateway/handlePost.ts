import { createCorrelationId } from './correlation'
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

function withCorrelation(
  correlationId: string,
  status: number,
  body: Record<string, unknown>,
  extraHeaders?: HeadersInit,
): Response {
  // correlationId is request-scoped scaffolding only — not a user identity.
  return jsonResponse(status, { ...body, correlationId }, {
    'X-Correlation-Id': correlationId,
    ...extraHeaders,
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
  // Opaque request id for future log correlation. Not auth / not user identity
  // (Phase-1 auth will attach real identity later).
  const correlationId = createCorrelationId()

  if (!isGatewayEnabled(env)) {
    return withCorrelation(correlationId, 503, { error: 'LLM gateway is disabled.' })
  }

  if (!isAllowedOrigin(request, env)) {
    return withCorrelation(correlationId, 403, { error: 'Origin not allowed.' })
  }

  const ip = clientIpFromRequest(request)
  const rate = checkRateLimit(ip)
  if (!rate.allowed) {
    return withCorrelation(
      correlationId,
      429,
      { error: 'Rate limit exceeded.' },
      { 'Retry-After': String(rate.retryAfterSec) },
    )
  }

  let rawText: string
  try {
    rawText = await request.text()
  } catch {
    return withCorrelation(correlationId, 400, { error: 'Invalid request body.' })
  }

  if (!isBodyWithinLimit(rawText, MAX_BODY_BYTES)) {
    return withCorrelation(correlationId, 413, { error: 'Request body too large.' })
  }

  let body: GatewayRequestBody
  try {
    body = JSON.parse(rawText) as GatewayRequestBody
  } catch {
    return withCorrelation(correlationId, 400, { error: 'Invalid JSON body.' })
  }

  // Reject legacy generic OpenAI-proxy shape (messages[]).
  if (body.messages !== undefined) {
    return withCorrelation(correlationId, 400, {
      error: 'Generic messages[] requests are not allowed. Use a registered operation.',
    })
  }

  if (!isRegisteredOperation(body.operation)) {
    return withCorrelation(correlationId, 400, {
      error: 'Unknown or missing operation. Use a registered operation id.',
    })
  }

  const operationId = body.operation as LlmOperationId
  const definition = OPERATION_REGISTRY[operationId]
  const parsedInput = definition.parseInput(body.input)
  if (!parsedInput) {
    return withCorrelation(correlationId, 400, { error: 'Invalid input for operation.' })
  }

  const draftAssistInput = parsedInput as DraftAssistInput
  if (draftAssistInput.draft.length > definition.maxInputChars) {
    return withCorrelation(correlationId, 400, {
      error: 'Input exceeds maximum allowed length.',
    })
  }

  const provider = resolveProvider(env)
  if (!provider) {
    return withCorrelation(correlationId, 503, {
      error: 'LLM provider is not configured.',
    })
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
    return withCorrelation(correlationId, status, {
      error: result.timedOut ? 'LLM provider timed out.' : 'LLM request failed.',
      status,
    })
  }

  return withCorrelation(correlationId, 200, { text: result.text })
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
