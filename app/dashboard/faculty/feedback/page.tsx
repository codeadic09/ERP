"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, BrainCircuit, CheckCircle2, Loader2, Wrench } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Issue = {
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

type InsightPayload = {
  ready: boolean
  message?: string
  summary?: string
  actions?: string[]
  issues?: Issue[]
  analyzedCampaigns?: number
  activeStudentsCount?: number
  generatedAt?: string
}

export default function FacultyFeedbackInsightsPage() {
  const me = useAuth("faculty")
  if (!me) return null

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<InsightPayload | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/feedback/insights", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load AI feedback insights")
      }
      setPayload(data)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load insights")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <DashboardLayout
      role="faculty"
      userName={me.user?.name ?? "Faculty"}
      avatarUrl={me.user?.avatar_url}
      pageTitle="AI Feedback Insights"
      pageSubtitle="Most common issues students face and what to improve first"
      loading={loading}
    >
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {!loading && payload && !payload.ready && (
          <Card className="liquid-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-blue-600" />
                AI Summary Not Ready Yet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{payload.message ?? "Summary will appear when enough feedback is collected."}</p>
            </CardContent>
          </Card>
        )}

        {!loading && payload?.ready && (
          <>
            <Card className="liquid-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-indigo-600" />
                  AI Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-700 leading-relaxed">{payload.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-500">
                  <div className="rounded-lg border bg-white/60 px-3 py-2">Campaigns analyzed: <span className="font-semibold text-gray-700">{payload.analyzedCampaigns ?? 0}</span></div>
                  <div className="rounded-lg border bg-white/60 px-3 py-2">Active students considered: <span className="font-semibold text-gray-700">{payload.activeStudentsCount ?? 0}</span></div>
                  <div className="rounded-lg border bg-white/60 px-3 py-2">Generated: <span className="font-semibold text-gray-700">{payload.generatedAt ? new Date(payload.generatedAt).toLocaleString() : "-"}</span></div>
                </div>
              </CardContent>
            </Card>

            <Card className="liquid-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-emerald-600" />
                  Recommended Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(payload.actions ?? []).map((action, i) => (
                  <div key={i} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{action}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="liquid-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Top Recurring Issues
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(payload.issues ?? []).length === 0 && (
                  <p className="text-sm text-gray-600">No major recurring issues detected.</p>
                )}

                {(payload.issues ?? []).map((issue, idx) => (
                  <div key={`${issue.campaignId}-${idx}`} className="rounded-xl border border-gray-200 bg-white/70 p-4 space-y-2">
                    <div className="flex flex-wrap gap-2 items-center text-xs">
                      <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-700 font-semibold">{issue.monthKey}</span>
                      <span className="px-2 py-1 rounded-md bg-purple-100 text-purple-700 font-semibold">{issue.scope}</span>
                      <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-700 font-semibold">Severity {issue.severity.toFixed(2)}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{issue.question}</p>
                    <p className="text-xs text-gray-600">
                      Most selected response: <span className="font-semibold">{issue.dominantOption}</span> | Responses: <span className="font-semibold">{issue.responses}</span> | Negative share: <span className="font-semibold">{Math.round(issue.negativeShare * 100)}%</span>
                    </p>
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1">
                      Action: {issue.recommendedAction}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing monthly feedback...
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
