/**
 * CSRF protection via Origin/Referer header verification.
 * For stateless Next.js apps (no server-side session), this is the
 * recommended OWASP "double-submit" alternative.
 */

/**
 * Validate that a mutating request (POST/PUT/PATCH/DELETE) comes
 * from the same origin. Blocks cross-site request forgery.
 */
export function validateCsrf(
  request: Request,
  allowedOrigins?: string[]
): { valid: boolean; reason: string } {
  const method = request.method.toUpperCase()

  // Safe methods don't need CSRF verification
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { valid: true, reason: "" }
  }

  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")

  // At least one must be present for mutation requests
  if (!origin && !referer) {
    return { valid: false, reason: "missing-origin-and-referer" }
  }

  // Build list of allowed origins
  const url = new URL(request.url)
  const allowed = new Set<string>([
    url.origin,
    ...(allowedOrigins ?? []),
  ])

  // Check Origin header first (more reliable)
  if (origin) {
    if (allowed.has(origin)) {
      return { valid: true, reason: "" }
    }
    return { valid: false, reason: `origin-mismatch:${origin}` }
  }

  // Fallback to Referer if Origin is absent
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin
      if (allowed.has(refOrigin)) {
        return { valid: true, reason: "" }
      }
      return { valid: false, reason: `referer-mismatch:${refOrigin}` }
    } catch {
      return { valid: false, reason: "invalid-referer-url" }
    }
  }

  return { valid: false, reason: "no-origin-header" }
}
