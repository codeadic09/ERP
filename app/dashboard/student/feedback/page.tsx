"use client"

import { useEffect, useMemo, useState } from "react"
import { MessageSquareQuote, Loader2, Clock3, Lock } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Question = {
  id: string
  scope_type: "subject" | "faculty" | "facility" | "custom"
  scope_label: string | null
  question_text: string
  options: string[]
  subjects?: { id: string; name: string; code: string } | null
  faculty?: { id: string; name: string } | null
}

type Campaign = {
  id: string
  title: string
  month_key: string
  opens_at: string
  closes_at: string
  alreadySubmitted: boolean
  questions: Question[]
}

function scopeLabel(q: Question) {
  if (q.scope_type === "subject") return q.subjects ? `${q.subjects.name} (${q.subjects.code})` : "Subject"
  if (q.scope_type === "faculty") return q.faculty?.name ?? "Faculty"
  return q.scope_label || "General"
}

export default function StudentFeedbackPage() {
  const me = useAuth("student")
  if (!me) return null

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("")
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activeCampaign = useMemo(() => {
    return campaigns.find((c) => c.id === selectedCampaignId) ?? campaigns[0] ?? null
  }, [campaigns, selectedCampaignId])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/feedback/campaigns", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load feedback")
      }

      const list = (data.campaigns ?? []) as Campaign[]
      setCampaigns(list)
      if (list.length) setSelectedCampaignId(list[0].id)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    setAnswers({})
    setMessage(null)
    setError(null)
  }, [selectedCampaignId])

  const completion = useMemo(() => {
    if (!activeCampaign) return 0
    const total = activeCampaign.questions.length
    if (!total) return 0
    let answered = 0
    for (const q of activeCampaign.questions) {
      if (answers[q.id] !== undefined) answered += 1
    }
    return Math.round((answered / total) * 100)
  }, [activeCampaign, answers])

  async function submitFeedback() {
    if (!activeCampaign) return
    setError(null)
    setMessage(null)

    if (activeCampaign.alreadySubmitted) {
      setError("You have already submitted this feedback")
      return
    }

    const missing = activeCampaign.questions.some((q) => answers[q.id] === undefined)
    if (missing) {
      setError("Please answer all questions before submitting")
      return
    }

    const payloadAnswers = activeCampaign.questions.map((q) => ({
      questionId: q.id,
      optionIndex: answers[q.id],
      optionText: q.options[answers[q.id]],
    }))

    setSubmitting(true)
    try {
      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: activeCampaign.id,
          answers: payloadAnswers,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Submission failed")
      setMessage("Feedback submitted successfully")
      await load()
    } catch (e: any) {
      setError(e?.message ?? "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  const isClosed = !activeCampaign
  const alreadySubmitted = !!activeCampaign?.alreadySubmitted

  return (
    <DashboardLayout
      role="student"
      userName={me.user?.name ?? "Student"}
      avatarUrl={me.user?.avatar_url}
      pageTitle="Monthly Feedback"
      pageSubtitle="Fill the current month feedback form before the deadline"
      loading={loading}
    >
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        {(error || message) && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
            {error ?? message}
          </div>
        )}

        <Card className="liquid-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareQuote className="h-5 w-5 text-blue-600" />
              Student Feedback Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isClosed && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Feedback is currently closed. It opens only when admin publishes a campaign and the date window is active.
              </div>
            )}

            {!isClosed && campaigns.length > 1 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-600">Active Campaign</p>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.title} ({c.month_key})</option>
                  ))}
                </select>
              </div>
            )}

            {activeCampaign && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700 flex flex-wrap items-center gap-2">
                <Clock3 className="h-4 w-4" />
                <span>Open: {new Date(activeCampaign.opens_at).toLocaleString()}</span>
                <span>|</span>
                <span>Closes: {new Date(activeCampaign.closes_at).toLocaleString()}</span>
                <span>|</span>
                <span>Completion: {completion}%</span>
              </div>
            )}

            {alreadySubmitted && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                You have already submitted this month's feedback. Thank you.
              </div>
            )}
          </CardContent>
        </Card>

        {activeCampaign && !alreadySubmitted && (
          <Card className="liquid-glass">
            <CardHeader>
              <CardTitle>{activeCampaign.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeCampaign.questions.map((q, index) => (
                <div key={q.id} className="rounded-xl border border-gray-200 bg-white/70 p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-blue-600">{scopeLabel(q)}</p>
                  <p className="text-sm font-semibold text-gray-900">{index + 1}. {q.question_text}</p>

                  <div className="space-y-2">
                    {q.options.map((option, oi) => (
                      <label key={oi} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers[q.id] === oi}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <Button onClick={submitFeedback} disabled={submitting} className="gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Submit Feedback
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
