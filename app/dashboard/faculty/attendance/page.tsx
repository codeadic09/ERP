"use client"

import { useAuth }                     from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo } from "react"
import {
  CheckCircle2, XCircle, Clock, Search,
  CalendarDays, Users, RefreshCw, AlertTriangle,
  Loader2, Save, Download, BarChart2, TrendingUp,
  AlertCircle, BookOpen, ArrowLeft, ChevronRight,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button }          from "@/components/ui/button"
import { Input }           from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  getUsers, getDepartments,
  getAttendance, upsertAttendance,
  getSubjectsByFacultyId,
  getStudentsEnrolledInSubject,
} from "@/lib/db"
import type { User, Department, Attendance, Subject } from "@/lib/types"

// ─── Types ────────────────────────────────────────────────────────
type AttStatus = "present" | "absent" | "late"

interface SessionRow {
  student:   User
  status:    AttStatus
  existing?: string
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

const statusConfig: Record<AttStatus, {
  label: string; color: string; bg: string; border: string; icon: any
}> = {
  present: { label: "Present", color: "#16A34A", bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.2)",  icon: CheckCircle2 },
  absent:  { label: "Absent",  color: "#DC2626", bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.2)",  icon: XCircle      },
  late:    { label: "Late",    color: "#D97706", bg: "rgba(217,119,6,0.08)",  border: "rgba(217,119,6,0.2)",  icon: Clock        },
}

// ════════════════════════════════════════════════════════════════
export default function FacultyAttendancePage() {
  const authUser = useAuth("faculty")
  if (!authUser) return null

  // ── Stable primitives — prevents infinite loop ───────────────
  const myId     = authUser.user?.id
  const myDeptId = authUser.user?.dept_id
  const myName   = authUser.user?.name ?? "User"

  // ── Data ─────────────────────────────────────────────────────
  const [allUsers,      setAllUsers]      = useState<User[]>([])
  const [depts,         setDepts]         = useState<Department[]>([])
  const [attendance,    setAttendance]    = useState<Attendance[]>([])
  const [mySubjects,    setMySubjects]    = useState<Subject[]>([])
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [savedMsg,      setSavedMsg]      = useState(false)

  // ── Subject + Date ────────────────────────────────────────────
  const [subjectId,   setSubjectId]   = useState("")
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  )

  // ── Enrolled students for selected subject ────────────────────
  const [enrolledStudents, setEnrolledStudents] = useState<User[]>([])
  const [loadingStudents,  setLoadingStudents]  = useState(false)
  const [subjectEnrolledCounts, setSubjectEnrolledCounts] = useState<Record<string, number>>({})

  // ── Search / filter ───────────────────────────────────────────
  const [search,       setSearch]       = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | AttStatus>("all")

  // ── Session rows ──────────────────────────────────────────────
  const [rows, setRows] = useState<SessionRow[]>([])

  // ── Load ─────────────────────────────────────────────────────
  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [u, d, a, ms] = await Promise.all([
        getUsers(), getDepartments(), getAttendance(),
        myId ? getSubjectsByFacultyId(myId) : Promise.resolve([]),
      ])
      setAllUsers(u)
      setDepts(d)
      setAttendance(a)
      setMySubjects(ms)
      // Pre-fetch enrolled counts for all subjects
      const counts: Record<string, number> = {}
      await Promise.all(ms.map(async (s) => {
        try {
          const stu = await getStudentsEnrolledInSubject(s.id)
          counts[s.id] = stu.length
        } catch { counts[s.id] = 0 }
      }))
      setSubjectEnrolledCounts(counts)
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (authUser.user) load() }, [authUser.user])

  // ── My dept students (fallback) or enrolled students ─────────
  const myStudents = useMemo(
    () => subjectId ? enrolledStudents : [],
    [subjectId, enrolledStudents]
  )

  // ── Load enrolled students when subject changes ───────────────
  const selectedSubjectObj = useMemo(
    () => mySubjects.find(s => s.id === subjectId),
    [mySubjects, subjectId]
  )

  useEffect(() => {
    if (!subjectId) { setEnrolledStudents([]); return }
    let cancelled = false
    setLoadingStudents(true)
    getStudentsEnrolledInSubject(subjectId).then(students => {
      if (!cancelled) {
        setEnrolledStudents(students)
        setLoadingStudents(false)
      }
    }).catch(() => {
      if (!cancelled) setLoadingStudents(false)
    })
    return () => { cancelled = true }
  }, [subjectId])

  // ── Build rows ────────────────────────────────────────────────
  useEffect(() => {
    if (!myStudents.length) {
      setRows([])
      return
    }
    const built: SessionRow[] = myStudents.map(s => {
      const rec = attendance.find(
        a => a.student_id === s.id && a.date === selectedDate
      )
      return {
        student:  s,
        status:   (rec?.status as AttStatus) ?? "present",
        existing: rec?.id,
      }
    })
    setRows(built)
  }, [myStudents, selectedDate, attendance])

  // ── Stats ─────────────────────────────────────────────────────
  const sessionStats = useMemo(() => ({
    present: rows.filter(r => r.status === "present").length,
    absent:  rows.filter(r => r.status === "absent").length,
    late:    rows.filter(r => r.status === "late").length,
    total:   rows.length,
    rate:    rows.length
      ? Math.round(
          (rows.filter(r => r.status === "present").length / rows.length) * 100
        )
      : 0,
  }), [rows])

  // ── Weekly data ───────────────────────────────────────────────
  const weeklyData = useMemo(() => {
    const studentIds = new Set(myStudents.map(s => s.id))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const dateStr = d.toISOString().split("T")[0]
      const label   = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })
      const dayRecs = attendance.filter(a =>
        a.date === dateStr && studentIds.has(a.student_id)
      )
      return {
        label,
        present: dayRecs.filter(a => a.status === "present").length,
        absent:  dayRecs.filter(a => a.status === "absent").length,
        late:    dayRecs.filter(a => a.status === "late").length,
      }
    })
  }, [attendance, myStudents])

  // ── Student overall % ─────────────────────────────────────────
  const studentOverall = useMemo(() => {
    return myStudents.map(s => {
      const recs    = attendance.filter(a => a.student_id === s.id)
      const present = recs.filter(a => a.status === "present").length
      const pct     = recs.length ? Math.round((present / recs.length) * 100) : 0
      return { name: s.name.split(" ")[0], pct }
    })
  }, [myStudents, attendance])

  // ── Per-subject overview (for subject selection screen) ───────
  const subjectOverviewData = useMemo(() => {
    return mySubjects.map(sub => {
      const subAtt = attendance.filter(a => a.subject === sub.name)
      const total = subAtt.length
      const present = subAtt.filter(a => a.status === "present").length
      const absent = subAtt.filter(a => a.status === "absent").length
      const late = subAtt.filter(a => a.status === "late").length
      const rate = total > 0 ? Math.round((present / total) * 100) : 0
      const enrolled = subjectEnrolledCounts[sub.id] ?? 0

      const today = new Date()
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      const recent = subAtt.filter(a => new Date(a.date) >= weekAgo)
      const recentRate = recent.length > 0
        ? Math.round((recent.filter(a => a.status === "present").length / recent.length) * 100)
        : null

      return { subject: sub, enrolled, total, present, absent, late, rate, recentRate }
    })
  }, [mySubjects, attendance, subjectEnrolledCounts])

  // ── Filtered rows ─────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (search && !r.student.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus !== "all" && r.status !== filterStatus) return false
      return true
    })
  }, [rows, search, filterStatus])

  // ── Row actions ───────────────────────────────────────────────
  function setStatus(studentId: string, status: AttStatus) {
    setRows(prev => prev.map(r =>
      r.student.id === studentId ? { ...r, status } : r
    ))
  }

  function markAll(status: AttStatus) {
    setRows(prev => prev.map(r => ({ ...r, status })))
  }

  // ── Save ─────────────────────────────────────────────────────
  async function handleSave() {
    if (!selectedSubjectObj) {
      setError("Please select a subject before saving attendance.")
      return
    }
    setSaving(true)
    try {
      const subjectName = selectedSubjectObj.name
      const records = rows.map(r => ({
        student_id: r.student.id,
        faculty_id: myId ?? null,
        subject:    subjectName,
        date:       selectedDate,
        status:     r.status,
      }))
      const saved = await upsertAttendance(records)
      setAttendance(prev => {
        const updated = [...prev]
        saved.forEach((rec: Attendance) => {
          const idx = updated.findIndex(
            a => a.student_id === rec.student_id && a.date === rec.date
          )
          if (idx >= 0) updated[idx] = rec
          else updated.push(rec)
        })
        return updated
      })
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 2500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Export CSV ────────────────────────────────────────────────
  function exportCSV() {
    const filteredAtt = subjectId && selectedSubjectObj
      ? attendance.filter(a => a.subject === selectedSubjectObj.name && myStudents.some(s => s.id === a.student_id))
      : attendance.filter(a => myStudents.some(s => s.id === a.student_id))
    const csvRows = [
      ["Date", "Student", "Email", "Department", "Subject", "Status"],
      ...filteredAtt
        .map(a => {
          const s = myStudents.find(s => s.id === a.student_id)
          return [
            a.date,
            s?.name  ?? "—",
            s?.email ?? "—",
            depts.find(d => d.id === s?.dept_id)?.name ?? "—",
            a.subject ?? "—",
            a.status,
          ]
        }),
    ]
    const csv  = csvRows.map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const el   = document.createElement("a")
    el.href = url
    el.download = `attendance-${selectedDate}.csv`
    el.click()
    URL.revokeObjectURL(url)
  }

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="faculty"
      userName={myName}
      avatarUrl={authUser.user?.avatar_url}
      pageTitle="Attendance"
      pageSubtitle="Mark and track student attendance"
      loading={loading}
    >
      <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full min-w-0">

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}

        {/* Saved toast */}
        {savedMsg && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Attendance saved for {selectedDate}
          </div>
        )}

        {/* ── Subject overview (no subject selected) ──────── */}
        {!subjectId && !loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">My Subjects</h2>
                <p className="text-xs text-gray-500">Select a subject to mark attendance</p>
              </div>
            </div>

            {mySubjects.length === 0 ? (
              <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-500">No subjects assigned</p>
                  <p className="text-xs text-gray-400 mt-1">Contact admin to get subjects assigned to you</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjectOverviewData.map(({ subject, enrolled, total, present, absent, late, rate, recentRate }) => (
                  <Card
                    key={subject.id}
                    className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 backdrop-blur-xl bg-white/70 border-white/50 group"
                    onClick={() => setSubjectId(subject.id)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors truncate">
                            {subject.name}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{subject.code} · Sem {subject.semester}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors mt-0.5 shrink-0" />
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center">
                          <Users className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-xs text-gray-600 font-medium">
                          {enrolled} student{enrolled !== 1 ? "s" : ""} enrolled
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Attendance ring */}
                        <div className="relative w-14 h-14 shrink-0">
                          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="#F1F5F9" strokeWidth="2.5" />
                            <circle cx="18" cy="18" r="15" fill="none"
                              stroke={total === 0 ? "#E2E8F0" : rate >= 75 ? "#16A34A" : rate >= 50 ? "#D97706" : "#DC2626"}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeDasharray={`${rate * 0.9425} 94.25`}
                            />
                          </svg>
                          <span className={`absolute inset-0 flex items-center justify-center text-xs font-black ${
                            total === 0 ? "text-gray-400" : rate >= 75 ? "text-emerald-600" : rate >= 50 ? "text-amber-600" : "text-red-600"
                          }`}>
                            {total > 0 ? `${rate}%` : "\u2014"}
                          </span>
                        </div>

                        {/* Breakdown */}
                        <div className="flex-1 space-y-1.5">
                          {[
                            { label: "Present", value: present, color: "text-emerald-600", dot: "bg-emerald-500" },
                            { label: "Absent",  value: absent,  color: "text-red-600",     dot: "bg-red-500"     },
                            { label: "Late",    value: late,    color: "text-amber-600",   dot: "bg-amber-500"   },
                          ].map(s => (
                            <div key={s.label} className="flex items-center justify-between text-[11px]">
                              <span className="flex items-center gap-1.5 text-gray-500">
                                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                {s.label}
                              </span>
                              <span className={`font-bold ${s.color}`}>{s.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {recentRate !== null && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
                          <span className="text-gray-400">Last 7 days</span>
                          <span className={`font-bold ${recentRate >= 75 ? "text-emerald-600" : recentRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                            {recentRate}% attendance
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {subjectId && (<>
        {/* Back to subjects + subject info */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
            onClick={() => { setSubjectId(""); setEnrolledStudents([]); }}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Subjects
          </Button>
          {selectedSubjectObj && (
            <div className="border-l border-gray-200 pl-3">
              <p className="text-sm font-bold text-gray-800">{selectedSubjectObj.name}</p>
              <p className="text-[10px] text-gray-500">{selectedSubjectObj.code} · Sem {selectedSubjectObj.semester}</p>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total",   value: sessionStats.total,      icon: Users,        color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100"    },
            { label: "Present", value: sessionStats.present,    icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
            { label: "Absent",  value: sessionStats.absent,     icon: XCircle,      color: "text-red-600",     bg: "bg-red-50",     border: "border-red-100"     },
            { label: "Late",    value: sessionStats.late,       icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100"   },
            { label: "Rate",    value: `${sessionStats.rate}%`, icon: TrendingUp,   color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-100"  },
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

        {/* Charts */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <BarChart2 className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  Last 7 Days
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }} />
                    <Bar dataKey="present" name="Present" stackId="a" fill="#16A34A" />
                    <Bar dataKey="late"    name="Late"    stackId="a" fill="#D97706" />
                    <Bar dataKey="absent"  name="Absent"  stackId="a" fill="#DC2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  Overall Attendance %
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {studentOverall.length === 0
                  ? (
                    <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">
                      No attendance data yet
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={studentOverall} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} width={52} />
                        <Tooltip formatter={(v: number) => [`${v}%`, "Attendance"]} contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }} />
                        <Bar dataKey="pct" name="Attendance" radius={[0, 4, 4, 0]}>
                          {studentOverall.map((e, i) => (
                            <Cell key={i} fill={e.pct >= 75 ? "#16A34A" : e.pct >= 50 ? "#D97706" : "#DC2626"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )
                }
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mark attendance */}
        <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
          <CardHeader className="pb-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">

                {/* Date */}
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="pl-9 h-8 text-xs w-40"
                  />
                </div>

                {/* Search */}
                <div className="relative min-w-[160px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Search student..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-8 text-xs"
                  />
                </div>

                {/* Filter */}
                <Select
                  value={filterStatus}
                  onValueChange={(v) => setFilterStatus(v as "all" | AttStatus)}
                >
                  <SelectTrigger className="h-8 text-xs w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm"
                    className="h-8 text-xs gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => markAll("present")}>
                    <CheckCircle2 className="h-3 w-3" /> All Present
                  </Button>
                  <Button variant="outline" size="sm"
                    className="h-8 text-xs gap-1 text-red-700 border-red-200 hover:bg-red-50"
                    onClick={() => markAll("absent")}>
                    <XCircle className="h-3 w-3" /> All Absent
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
                  onClick={exportCSV} disabled={loading}>
                  <Download className="h-3.5 w-3.5" /> Export
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={load}>
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </Button>
                <Button size="sm" onClick={handleSave}
                  disabled={saving || loading || rows.length === 0 || !subjectId}
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-semibold">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Attendance
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {!loading && sessionStats.rate < 75 && sessionStats.total > 0 && (
              <div className="mx-6 mb-4 flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Attendance rate is below 75% for {selectedDate}. Please review.
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-xs font-bold text-gray-600 pl-6">#</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Student</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Overall %</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Status</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 pr-6">Quick Mark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <TableCell key={j} className={j === 0 ? "pl-6" : j === 4 ? "pr-6" : ""}>
                              <Skeleton className="h-5 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : filteredRows.length === 0
                      ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                            {!subjectId
                              ? "Select a subject to see enrolled students"
                              : loadingStudents
                                ? "Loading enrolled students..."
                                : myStudents.length === 0
                                  ? "No students enrolled in this subject"
                                  : "No students match your search"
                            }
                          </TableCell>
                        </TableRow>
                      )
                      : filteredRows.map((row, idx) => {
                          const sc   = statusConfig[row.status]
                          const recs = attendance.filter(a => a.student_id === row.student.id)
                          const pct  = recs.length
                            ? Math.round((recs.filter(a => a.status === "present").length / recs.length) * 100)
                            : null

                          return (
                            <TableRow key={row.student.id} className="hover:bg-gray-50/60 transition-colors">
                              <TableCell className="pl-6 text-xs text-gray-400 font-medium w-10">{idx + 1}</TableCell>

                              <TableCell className="py-2.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-[10px] font-black text-blue-700 shrink-0">
                                    {row.student.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{row.student.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{row.student.email}</p>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                {pct === null
                                  ? <span className="text-xs text-gray-400">No data</span>
                                  : (
                                    <div className="flex items-center gap-2">
                                      <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                        <div className="h-full rounded-full transition-all"
                                          style={{ width: `${pct}%`, background: pct >= 75 ? "#16A34A" : pct >= 50 ? "#D97706" : "#DC2626" }}
                                        />
                                      </div>
                                      <span className={`text-xs font-black ${pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600"}`}>
                                        {pct}%
                                      </span>
                                    </div>
                                  )
                                }
                              </TableCell>

                              <TableCell>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                                  style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                  <sc.icon className="h-3 w-3" />
                                  {sc.label}
                                </div>
                              </TableCell>

                              <TableCell className="pr-6">
                                <div className="flex items-center gap-1">
                                  {(["present", "absent", "late"] as AttStatus[]).map(s => {
                                    const c      = statusConfig[s]
                                    const active = row.status === s
                                    return (
                                      <button key={s}
                                        onClick={() => setStatus(row.student.id, s)}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all border"
                                        style={{
                                          background:  active ? c.bg     : "transparent",
                                          borderColor: active ? c.border : "#E5E7EB",
                                          color:       active ? c.color  : "#9CA3AF",
                                        }}
                                        title={c.label}
                                      >
                                        <c.icon className="h-3.5 w-3.5" />
                                      </button>
                                    )
                                  })}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                  }
                </TableBody>
              </Table>
            </div>

            {!loading && rows.length > 0 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-4 text-xs">
                  {[
                    { label: "Present", value: sessionStats.present, color: "text-emerald-600" },
                    { label: "Absent",  value: sessionStats.absent,  color: "text-red-600"     },
                    { label: "Late",    value: sessionStats.late,    color: "text-amber-600"   },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <span className="text-gray-500">{s.label}:</span>
                      <span className={`font-black ${s.color}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
                <Button size="sm" onClick={handleSave} disabled={saving || loading}
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-semibold">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </>)}

      </div>
    </DashboardLayout>
  )
}
