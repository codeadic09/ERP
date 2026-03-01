"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo } from "react"
import {
  ClipboardCheck, CheckCircle2, XCircle, Clock,
  TrendingUp, AlertCircle, Calendar, ChevronLeft,
  ChevronRight, AlertTriangle, RefreshCw,
  Activity, BarChart2, Filter, BookOpen, User as UserIcon,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie,
} from "recharts"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button }   from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  getAttendanceByStudent,
  getStudentSubjectsWithFaculty,
} from "@/lib/db"
import type { User, Attendance, Subject } from "@/lib/types"

// ─── Helpers ─────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

type AttStatus = "present" | "absent" | "late"

const statusConfig: Record<AttStatus, {
  label: string; color: string; bg: string; border: string; icon: any
}> = {
  present: { label: "Present", color: "#16A34A", bg: "rgba(22,163,74,0.08)",   border: "rgba(22,163,74,0.2)",   icon: CheckCircle2 },
  absent:  { label: "Absent",  color: "#DC2626", bg: "rgba(220,38,38,0.08)",   border: "rgba(220,38,38,0.2)",   icon: XCircle      },
  late:    { label: "Late",    color: "#D97706", bg: "rgba(217,119,6,0.08)",   border: "rgba(217,119,6,0.2)",   icon: Clock        },
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
]

// Build a full calendar grid for a given year/month
function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()   // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const grid: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) grid.push(null)
  for (let d = 1; d <= daysInMonth; d++) grid.push(d)
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

type SubjectInfo = Subject & { faculty: User[] }
type SubjectStats = {
  subject: SubjectInfo
  total: number; present: number; absent: number; late: number; pct: number
}

// ════════════════════════════════════════════════════════════════
export default function StudentAttendancePage() {
  const authUser = useAuth("student")
  if (!authUser) return null

  // ── Data ──────────────────────────────────────────────────────
  const [me,         setMe]         = useState<User | null>(null)
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [subjects,   setSubjects]   = useState<SubjectInfo[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  // ── Calendar nav ──────────────────────────────────────────────
  const today = new Date()
  const [calYear,  setCalYear]  = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  // ── Subject filter ────────────────────────────────────────────
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [filterStatus,    setFilterStatus]    = useState<"all" | AttStatus>("all")

  // ── Load ──────────────────────────────────────────────────────
  async function load() {
    setLoading(true); setError(null)
    try {
      const student = authUser.user
      setMe(student)
      if (student) {
        const [att, subs] = await Promise.all([
          getAttendanceByStudent(student.id),
          getStudentSubjectsWithFaculty(student.id),
        ])
        setAttendance(att)
        setSubjects(subs)
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (authUser.user) load() }, [authUser.user])

  // ── Overall stats ─────────────────────────────────────────────
  const stats = useMemo(() => {
    const total   = attendance.length
    const present = attendance.filter(a => a.status === "present").length
    const absent  = attendance.filter(a => a.status === "absent").length
    const late    = attendance.filter(a => a.status === "late").length
    const pct     = total ? Math.round((present / total) * 100) : 0
    const needed  = pct < 75 && total > 0
      ? Math.ceil((0.75 * total - present) / 0.25)
      : 0
    return { total, present, absent, late, pct, needed }
  }, [attendance])

  // ── Subject-wise stats ────────────────────────────────────────
  const subjectStats: SubjectStats[] = useMemo(() => {
    return subjects.map(subj => {
      const recs    = attendance.filter(a => a.subject === subj.name)
      const present = recs.filter(a => a.status === "present").length
      const absent  = recs.filter(a => a.status === "absent").length
      const late    = recs.filter(a => a.status === "late").length
      const total   = recs.length
      const pct     = total ? Math.round((present / total) * 100) : 0
      return { subject: subj, total, present, absent, late, pct }
    })
  }, [subjects, attendance])

  // ── Displayed stats (overall or filtered by subject) ──────────
  const displayStats = useMemo(() => {
    const recs    = selectedSubject === "all" ? attendance : attendance.filter(a => a.subject === selectedSubject)
    const total   = recs.length
    const present = recs.filter(a => a.status === "present").length
    const absent  = recs.filter(a => a.status === "absent").length
    const late    = recs.filter(a => a.status === "late").length
    const pct     = total ? Math.round((present / total) * 100) : 0
    return { total, present, absent, late, pct }
  }, [attendance, selectedSubject])

  // ── Monthly breakdown (filtered by subject) ───────────────────
  const monthlyData = useMemo(() => {
    const recs = selectedSubject === "all" ? attendance : attendance.filter(a => a.subject === selectedSubject)
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - i))
      const y = d.getFullYear()
      const m = d.getMonth()
      const label = d.toLocaleDateString("en-IN", { month: "short" })
      const mRecs = recs.filter(a => {
        const ad = new Date(a.date)
        return ad.getFullYear() === y && ad.getMonth() === m
      })
      return {
        label,
        present: mRecs.filter(a => a.status === "present").length,
        absent:  mRecs.filter(a => a.status === "absent").length,
        late:    mRecs.filter(a => a.status === "late").length,
        pct:     mRecs.length ? Math.round((mRecs.filter(a => a.status === "present").length / mRecs.length) * 100) : 0,
      }
    })
  }, [attendance, selectedSubject])

  // ── Pie data ──────────────────────────────────────────────────
  const pieData = useMemo(() => [
    { name: "Present", value: displayStats.present, color: "#16A34A" },
    { name: "Late",    value: displayStats.late,    color: "#D97706" },
    { name: "Absent",  value: displayStats.absent,  color: "#DC2626" },
  ].filter(d => d.value > 0), [displayStats])

  // ── Calendar date map (filtered by subject) ───────────────────
  const dateMap = useMemo(() => {
    const recs = selectedSubject === "all" ? attendance : attendance.filter(a => a.subject === selectedSubject)
    const m: Record<string, AttStatus> = {}
    recs.forEach(a => { m[a.date] = a.status as AttStatus })
    return m
  }, [attendance, selectedSubject])

  // ── Calendar grid ─────────────────────────────────────────────
  const calGrid   = useMemo(() => buildCalendar(calYear, calMonth), [calYear, calMonth])
  const monthRecs = useMemo(() => {
    const recs = selectedSubject === "all" ? attendance : attendance.filter(a => a.subject === selectedSubject)
    return recs.filter(a => {
      const d = new Date(a.date)
      return d.getFullYear() === calYear && d.getMonth() === calMonth
    })
  }, [attendance, selectedSubject, calYear, calMonth])

  // ── Month navigation ──────────────────────────────────────────
  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }
  const isCurrentMonth = calYear === today.getFullYear() && calMonth === today.getMonth()

  // ── Filtered records list ─────────────────────────────────────
  const filteredRecords = useMemo(() => {
    return [...attendance]
      .filter(a => {
        if (selectedSubject !== "all" && a.subject !== selectedSubject) return false
        if (filterStatus !== "all" && a.status !== filterStatus) return false
        return true
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [attendance, selectedSubject, filterStatus])

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="student"
      userName={me?.name ?? "Student"}
      avatarUrl={me?.avatar_url}
      pageTitle="My Attendance"
      pageSubtitle="Track your attendance across all subjects"
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

        {/* ── Low attendance warning ────────────────────────── */}
        {!loading && stats.pct < 75 && stats.total > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Your overall attendance is <strong>{stats.pct}%</strong> — below the 75% requirement.
            {stats.needed > 0 && <> You need <strong>{stats.needed}</strong> more consecutive present sessions to recover.</>}
          </div>
        )}

        {/* ── Stat cards ────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Overall",  value: `${stats.pct}%`,    icon: TrendingUp,   color: stats.pct >= 75 ? "text-emerald-600" : "text-red-600",    bg: stats.pct >= 75 ? "bg-emerald-50" : "bg-red-50",    border: stats.pct >= 75 ? "border-emerald-100" : "border-red-100"    },
            { label: "Total",    value: stats.total,         icon: Calendar,     color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100"    },
            { label: "Present",  value: stats.present,       icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
            { label: "Absent",   value: stats.absent,        icon: XCircle,      color: "text-red-600",     bg: "bg-red-50",     border: "border-red-100"     },
            { label: "Late",     value: stats.late,          icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100"   },
          ].map(s => (
            <Card key={s.label} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${s.bg} border ${s.border} flex items-center justify-center shrink-0`}>
                  <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium">{s.label}</p>
                  {loading
                    ? <Skeleton className="h-5 w-8 mt-0.5" />
                    : <p className={`text-lg font-black ${s.color} leading-tight`}>{s.value}</p>
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ═══ SUBJECT-WISE ATTENDANCE CARDS ═══════════════════ */}
        {!loading && subjectStats.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              Subject-wise Attendance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectStats.map(ss => {
                const isCritical = ss.total > 0 && ss.pct < 75
                return (
                  <Card
                    key={ss.subject.id}
                    className={`backdrop-blur-xl bg-white/70 shadow-sm transition-all hover:shadow-md cursor-pointer ${
                      selectedSubject === ss.subject.name
                        ? "ring-2 ring-blue-400 border-blue-200"
                        : "border-white/50"
                    }`}
                    onClick={() => setSelectedSubject(
                      selectedSubject === ss.subject.name ? "all" : ss.subject.name
                    )}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Subject header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{ss.subject.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{ss.subject.code} • Sem {ss.subject.semester}</p>
                        </div>
                        <div className={`text-lg font-black leading-none ${
                          ss.pct >= 75 ? "text-emerald-600" : ss.pct >= 50 ? "text-amber-600" : "text-red-600"
                        }`}>
                          {ss.total > 0 ? `${ss.pct}%` : "—"}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${ss.pct}%`,
                            background: ss.pct >= 75 ? "#16A34A" : ss.pct >= 50 ? "#D97706" : "#DC2626",
                          }}
                        />
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-emerald-600 font-bold">{ss.present}P</span>
                        <span className="text-red-600 font-bold">{ss.absent}A</span>
                        <span className="text-amber-600 font-bold">{ss.late}L</span>
                        <span className="text-gray-400 ml-auto">{ss.total} classes</span>
                      </div>

                      {/* Critical warning */}
                      {isCritical && (
                        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-50 border border-red-100">
                          <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
                          <span className="text-[10px] text-red-600 font-semibold">Below 75% — attend more classes!</span>
                        </div>
                      )}

                      {/* Faculty info */}
                      {ss.subject.faculty.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                          <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                            <UserIcon className="h-3 w-3 text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-gray-700 truncate">
                              {ss.subject.faculty.map(f => f.name).join(", ")}
                            </p>
                            <p className="text-[9px] text-gray-400">Faculty</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {!loading && subjectStats.length === 0 && attendance.length === 0 && (
          <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
            <CardContent className="py-12 flex flex-col items-center gap-3 text-gray-400">
              <BookOpen className="h-10 w-10 text-gray-200" />
              <p className="text-sm font-medium">No attendance records yet</p>
              <p className="text-xs">Once your teachers mark attendance, it will appear here.</p>
            </CardContent>
          </Card>
        )}

        {/* ── Subject filter pill ───────────────────────────── */}
        {selectedSubject !== "all" && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Showing:</span>
            <button
              onClick={() => setSelectedSubject("all")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              {selectedSubject}
              <XCircle className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* ── Charts row ────────────────────────────────────── */}
        {!loading && displayStats.total > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Monthly stacked bar */}
            <Card className="lg:col-span-2 backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-blue-600" />
                  Monthly Overview
                  {selectedSubject !== "all" && (
                    <span className="text-[10px] font-medium text-gray-400">({selectedSubject})</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }}
                      formatter={(v: number, name: string) => [v, name]}
                    />
                    <Bar dataKey="present" name="Present" stackId="a" fill="#16A34A" />
                    <Bar dataKey="late"    name="Late"    stackId="a" fill="#D97706" />
                    <Bar dataKey="absent"  name="Absent"  stackId="a" fill="#DC2626" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Donut */}
            <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  {selectedSubject === "all" ? "Overall Split" : selectedSubject}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 flex flex-col items-center">
                {pieData.length === 0
                  ? <div className="h-[160px] flex items-center justify-center text-gray-400 text-xs">No data</div>
                  : (
                    <>
                      <div className="relative">
                        <ResponsiveContainer width={140} height={140}>
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%"
                              innerRadius={42} outerRadius={62}
                              paddingAngle={3} dataKey="value"
                            >
                              {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                          <p className={`text-xl font-black ${displayStats.pct >= 75 ? "text-emerald-600" : "text-red-600"}`}>
                            {displayStats.pct}%
                          </p>
                          <p className="text-[9px] text-gray-400 font-semibold">PRESENT</p>
                        </div>
                      </div>
                      <div className="w-full space-y-2 mt-2">
                        {pieData.map(d => (
                          <div key={d.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                              <span className="text-gray-600 font-medium">{d.name}</span>
                            </div>
                            <span className="font-black" style={{ color: d.color }}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                }
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Calendar + Records row ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Attendance Calendar ───────────────────────── */}
          <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Attendance Calendar
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={prevMonth}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs font-bold text-gray-700 w-28 text-center">
                    {MONTHS[calMonth]} {calYear}
                  </span>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                    onClick={nextMonth} disabled={isCurrentMonth}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {loading
                ? <Skeleton className="h-[220px] w-full" />
                : (
                  <>
                    {/* Month stats strip */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {[
                        { label: "Present", count: monthRecs.filter(a => a.status === "present").length, color: "#16A34A" },
                        { label: "Absent",  count: monthRecs.filter(a => a.status === "absent").length,  color: "#DC2626" },
                        { label: "Late",    count: monthRecs.filter(a => a.status === "late").length,    color: "#D97706" },
                      ].map(s => (
                        <div key={s.label} className="flex items-center gap-1 text-xs">
                          <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                          <span className="text-gray-500">{s.label}:</span>
                          <span className="font-bold" style={{ color: s.color }}>{s.count}</span>
                        </div>
                      ))}
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-1">
                      {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
                      ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-0.5">
                      {calGrid.map((day, i) => {
                        if (!day) return <div key={`e-${i}`} />
                        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`
                        const status  = dateMap[dateStr] as AttStatus | undefined
                        const isToday = dateStr === today.toISOString().split("T")[0]
                        const sc      = status ? statusConfig[status] : null

                        return (
                          <div
                            key={dateStr}
                            className="aspect-square flex items-center justify-center rounded-lg text-xs font-semibold relative transition-all"
                            style={{
                              background: sc ? sc.bg  : isToday ? "rgba(37,99,235,0.06)" : "transparent",
                              border:     sc ? `1px solid ${sc.border}` : isToday ? "1px solid rgba(37,99,235,0.18)" : "1px solid transparent",
                              color:      sc ? sc.color : isToday ? "#2563EB" : "#374151",
                              fontWeight: isToday ? 800 : 600,
                            }}
                            title={status ?? ""}
                          >
                            {day}
                            {/* Dot indicator */}
                            {sc && (
                              <div
                                className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                style={{ background: sc.color }}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-3 mt-3 justify-center flex-wrap">
                      {Object.entries(statusConfig).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-1 text-[10px] text-gray-500">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: val.bg, border: `1px solid ${val.border}` }} />
                          {val.label}
                        </div>
                      ))}
                    </div>
                  </>
                )
              }
            </CardContent>
          </Card>

          {/* ── Records list ─────────────────────────────── */}
          <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-indigo-600" />
                  All Records
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
                    <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={load}>
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading
                ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-2/3" />
                          <Skeleton className="h-3 w-1/3" />
                        </div>
                        <Skeleton className="h-5 w-14 rounded-full" />
                      </div>
                    ))}
                  </div>
                )
                : filteredRecords.length === 0
                  ? (
                    <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
                      <ClipboardCheck className="h-8 w-8 text-gray-200" />
                      <p className="text-xs">No records found</p>
                    </div>
                  )
                  : (
                    <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-50">
                      {filteredRecords.map((rec, i) => {
                        const sc     = statusConfig[rec.status as AttStatus]
                        const date   = new Date(rec.date)
                        const Icon   = sc.icon
                        return (
                          <div key={rec.id ?? i}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors">
                            {/* Icon */}
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: sc.bg, border: `1px solid ${sc.border}` }}
                            >
                              <Icon className="h-3.5 w-3.5" style={{ color: sc.color }} />
                            </div>

                            {/* Date + subject */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800">
                                {date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                              </p>
                              {(rec as any).subject && (
                                <p className="text-xs text-gray-400 truncate">{(rec as any).subject}</p>
                              )}
                            </div>

                            {/* Status badge */}
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0"
                              style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                            >
                              {sc.label}
                            </span>
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
