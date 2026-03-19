import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { requireAuth, requireAdmin, unauthorizedResponse } from "@/lib/security/auth-guard"
import { sanitizeString } from "@/lib/security/sanitize"

type QuestionPayload = {
  scopeType: "subject" | "faculty" | "facility" | "custom"
  scopeSubjectId: string | null
  scopeFacultyId: string | null
  scopeLabel: string | null
  questionText: string
  options: string[]
  sortOrder: number
}

const QuestionSchema = z.object({
  scopeType: z.enum(["subject", "faculty", "facility", "custom"]),
  scopeSubjectId: z.string().uuid().nullable().optional().default(null),
  scopeFacultyId: z.string().uuid().nullable().optional().default(null),
  scopeLabel: z.string().trim().max(140).nullable().optional().default(null),
  questionText: z.string().trim().min(4).max(400),
  options: z.array(z.string().trim().min(1).max(120)).min(2).max(10),
  sortOrder: z.number().int().min(0),
})

const CreateCampaignSchema = z.object({
  title: z.string().trim().min(3).max(200),
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  opensAt: z.string().datetime(),
  closesAt: z.string().datetime(),
  isPublished: z.boolean().default(false),
  questions: z.array(QuestionSchema).min(1),
})

function normalizeQuestions(input: QuestionPayload[]) {
  return input.map((q, idx) => {
    const cleanedOptions = q.options.map((o) => sanitizeString(o)).filter(Boolean)
    if (cleanedOptions.length < 2) {
      throw new Error("Each question must have at least 2 non-empty options")
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

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error ?? "Forbidden")
  }

  const role = auth.role
  const nowIso = new Date().toISOString()

  if (role === "admin") {
    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from("feedback_campaigns")
      .select("*")
      .order("created_at", { ascending: false })

    if (campaignsError) {
      return NextResponse.json({ error: campaignsError.message }, { status: 400 })
    }

    const campaignIds = (campaigns ?? []).map((c: any) => c.id)

    let questionsByCampaign = new Map<string, any[]>()
    if (campaignIds.length) {
      const { data: questions, error: questionsError } = await supabaseAdmin
        .from("feedback_questions")
        .select("id, campaign_id, scope_type, scope_subject_id, scope_faculty_id, scope_label, question_text, options, sort_order, is_active")
        .in("campaign_id", campaignIds)
        .order("sort_order", { ascending: true })

      if (questionsError) {
        return NextResponse.json({ error: questionsError.message }, { status: 400 })
      }

      for (const q of questions ?? []) {
        const arr = questionsByCampaign.get(q.campaign_id) ?? []
        arr.push(q)
        questionsByCampaign.set(q.campaign_id, arr)
      }
    }

    let submissionCountByCampaign = new Map<string, number>()
    if (campaignIds.length) {
      const { data: submissions, error: submissionsError } = await supabaseAdmin
        .from("feedback_submissions")
        .select("campaign_id")
        .in("campaign_id", campaignIds)

      if (submissionsError) {
        return NextResponse.json({ error: submissionsError.message }, { status: 400 })
      }

      for (const s of submissions ?? []) {
        submissionCountByCampaign.set(s.campaign_id, (submissionCountByCampaign.get(s.campaign_id) ?? 0) + 1)
      }
    }

    const payload = (campaigns ?? []).map((campaign: any) => ({
      ...campaign,
      questions: questionsByCampaign.get(campaign.id) ?? [],
      submissionCount: submissionCountByCampaign.get(campaign.id) ?? 0,
    }))

    return NextResponse.json({ campaigns: payload })
  }

  if (role !== "student") {
    return NextResponse.json({ campaigns: [] })
  }

  const { data: activeCampaigns, error: activeError } = await supabaseAdmin
    .from("feedback_campaigns")
    .select("*")
    .eq("is_published", true)
    .lte("opens_at", nowIso)
    .gte("closes_at", nowIso)
    .order("opens_at", { ascending: false })

  if (activeError) {
    return NextResponse.json({ error: activeError.message }, { status: 400 })
  }

  const campaignIds = (activeCampaigns ?? []).map((c: any) => c.id)

  let questionsByCampaign = new Map<string, any[]>()
  if (campaignIds.length) {
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("feedback_questions")
      .select(`
        id,
        campaign_id,
        scope_type,
        scope_subject_id,
        scope_faculty_id,
        scope_label,
        question_text,
        options,
        sort_order,
        subjects:scope_subject_id(id, name, code),
        faculty:scope_faculty_id(id, name)
      `)
      .eq("is_active", true)
      .in("campaign_id", campaignIds)
      .order("sort_order", { ascending: true })

    if (questionsError) {
      return NextResponse.json({ error: questionsError.message }, { status: 400 })
    }

    for (const q of questions ?? []) {
      const arr = questionsByCampaign.get(q.campaign_id) ?? []
      arr.push(q)
      questionsByCampaign.set(q.campaign_id, arr)
    }
  }

  let submittedSet = new Set<string>()
  if (campaignIds.length && auth.userId) {
    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from("feedback_submissions")
      .select("campaign_id")
      .eq("student_id", auth.userId)
      .in("campaign_id", campaignIds)

    if (submissionsError) {
      return NextResponse.json({ error: submissionsError.message }, { status: 400 })
    }

    submittedSet = new Set((submissions ?? []).map((s: any) => s.campaign_id))
  }

  const payload = (activeCampaigns ?? []).map((campaign: any) => ({
    ...campaign,
    questions: questionsByCampaign.get(campaign.id) ?? [],
    alreadySubmitted: submittedSet.has(campaign.id),
  }))

  return NextResponse.json({ campaigns: payload })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error ?? "Forbidden")
  }

  try {
    const body = await req.json()
    const parsed = CreateCampaignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
    }

    const { title, monthKey, opensAt, closesAt, isPublished, questions } = parsed.data
    if (new Date(closesAt).getTime() <= new Date(opensAt).getTime()) {
      return NextResponse.json({ error: "Close date must be after open date" }, { status: 400 })
    }

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("feedback_campaigns")
      .insert([{
        title: sanitizeString(title),
        month_key: monthKey,
        opens_at: opensAt,
        closes_at: closesAt,
        is_published: isPublished,
        created_by: auth.userId,
      }])
      .select("*")
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: campaignError?.message ?? "Failed to create campaign" }, { status: 400 })
    }

    const normalizedQuestions = normalizeQuestions(questions).map((q) => ({
      ...q,
      campaign_id: campaign.id,
    }))

    const { error: questionsError } = await supabaseAdmin
      .from("feedback_questions")
      .insert(normalizedQuestions)

    if (questionsError) {
      await supabaseAdmin.from("feedback_campaigns").delete().eq("id", campaign.id)
      return NextResponse.json({ error: questionsError.message }, { status: 400 })
    }

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 })
  }
}
