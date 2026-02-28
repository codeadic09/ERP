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

  // Build list of allowed origins — include the request URL's own origin
  // AND the forwarded origin (behind reverse proxies like Render, Vercel, etc.)
  const url = new URL(request.url)
  const allowed = new Set<string>([
    url.origin,
    ...(allowedOrigins ?? []),
  ])

  // Behind a reverse proxy, request.url may show the internal host (e.g. localhost:10000)
  // but the browser sends the public origin. Use X-Forwarded-Host/Proto to match.
  const fwdHost  = request.headers.get("x-forwarded-host")
  const fwdProto = request.headers.get("x-forwarded-proto") ?? "https"
  if (fwdHost) {
    allowed.add(`${fwdProto}://${fwdHost}`)
  }

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
