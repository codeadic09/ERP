import { NextRequest, NextResponse } from "next/server"
import { getPasswordResetLookup } from "@/lib/security/password-reset"
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limiter"

function getClientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown"
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@")
  if (!local || !domain) return email

  const visibleLocal = local.length <= 2
    ? `${local[0] ?? ""}*`
    : `${local.slice(0, 2)}${"*".repeat(Math.max(local.length - 2, 1))}`

  return `${visibleLocal}@${domain}`
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const clientIp = getClientIp(req)
    const rateLimit = checkRateLimit(
      `password-reset-verify:${clientIp}`,
      RATE_LIMITS.passwordResetVerify
    )

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait before retrying." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSec) },
        }
      )
    }

    const { token } = await context.params
    const lookup = await getPasswordResetLookup(token)

    if (lookup.status === "expired") {
      return NextResponse.json(
        { valid: false, reason: "expired", message: "This password reset link has expired." },
        { status: 410 }
      )
    }

    if (lookup.status !== "valid" || !lookup.record) {
      return NextResponse.json(
        { valid: false, reason: "invalid", message: "This password reset link is invalid or has already been used." },
        { status: 404 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: maskEmail(lookup.record.user.email),
      expiresAt: lookup.record.expires_at,
    })
  } catch (err: any) {
    console.error("[API] Password reset verify error:", err.message)
    return NextResponse.json(
      { error: "Unable to verify password reset link." },
      { status: 500 }
    )
  }
}