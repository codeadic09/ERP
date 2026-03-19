"use client"

import { useEffect, useMemo, useState } from "react"
import { MessageSquareQuote, Plus, Trash2, CalendarClock, Save, Send, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getSubjects, getUsersByRole } from "@/lib/db"
import type { Subject, User } from "@/lib/types"

type ScopeType = "subject" | "faculty" | "facility" | "custom"

type QuestionDraft = {
  scopeType: ScopeType
  scopeSubjectId: string
  scopeFacultyId: string
  scopeLabel: string
  questionText: string
  optionsRaw: string
}

type Campaign = {
  id: string
  title: string
  month_key: string
  opens_at: string
  closes_at: string
  is_published: boolean
  submissionCount: number
  questions: Array<any>
}

function defaultQuestion(): QuestionDraft {
  return {
    scopeType: "subject",
    scopeSubjectId: "",
    scopeFacultyId: "",
    scopeLabel: "",
    questionText: "",
    optionsRaw: "Excellent, Good, Average, Poor",
  }
}

function statusLabel(c: Campaign) {
  const now = Date.now()
  const opens = new Date(c.opens_at).getTime()
  const closes = new Date(c.closes_at).getTime()
  if (!c.is_published) return "Draft"
  if (now < opens) return "Scheduled"
  if (now > closes) return "Closed"
  return "Open"
}

export default function AdminFeedbackPage() {
  const me = useAuth("admin")
  if (!me) return null

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [faculty, setFaculty] = useState<User[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [monthKey, setMonthKey] = useState("")
  const [opensAt, setOpensAt] = useState("")
  const [closesAt, setClosesAt] = useState("")
  const [isPublished, setIsPublished] = useState(false)
  const [questions, setQuestions] = useState<QuestionDraft[]>([defaultQuestion()])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [campaignRes, subjectsData, facultyData] = await Promise.all([
        fetch("/api/feedback/campaigns", { cache: "no-store" }),
        getSubjects(),
        getUsersByRole("faculty"),
      ])

      const campaignJson = await campaignRes.json()
      if (!campaignRes.ok) {
        throw new Error(campaignJson.error ?? "Failed to load feedback campaigns")
      }

      setCampaigns(campaignJson.campaigns ?? [])
      setSubjects(subjectsData)
      setFaculty(facultyData)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const subjectNameById = useMemo(() => {
    const map = new Map<string, string>()
    subjects.forEach((s) => map.set(s.id, `${s.name} (${s.code})`))
    return map
  }, [subjects])

  const facultyNameById = useMemo(() => {
    const map = new Map<string, string>()
    faculty.forEach((f) => map.set(f.id, f.name))
    return map
  }, [faculty])

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  async function createCampaign() {
    setError(null)
    setMessage(null)

    if (!title.trim() || !monthKey || !opensAt || !closesAt) {
      setError("Title, month, open date, and close date are required")
      return
    }

    const payloadQuestions = questions.map((q, i) => ({
      scopeType: q.scopeType,
      scopeSubjectId: q.scopeSubjectId || null,
      scopeFacultyId: q.scopeFacultyId || null,
      scopeLabel: q.scopeLabel.trim() || null,
      questionText: q.questionText.trim(),
      options: q.optionsRaw.split(",").map((x) => x.trim()).filter(Boolean),
      sortOrder: i,
    }))

    const hasInvalid = payloadQuestions.some((q) => q.questionText.length < 4 || q.options.length < 2)
    if (hasInvalid) {
      setError("Each question needs text and at least 2 options")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/feedback/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          monthKey,
          opensAt: new Date(opensAt).toISOString(),
          closesAt: new Date(closesAt).toISOString(),
          isPublished,
          questions: payloadQuestions,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to create campaign")

      setMessage("Feedback campaign created")
      setTitle("")
      setMonthKey("")
      setOpensAt("")
      setClosesAt("")
      setIsPublished(false)
      setQuestions([defaultQuestion()])
      await load()
    } catch (e: any) {
      setError(e?.message ?? "Failed to create campaign")
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish(c: Campaign) {
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(`/api/feedback/campaigns/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !c.is_published }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to update campaign")
      setMessage(!c.is_published ? "Campaign published" : "Campaign moved to draft")
      await load()
    } catch (e: any) {
      setError(e?.message ?? "Failed to update campaign")
    }
  }

  return (
    <DashboardLayout
      role="admin"
      userName="Admin"
      avatarUrl={me.user?.avatar_url}
      pageTitle="Monthly Feedback"
      pageSubtitle="Create, schedule, and publish MCQ feedback for students"
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
              Create Monthly Feedback Campaign
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-600">Campaign Title</p>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="March 2026 Student Feedback" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-600">Month</p>
                <Input type="month" value={monthKey} onChange={(e) => setMonthKey(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-600">Open From</p>
                <Input type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-600">Close On</p>
                <Input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4"
              />
              Publish immediately (students can access only during open and close window)
            </label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-800">Questions (MCQ)</p>
                <Button type="button" variant="outline" onClick={() => setQuestions((prev) => [...prev, defaultQuestion()])} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add Question
                </Button>
              </div>

              {questions.map((q, index) => (
                <div key={index} className="rounded-xl border border-gray-200 bg-white/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500">Question #{index + 1}</p>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(index)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5 md:col-span-1">
                      <p className="text-xs font-semibold text-gray-600">Type</p>
                      <select
                        value={q.scopeType}
                        onChange={(e) => updateQuestion(index, { scopeType: e.target.value as ScopeType })}
                        className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                      >
                        <option value="subject">Subject</option>
                        <option value="faculty">Faculty</option>
                        <option value="facility">Facility</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 md:col-span-3">
                      <p className="text-xs font-semibold text-gray-600">Question</p>
                      <Textarea
                        rows={2}
                        value={q.questionText}
                        onChange={(e) => updateQuestion(index, { questionText: e.target.value })}
                        placeholder="How do you rate this class/facility?"
                      />
                    </div>
                  </div>

                  {q.scopeType === "subject" && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-gray-600">Subject</p>
                      <select
                        value={q.scopeSubjectId}
                        onChange={(e) => updateQuestion(index, { scopeSubjectId: e.target.value })}
                        className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                      >
                        <option value="">Select subject</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {q.scopeType === "faculty" && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-gray-600">Faculty</p>
                      <select
                        value={q.scopeFacultyId}
                        onChange={(e) => updateQuestion(index, { scopeFacultyId: e.target.value })}
                        className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                      >
                        <option value="">Select faculty</option>
                        {faculty.map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(q.scopeType === "facility" || q.scopeType === "custom") && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-gray-600">Label</p>
                      <Input
                        value={q.scopeLabel}
                        onChange={(e) => updateQuestion(index, { scopeLabel: e.target.value })}
                        placeholder={q.scopeType === "facility" ? "Library, Labs, Hostel, Transport" : "Custom area label"}
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-gray-600">Options (comma separated)</p>
                    <Input
                      value={q.optionsRaw}
                      onChange={(e) => updateQuestion(index, { optionsRaw: e.target.value })}
                      placeholder="Excellent, Good, Average, Poor"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={createCampaign} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Campaign
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="liquid-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-indigo-600" />
              Existing Feedback Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!campaigns.length && (
              <p className="text-sm text-gray-500">No campaign created yet.</p>
            )}

            {campaigns.map((c) => (
              <div key={c.id} className="rounded-xl border border-gray-200 bg-white/75 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{c.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Month: {c.month_key} | Opens: {new Date(c.opens_at).toLocaleString()} | Closes: {new Date(c.closes_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {c.questions?.length ?? 0} questions | {c.submissionCount ?? 0} submissions
                    </p>
                    {(c.questions ?? []).length > 0 && (
                      <div className="mt-2 text-xs text-gray-600 space-y-1">
                        {(c.questions as any[]).slice(0, 2).map((q) => {
                          const scope = q.scope_type === "subject"
                            ? (subjectNameById.get(q.scope_subject_id) ?? "Subject")
                            : q.scope_type === "faculty"
                              ? (facultyNameById.get(q.scope_faculty_id) ?? "Faculty")
                              : (q.scope_label || q.scope_type)
                          return (
                            <p key={q.id}>• {scope}: {q.question_text}</p>
                          )
                        })}
                        {(c.questions?.length ?? 0) > 2 && <p>• +{(c.questions?.length ?? 0) - 2} more</p>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${statusLabel(c) === "Open" ? "bg-emerald-100 text-emerald-700" : statusLabel(c) === "Closed" ? "bg-gray-100 text-gray-700" : statusLabel(c) === "Scheduled" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                      {statusLabel(c)}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => togglePublish(c)} className="gap-1.5">
                      <Send className="h-3.5 w-3.5" />
                      {c.is_published ? "Unpublish" : "Publish"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
