"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo } from "react"
import {
  BarChart2, TrendingUp, Users, Wallet,
  GraduationCap, BookOpen, Building2, Bell,
  Download, RefreshCw, AlertTriangle, Loader2,
  CreditCard, CheckCircle2, Clock, XCircle,
  CalendarDays, Activity
} from "lucide-react"
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button }          from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  getAdminStats, getFees, getUsers,
  getDepartments, getNotices,
} from "@/lib/db"
import type { Fee, User, Department, Notice } from "@/lib/types"

// ─── Helpers ─────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

const MONTHS_6 = Array.from({ length: 6 }, (_, i) => {
  const d = new Date()
  d.setMonth(d.getMonth() - (5 - i))
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
})

const MONTHS_12 = Array.from({ length: 12 }, (_, i) => {
  const d = new Date()
  d.setMonth(d.getMonth() - (11 - i))
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
})

// ════════════════════════════════════════════════════════════════
export default function ReportsPage() {
  const me = useAuth("admin")
  if (!me) return null

  // ── Data ─────────────────────────────────────────────────────
  const [fees,    setFees]    = useState<Fee[]>([])
  const [users,   setUsers]   = useState<User[]>([])
  const [depts,   setDepts]   = useState<Department[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  // ── Filter ───────────────────────────────────────────────────
  const [period, setPeriod] = useState<"6" | "12">("6")
  const months = period === "6" ? MONTHS_6 : MONTHS_12

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [f, u, d, n] = await Promise.all([
        getFees(), getUsers(), getDepartments(), getNotices(),
      ])
      setFees(f); setUsers(u); setDepts(d); setNotices(n)
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Derived ───────────────────────────────────────────────────
  const students = useMemo(() => users.filter(u => u.role === "student"), [users])
  const faculty  = useMemo(() => users.filter(u => u.role === "faculty"),  [users])

  // ── KPI cards ────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const collected = fees.filter(f => f.status === "paid")   .reduce((s, f) => s + Number(f.amount), 0)
    const pending   = fees.filter(f => f.status === "pending").reduce((s, f) => s + Number(f.amount), 0)
    const overdue   = fees.filter(f => f.status === "overdue").reduce((s, f) => s + Number(f.amount), 0)
    const collRate  = fees.length ? Math.round((fees.filter(f => f.status === "paid").length / fees.length) * 100) : 0
    return [
      { label: "Total Students",    value: students.length,      unit: "",  icon: GraduationCap, color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100"    },
      { label: "Total Faculty",     value: faculty.length,       unit: "",  icon: BookOpen,      color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-100"  },
      { label: "Fee Collected",     value: fmt(collected),       unit: "",  icon: Wallet,        color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
      { label: "Pending Amount",    value: fmt(pending),         unit: "",  icon: Clock,         color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100"   },
      { label: "Overdue Amount",    value: fmt(overdue),         unit: "",  icon: XCircle,       color: "text-red-600",     bg: "bg-red-50",     border: "border-red-100"     },
      { label: "Collection Rate",   value: `${collRate}%`,       unit: "",  icon: TrendingUp,    color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-100"  },
      { label: "Departments",       value: depts.length,         unit: "",  icon: Building2,     color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-100"  },
      { label: "Notices Published", value: notices.length,       unit: "",  icon: Bell,          color: "text-pink-600",    bg: "bg-pink-50",    border: "border-pink-100"    },
    ]
  }, [fees, students, faculty, depts, notices])

  // ── Monthly fee trend ─────────────────────────────────────────
  const feeMonthlyData = useMemo(() => {
    const map: Record<string, { collected: number; pending: number; overdue: number }> = {}
    months.forEach(m => { map[m] = { collected: 0, pending: 0, overdue: 0 } })
    fees.forEach(f => {
      const key = new Date(f.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
      if (!map[key]) return
      if (f.status === "paid")    map[key].collected += Number(f.amount)
      if (f.status === "pending") map[key].pending   += Number(f.amount)
      if (f.status === "overdue") map[key].overdue   += Number(f.amount)
    })
    return months.map(m => ({ month: m, ...map[m] }))
  }, [fees, months])

  // ── User enrollment monthly ───────────────────────────────────
  const enrollmentData = useMemo(() => {
    const map: Record<string, { students: number; faculty: number }> = {}
    months.forEach(m => { map[m] = { students: 0, faculty: 0 } })
    users.forEach(u => {
      if (u.role === "admin") return
      const key = new Date(u.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
      if (!map[key]) return
      if (u.role === "student") map[key].students++
      if (u.role === "faculty") map[key].faculty++
    })
    return months.map(m => ({ month: m, ...map[m] }))
  }, [users, months])

  // ── Dept breakdown ────────────────────────────────────────────
  const deptBreakdown = useMemo(() => {
    return depts.map((d, i) => {
      const deptStudents = students.filter(s => s.dept_id === d.id)
      const deptFaculty  = faculty .filter(f => f.dept_id === d.id)
      const deptStudentIds = deptStudents.map(s => s.id)
      const collected    = fees
        .filter(f => deptStudentIds.includes(f.student_id) && f.status === "paid")
        .reduce((sum, f) => sum + Number(f.amount), 0)
      return {
        name:      d.code,
        fullName:  d.name,
        students:  deptStudents.length,
        faculty:   deptFaculty.length,
        collected,
        color:     d.color ?? "#3B82F6",
      }
    })
  }, [depts, students, faculty, fees])

  // ── Fee status pie ────────────────────────────────────────────
  const feePieData = useMemo(() => [
    { name: "Paid",    value: fees.filter(f => f.status === "paid").length,    color: "#16A34A" },
    { name: "Pending", value: fees.filter(f => f.status === "pending").length, color: "#D97706" },
    { name: "Overdue", value: fees.filter(f => f.status === "overdue").length, color: "#DC2626" },
  ].filter(d => d.value > 0), [fees])

  // ── Dept radar data ───────────────────────────────────────────
  const radarData = useMemo(() => {
    return deptBreakdown.map(d => ({
      dept:     d.name,
      Students: d.students,
      Faculty:  d.faculty,
    }))
  }, [deptBreakdown])

  // ── Notices by target ─────────────────────────────────────────
  const noticeTargetData = useMemo(() => [
    { name: "All",      value: notices.filter(n => n.target === "All").length,      color: "#64748B" },
    { name: "Students", value: notices.filter(n => n.target === "Students").length, color: "#2563EB" },
    { name: "Faculty",  value: notices.filter(n => n.target === "Faculty").length,  color: "#9333EA" },
  ].filter(d => d.value > 0), [notices])

  // ── Export full report CSV ────────────────────────────────────
  function exportReport() {
    const lines = [
      ["=== UNICORE ERP — FULL REPORT ==="],
      [`Generated: ${new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}`],
      [""],
      ["--- USERS ---"],
      ["Name", "Email", "Role", "Department", "Status", "Enrolled"],
      ...users.filter(u => u.role !== "admin").map(u => [
        u.name, u.email, u.role,
        depts.find(d => d.id === u.dept_id)?.name ?? "—",
        u.status, u.enrolled_at ?? "—",
      ]),
      [""],
      ["--- FEES ---"],
      ["Student", "Department", "Amount", "Status", "Due Date", "Paid Date"],
      ...fees.map(f => {
        const usr = (f as any).users
        return [
          usr?.name ?? "—",
          usr?.departments?.name ?? "—",
          f.amount, f.status,
          f.due_date  ?? "—",
          f.paid_date ?? "—",
        ]
      }),
      [""],
      ["--- NOTICES ---"],
      ["Title", "Target", "Urgent", "Published"],
      ...notices.map(n => [
        n.title, n.target,
        n.urgent ? "Yes" : "No",
        new Date(n.created_at).toLocaleDateString("en-IN"),
      ]),
    ]
    const csv  = lines.map(r => Array.isArray(r) ? r.join(",") : r).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = `unicore-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="admin"
      userName="Admin"
      pageTitle="Reports"
      pageSubtitle="Analytics and insights across the university"
      loading={loading}
    >
      <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full min-w-0">

        {/* ── Error ─────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}

        {/* ── Toolbar ───────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500 font-medium">Period:</span>
            <Select value={period} onValueChange={v => setPeriod(v as any)}>
              <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} className="h-8 gap-1.5 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button size="sm" onClick={exportReport} disabled={loading}
              className="h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" /> Export Report
            </Button>
          </div>
        </div>

        {/* ── KPI grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            : kpis.map(k => (
                <Card key={k.label} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
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

        {/* ── Row 1 — Fee trend + Pie ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Area — Fee monthly */}
          <Card className="lg:col-span-2 backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                </div>
                Fee Collection Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {loading
                ? <Skeleton className="h-52" />
                : (
                  <ResponsiveContainer width="100%" height={210}>
                    <AreaChart data={feeMonthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        {[
                          { id: "gc", color: "#16A34A" },
                          { id: "gp", color: "#D97706" },
                          { id: "go", color: "#DC2626" },
                        ].map(g => (
                          <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={g.color} stopOpacity={0.15} />
                            <stop offset="95%" stopColor={g.color} stopOpacity={0}    />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}K`} />
                      <Tooltip
                        formatter={(v: number, n: string) => [`₹${v.toLocaleString("en-IN")}`, n]}
                        contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="collected" name="Collected" stroke="#16A34A" strokeWidth={2} fill="url(#gc)" dot={false} />
                      <Area type="monotone" dataKey="pending"   name="Pending"   stroke="#D97706" strokeWidth={2} fill="url(#gp)" dot={false} />
                      <Area type="monotone" dataKey="overdue"   name="Overdue"   stroke="#DC2626" strokeWidth={2} fill="url(#go)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )
              }
            </CardContent>
          </Card>

          {/* Pie — Fee status */}
          <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                Fee Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {loading
                ? <Skeleton className="h-52" />
                : (
                  <>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={feePieData} cx="50%" cy="50%"
                          innerRadius={42} outerRadius={65}
                          paddingAngle={3} dataKey="value"
                        >
                          {feePieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip
                          formatter={(v: number, n: string) => [`${v} records`, n]}
                          contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {feePieData.map(d => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                            <span className="text-gray-600 font-medium">{d.name}</span>
                          </div>
                          <span className="font-black" style={{ color: d.color }}>{d.value} records</span>
                        </div>
                      ))}
                    </div>
                  </>
                )
              }
            </CardContent>
          </Card>
        </div>

        {/* ── Row 2 — Enrollment + Dept bar ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Line — Enrollment trend */}
          <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                User Enrollment
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {loading
                ? <Skeleton className="h-52" />
                : (
                  <ResponsiveContainer width="100%" height={210}>
                    <LineChart data={enrollmentData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="students" name="Students" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="faculty"  name="Faculty"  stroke="#9333EA" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )
              }
            </CardContent>
          </Card>

          {/* Bar — Dept students vs faculty */}
          <Card className="lg:col-span-2 backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <Building2 className="h-3.5 w-3.5 text-amber-600" />
                </div>
                Department Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {loading
                ? <Skeleton className="h-52" />
                : (
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={deptBreakdown} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }}
                        labelFormatter={label => deptBreakdown.find(d => d.name === label)?.fullName ?? label}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="students" name="Students" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="faculty"  name="Faculty"  fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </CardContent>
          </Card>
        </div>

        {/* ── Row 3 — Dept fee bar + Radar + Notices pie ────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Bar — Dept fee collection */}
          <Card className="lg:col-span-2 backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                Department-wise Fee Collection
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {loading
                ? <Skeleton className="h-52" />
                : (
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={deptBreakdown} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                        tickFormatter={v => `₹${v/1000}K`} />
                      <Tooltip
                        formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Collected"]}
                        labelFormatter={label => deptBreakdown.find(d => d.name === label)?.fullName ?? label}
                        contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }}
                      />
                      <Bar dataKey="collected" name="Collected" radius={[6, 6, 0, 0]}>
                        {deptBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </CardContent>
          </Card>

          {/* Pie — Notices by target */}
          <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center">
                  <Bell className="h-3.5 w-3.5 text-pink-600" />
                </div>
                Notices by Audience
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {loading
                ? <Skeleton className="h-52" />
                : (
                  <>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={noticeTargetData} cx="50%" cy="50%"
                          innerRadius={42} outerRadius={65}
                          paddingAngle={3} dataKey="value"
                        >
                          {noticeTargetData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip
                          formatter={(v: number, n: string) => [`${v} notices`, n]}
                          contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {noticeTargetData.map(d => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
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

        {/* ── Row 4 — Radar ─────────────────────────────────── */}
        <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center">
                <Activity className="h-3.5 w-3.5 text-cyan-600" />
              </div>
              Department Strength Radar
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {loading
              ? <Skeleton className="h-72" />
              : (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="dept" tick={{ fontSize: 11, fill: "#64748B" }} />
                    <Radar name="Students" dataKey="Students" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} strokeWidth={2} />
                    <Radar name="Faculty"  dataKey="Faculty"  stroke="#9333EA" fill="#9333EA" fillOpacity={0.15} strokeWidth={2} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }} />
                  </RadarChart>
                </ResponsiveContainer>
              )
            }
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  )
}
