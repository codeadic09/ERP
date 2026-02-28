"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo } from "react"
import {
  FileText, Clock, CheckCircle2, AlertCircle,
  Calendar, Search, Filter, ChevronLeft,
  ChevronRight, AlertTriangle, RefreshCw,
  BookOpen, TrendingUp, XCircle, Eye,
  BarChart2, Loader2
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button }  from "@/components/ui/button"
import { Input }   from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  getUsers, getDepartments, getAssignmentsByDept,
} from "@/lib/db"
import type { User, Department, Assignment } from "@/lib/types"

// ─── Helpers ─────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

const PAGE_SIZE = 8

type DueFilter  = "all" | "upcoming" | "today" | "overdue" | "this-week"
type SortKey    = "due_asc" | "due_desc" | "title"

function getDueState(dueDateStr: string): "overdue" | "today" | "soon" | "upcoming" {
  const now  = new Date(); now.setHours(0,0,0,0)
  const due  = new Date(dueDateStr); due.setHours(0,0,0,0)
  const diff = Math.ceil((due.getTime() - now.getTime()) / 86400000)
  if (diff < 0)  return "overdue"
  if (diff === 0) return "today"
  if (diff <= 3)  return "soon"
  return "upcoming"
}

function daysLeft(dueDateStr: string) {
  const now = new Date(); now.setHours(0,0,0,0)
  const due = new Date(dueDateStr); due.setHours(0,0,0,0)
  return Math.ceil((due.getTime() - now.getTime()) / 86400000)
}

const dueStateConfig = {
  overdue:  { label: "Overdue",  color: "#DC2626", bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.2)"  },
  today:    { label: "Due Today",color: "#D97706", bg: "rgba(217,119,6,0.08)",  border: "rgba(217,119,6,0.2)"  },
  soon:     { label: "Due Soon", color: "#2563EB", bg: "rgba(37,99,235,0.08)",  border: "rgba(37,99,235,0.2)"  },
  upcoming: { label: "Upcoming", color: "#16A34A", bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.2)"  },
}

// ════════════════════════════════════════════════════════════════
export default function StudentAssignmentsPage() {
  const authUser = useAuth("student")
  if (!authUser) return null

  // ── Data ─────────────────────────────────────────────────────
  const [me,          setMe]          = useState<User | null>(null)
  const [dept,        setDept]        = useState<Department | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  // ── UI ───────────────────────────────────────────────────────
  const [search,    setSearch]    = useState("")
  const [dueFilter, setDueFilter] = useState<DueFilter>("all")
  const [sortKey,   setSortKey]   = useState<SortKey>("due_asc")
  const [page,      setPage]      = useState(1)

  // ── View dialog ───────────────────────────────────────────────
  const [viewing, setViewing] = useState<Assignment | null>(null)

  // ── Load ─────────────────────────────────────────────────────
  async function load() {
    setLoading(true); setError(null)
    try {
      const depts = await getDepartments()
      const student = authUser.user
      setMe(student)
      if (student) {
        const d = depts.find(d => d.id === student.dept_id) ?? null
        setDept(d)
        const asgn = d ? await getAssignmentsByDept(d.id) : []
        setAssignments(asgn)
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (authUser.user) load() }, [authUser.user])
  useEffect(() => { setPage(1) }, [search, dueFilter, sortKey])

  // ── Stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    assignments.length,
    overdue:  assignments.filter(a => getDueState(a.due_date) === "overdue").length,
    today:    assignments.filter(a => getDueState(a.due_date) === "today").length,
    upcoming: assignments.filter(a => ["upcoming","soon"].includes(getDueState(a.due_date))).length,
  }), [assignments])

  // ── Per-subject breakdown (bar chart) ─────────────────────────
  const subjectData = useMemo(() => {
    const map: Record<string, number> = {}
    assignments.forEach(a => {
      const sub = a.subject ?? "General"
      map[sub] = (map[sub] ?? 0) + 1
    })
    return Object.entries(map)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [assignments])

  // ── Filtered + sorted ─────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date(); now.setHours(0,0,0,0)

    return assignments
      .filter(a => {
        if (search) {
          const q = search.toLowerCase()
          if (!a.title.toLowerCase().includes(q) &&
              !(a.subject ?? "").toLowerCase().includes(q) &&
              !(a.description ?? "").toLowerCase().includes(q)) return false
        }
        if (dueFilter === "upcoming") return ["upcoming","soon"].includes(getDueState(a.due_date))
        if (dueFilter === "today")    return getDueState(a.due_date) === "today"
        if (dueFilter === "overdue")  return getDueState(a.due_date) === "overdue"
        if (dueFilter === "this-week") {
          const d = daysLeft(a.due_date)
          return d >= 0 && d <= 7
        }
        return true
      })
      .sort((a, b) => {
        if (sortKey === "due_asc")  return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        if (sortKey === "due_desc") return new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
        return a.title.localeCompare(b.title)
      })
  }, [assignments, search, dueFilter, sortKey])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="student"
      userName={me?.name ?? "Student"}
      pageTitle="Assignments"
      pageSubtitle={`${dept?.name ?? "Your department"} — all assignments`}
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

        {/* ── Overdue alert ─────────────────────────────────── */}
        {!loading && stats.overdue > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            You have <strong>{stats.overdue}</strong> overdue assignment{stats.overdue > 1 ? "s" : ""}. Please submit as soon as possible.
          </div>
        )}

        {/* ── Stat cards ────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total",    value: stats.total,    icon: FileText,    color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100"    },
            { label: "Upcoming", value: stats.upcoming, icon: Clock,       color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
            { label: "Due Today",value: stats.today,    icon: AlertCircle, color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100"   },
            { label: "Overdue",  value: stats.overdue,  icon: XCircle,     color: "text-red-600",     bg: "bg-red-50",     border: "border-red-100"     },
          ].map(s => (
            <Card key={s.label} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-3`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
                {loading
                  ? <Skeleton className="h-6 w-12" />
                  : <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                }
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Subject breakdown bar ─────────────────────────── */}
        {!loading && subjectData.length > 0 && (
          <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-indigo-600" />
                Assignments by Subject
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={subjectData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="subject" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }} />
                  <Bar dataKey="count" name="Assignments" radius={[6,6,0,0]}>
                    {subjectData.map((_, i) => (
                      <Cell key={i} fill={["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#06B6D4"][i % 6]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* ── Toolbar ───────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search by title or subject..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-white/80"
            />
          </div>

          {/* Due filter */}
          <Select value={dueFilter} onValueChange={v => setDueFilter(v as DueFilter)}>
            <SelectTrigger className="h-9 text-sm w-36 bg-white/80"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="today">Due Today</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortKey} onValueChange={v => setSortKey(v as SortKey)}>
            <SelectTrigger className="h-9 text-sm w-36 bg-white/80"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="due_asc">Due: Earliest</SelectItem>
              <SelectItem value="due_desc">Due: Latest</SelectItem>
              <SelectItem value="title">A → Z</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={load}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* ── Assignment cards grid ─────────────────────────── */}
        {loading
          ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-5 w-20 rounded-full mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )
          : paginated.length === 0
            ? (
              <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
                <CardContent className="py-20 flex flex-col items-center gap-3 text-gray-400">
                  <FileText className="h-12 w-12 text-gray-200" />
                  <p className="text-sm font-semibold">No assignments found</p>
                  <p className="text-xs">Try adjusting your search or filter</p>
                </CardContent>
              </Card>
            )
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {paginated.map(a => {
                  const ds  = getDueState(a.due_date)
                  const dc  = dueStateConfig[ds]
                  const dl  = daysLeft(a.due_date)

                  return (
                    <Card
                      key={a.id}
                      className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden cursor-pointer"
                      onClick={() => setViewing(a)}
                    >
                      {/* Top accent bar */}
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: dc.color }} />

                      <CardContent className="p-5">

                        {/* Subject pill */}
                        {a.subject && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 mb-2">
                            <BookOpen className="h-2.5 w-2.5" />
                            {a.subject}
                          </div>
                        )}

                        {/* Title */}
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-2 group-hover:text-blue-600 transition-colors">
                          {a.title}
                        </h3>

                        {/* Description preview */}
                        {a.description && (
                          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
                            {a.description}
                          </p>
                        )}

                        {/* Due date */}
                        <div className="flex items-center gap-1.5 mb-3">
                          <Calendar className="h-3 w-3 text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-500">
                            {new Date(a.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>

                        {/* Due state badge */}
                        <div className="flex items-center justify-between">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                            style={{ background: dc.bg, color: dc.color, border: `1px solid ${dc.border}` }}
                          >
                            {dc.label}
                          </span>

                          <span className={`text-xs font-bold ${
                            ds === "overdue" ? "text-red-600"
                            : ds === "today" ? "text-amber-600"
                            : ds === "soon"  ? "text-blue-600"
                            : "text-gray-400"
                          }`}>
                            {ds === "overdue"
                              ? `${Math.abs(dl)}d ago`
                              : dl === 0 ? "Today!"
                              : `${dl}d left`
                            }
                          </span>
                        </div>

                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )
        }

        {/* ── Pagination ────────────────────────────────────── */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between">
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
      </div>

      {/* ════ VIEW ASSIGNMENT DIALOG ════ */}
      <Dialog open={!!viewing} onOpenChange={open => { if (!open) setViewing(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
          </DialogHeader>
          {viewing && (() => {
            const ds = getDueState(viewing.due_date)
            const dc = dueStateConfig[ds]
            const dl = daysLeft(viewing.due_date)
            return (
              <div className="space-y-4 py-2">

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: dc.bg, color: dc.color, border: `1px solid ${dc.border}` }}
                  >
                    {dc.label}
                  </span>
                  {viewing.subject && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <BookOpen className="h-3 w-3" /> {viewing.subject}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-base font-black text-gray-900 leading-snug">
                  {viewing.title}
                </h2>

                {/* Description */}
                {viewing.description && (
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {viewing.description}
                    </p>
                  </div>
                )}

                {/* Meta grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      label: "Due Date",
                      value: new Date(viewing.due_date).toLocaleDateString("en-IN", {
                        weekday: "long", day: "numeric", month: "long", year: "numeric"
                      })
                    },
                    {
                      label: "Time Left",
                      value: ds === "overdue"
                        ? `${Math.abs(dl)} day${Math.abs(dl) !== 1 ? "s" : ""} overdue`
                        : dl === 0 ? "Due today!"
                        : `${dl} day${dl !== 1 ? "s" : ""} left`
                    },
                  ].map(m => (
                    <div key={m.label} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{m.label}</p>
                      <p className="text-xs font-bold text-gray-800">{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Urgency bar */}
                {ds !== "upcoming" && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold ${
                    ds === "overdue" ? "bg-red-50 border border-red-200 text-red-700"
                    : ds === "today" ? "bg-amber-50 border border-amber-200 text-amber-700"
                    : "bg-blue-50 border border-blue-200 text-blue-700"
                  }`}>
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {ds === "overdue"
                      ? "This assignment is past its due date. Submit immediately."
                      : ds === "today"
                      ? "This assignment is due today. Submit before end of day."
                      : "This assignment is due very soon. Don't miss it!"}
                  </div>
                )}

              </div>
            )
          })()}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewing(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}
