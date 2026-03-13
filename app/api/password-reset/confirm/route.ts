import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import {
  findAuthUserByEmail,
  getPasswordResetLookup,
  invalidatePasswordResetTokens,
} from "@/lib/security/password-reset"
import { hashPassword } from "@/lib/security/passwords"
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limiter"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { z } from "zod"

const ResetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: "Passwords do not match.",
    })
  }
})

function getClientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown"
}

function hashIdentifier(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json()
    const parsed = ResetPasswordSchema.safeParse(rawBody)

    if (!parsed.success) {
      const message = parsed.error.flatten().fieldErrors.confirmPassword?.[0]
        ?? parsed.error.flatten().fieldErrors.password?.[0]
        ?? "Enter a valid new password."

      return NextResponse.json({ error: message }, { status: 400 })
    }

    const clientIp = getClientIp(req)
    const rateLimit = checkRateLimit(
      `password-reset-confirm:${clientIp}:${hashIdentifier(parsed.data.token)}`,
      RATE_LIMITS.passwordResetConfirm
    )

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please wait before trying again." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSec) },
        }
      )
    }

    const lookup = await getPasswordResetLookup(parsed.data.token)

    if (lookup.status === "expired") {
      return NextResponse.json(
        { error: "This password reset link has expired." },
        { status: 410 }
      )
    }

    if (lookup.status !== "valid" || !lookup.record) {
      return NextResponse.json(
        { error: "This password reset link is invalid or has already been used." },
        { status: 404 }
      )
    }

    const authUser = await findAuthUserByEmail(lookup.record.user.email)
    if (!authUser) {
      return NextResponse.json(
        { error: "Account not found for this password reset request." },
        { status: 404 }
      )
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      password: parsed.data.password,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const passwordHash = await hashPassword(parsed.data.password)
    const { error: userError } = await supabaseAdmin
      .from("users")
      .update({ password: passwordHash })
      .eq("id", lookup.record.user_id)

    if (userError) {
      throw userError
    }

    await invalidatePasswordResetTokens(lookup.record.user_id)

    return NextResponse.json({
      success: true,
      message: "Password reset successful. You can now sign in with your new password.",
    })
  } catch (err: any) {
    console.error("[API] Password reset confirm error:", err.message)
    return NextResponse.json(
      { error: "Unable to reset password right now. Please try again." },
      { status: 500 }
    )
  }
}