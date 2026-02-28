import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { requireAdmin, unauthorizedResponse } from "@/lib/security/auth-guard"
import { isValidUUID, sanitizeEmail } from "@/lib/security/sanitize"
import { z } from "zod"

// ── Input validation schema ────────────────────────────
const DeleteUserSchema = z.object({
  userId: z.string().uuid(),
  email:  z.string().email().max(320),
})

export async function DELETE(req: NextRequest) {
  try {
    // ── 0. Auth guard — ADMIN ONLY ──────────────────────
    const auth = await requireAdmin(req)
    if (!auth.authorized) {
      console.warn(`[SECURITY] Unauthorized user delete attempt: ${auth.error}`)
      return unauthorizedResponse(auth.error ?? "Forbidden")
    }

    // ── 1. Parse & validate input ───────────────────────
    const rawBody = await req.json()
    const parsed = DeleteUserSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { userId, email } = parsed.data
    const cleanEmail = sanitizeEmail(email)

    // ── 2. Prevent admin from deleting themselves ───────
    if (userId === auth.userId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      )
    }

    // ── 3. Find auth user by email ─────────────────────
    const { data: { users }, error: listError } =
      await supabaseAdmin.auth.admin.listUsers()

    if (listError) throw listError

    const authUser = users.find(u => u.email === cleanEmail)

    // ── 4. Delete from Supabase Auth ───────────────────
    if (authUser) {
      const { error: authError } =
        await supabaseAdmin.auth.admin.deleteUser(authUser.id)
      if (authError) throw authError
    }

    // ── 5. Delete from public.users ────────────────────
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId)

    if (dbError) throw dbError

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error("[API] Delete user error:", err.message)
    return NextResponse.json(
      { error: "Internal server error" },   // Never leak internal details
      { status: 500 }
    )
  }
}
