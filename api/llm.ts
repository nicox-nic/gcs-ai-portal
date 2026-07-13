// api/llm.ts
// Provider-neutral LLM gateway. The API key lives ONLY here (server-side).
// Browser clients call registered operations only — never generic messages[].

import { handleLlmGet, handleLlmPost, methodNotAllowed } from './llmGateway/handlePost'

export function GET(_request: Request) {
  return handleLlmGet()
}

export async function POST(request: Request) {
  return handleLlmPost(request)
}

export function PUT() {
  return methodNotAllowed()
}

export function PATCH() {
  return methodNotAllowed()
}

export function DELETE() {
  return methodNotAllowed()
}

export function OPTIONS() {
  return methodNotAllowed()
}
