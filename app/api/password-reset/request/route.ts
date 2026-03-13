import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { sendPasswordResetEmail, isPasswordResetEmailConfigured } from "@/lib/email/reset-password"
import {
  createPasswordResetToken,
  deletePasswordResetToken,
  RESET_TOKEN_TTL_MINUTES,
} from "@/lib/security/password-reset"
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limiter"
import { sanitizeEmail } from "@/lib/security/sanitize"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { z } from "zod"

const ForgotPasswordSchema = z.object({
  email: z.string().email().max(320),
})

const GENERIC_SUCCESS_MESSAGE = "If that email is registered, a password reset link has been sent."

function getClientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown"
}

function minimumDelay(startedAt: number, delayMs: number) {
  const elapsed = Date.now() - startedAt
  const remaining = delayMs - elapsed
  if (remaining <= 0) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, remaining))
}

function hashIdentifier(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now()

  try {
    if (!isPasswordResetEmailConfigured()) {
      return NextResponse.json(
        { error: "Password reset email is not configured yet." },
        { status: 503 }
      )
    }

    const rawBody = await req.json()
    const parsed = ForgotPasswordSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      )
    }

    const cleanEmail = sanitizeEmail(parsed.data.email)
    const clientIp = getClientIp(req)
    const rateLimitKey = `password-reset:${clientIp}:${hashIdentifier(cleanEmail)}`
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.passwordResetRequest)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please wait before trying again." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSec) },
        }
      )
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, name, status")
      .eq("email", cleanEmail)
      .maybeSingle<{ id: string; email: string; name: string | null; status: string }>()

    if (userError) throw userError

    if (!user || user.status !== "active") {
      await minimumDelay(startedAt, 700)
      return NextResponse.json({ message: GENERIC_SUCCESS_MESSAGE })
    }

    const { token, tokenId } = await createPasswordResetToken(user.id, clientIp)
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, "")
    const resetUrl = `${baseUrl}/reset-password/${token}`

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
        expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
      })
    } catch (error) {
      await deletePasswordResetToken(tokenId)
      throw error
    }

    await minimumDelay(startedAt, 700)
    return NextResponse.json({ message: GENERIC_SUCCESS_MESSAGE })
  } catch (err: any) {
    console.error("[API] Forgot password request error:", err.message)
    return NextResponse.json(
      { error: "Unable to process password reset right now. Please try again shortly." },
      { status: 500 }
    )
  }
}