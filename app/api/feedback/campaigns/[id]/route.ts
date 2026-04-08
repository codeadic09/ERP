import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { requireAdmin, unauthorizedResponse } from "@/lib/security/auth-guard"
import { sanitizeString } from "@/lib/security/sanitize"

const QuestionSchema = z.object({
  scopeType: z.enum(["subject", "faculty", "facility", "custom"]),
  scopeSubjectId: z.string().uuid().nullable().optional().default(null),
  scopeFacultyId: z.string().uuid().nullable().optional().default(null),
  scopeLabel: z.string().trim().max(140).nullable().optional().default(null),
  questionText: z.string().trim().min(4).max(400),
  options: z.array(z.string().trim().min(1).max(120)).min(2).max(10),
  sortOrder: z.number().int().min(0),
})

const UpdateCampaignSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  monthKey: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  opensAt: z.string().datetime().optional(),
  closesAt: z.string().datetime().optional(),
  isPublished: z.boolean().optional(),
  questions: z.array(QuestionSchema).min(1).optional(),
})

function normalizeQuestions(input: z.infer<typeof QuestionSchema>[]) {
  return input.map((q, idx) => {
    const cleanedOptions = q.options.map((o) => sanitizeString(o)).filter(Boolean)
    if (cleanedOptions.length < 2) {
      throw new Error("Each question must have at least 2 options")
    }

    return {
      scope_type: q.scopeType,
      scope_subject_id: q.scopeSubjectId,
      scope_faculty_id: q.scopeFacultyId,
      scope_label: q.scopeLabel ? sanitizeString(q.scopeLabel) : null,
      question_text: sanitizeString(q.questionText),
      options: cleanedOptions,
      sort_order: Number.isFinite(q.sortOrder) ? q.sortOrder : idx,
      is_active: true,
    }
  })
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error ?? "Forbidden")
  }

  try {
    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ error: "Missing campaign id" }, { status: 400 })
    }

    const body = await req.json()
    const parsed = UpdateCampaignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    const p = parsed.data

    if (p.title !== undefined) updates.title = sanitizeString(p.title)
    if (p.monthKey !== undefined) updates.month_key = p.monthKey
    if (p.opensAt !== undefined) updates.opens_at = p.opensAt
    if (p.closesAt !== undefined) updates.closes_at = p.closesAt
    if (p.isPublished !== undefined) updates.is_published = p.isPublished

    if (updates.opens_at && updates.closes_at && new Date(updates.closes_at).getTime() <= new Date(updates.opens_at).getTime()) {
      return NextResponse.json({ error: "Close date must be after open date" }, { status: 400 })
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString()
      const { error: updateError } = await supabaseAdmin
        .from("feedback_campaigns")
        .update(updates)
        .eq("id", id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }
    }

    if (p.questions) {
      const normalizedQuestions = normalizeQuestions(p.questions)

      const { error: deleteError } = await supabaseAdmin
        .from("feedback_questions")
        .delete()
        .eq("campaign_id", id)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 400 })
      }

      const { error: insertError } = await supabaseAdmin
        .from("feedback_questions")
        .insert(normalizedQuestions.map((q) => ({ ...q, campaign_id: id })))

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 })
  }
}
