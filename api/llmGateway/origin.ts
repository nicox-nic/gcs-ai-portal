/**
 * Origin/Referer defense-in-depth — not a substitute for authentication.
 * Allowed origins come from LLM_ALLOWED_ORIGINS (comma-separated) or, if unset,
 * the request's own host as same-origin (VERCEL_URL / request URL origin).
 */

export function resolveAllowedOrigins(
  env: NodeJS.ProcessEnv,
  requestUrl: string,
): string[] {
  const configured = (env.LLM_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (configured.length > 0) return configured

  const origins: string[] = []
  try {
    origins.push(new URL(requestUrl).origin)
  } catch {
    /* ignore */
  }
  const vercel = env.VERCEL_URL?.replace(/^https?:\/\//, '').trim()
  if (vercel) origins.push(`https://${vercel}`)
  return [...new Set(origins)]
}

export function isAllowedOrigin(
  request: Request,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const allowed = resolveAllowedOrigins(env, request.url)
  if (allowed.length === 0) return false

  const origin = request.headers.get('origin')
  if (origin && allowed.includes(origin)) return true

  // Same-origin navigations / some clients omit Origin; accept matching Referer.
  const referer = request.headers.get('referer')
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin
      if (allowed.includes(refOrigin)) return true
    } catch {
      return false
    }
  }

  // No Origin/Referer — treat as non-browser direct call; reject.
  return false
}

/** Upstream provider fetch timeout (ms). */
export const PROVIDER_TIMEOUT_MS = 25_000
