type ScopeType = "subject" | "faculty" | "facility" | "custom"

export interface FeedbackQuestion {
  id: string
  campaign_id: string
  scope_type: ScopeType
  scope_subject_id: string | null
  scope_faculty_id: string | null
  scope_label: string | null
  question_text: string
  options: string[]
}

export interface FeedbackAnswer {
  question_id: string
  option_text: string
  option_index: number
}

export interface FeedbackIssue {
  campaignId: string
  campaignTitle: string
  monthKey: string
  scope: string
  question: string
  dominantOption: string
  responses: number
  negativeShare: number
  averageScore: number
  severity: number
  recommendedAction: string
}

const NEGATIVE_WORDS = [
  "poor", "bad", "very bad", "difficult", "hard", "confusing", "unclear", "slow", "boring", "weak", "low", "late", "not satisfied", "unsatisfied",
]

const POSITIVE_WORDS = [
  "excellent", "very good", "great", "good", "clear", "helpful", "satisfied", "strong", "easy", "engaging",
]

function scoreOption(optionText: string, optionIndex: number, totalOptions: number) {
  const v = optionText.toLowerCase().trim()

  if (NEGATIVE_WORDS.some((w) => v.includes(w))) return 1
  if (v.includes("average") || v.includes("neutral") || v.includes("ok") || v.includes("okay")) return 3
  if (POSITIVE_WORDS.some((w) => v.includes(w))) return 5

  if (totalOptions <= 1) return 3
  const normalized = 1 - optionIndex / Math.max(totalOptions - 1, 1)
  return Math.max(1, Math.min(5, Math.round(1 + normalized * 4)))
}

function recommendAction(question: string, scope: string) {
  const q = `${scope} ${question}`.toLowerCase()

  if (q.includes("clarity") || q.includes("understand") || q.includes("explain") || q.includes("confusing")) {
    return "Break down complex topics into shorter steps and add a 5-minute recap at the end of class."
  }
  if (q.includes("pace") || q.includes("speed") || q.includes("fast") || q.includes("slow")) {
    return "Adjust lecture pace with quick comprehension checks and pause for doubts every 15-20 minutes."
  }
  if (q.includes("doubt") || q.includes("question") || q.includes("support")) {
    return "Add a weekly doubt-clearing slot and track unresolved doubts in a shared list."
  }
  if (q.includes("assignment") || q.includes("homework") || q.includes("workload")) {
    return "Rebalance assignment difficulty and provide a sample solution or rubric before submission."
  }
  if (q.includes("lab") || q.includes("practical") || q.includes("facility") || q.includes("library")) {
    return "Coordinate with admin to fix resource gaps and publish an expected resolution timeline."
  }

  return "Review this topic with students directly and define one measurable improvement for next month."
}

function formatScopeLabel(question: FeedbackQuestion, subjectName?: string, facultyName?: string) {
  if (question.scope_type === "subject") return subjectName || "Subject"
  if (question.scope_type === "faculty") return facultyName || "Faculty"
  if (question.scope_type === "facility") return question.scope_label || "Facility"
  return question.scope_label || "General"
}

export function buildFacultyIssues(params: {
  campaign: { id: string; title: string; month_key: string }
  questions: FeedbackQuestion[]
  answersByQuestion: Map<string, FeedbackAnswer[]>
  subjectNameById: Map<string, string>
  facultyNameById: Map<string, string>
}) {
  const { campaign, questions, answersByQuestion, subjectNameById, facultyNameById } = params
  const issues: FeedbackIssue[] = []

  for (const question of questions) {
    const answers = answersByQuestion.get(question.id) ?? []
    if (!answers.length) continue

    const counts = new Map<string, number>()
    let totalScore = 0
    let negativeVotes = 0

    for (const answer of answers) {
      counts.set(answer.option_text, (counts.get(answer.option_text) ?? 0) + 1)
      const optionPos = question.options.findIndex((o) => o === answer.option_text)
      const effectiveIndex = optionPos >= 0 ? optionPos : answer.option_index
      const score = scoreOption(answer.option_text, effectiveIndex, question.options.length)
      totalScore += score
      if (score <= 2) negativeVotes += 1
    }

    const responses = answers.length
    const averageScore = totalScore / responses
    const negativeShare = negativeVotes / responses

    let dominantOption = ""
    let dominantVotes = -1
    for (const [option, count] of counts.entries()) {
      if (count > dominantVotes) {
        dominantVotes = count
        dominantOption = option
      }
    }

    const isIssue = averageScore <= 2.8 || negativeShare >= 0.35
    if (!isIssue) continue

    const severity = (3.3 - Math.min(averageScore, 3.3)) + negativeShare
    const scope = formatScopeLabel(
      question,
      question.scope_subject_id ? subjectNameById.get(question.scope_subject_id) : undefined,
      question.scope_faculty_id ? facultyNameById.get(question.scope_faculty_id) : undefined,
    )

    issues.push({
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      monthKey: campaign.month_key,
      scope,
      question: question.question_text,
      dominantOption,
      responses,
      negativeShare,
      averageScore,
      severity,
      recommendedAction: recommendAction(question.question_text, scope),
    })
  }

  issues.sort((a, b) => b.severity - a.severity)
  return issues
}

export function buildFacultySummary(issues: FeedbackIssue[]) {
  if (!issues.length) {
    return {
      summary: "No major recurring pain points were found in the latest completed feedback cycle for your classes.",
      actions: ["Continue current teaching strategy and review again after the next monthly cycle."],
    }
  }

  const topScopes = Array.from(new Set(issues.slice(0, 3).map((i) => i.scope)))
  const actions = Array.from(new Set(issues.slice(0, 3).map((i) => i.recommendedAction)))

  return {
    summary: `Students most commonly reported issues in ${topScopes.join(", ")}. Focus on the top items below first for the fastest impact next month.`,
    actions,
  }
}
