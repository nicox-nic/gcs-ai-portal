// api/llm.ts
// Serverless proxy to the OpenAI API. The API key lives ONLY here (server-side),
// read from process.env — it is never shipped to the browser bundle.

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface LlmRequestBody {
  model?: string
  messages: ChatMessage[]
  max_tokens?: number
  temperature?: number
}

// GET /api/llm — health check. Confirms the function is deployed and whether
// the key is configured, WITHOUT calling OpenAI or revealing the key value.
export function GET(_request: Request) {
  const keyConfigured = Boolean(process.env.OPENAI_API_KEY)
  return new Response(JSON.stringify({ ok: true, keyConfigured }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

// POST /api/llm — forwards a chat-completion request to OpenAI.
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'OPENAI_API_KEY is not configured on the server.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  let body: LlmRequestBody
  try {
    body = (await request.json()) as LlmRequestBody
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages[] is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const model = body.model ?? process.env.OPENAI_MODEL
  if (!model) {
    return new Response(
      JSON.stringify({
        error:
          'OPENAI_MODEL is not configured on the server and no model was supplied.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        max_tokens: body.max_tokens ?? 1000,
        ...(body.temperature !== undefined ? { temperature: body.temperature } : {}),
      }),
    })

    const data = await upstream.json()
    // Pass through OpenAI's status so the client can distinguish rate limits,
    // auth errors, etc. from a healthy 200.
    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Upstream LLM request failed.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
