/**
 * In-memory sliding-window rate limiter.
 * Works on a single server instance (Vercel serverless / Node).
 * For multi-instance production, swap with Redis (Upstash) adapter.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Auto-cleanup every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number
  /** Window duration in seconds */
  windowSec: number
}

/** Default tiers for different route types */
export const RATE_LIMITS = {
  /** Auth endpoints — tight to block brute-force */
  auth: { maxRequests: 20, windowSec: 60 } as RateLimitConfig,
  /** API mutation endpoints */
  api: { maxRequests: 60, windowSec: 60 } as RateLimitConfig,
  /** General page loads */
  page: { maxRequests: 120, windowSec: 60 } as RateLimitConfig,
  /** Strict limit for signup (prevent mass account creation) */
  signup: { maxRequests: 10, windowSec: 300 } as RateLimitConfig,
} as const

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSec: number
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  // First request or window expired — start fresh
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowSec * 1000 })
    return { allowed: true, remaining: config.maxRequests - 1, retryAfterSec: 0 }
  }

  // Within window — increment
  entry.count++

  if (entry.count > config.maxRequests) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, retryAfterSec }
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    retryAfterSec: 0,
  }
}
