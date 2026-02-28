/**
 * Barrel export for all security modules.
 */

export { checkRateLimit, RATE_LIMITS } from "./rate-limiter"
export type { RateLimitConfig, RateLimitResult } from "./rate-limiter"

export { detectBot } from "./bot-detection"
export type { BotDetectionResult } from "./bot-detection"

export { getSecurityHeaders } from "./headers"

export { validateCsrf } from "./csrf"

export { requireAdmin, requireAuth, unauthorizedResponse } from "./auth-guard"
export type { AuthResult } from "./auth-guard"

export {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeObject,
  stripHtml,
  escapeHtml,
  isValidUUID,
} from "./sanitize"
