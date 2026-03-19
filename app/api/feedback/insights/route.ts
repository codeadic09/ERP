import { NextRequest, NextResponse } from "next/server"
import { requireAuth, unauthorizedResponse } from "@/lib/security/auth-guard"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { buildFacultyIssues, buildFacultySummary, type FeedbackAnswer, type FeedbackQuestion } from "@/lib/feedback/insights"

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error ?? "Forbidden")
  }

  if (auth.role !== "faculty" || !auth.userId) {
    return unauthorizedResponse("Faculty access required", 403)
  }

  try {
    const facultyId = auth.userId

    const { count: activeStudentsCount, error: studentsErr } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "student")
      .eq("status", "active")

    if (studentsErr) {
      return NextResponse.json({ error: studentsErr.message }, { status: 400 })
    }

    const activeCount = activeStudentsCount ?? 0

    const { data: campaigns, error: campaignsErr } = await supabaseAdmin
      .from("feedback_campaigns")
      .select("id, title, month_key, opens_at, closes_at, is_published")
      .eq("is_published", true)
      .order("opens_at", { ascending: false })
      .limit(12)

    if (campaignsErr) {
      return NextResponse.json({ error: campaignsErr.message }, { status: 400 })
    }

    if (!(campaigns ?? []).length) {
      return NextResponse.json({
        ready: false,
        message: "No published monthly feedback campaigns found yet.",
      })
    }

    const campaignIds = (campaigns ?? []).map((c: any) => c.id)

    const { data: allSubmissions, error: submissionsErr } = await supabaseAdmin
      .from("feedback_submissions")
      .select("id, campaign_id")
      .in("campaign_id", campaignIds)

    if (submissionsErr) {
      return NextResponse.json({ error: submissionsErr.message }, { status: 400 })
    }

    const submissionCountByCampaign = new Map<string, number>()
    for (const row of allSubmissions ?? []) {
      submissionCountByCampaign.set(row.campaign_id, (submissionCountByCampaign.get(row.campaign_id) ?? 0) + 1)
    }

    const completedCampaigns = (campaigns ?? []).filter((c: any) => {
      const count = submissionCountByCampaign.get(c.id) ?? 0
      return activeCount > 0 && count >= activeCount
    })

    if (!completedCampaigns.length) {
      return NextResponse.json({
        ready: false,
        message: "AI summary will be available once all active students submit monthly feedback.",
        activeStudentsCount: activeCount,
      })
    }

    const completedIds = completedCampaigns.map((c: any) => c.id)

    const { data: facultySubjects, error: facultySubjectsErr } = await supabaseAdmin
      .from("faculty_subjects")
      .select("subject_id")
      .eq("faculty_id", facultyId)

    if (facultySubjectsErr) {
      return NextResponse.json({ error: facultySubjectsErr.message }, { status: 400 })
    }

    const subjectIds = new Set((facultySubjects ?? []).map((r: any) => r.subject_id))

    const { data: questionsRaw, error: questionsErr } = await supabaseAdmin
      .from("feedback_questions")
      .select("id, campaign_id, scope_type, scope_subject_id, scope_faculty_id, scope_label, question_text, options")
      .eq("is_active", true)
      .in("campaign_id", completedIds)

    if (questionsErr) {
      return NextResponse.json({ error: questionsErr.message }, { status: 400 })
    }

    const allQuestions = (questionsRaw ?? []) as FeedbackQuestion[]

    const relevantQuestions = allQuestions.filter((q) => {
      if (q.scope_type === "faculty") return q.scope_faculty_id === facultyId
      if (q.scope_type === "subject") return !!q.scope_subject_id && subjectIds.has(q.scope_subject_id)
      return false
    })

    if (!relevantQuestions.length) {
      return NextResponse.json({
        ready: true,
        summary: "No teacher-specific feedback questions were mapped to your assigned subjects/faculty profile yet.",
        actions: ["Ask admin to include faculty or subject-specific questions for your courses."],
        issues: [],
        analyzedCampaigns: completedCampaigns.length,
      })
    }

    const relevantQuestionIds = relevantQuestions.map((q) => q.id)

    const completedSubmissions = (allSubmissions ?? []).filter((s: any) => completedIds.includes(s.campaign_id))
    const submissionIds = completedSubmissions.map((s: any) => s.id)

    if (!submissionIds.length) {
      return NextResponse.json({
        ready: false,
        message: "No submissions available for completed campaigns.",
      })
    }

    const { data: answersRaw, error: answersErr } = await supabaseAdmin
      .from("feedback_answers")
      .select("question_id, option_index, option_text")
      .in("submission_id", submissionIds)
      .in("question_id", relevantQuestionIds)

    if (answersErr) {
      return NextResponse.json({ error: answersErr.message }, { status: 400 })
    }

    const answersByQuestion = new Map<string, FeedbackAnswer[]>()
    for (const ans of (answersRaw ?? []) as FeedbackAnswer[]) {
      const arr = answersByQuestion.get(ans.question_id) ?? []
      arr.push(ans)
      answersByQuestion.set(ans.question_id, arr)
    }

    const subjectNameById = new Map<string, string>()
    const { data: subjectsRaw } = await supabaseAdmin
      .from("subjects")
      .select("id, name, code")
      .in("id", Array.from(subjectIds))

    for (const s of subjectsRaw ?? []) {
      subjectNameById.set(s.id, `${s.name} (${s.code})`)
    }

    const facultyNameById = new Map<string, string>()
    const { data: facultyRow } = await supabaseAdmin
      .from("users")
      .select("id, name")
      .eq("id", facultyId)
      .maybeSingle()

    if (facultyRow) {
      facultyNameById.set(facultyRow.id, facultyRow.name)
    }

    let issues = [] as ReturnType<typeof buildFacultyIssues>

    for (const campaign of completedCampaigns) {
      const campaignQuestions = relevantQuestions.filter((q) => q.campaign_id === campaign.id)
      if (!campaignQuestions.length) continue

      const campaignIssues = buildFacultyIssues({
        campaign,
        questions: campaignQuestions,
        answersByQuestion,
        subjectNameById,
        facultyNameById,
      })
      issues = issues.concat(campaignIssues)
    }

    issues.sort((a, b) => b.severity - a.severity)
    const topIssues = issues.slice(0, 8)
    const summaryPack = buildFacultySummary(topIssues)

    return NextResponse.json({
      ready: true,
      generatedAt: new Date().toISOString(),
      activeStudentsCount: activeCount,
      analyzedCampaigns: completedCampaigns.length,
      summary: summaryPack.summary,
      actions: summaryPack.actions,
      issues: topIssues,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 })
  }
}
