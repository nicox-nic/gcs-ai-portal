/** Hard cap on raw POST body size (bytes) before JSON parse. */
export const MAX_BODY_BYTES = 32_768

export function isBodyWithinLimit(raw: string, maxBytes = MAX_BODY_BYTES): boolean {
  // UTF-16 length is a close enough proxy for demo; reject clearly oversized payloads.
  return raw.length <= maxBytes
}
