/**
 * Best-effort in-memory per-IP rate limit for the Vercel serverless runtime.
 * Limits: per-instance only (not durable across isolates/regions); not per-user
 * (no server identity yet — deferred to Phase-1 auth). Defense-in-depth only.
 */

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSec: number }

type Bucket = { count: number; windowStartMs: number }

const buckets = new Map<string, Bucket>()

export const DEFAULT_RATE_LIMIT = {
  maxRequests: 20,
  windowMs: 60_000,
}

export function resetRateLimitStoreForTests(): void {
  buckets.clear()
}

export function checkRateLimit(
  ip: string,
  nowMs = Date.now(),
  config = DEFAULT_RATE_LIMIT,
): RateLimitResult {
  const key = ip.trim() || 'unknown'
  const existing = buckets.get(key)
  if (!existing || nowMs - existing.windowStartMs >= config.windowMs) {
    buckets.set(key, { count: 1, windowStartMs: nowMs })
    return { allowed: true }
  }
  if (existing.count >= config.maxRequests) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((config.windowMs - (nowMs - existing.windowStartMs)) / 1000),
    )
    return { allowed: false, retryAfterSec }
  }
  existing.count += 1
  return { allowed: true }
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  return 'unknown'
}
