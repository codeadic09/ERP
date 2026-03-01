"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo } from "react"
import {
  BookOpen, Users, FileText, Bell,
  TrendingUp, Calendar, Clock, CheckCircle2,
  AlertCircle, ChevronRight, GraduationCap,
  Loader2, RefreshCw, AlertTriangle,
  BarChart2, Activity, Wallet
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { LiquidGlassBackground } from "@/components/liquid-glass-bg"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  getUsers, getDepartments,
  getNotices, getAttendance,
  getSubjectsByFacultyId,
  getStudentsEnrolledInSubject,
} from "@/lib/db"
import type { User, Department, Notice, Attendance, Subject } from "@/lib/types"

// ─── Helpers ─────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hrs   = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 60)  return `${mins}m ago`
  if (hrs   < 24)  return `${hrs}h ago`
  return `${days}d ago`
}

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// ════════════════════════════════════════════════════════════════
export default function FacultyDashboard() {
  const authUser = useAuth("faculty")
  if (!authUser) return null

  // ── Data ─────────────────────────────────────────────────────
  const [users,      setUsers]      = useState<User[]>([])
  const [depts,      setDepts]      = useState<Department[]>([])
  const [notices,    setNotices]    = useState<Notice[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [mySubjects, setMySubjects] = useState<Subject[]>([])
  const [enrolledStudents, setEnrolledStudents] = useState<User[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  // ── Simulated logged-in faculty ──────────────────────────────
  // In production, replace with actual session user
  const [me, setMe] = useState<User | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const myId = authUser.user?.id
      const [u, d, n, a, ms] = await Promise.all([
        getUsers(), getDepartments(), getNotices(), getAttendance(),
        myId ? getSubjectsByFacultyId(myId) : Promise.resolve([]),
      ])
      setUsers(u); setDepts(d); setNotices(n); setAttendance(a); setMySubjects(ms)

      // Fetch enrolled students for all faculty subjects (deduplicated)
      const studentMap = new Map<string, User>()
      await Promise.all(ms.map(async (sub) => {
        try {
          const students = await getStudentsEnrolledInSubject(sub.id)
          students.forEach(s => studentMap.set(s.id, s))
        } catch {}
      }))
      setEnrolledStudents(Array.from(studentMap.values()))

      // Use the authenticated user from useAuth
      setMe(authUser.user)
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (authUser.user) load() }, [authUser.user])

  // ── Derived ───────────────────────────────────────────────────
  const myDept = useMemo(
    () => depts.find(d => d.id === me?.dept_id) ?? null,
    [depts, me]
  )

  const myStudents = useMemo(
    () => enrolledStudents,
    [enrolledStudents]
  )

  const myNotices = useMemo(
    () => notices.filter(n => n.target === "Faculty" || n.target === "All")
                 .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                 .slice(0, 5),
    [notices]
  )

  // ── Attendance per day this week ──────────────────────────────
  const weekAttendance = useMemo(() => {
    const today  = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))

    return WEEK_DAYS.map((day, i) => {
      const target = new Date(monday)
      target.setDate(monday.getDate() + i)
      const dateStr = target.toISOString().split("T")[0]

      const dayRecs = attendance.filter(a => {
        const d = (a as any).date ?? (a as any).created_at?.split("T")[0]
        return d === dateStr && myStudents.map(s => s.id).includes(a.student_id)
      })

      const present = dayRecs.filter(a => a.status === "present").length
      const absent  = dayRecs.filter(a => a.status === "absent").length
      return { day, present, absent, total: myStudents.length }
    })
  }, [attendance, myStudents])

  // ── Attendance donut per student (top 6) ─────────────────────
  const studentAttStats = useMemo(() => {
    return myStudents.slice(0, 6).map(s => {
      const recs    = attendance.filter(a => a.student_id === s.id)
      const present = recs.filter(a => a.status === "present").length
      const pct     = recs.length ? Math.round((present / recs.length) * 100) : 0
      return { name: s.name.split(" ")[0], pct, total: recs.length }
    })
  }, [myStudents, attendance])

  // ── Monthly student enrollment in my dept ────────────────────
  const enrollmentTrend = useMemo(() => {
    const months: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
      months[key] = 0
    }
    myStudents.forEach(s => {
      const key = new Date(s.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
      if (key in months) months[key]++
    })
    return Object.entries(months).map(([month, count]) => ({ month, count }))
  }, [myStudents])

  // ── KPI cards ────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const todayStr   = new Date().toISOString().split("T")[0]
    const todayRecs  = attendance.filter(a => {
      const d = (a as any).date ?? (a as any).created_at?.split("T")[0]
      return d === todayStr && myStudents.map(s => s.id).includes(a.student_id)
    })
    const todayPresent = todayRecs.filter(a => a.status === "present").length
    const attRate      = myStudents.length
      ? Math.round((todayPresent / myStudents.length) * 100)
      : 0

    return [
      { label: "My Students",    value: myStudents.length, icon: GraduationCap, color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100"    },
      { label: "My Subjects",     value: mySubjects.length,  icon: BookOpen,      color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-100"  },
      { label: "Today Present",  value: todayPresent,       icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
      { label: "Attendance Rate",value: `${attRate}%`,      icon: TrendingUp,   color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-100"  },
      { label: "Notices",        value: myNotices.length,   icon: Bell,         color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100"   },
      { label: "Dept Faculty",   value: users.filter(u => u.role === "faculty" && u.dept_id === me?.dept_id).length,
                                        icon: Users,        color: "text-pink-600",    bg: "bg-pink-50",    border: "border-pink-100"    },
    ]
  }, [myStudents, mySubjects, myDept, attendance, myNotices, users, me])

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="faculty"
      userName={me?.name ?? "Faculty"}
      avatarUrl={me?.avatar_url}
      pageTitle="Faculty Dashboard"
      pageSubtitle={`Welcome back${me ? `, ${me.name.split(" ")[0]}` : ""} · ${myDept?.name ?? "Loading..."}`}
      loading={loading}
    >
      <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full min-w-0">
        <LiquidGlassBackground />

        {/* ── Error ─────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}

        {/* ── Welcome banner ────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 text-white liquid-glass-banner">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <h2 className="text-2xl font-black mb-1">
                Welcome, {me?.name?.split(" ")[0] ?? "Faculty"} 👋
              </h2>
              <p className="text-blue-100 text-sm">
                {myDept?.name ?? "—"} · {mySubjects.length} subject{mySubjects.length !== 1 ? "s" : ""} · {myStudents.length} enrolled student{myStudents.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={load}
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 h-9 gap-1.5 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* ── KPI cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            : kpis.map(k => (
                <Card key={k.label} className="liquid-glass">
                  <CardContent className="p-3">
                    <div className={`w-8 h-8 rounded-lg ${k.bg} border ${k.border} flex items-center justify-center mb-2`}>
                      <k.icon className={`h-3.5 w-3.5 ${k.color}`} />
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium leading-tight mb-0.5">{k.label}</p>
                    <p className={`text-lg font-black ${k.color} leading-tight`}>{k.value}</p>
                  </CardContent>
                </Card>
              ))
          }
        </div>

        {/* ── Row 1 — Weekly attendance + Student att bars ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Weekly attendance area chart */}
          <Card className="lg:col-span-2 liquid-glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Activity className="h-3.5 w-3.5 text-blue-600" />
                </div>
                This Week's Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {loading
                ? <Skeleton className="h-52" />
                : (
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={weekAttendance} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E2E8F0" }}
                      />
                      <Bar dataKey="present" name="Present" fill="#16A34A" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="absent"  name="Absent"  fill="#FCA5A5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </CardContent>
          </Card>

          {/* Per-student attendance % */}
          <Card className="liquid-glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                Student Attendance %
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {loading
                ? <Skeleton className="h-52" />
                : studentAttStats.length === 0
                  ? (
                    <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
                      No attendance data yet
                    </div>
                  )
                  : (
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart
                        data={studentAttStats}
                        layout="vertical"
                        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} width={48} />
                        <Tooltip
                          formatter={(v: number) => [`${v}%`, "Attendance"]}
                          contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }}
                        />
                        <Bar dataKey="pct" name="Attendance" radius={[0, 4, 4, 0]}>
                          {studentAttStats.map((e, i) => (
                            <Cell
                              key={i}
                              fill={e.pct >= 75 ? "#16A34A" : e.pct >= 50 ? "#D97706" : "#DC2626"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )
              }
            </CardContent>
          </Card>
        </div>

        {/* ── Row 2 — Enrollment trend + My students + Notices ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Area — Enrollment trend */}
          <Card className="liquid-glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                Dept Enrollment Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {loading
                ? <Skeleton className="h-52" />
                : (
                  <ResponsiveContainer width="100%" height={210}>
                    <AreaChart data={enrollmentTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }} />
                      <Area type="monotone" dataKey="count" name="Students" stroke="#6366F1" strokeWidth={2} fill="url(#enrollGrad)" dot={{ r: 3, fill: "#6366F1" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )
              }
            </CardContent>
          </Card>

          {/* My students list */}
          <Card className="liquid-glass">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  My Students
                </CardTitle>
                <span className="text-xs text-gray-400 font-medium">
                  {myStudents.length} total
                </span>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              {loading
                ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                : myStudents.length === 0
                  ? <p className="text-sm text-gray-400 text-center py-8">No students enrolled in your subjects</p>
                  : (
                    <div className="space-y-1 max-h-[210px] overflow-y-auto pr-1">
                      {myStudents.map(s => (
                        <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-[10px] font-black text-blue-700 shrink-0">
                            {s.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-800 truncate">{s.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{s.email}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                            s.status === "active"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {s.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
              }
            </CardContent>
          </Card>

          {/* Notices */}
          <Card className="liquid-glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <Bell className="h-3.5 w-3.5 text-amber-600" />
                </div>
                Recent Notices
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              {loading
                ? <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
                : myNotices.length === 0
                  ? <p className="text-sm text-gray-400 text-center py-8">No notices yet</p>
                  : (
                    <div className="space-y-2">
                      {myNotices.map(n => (
                        <div key={n.id} className={`p-3 rounded-xl border transition-colors ${
                          n.urgent
                            ? "bg-red-50 border-red-100"
                            : "bg-gray-50 border-gray-100"
                        }`}>
                          <div className="flex items-start gap-2">
                            {n.urgent
                              ? <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                              : <Bell        className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                            }
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{n.title}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
              }
            </CardContent>
          </Card>
        </div>

        {/* ── Row 3 — Quick actions ─────────────────────────── */}
        <Card className="liquid-glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                <BarChart2 className="h-3.5 w-3.5 text-gray-600" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Mark Attendance", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", href: "/dashboard/faculty/attendance" },
                { label: "My Students",     icon: GraduationCap,color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100",    href: "/dashboard/faculty/students"   },
                { label: "View Notices",    icon: Bell,         color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100",   href: "/dashboard/faculty/notices"    },
                { label: "My Profile",      icon: BookOpen,     color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-100",  href: "/dashboard/faculty/profile"    },
              ].map(a => (
                <a key={a.label} href={a.href}
                  className="group flex flex-col items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer">
                  <div className={`w-10 h-10 rounded-xl ${a.bg} border ${a.border} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <a.icon className={`h-5 w-5 ${a.color}`} />
                  </div>
                  <p className="text-xs font-semibold text-gray-700 text-center leading-tight">{a.label}</p>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  )
}
