import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { requireAdmin, unauthorizedResponse } from "@/lib/security/auth-guard"
import { sanitizeString, sanitizeEmail, sanitizePhone, isValidUUID } from "@/lib/security/sanitize"
import { z } from "zod"

// ── Input validation schema ────────────────────────────
const CreateUserSchema = z.object({
  name:        z.string().min(1).max(200),
  email:       z.string().email().max(320),
  password:    z.string().min(8).max(128),
  role:        z.enum(["student", "faculty", "admin"]),
  dept_id:     z.string().uuid().nullable().optional()
                .or(z.literal("").transform(() => null)),   // "" → null
  phone:       z.string().max(20).nullable().optional()
                .or(z.literal("").transform(() => null)),   // "" → null
  status:      z.enum(["active", "inactive"]).default("active"),
  enrolled_at: z.string().optional(),
}).passthrough()

export async function POST(req: NextRequest) {
  try {
    // ── 0. Auth guard — ADMIN ONLY ──────────────────────
    const auth = await requireAdmin(req)
    if (!auth.authorized) {
      console.warn(`[SECURITY] Unauthorized user create attempt: ${auth.error}`)
      return unauthorizedResponse(auth.error ?? "Forbidden")
    }

    // ── 1. Parse & validate input ───────────────────────
    const rawBody = await req.json()
    const parsed = CreateUserSchema.safeParse(rawBody)

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      const summary = Object.entries(fieldErrors)
        .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
        .join("; ")
      console.warn(`[API] Create user validation failed:`, summary)
      return NextResponse.json(
        { error: summary || "Invalid input", details: fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, password, role, dept_id, phone, status, enrolled_at } = parsed.data

    // ── 2. Sanitize inputs ──────────────────────────────
    const cleanName  = sanitizeString(name)
    const cleanEmail = sanitizeEmail(email)
    const cleanPhone = phone ? sanitizePhone(phone) : null

    // ── 3. Create in Supabase Auth ──────────────────────
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
      })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // ── 4. Insert into users table (password NOT stored) ─
    const { data: user, error: dbError } = await supabaseAdmin
      .from("users")
      .insert([{
        name: cleanName,
        email: cleanEmail,
        role,
        dept_id: dept_id ?? null,
        phone: cleanPhone,
        status,
        enrolled_at,
      }])
      .select(`*, departments(id, name, code, color)`)
      .single()

    if (dbError) {
      // Rollback: delete Auth user if DB insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json({ user }, { status: 201 })

  } catch (err: any) {
    console.error("[API] Create user error:", err.message)
    return NextResponse.json(
      { error: "Internal server error" },   // Never leak internal details
      { status: 500 }
    )
  }
}
