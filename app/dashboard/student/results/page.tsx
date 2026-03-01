"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo } from "react"
import {
  Award, TrendingUp, TrendingDown, BarChart2,
  BookOpen, CheckCircle2, AlertCircle, Star,
  ChevronLeft, ChevronRight, AlertTriangle,
  RefreshCw, Search, Medal, Target, Minus
} from "lucide-react"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button }  from "@/components/ui/button"
import { Input }   from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { getUsers, getResultsByStudent } from "@/lib/db"
import type { User, Result } from "@/lib/types"

// ─── Helpers ─────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

type Grade = "O" | "A+" | "A" | "B+" | "B" | "C" | "F"

function scoreToGrade(score: number): Grade {
  if (score >= 90) return "O"
  if (score >= 80) return "A+"
  if (score >= 70) return "A"
  if (score >= 60) return "B+"
  if (score >= 50) return "B"
  if (score >= 40) return "C"
  return "F"
}

function scoreToGPA(score: number): number {
  if (score >= 90) return 10
  if (score >= 80) return 9
  if (score >= 70) return 8
  if (score >= 60) return 7
  if (score >= 50) return 6
  if (score >= 40) return 5
  return 0
}

const gradeConfig: Record<Grade, {
  color: string; bg: string; border: string; label: string
}> = {
  "O":  { color: "#16A34A", bg: "rgba(22,163,74,0.08)",   border: "rgba(22,163,74,0.20)",   label: "Outstanding" },
  "A+": { color: "#2563EB", bg: "rgba(37,99,235,0.08)",   border: "rgba(37,99,235,0.20)",   label: "Excellent"   },
  "A":  { color: "#0891B2", bg: "rgba(8,145,178,0.08)",   border: "rgba(8,145,178,0.20)",   label: "Very Good"   },
  "B+": { color: "#7C3AED", bg: "rgba(124,58,237,0.08)",  border: "rgba(124,58,237,0.20)",  label: "Good"        },
  "B":  { color: "#D97706", bg: "rgba(217,119,6,0.08)",   border: "rgba(217,119,6,0.20)",   label: "Above Avg"   },
  "C":  { color: "#EA580C", bg: "rgba(234,88,12,0.08)",   border: "rgba(234,88,12,0.20)",   label: "Average"     },
  "F":  { color: "#DC2626", bg: "rgba(220,38,38,0.08)",   border: "rgba(220,38,38,0.20)",   label: "Fail"        },
}

const EXAM_TYPES = ["all", "internal", "midterm", "final", "practical"]

const BAR_COLORS = [
  "#3B82F6","#8B5CF6","#10B981","#F59E0B",
  "#EF4444","#06B6D4","#EC4899","#84CC16",
]

// ════════════════════════════════════════════════════════════════
export default function StudentResultsPage() {
  const authUser = useAuth("student")
  if (!authUser) return null

  // ── Data ─────────────────────────────────────────────────────
  const [me,      setMe]      = useState<User | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  // ── Filters ───────────────────────────────────────────────────
  const [search,   setSearch]   = useState("")
  const [examType, setExamType] = useState("all")
  const [sortKey,  setSortKey]  = useState<"score_desc"|"score_asc"|"subject">("score_desc")
  const [page,     setPage]     = useState(1)
  const PAGE_SIZE = 8

  // ── Load ─────────────────────────────────────────────────────
  async function load() {
    setLoading(true); setError(null)
    try {
      const student = authUser.user
      setMe(student)
      if (student) {
        const res = await getResultsByStudent(student.id)
        setResults(res)
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (authUser.user) load() }, [authUser.user])
  useEffect(() => { setPage(1) }, [search, examType, sortKey])

  // ── Overall stats ─────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!results.length) return null
    const scores  = results.map(r => r.score)
    const avg     = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const highest = Math.max(...scores)
    const lowest  = Math.min(...scores)
    const cgpa    = +(results.reduce((a, r) => a + scoreToGPA(r.score), 0) / results.length).toFixed(2)
    const passed  = results.filter(r => r.score >= 40).length
    const failed  = results.length - passed
    return { avg, highest, lowest, cgpa, passed, failed, total: results.length }
  }, [results])

  // ── Grade distribution pie ────────────────────────────────────
  const gradeDist = useMemo(() => {
    const map: Partial<Record<Grade, number>> = {}
    results.forEach(r => {
      const g = scoreToGrade(r.score)
      map[g] = (map[g] ?? 0) + 1
    })
    return (Object.entries(map) as [Grade, number][])
      .map(([grade, count]) => ({ grade, count, ...gradeConfig[grade] }))
      .sort((a, b) => b.count - a.count)
  }, [results])

  // ── Radar data (per subject avg) ──────────────────────────────
  const radarData = useMemo(() => {
    const map: Record<string, number[]> = {}
    results.forEach(r => {
      const sub = r.subject ?? "General"
      if (!map[sub]) map[sub] = []
      map[sub].push(r.score)
    })
    return Object.entries(map)
      .map(([subject, scores]) => ({
        subject: subject.length > 10 ? subject.slice(0, 10) + "…" : subject,
        score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }))
      .slice(0, 7)
  }, [results])

  // ── Bar chart (score per result) ──────────────────────────────
  const barData = useMemo(() =>
    results
      .slice()
      .sort((a, b) => (a.subject ?? "").localeCompare(b.subject ?? ""))
      .map(r => ({
        subject: (r.subject ?? "General").slice(0, 8),
        score:   r.score,
        grade:   scoreToGrade(r.score),
        color:   gradeConfig[scoreToGrade(r.score)].color,
      }))
  , [results])

  // ── Filtered ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return results
      .filter(r => {
        if (search) {
          const q = search.toLowerCase()
          if (!( (r.subject ?? "").toLowerCase().includes(q) ||
                 (r.exam_type ?? "").toLowerCase().includes(q) )) return false
        }
        if (examType !== "all" && (r.exam_type ?? "").toLowerCase() !== examType) return false
        return true
      })
      .sort((a, b) => {
        if (sortKey === "score_desc") return b.score - a.score
        if (sortKey === "score_asc")  return a.score - b.score
        return (a.subject ?? "").localeCompare(b.subject ?? "")
      })
  }, [results, search, examType, sortKey])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── CGPA color ────────────────────────────────────────────────
  const cgpaColor = !stats ? "#94A3B8"
    : stats.cgpa >= 9 ? "#16A34A"
    : stats.cgpa >= 7 ? "#2563EB"
    : stats.cgpa >= 5 ? "#D97706"
    : "#DC2626"

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="student"
      userName={me?.name ?? "Student"}
      avatarUrl={me?.avatar_url}
      pageTitle="My Results"
      pageSubtitle="Academic performance across all subjects"
      loading={loading}
    >
      <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full min-w-0">

        {/* ── Error ─────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />{error}
            <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}

        {/* ── Failed subjects alert ─────────────────────────── */}
        {!loading && stats && stats.failed > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            You have <strong>{stats.failed}</strong> failed subject{stats.failed > 1 ? "s" : ""}. Please contact your faculty for remedial assistance.
          </div>
        )}

        {/* ── KPI cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "CGPA",
              value: loading ? null : stats ? `${stats.cgpa}` : "—",
              sub:   "out of 10",
              icon:  Star,
              color: loading ? "text-gray-400" : `text-[${cgpaColor}]`,
              bg:    "bg-indigo-50",
              border:"border-indigo-100",
              iconColor: "#6366F1",
            },
            {
              label: "Average",
              value: loading ? null : stats ? `${stats.avg}%` : "—",
              sub:   `${stats?.total ?? 0} subjects`,
              icon:  Target,
              color: !stats ? "text-gray-400" : stats.avg >= 75 ? "text-emerald-600" : stats.avg >= 50 ? "text-amber-600" : "text-red-600",
              bg:    "bg-blue-50",
              border:"border-blue-100",
              iconColor: "#3B82F6",
            },
            {
              label: "Highest",
              value: loading ? null : stats ? `${stats.highest}%` : "—",
              sub:   stats ? scoreToGrade(stats.highest) : "",
              icon:  TrendingUp,
              color: "text-emerald-600",
              bg:    "bg-emerald-50",
              border:"border-emerald-100",
              iconColor: "#16A34A",
            },
            {
              label: "Lowest",
              value: loading ? null : stats ? `${stats.lowest}%` : "—",
              sub:   stats ? scoreToGrade(stats.lowest) : "",
              icon:  TrendingDown,
              color: stats && stats.lowest < 40 ? "text-red-600" : "text-amber-600",
              bg:    stats && stats.lowest < 40 ? "bg-red-50"    : "bg-amber-50",
              border:stats && stats.lowest < 40 ? "border-red-100" : "border-amber-100",
              iconColor: stats && stats.lowest < 40 ? "#DC2626" : "#D97706",
            },
          ].map(k => (
            <Card key={k.label} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-xl ${k.bg} border ${k.border} flex items-center justify-center mb-3`}>
                  <k.icon className="h-4 w-4" style={{ color: k.iconColor }} />
                </div>
                <p className="text-xs text-gray-500 font-medium mb-1">{k.label}</p>
                {loading
                  ? <><Skeleton className="h-7 w-14 mb-1" /><Skeleton className="h-3 w-16" /></>
                  : <>
                      <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
                    </>
                }
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Charts row ────────────────────────────────────── */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Score bar chart */}
            <Card className="lg:col-span-2 backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-blue-600" />
                  Score by Subject
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="subject" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }}
                      formatter={(v: number, _, p) => [`${v}% (${p.payload.grade})`, "Score"]}
                    />
                    {/* Pass line */}
                    <Bar dataKey="score" radius={[6,6,0,0]}>
                      {barData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* Pass mark line label */}
                <p className="text-[10px] text-gray-400 text-right mt-1">
                  Pass mark: <span className="font-bold text-red-400">40%</span>
                </p>
              </CardContent>
            </Card>

            {/* Grade distribution donut */}
            <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Medal className="h-4 w-4 text-amber-500" />
                  Grade Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 flex flex-col items-center">
                <div className="relative">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={gradeDist} cx="50%" cy="50%"
                        innerRadius={40} outerRadius={60}
                        paddingAngle={3} dataKey="count"
                      >
                        {gradeDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xs font-black text-gray-800">{stats?.total}</p>
                    <p className="text-[9px] text-gray-400 font-semibold">TOTAL</p>
                  </div>
                </div>
                <div className="w-full space-y-1.5 mt-2">
                  {gradeDist.map(d => (
                    <div key={d.grade} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                        <span className="font-bold" style={{ color: d.color }}>{d.grade}</span>
                        <span className="text-gray-400">{d.label}</span>
                      </div>
                      <span className="font-black text-gray-700">{d.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Radar chart ──────────────────────────────────── */}
        {!loading && radarData.length >= 3 && (
          <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                Subject Performance Radar
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                  <PolarGrid stroke="rgba(148,163,184,0.2)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#64748B" }} />
                  <Radar
                    name="Score" dataKey="score"
                    stroke="#6366F1" fill="#6366F1" fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }}
                    formatter={(v: number) => [`${v}%`, "Avg Score"]} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* ── Toolbar ───────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search by subject or exam type..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-white/80"
            />
          </div>

          <Select value={examType} onValueChange={setExamType}>
            <SelectTrigger className="h-9 text-sm w-36 bg-white/80"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EXAM_TYPES.map(t => (
                <SelectItem key={t} value={t}>
                  {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortKey} onValueChange={v => setSortKey(v as any)}>
            <SelectTrigger className="h-9 text-sm w-36 bg-white/80"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="score_desc">Score: High → Low</SelectItem>
              <SelectItem value="score_asc">Score: Low → High</SelectItem>
              <SelectItem value="subject">Subject A → Z</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={load}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* ── Results table ─────────────────────────────────── */}
        {loading
          ? (
            <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
          : filtered.length === 0
            ? (
              <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
                <CardContent className="py-20 flex flex-col items-center gap-3 text-gray-400">
                  <Award className="h-12 w-12 text-gray-200" />
                  <p className="text-sm font-semibold">No results found</p>
                  <p className="text-xs">Try adjusting your search or filter</p>
                </CardContent>
              </Card>
            )
            : (
              <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        {["Subject","Exam Type","Score","Grade","Performance","Status"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((r, i) => {
                        const grade = scoreToGrade(r.score)
                        const gc    = gradeConfig[grade]
                        const pass  = r.score >= 40
                        return (
                          <tr key={r.id ?? i}
                            className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">

                            {/* Subject */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                  style={{ background: gc.bg, border: `1px solid ${gc.border}` }}>
                                  <BookOpen className="h-3 w-3" style={{ color: gc.color }} />
                                </div>
                                <span className="text-sm font-semibold text-gray-800">
                                  {r.subject ?? "General"}
                                </span>
                              </div>
                            </td>

                            {/* Exam type */}
                            <td className="px-4 py-3">
                              <span className="text-xs font-medium text-gray-500 capitalize">
                                {r.exam_type ?? "—"}
                              </span>
                            </td>

                            {/* Score */}
                            <td className="px-4 py-3">
                              <span className="text-sm font-black" style={{ color: gc.color }}>
                                {r.score}
                                <span className="text-xs font-normal text-gray-400">/100</span>
                              </span>
                            </td>

                            {/* Grade badge */}
                            <td className="px-4 py-3">
                              <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black"
                                style={{ background: gc.bg, color: gc.color, border: `1px solid ${gc.border}` }}
                              >
                                {grade}
                              </span>
                            </td>

                            {/* Progress bar */}
                            <td className="px-4 py-3 min-w-[120px]">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${r.score}%`, background: gc.color }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400 font-medium w-7 text-right">
                                  {r.score}%
                                </span>
                              </div>
                            </td>

                            {/* Pass/Fail */}
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                                pass
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-red-50 text-red-700 border border-red-100"
                              }`}>
                                {pass
                                  ? <CheckCircle2 className="h-3 w-3" />
                                  : <AlertCircle  className="h-3 w-3" />
                                }
                                {pass ? "Pass" : "Fail"}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table footer */}
                {filtered.length > PAGE_SIZE && (
                  <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                        onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                        .map((p, i, arr) => (
                          <>
                            {i > 0 && arr[i - 1] !== p - 1 && (
                              <span key={`d${p}`} className="text-xs text-gray-400 px-1">…</span>
                            )}
                            <Button key={p}
                              variant={page === p ? "default" : "outline"} size="sm"
                              className={`h-7 w-7 p-0 text-xs ${page === p ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                              onClick={() => setPage(p)}>{p}
                            </Button>
                          </>
                        ))
                      }
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                        onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
        }
      </div>
    </DashboardLayout>
  )
}
