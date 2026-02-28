"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo } from "react"
import {
  GraduationCap, ClipboardCheck, FileText,
  Award, CreditCard, Bell, TrendingUp,
  AlertCircle, CheckCircle2, Clock,
  Calendar, BookOpen, ChevronRight,
  AlertTriangle, Loader2, Activity
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"
import { DashboardLayout }  from "@/components/layout/dashboard-layout"
import { LiquidGlassBackground } from "@/components/liquid-glass-bg"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  getUsers, getDepartments, getAttendance,
  getFees, getNotices, getAssignmentsByDept,
  getResultsByStudent,
} from "@/lib/db"
import type {
  User, Department, Attendance,
  Fee, Notice, Assignment, Result,
} from "@/lib/types"

// ─── Helpers ─────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1)  return "Just now"
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (d < 7)  return `${d}d ago`
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

const ATT_COLORS = {
  present: "#16A34A",
  absent:  "#DC2626",
  late:    "#D97706",
}

// ════════════════════════════════════════════════════════════════
export default function StudentDashboardPage() {
  const authUser = useAuth("student")
  if (!authUser) return null

  // ── Data ─────────────────────────────────────────────────────
  const [me,          setMe]          = useState<User | null>(null)
  const [dept,        setDept]        = useState<Department | null>(null)
  const [attendance,  setAttendance]  = useState<Attendance[]>([])
  const [fee,         setFee]         = useState<Fee | null>(null)
  const [notices,     setNotices]     = useState<Notice[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [results,     setResults]     = useState<Result[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  // ── Load ─────────────────────────────────────────────────────
  async function load() {
    setLoading(true); setError(null)
    try {
      const [users, depts, att, fees, nots] = await Promise.all([
        getUsers(), getDepartments(), getAttendance(), getFees(), getNotices(),
      ])
      const student = authUser.user
      setMe(student)
      if (student) {
        const d = depts.find(d => d.id === student.dept_id) ?? null
        setDept(d)
        setAttendance(att.filter(a => a.student_id === student.id))
        setFee(fees.find(f => f.student_id === student.id) ?? null)
        setNotices(
          nots
            .filter(n => n.target === "All" || n.target === "Students")
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
        )
        const [asgn, res] = await Promise.all([
          d ? getAssignmentsByDept(d.id) : Promise.resolve([]),
          getResultsByStudent(student.id),
        ])
        setAssignments(asgn)
        setResults(res)
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (authUser.user) load() }, [authUser.user])

  // ── Attendance stats ──────────────────────────────────────────
  const attStats = useMemo(() => {
    const total   = attendance.length
    const present = attendance.filter(a => a.status === "present").length
    const absent  = attendance.filter(a => a.status === "absent").length
    const late    = attendance.filter(a => a.status === "late").length
    const pct     = total ? Math.round((present / total) * 100) : 0
    return { total, present, absent, late, pct }
  }, [attendance])

  // ── Weekly attendance (last 7 days) ───────────────────────────
  const weeklyAtt = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const dateStr = d.toISOString().split("T")[0]
      const label   = d.toLocaleDateString("en-IN", { weekday: "short" })
      const rec     = attendance.find(a => a.date === dateStr)
      return {
        label,
        value: rec ? (rec.status === "present" ? 1 : rec.status === "late" ? 0.5 : 0) : null,
        status: rec?.status ?? null,
      }
    })
  }, [attendance])

  // ── Attendance pie ────────────────────────────────────────────
  const attPie = useMemo(() => [
    { name: "Present", value: attStats.present, color: ATT_COLORS.present },
    { name: "Late",    value: attStats.late,    color: ATT_COLORS.late    },
    { name: "Absent",  value: attStats.absent,  color: ATT_COLORS.absent  },
  ].filter(d => d.value > 0), [attStats])

  // ── Results average ───────────────────────────────────────────
  const avgScore = useMemo(() => {
    if (!results.length) return null
    return Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
  }, [results])

  // ── Upcoming assignments (due in future) ─────────────────────
  const upcomingAsgn = useMemo(() => {
    const now = new Date()
    return assignments
      .filter(a => new Date(a.due_date) >= now)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 4)
  }, [assignments])

  // ── Fee status config ─────────────────────────────────────────
  const feeConf = {
    paid:    { label: "Paid",     color: "#16A34A", bg: "bg-emerald-50", border: "border-emerald-100", icon: CheckCircle2 },
    pending: { label: "Pending",  color: "#D97706", bg: "bg-amber-50",   border: "border-amber-100",   icon: Clock        },
    overdue: { label: "Overdue",  color: "#DC2626", bg: "bg-red-50",     border: "border-red-100",     icon: AlertCircle  },
    none:    { label: "No Record",color: "#94A3B8", bg: "bg-gray-50",    border: "border-gray-100",    icon: AlertCircle  },
  }
  const fs = feeConf[(fee?.status as keyof typeof feeConf) ?? "none"]

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="student"
      userName={me?.name ?? "Student"}
      pageTitle="Dashboard"
      pageSubtitle={`Welcome back${me ? `, ${me.name.split(" ")[0]}` : ""}! Here's your overview.`}
      loading={loading}
    >
      <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full min-w-0">
        <LiquidGlassBackground />

        {/* ── Error ─────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />{error}
            <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}

        {/* ── KPI cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label:   "Attendance",
              value:   loading ? null : `${attStats.pct}%`,
              sub:     loading ? null : `${attStats.present}/${attStats.total} sessions`,
              icon:    ClipboardCheck,
              color:   attStats.pct >= 75 ? "text-emerald-600" : "text-red-600",
              bg:      attStats.pct >= 75 ? "bg-emerald-50"    : "bg-red-50",
              border:  attStats.pct >= 75 ? "border-emerald-100" : "border-red-100",
              href:    "/dashboard/student/attendance",
              warn:    attStats.pct < 75 && !loading,
            },
            {
              label:  "Assignments",
              value:  loading ? null : assignments.length,
              sub:    loading ? null : `${upcomingAsgn.length} upcoming`,
              icon:   FileText,
              color:  "text-blue-600",
              bg:     "bg-blue-50",
              border: "border-blue-100",
              href:   "/dashboard/student/assignments",
              warn:   false,
            },
            {
              label:  "Avg Score",
              value:  loading ? null : (avgScore !== null ? `${avgScore}%` : "—"),
              sub:    loading ? null : `${results.length} subjects`,
              icon:   Award,
              color:  "text-indigo-600",
              bg:     "bg-indigo-50",
              border: "border-indigo-100",
              href:   "/dashboard/student/results",
              warn:   false,
            },
            {
              label:  "Fee Status",
              value:  loading ? null : fs.label,
              sub:    loading ? null : fee ? `₹${Number(fee.amount).toLocaleString("en-IN")}` : "No record",
              icon:   CreditCard,
              color:  loading ? "text-gray-600" : `text-[${fs.color}]`,
              bg:     loading ? "bg-gray-50"    : fs.bg,
              border: loading ? "border-gray-100" : fs.border,
              href:   "/dashboard/student/fees",
              warn:   fee?.status === "overdue",
            },
          ].map(k => (
            <Link key={k.label} href={k.href} className="block group">
              <Card className="liquid-glass group-hover:shadow-md transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl ${k.bg} border ${k.border} flex items-center justify-center`}>
                      <k.icon className={`h-4 w-4 ${k.color}`} />
                    </div>
                    {k.warn && (
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-medium mb-1">{k.label}</p>
                  {loading
                    ? <><Skeleton className="h-6 w-16 mb-1" /><Skeleton className="h-3 w-20" /></>
                    : <>
                        <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
                      </>
                  }
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* ── Middle row ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Attendance donut + bar (spans 2) */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Donut */}
            <Card className="liquid-glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  Attendance Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {loading
                  ? <Skeleton className="h-[160px] w-full" />
                  : attStats.total === 0
                    ? <div className="h-[160px] flex items-center justify-center text-gray-400 text-xs">No records yet</div>
                    : (
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          <ResponsiveContainer width={120} height={120}>
                            <PieChart>
                              <Pie data={attPie} cx="50%" cy="50%"
                                innerRadius={35} outerRadius={52}
                                paddingAngle={3} dataKey="value"
                              >
                                {attPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          {/* Center label */}
                          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <p className={`text-lg font-black ${attStats.pct >= 75 ? "text-emerald-600" : "text-red-600"}`}>
                              {attStats.pct}%
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 flex-1">
                          {attPie.map(d => (
                            <div key={d.name} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                                <span className="text-gray-600">{d.name}</span>
                              </div>
                              <span className="font-black" style={{ color: d.color }}>{d.value}</span>
                            </div>
                          ))}
                          {attStats.pct < 75 && (
                            <div className="flex items-center gap-1.5 mt-1 p-1.5 rounded-lg bg-red-50 border border-red-100">
                              <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
                              <span className="text-[10px] text-red-600 font-semibold">Below 75% threshold</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                }
              </CardContent>
            </Card>

            {/* Weekly area chart */}
            <Card className="liquid-glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Last 7 Days
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {loading
                  ? <Skeleton className="h-[120px] w-full" />
                  : (
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={weeklyAtt} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gAtt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#16A34A" stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0,1]} hide />
                        <Tooltip
                          formatter={(v: any, _: any, p: any) => [
                            p.payload.status ? p.payload.status : "No record", "Status"
                          ]}
                          contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }}
                        />
                        <Area
                          type="monotone" dataKey="value"
                          stroke="#16A34A" strokeWidth={2}
                          fill="url(#gAtt)" connectNulls
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )
                }
              </CardContent>
            </Card>

          </div>

          {/* Fee card */}
          <Card className="liquid-glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-600" />
                Fee Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-4">
              {loading
                ? <Skeleton className="h-[140px] w-full" />
                : fee
                  ? (
                    <>
                      {/* Status badge */}
                      <div className={`flex items-center gap-3 p-3 rounded-xl border ${fs.bg} ${fs.border}`}>
                        <fs.icon className="h-5 w-5 shrink-0" style={{ color: fs.color }} />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Status</p>
                          <p className="text-sm font-black" style={{ color: fs.color }}>{fs.label}</p>
                        </div>
                      </div>

                      {/* Amount breakdown */}
                      {[
                        { label: "Total Fee",  value: fee.amount },
                        { label: "Paid",       value: (fee as any).paid   ?? 0 },
                        { label: "Due",        value: (fee as any).due    ?? 0 },
                      ].map(r => (
                        <div key={r.label} className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 font-medium">{r.label}</span>
                          <span className="font-black text-gray-800">
                            ₹{Number(r.value).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}

                      {/* Progress bar */}
                      {(fee as any).paid != null && (
                        <div className="space-y-1">
                          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, Math.round(((fee as any).paid / fee.amount) * 100))}%`,
                                background: "#16A34A",
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 text-right">
                            {Math.round(((fee as any).paid / fee.amount) * 100)}% paid
                          </p>
                        </div>
                      )}

                      <Link href="/dashboard/student/fees">
                        <button className="w-full mt-1 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5">
                          View Details <ChevronRight className="h-3 w-3" />
                        </button>
                      </Link>
                    </>
                  )
                  : (
                    <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
                      <CreditCard className="h-8 w-8 text-gray-200" />
                      <p className="text-xs">No fee record found</p>
                    </div>
                  )
              }
            </CardContent>
          </Card>
        </div>

        {/* ── Bottom row ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Upcoming assignments */}
          <Card className="liquid-glass">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Upcoming Assignments
                </CardTitle>
                <Link href="/dashboard/student/assignments"
                  className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-0.5">
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0 mt-2">
              {loading
                ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-8 w-8 shrink-0 rounded-xl" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )
                : upcomingAsgn.length === 0
                  ? (
                    <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
                      <FileText className="h-8 w-8 text-gray-200" />
                      <p className="text-xs">No upcoming assignments</p>
                    </div>
                  )
                  : (
                    <div className="divide-y divide-gray-50">
                      {upcomingAsgn.map(a => {
                        const due     = new Date(a.due_date)
                        const daysLeft = Math.ceil((due.getTime() - Date.now()) / 86400000)
                        const urgent   = daysLeft <= 2
                        return (
                          <div key={a.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              urgent ? "bg-red-50 border border-red-100" : "bg-blue-50 border border-blue-100"
                            }`}>
                              <FileText className={`h-3.5 w-3.5 ${urgent ? "text-red-500" : "text-blue-500"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{a.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{a.subject ?? "—"}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className={`text-xs font-bold ${urgent ? "text-red-600" : "text-gray-500"}`}>
                                {daysLeft === 0 ? "Due today!" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d left`}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {due.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
              }
            </CardContent>
          </Card>

          {/* Recent notices */}
          <Card className="liquid-glass">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-500" />
                  Recent Notices
                </CardTitle>
                <Link href="/dashboard/student/notices"
                  className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-0.5">
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0 mt-2">
              {loading
                ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-8 w-8 shrink-0 rounded-xl" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )
                : notices.length === 0
                  ? (
                    <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
                      <Bell className="h-8 w-8 text-gray-200" />
                      <p className="text-xs">No notices yet</p>
                    </div>
                  )
                  : (
                    <div className="divide-y divide-gray-50">
                      {notices.map(n => {
                        const prio      = ((n as any).priority ?? "medium") as string
                        const dotColor  = { low: "#94A3B8", medium: "#3B82F6", high: "#F59E0B", urgent: "#EF4444" }[prio] ?? "#3B82F6"
                        return (
                          <div key={n.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                              <div className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold text-gray-800 truncate">{n.title}</p>
                                {n.pinned && (
                                  <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-700 shrink-0">PIN</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
              }
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  )
}
