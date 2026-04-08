import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { requireAuth, unauthorizedResponse } from "@/lib/security/auth-guard"

const SubmitSchema = z.object({
  campaignId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    optionIndex: z.number().int().min(0),
    optionText: z.string().trim().min(1).max(120),
  })).min(1),
})

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error ?? "Forbidden")
  }

  if (auth.role !== "student" || !auth.userId) {
    return unauthorizedResponse("Only students can submit feedback", 403)
  }

  try {
    const body = await req.json()
    const parsed = SubmitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
    }

    const { campaignId, answers } = parsed.data

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("feedback_campaigns")
      .select("id, is_published, opens_at, closes_at")
      .eq("id", campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    const now = Date.now()
    const opens = new Date(campaign.opens_at).getTime()
    const closes = new Date(campaign.closes_at).getTime()

    if (!campaign.is_published || now < opens || now > closes) {
      return NextResponse.json({ error: "This feedback form is currently closed" }, { status: 400 })
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("feedback_submissions")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("student_id", auth.userId)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 400 })
    }

    if (existing) {
      return NextResponse.json({ error: "You already submitted this month's feedback" }, { status: 400 })
    }

    const { data: questionRows, error: questionError } = await supabaseAdmin
      .from("feedback_questions")
      .select("id, options")
      .eq("campaign_id", campaignId)
      .eq("is_active", true)

    if (questionError) {
      return NextResponse.json({ error: questionError.message }, { status: 400 })
    }

    const questionMap = new Map<string, string[]>()
    for (const q of questionRows ?? []) {
      questionMap.set(q.id, Array.isArray(q.options) ? q.options : [])
    }

    if (questionMap.size === 0) {
      return NextResponse.json({ error: "No active questions for this campaign" }, { status: 400 })
    }

    const answerMap = new Map(answers.map((a) => [a.questionId, a]))
    if (answerMap.size !== questionMap.size) {
      return NextResponse.json({ error: "Please answer all questions" }, { status: 400 })
    }

    for (const [questionId, options] of questionMap.entries()) {
      const ans = answerMap.get(questionId)
      if (!ans) {
        return NextResponse.json({ error: "Please answer all questions" }, { status: 400 })
      }
      const selected = options[ans.optionIndex]
      if (!selected || selected !== ans.optionText) {
        return NextResponse.json({ error: "Invalid option selected" }, { status: 400 })
      }
    }

    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("feedback_submissions")
      .insert([{
        campaign_id: campaignId,
        student_id: auth.userId,
      }])
      .select("id")
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ error: submissionError?.message ?? "Failed to save submission" }, { status: 400 })
    }

    const rows = answers.map((a) => ({
      submission_id: submission.id,
      question_id: a.questionId,
      option_index: a.optionIndex,
      option_text: a.optionText,
    }))

    const { error: answerError } = await supabaseAdmin
      .from("feedback_answers")
      .insert(rows)

    if (answerError) {
      await supabaseAdmin.from("feedback_submissions").delete().eq("id", submission.id)
      return NextResponse.json({ error: answerError.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 })
  }
}
