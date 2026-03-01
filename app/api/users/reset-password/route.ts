import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { requireAdmin, unauthorizedResponse } from "@/lib/security/auth-guard"
import { sanitizeEmail } from "@/lib/security/sanitize"
import { z } from "zod"

// ── Input validation schema ────────────────────────────
const ResetPasswordSchema = z.object({
  userId:   z.string().uuid(),
  email:    z.string().email().max(320),
  password: z.string().min(8).max(128),
})

export async function POST(req: NextRequest) {
  try {
    // ── 0. Auth guard — ADMIN ONLY ──────────────────────
    const auth = await requireAdmin(req)
    if (!auth.authorized) {
      console.warn(`[SECURITY] Unauthorized password reset attempt: ${auth.error}`)
      return unauthorizedResponse(auth.error ?? "Forbidden")
    }

    // ── 1. Parse & validate input ───────────────────────
    const rawBody = await req.json()
    const parsed = ResetPasswordSchema.safeParse(rawBody)

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      const summary = Object.entries(fieldErrors)
        .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
        .join("; ")
      return NextResponse.json(
        { error: summary || "Invalid input" },
        { status: 400 }
      )
    }

    const { userId, email, password } = parsed.data
    const cleanEmail = sanitizeEmail(email)

    // ── 2. Find auth user by email ──────────────────────
    const { data: { users }, error: listError } =
      await supabaseAdmin.auth.admin.listUsers()

    if (listError) throw listError

    const authUser = users.find(u => u.email === cleanEmail)
    if (!authUser) {
      return NextResponse.json(
        { error: "Auth user not found" },
        { status: 404 }
      )
    }

    // ── 3. Update password in Supabase Auth ─────────────
    const { error: authError } =
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        password,
      })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // ── 4. Store new password in users table ────────────
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .update({ password })
      .eq("id", userId)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    console.error("[API] Reset password error:", err.message)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
