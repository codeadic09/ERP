import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { requireAdmin, unauthorizedResponse } from "@/lib/security/auth-guard"
import { sanitizeString, sanitizeEmail, sanitizePhone } from "@/lib/security/sanitize"
import { z } from "zod"

// ── Row schema ─────────────────────────────────────────
const RowSchema = z.object({
  name:        z.string().min(1).max(200),
  email:       z.string().email().max(320),
  password:    z.string().min(8).max(128),
  role:        z.enum(["student", "faculty"]),
  dept_id:     z.string().uuid().nullable().optional()
                .or(z.literal("").transform(() => null)),
  phone:       z.string().max(20).nullable().optional()
                .or(z.literal("").transform(() => null)),
  status:      z.enum(["active", "inactive"]).default("active"),
  enrolled_at: z.string().optional().default(() => new Date().toISOString().split("T")[0]),
})

const BulkSchema = z.object({
  users: z.array(RowSchema).min(1).max(500),
})

export async function POST(req: NextRequest) {
  try {
    // ── Auth guard ──────────────────────────────────────
    const auth = await requireAdmin(req)
    if (!auth.authorized) {
      console.warn(`[SECURITY] Unauthorized bulk import attempt: ${auth.error}`)
      return unauthorizedResponse(auth.error ?? "Forbidden")
    }

    // ── Parse ───────────────────────────────────────────
    const rawBody = await req.json()
    const parsed = BulkSchema.safeParse(rawBody)

    if (!parsed.success) {
      const flat = parsed.error.flatten()
      return NextResponse.json(
        { error: "Validation failed", details: flat.fieldErrors },
        { status: 400 }
      )
    }

    const rows = parsed.data.users
    const results: { row: number; name: string; email: string; status: "ok" | "error"; error?: string }[] = []
    let created = 0
    let failed  = 0

    // ── Process each user ───────────────────────────────
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      try {
        const cleanName  = sanitizeString(r.name)
        const cleanEmail = sanitizeEmail(r.email)
        const cleanPhone = r.phone ? sanitizePhone(r.phone) : null

        // 1. Create Auth user
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: r.password,
            email_confirm: true,
          })

        if (authError) {
          results.push({ row: i + 1, name: r.name, email: r.email, status: "error", error: authError.message })
          failed++
          continue
        }

        // 2. Insert into public.users
        const { error: dbError } = await supabaseAdmin
          .from("users")
          .insert([{
            name:        cleanName,
            email:       cleanEmail,
            password:    r.password,
            role:        r.role,
            dept_id:     r.dept_id ?? null,
            phone:       cleanPhone,
            status:      r.status,
            enrolled_at: r.enrolled_at,
          }])

        if (dbError) {
          // Rollback auth user
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
          results.push({ row: i + 1, name: r.name, email: r.email, status: "error", error: dbError.message })
          failed++
          continue
        }

        results.push({ row: i + 1, name: r.name, email: r.email, status: "ok" })
        created++
      } catch (err: any) {
        results.push({ row: i + 1, name: r.name, email: r.email, status: "error", error: err.message })
        failed++
      }
    }

    return NextResponse.json({
      total:   rows.length,
      created,
      failed,
      results,
    })

  } catch (err: any) {
    console.error("[API] Bulk import error:", err.message)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
