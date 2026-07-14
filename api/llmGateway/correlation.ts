/**
 * Per-request correlation id scaffold.
 *
 * This is NOT user authentication and NOT user-identity correlation.
 * It exists so gateway logs can be stitched together once a Phase-1 auth system
 * can attach a real user id. Until then, ids are opaque, non-PII, server-generated.
 */

export function createCorrelationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `llm_${crypto.randomUUID()}`
  }
  return `llm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}
