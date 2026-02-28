import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limiter"
import { detectBot } from "@/lib/security/bot-detection"
import { getSecurityHeaders } from "@/lib/security/headers"
import { validateCsrf } from "@/lib/security/csrf"

// ─── Helpers ─────────────────────────────────────────────
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}

function jsonBlock(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Content-Type": "application/json" } }
  )
}

// ─── Main Middleware ─────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = getClientIp(req)
  const userAgent = req.headers.get("user-agent")
  const fullUrl = req.nextUrl.toString()

  // ═══════════════════════════════════════════════════════
  // 1. BOT DETECTION — block malicious bots & attack probes
  // ═══════════════════════════════════════════════════════
  const botResult = detectBot(userAgent, pathname, fullUrl)
  if (botResult.isBot) {
    console.warn(`[SECURITY] Bot blocked: ip=${ip} reason=${botResult.reason} path=${pathname}`)
    return jsonBlock("Forbidden", 403)
  }

  // ═══════════════════════════════════════════════════════
  // 2. RATE LIMITING — prevent brute-force & DDoS
  // ═══════════════════════════════════════════════════════
  const method = req.method
  let rateLimitConfig = RATE_LIMITS.page
  if (pathname.startsWith("/api/")) {
    rateLimitConfig = RATE_LIMITS.api
  }
  // Only apply strict auth rate-limits to POST (actual sign-in attempts),
  // not to GET page loads (which include HMR, prefetches, etc.)
  if ((pathname === "/login" || pathname.startsWith("/(auth)")) && method === "POST") {
    rateLimitConfig = RATE_LIMITS.auth
  }
  if (pathname === "/signup" && method === "POST") {
    rateLimitConfig = RATE_LIMITS.signup
  }

  // Skip rate limiting if we can't identify the client (e.g. behind Render proxy)
  // to avoid all users sharing one bucket
  let rateResult: { allowed: boolean; remaining: number; retryAfterSec: number } | null = null

  if (ip !== "unknown") {
    const rateLimitKey = `${ip}:${pathname.split("/").slice(0, 3).join("/")}`
    rateResult = checkRateLimit(rateLimitKey, rateLimitConfig)
  }

  if (rateResult && !rateResult.allowed) {
    console.warn(`[SECURITY] Rate limited: ip=${ip} path=${pathname}`)
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateResult.retryAfterSec),
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  // ═══════════════════════════════════════════════════════
  // 3. CSRF PROTECTION — verify Origin on mutations
  // ═══════════════════════════════════════════════════════
  if (pathname.startsWith("/api/")) {
    const csrfResult = validateCsrf(req, [
      process.env.NEXT_PUBLIC_APP_URL ?? "",
    ].filter(Boolean))

    if (!csrfResult.valid) {
      console.warn(`[SECURITY] CSRF blocked: ip=${ip} reason=${csrfResult.reason} path=${pathname}`)
      return jsonBlock("Forbidden: invalid request origin", 403)
    }
  }

  // ═══════════════════════════════════════════════════════
  // 4. SUPABASE AUTH — session verification
  // ═══════════════════════════════════════════════════════
  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          )
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from dashboard
  if (pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // ═══════════════════════════════════════════════════════
  // 5. SECURITY HEADERS — applied to every response
  // ═══════════════════════════════════════════════════════
  const securityHeaders = getSecurityHeaders()
  for (const [key, value] of Object.entries(securityHeaders)) {
    res.headers.set(key, value)
  }

  // Cache-busting for authenticated pages
  if (pathname.startsWith("/dashboard")) {
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private")
    res.headers.set("Pragma", "no-cache")
    res.headers.set("Expires", "0")
  }

  // Rate limit headers for transparency
  if (rateResult) {
    res.headers.set("X-RateLimit-Remaining", String(rateResult.remaining))
  }

  return res
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)",
  ],
}