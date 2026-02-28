"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo } from "react"
import {
  Search, GraduationCap, Users, CheckCircle2,
  XCircle, Clock, TrendingUp, AlertTriangle,
  RefreshCw, Eye, MoreVertical, Filter,
  ChevronLeft, ChevronRight, Mail, Phone,
  Calendar, BarChart2, Activity
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button }          from "@/components/ui/button"
import { Input }           from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getUsers, getDepartments, getAttendance, getFees,
} from "@/lib/db"
import type { User, Department, Attendance, Fee } from "@/lib/types"

// ─── Helpers ─────────────────────────────────────────────────────
const PAGE_SIZE = 10

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

function AttBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-gray-400">—</span>
  const color = pct >= 75 ? "text-emerald-600 bg-emerald-50 border-emerald-100"
              : pct >= 50 ? "text-amber-600 bg-amber-50 border-amber-100"
              :             "text-red-600 bg-red-50 border-red-100"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black border ${color}`}>
      {pct}%
    </span>
  )
}

// ════════════════════════════════════════════════════════════════
export default function FacultyStudentsPage() {
  const authUser = useAuth("faculty")
  if (!authUser) return null

  // ── Data ─────────────────────────────────────────────────────
  const [allUsers,   setAllUsers]   = useState<User[]>([])
  const [depts,      setDepts]      = useState<Department[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [fees,       setFees]       = useState<Fee[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  // ── Faculty session ───────────────────────────────────────────
  const [me, setMe] = useState<User | null>(null)

  // ── UI ───────────────────────────────────────────────────────
  const [search,       setSearch]       = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterAtt,    setFilterAtt]    = useState("all")
  const [page,         setPage]         = useState(1)

  // ── View dialog ───────────────────────────────────────────────
  const [viewOpen,  setViewOpen]  = useState(false)
  const [selected,  setSelected]  = useState<User | null>(null)

  // ── Load ─────────────────────────────────────────────────────
  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [u, d, a, f] = await Promise.all([
        getUsers(), getDepartments(), getAttendance(), getFees(),
      ])
      setAllUsers(u); setDepts(d); setAttendance(a); setFees(f)
      setMe(authUser.user)
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (authUser.user) load() }, [authUser.user])
  useEffect(() => { setPage(1) }, [search, filterStatus, filterAtt])

  // ── My dept students ──────────────────────────────────────────
  const myStudents = useMemo(
    () => allUsers.filter(u => u.role === "student" && u.dept_id === me?.dept_id),
    [allUsers, me]
  )

  // ── Per-student helpers ───────────────────────────────────────
  function attPct(studentId: string): number | null {
    const recs = attendance.filter(a => a.student_id === studentId)
    if (!recs.length) return null
    return Math.round((recs.filter(a => a.status === "present").length / recs.length) * 100)
  }

  function feeStatus(studentId: string): "paid" | "pending" | "overdue" | "none" {
    const rec = fees.find(f => f.student_id === studentId)
    return rec ? rec.status : "none"
  }

  // ── Stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active   = myStudents.filter(s => s.status === "active").length
    const atRisk   = myStudents.filter(s => {
      const p = attPct(s.id); return p !== null && p < 75
    }).length
    const avgAtt   = myStudents.length
      ? Math.round(
          myStudents.reduce((sum, s) => sum + (attPct(s.id) ?? 0), 0) / myStudents.length
        )
      : 0
    return { total: myStudents.length, active, atRisk, avgAtt }
  }, [myStudents, attendance])

  // ── Attendance distribution pie ───────────────────────────────
  const attDistribution = useMemo(() => {
    let good = 0, warn = 0, poor = 0, na = 0
    myStudents.forEach(s => {
      const p = attPct(s.id)
      if (p === null)  na++
      else if (p >= 75) good++
      else if (p >= 50) warn++
      else              poor++
    })
    return [
      { name: "≥75%",   value: good, color: "#16A34A" },
      { name: "50–74%", value: warn, color: "#D97706" },
      { name: "<50%",   value: poor, color: "#DC2626" },
      { name: "No data",value: na,   color: "#94A3B8" },
    ].filter(d => d.value > 0)
  }, [myStudents, attendance])

  // ── Fee breakdown bar ─────────────────────────────────────────
  const feeBreakdown = useMemo(() => [
    { label: "Paid",    value: myStudents.filter(s => feeStatus(s.id) === "paid").length,    color: "#16A34A" },
    { label: "Pending", value: myStudents.filter(s => feeStatus(s.id) === "pending").length, color: "#D97706" },
    { label: "Overdue", value: myStudents.filter(s => feeStatus(s.id) === "overdue").length, color: "#DC2626" },
    { label: "No Record",value:myStudents.filter(s => feeStatus(s.id) === "none").length,   color: "#94A3B8" },
  ].filter(d => d.value > 0), [myStudents, fees])

  // ── Filtered + paginated ──────────────────────────────────────
  const filtered = useMemo(() => {
    return myStudents.filter(s => {
      const q = search.toLowerCase()
      if (q && !s.name.toLowerCase().includes(q) &&
               !s.email.toLowerCase().includes(q)) return false
      if (filterStatus !== "all" && s.status !== filterStatus) return false
      if (filterAtt !== "all") {
        const p = attPct(s.id)
        if (filterAtt === "good" && (p === null || p < 75))  return false
        if (filterAtt === "warn" && (p === null || p < 50 || p >= 75)) return false
        if (filterAtt === "poor" && (p === null || p >= 50)) return false
        if (filterAtt === "na"   && p !== null)              return false
      }
      return true
    })
  }, [myStudents, search, filterStatus, filterAtt, attendance])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Selected student detail ───────────────────────────────────
  const selectedAtt = useMemo(() => {
    if (!selected) return []
    return attendance.filter(a => a.student_id === selected.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
  }, [selected, attendance])

  const selectedFee = useMemo(
    () => fees.find(f => f.student_id === selected?.id) ?? null,
    [selected, fees]
  )

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="faculty"
      userName={me?.name ?? "Faculty"}
      pageTitle="My Students"
      pageSubtitle={`${depts.find(d => d.id === me?.dept_id)?.name ?? "—"} department`}
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

        {/* ── Stat cards ────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Students", value: stats.total,          icon: GraduationCap, color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100"    },
            { label: "Active",         value: stats.active,         icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
            { label: "At Risk (<75%)", value: stats.atRisk,         icon: AlertTriangle, color: "text-red-600",     bg: "bg-red-50",     border: "border-red-100"     },
            { label: "Avg Attendance", value: `${stats.avgAtt}%`,   icon: TrendingUp,    color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-100"  },
          ].map(s => (
            <Card key={s.label} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-3`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
                {loading
                  ? <Skeleton className="h-6 w-16" />
                  : <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                }
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Charts row ────────────────────────────────────── */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Attendance distribution pie */}
            <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Activity className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  Attendance Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 flex items-center gap-6">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={attDistribution} cx="50%" cy="50%"
                      innerRadius={42} outerRadius={65}
                      paddingAngle={3} dataKey="value"
                    >
                      {attDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, n: string) => [`${v} students`, n]}
                      contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5 flex-1">
                  {attDistribution.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-gray-600 font-medium">{d.name}</span>
                      </div>
                      <span className="font-black" style={{ color: d.color }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Fee status bar */}
            <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <BarChart2 className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  Fee Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={feeBreakdown} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }} />
                    <Bar dataKey="value" name="Students" radius={[6, 6, 0, 0]}>
                      {feeBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Students table ────────────────────────────────── */}
        <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
          <CardHeader className="pb-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap gap-2 flex-1 min-w-0">

                {/* Search */}
                <div className="relative min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Search student..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-8 text-xs"
                  />
                </div>

                {/* Status filter */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                {/* Attendance filter */}
                <Select value={filterAtt} onValueChange={setFilterAtt}>
                  <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Attendance</SelectItem>
                    <SelectItem value="good">Good (≥75%)</SelectItem>
                    <SelectItem value="warn">Warning (50–74%)</SelectItem>
                    <SelectItem value="poor">Poor (&lt;50%)</SelectItem>
                    <SelectItem value="na">No Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" size="sm" onClick={load} className="h-8 w-8 p-0 shrink-0">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-xs font-bold text-gray-600 pl-6">Student</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Phone</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Enrolled</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Status</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Attendance</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Fee Status</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j} className={j === 0 ? "pl-6" : j === 6 ? "pr-6" : ""}>
                              <Skeleton className="h-5 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : paginated.length === 0
                      ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                            {myStudents.length === 0 ? "No students in your department" : "No students match your search"}
                          </TableCell>
                        </TableRow>
                      )
                      : paginated.map(s => {
                          const pct = attPct(s.id)
                          const fs  = feeStatus(s.id)
                          const feeStyle = {
                            paid:    { color: "#16A34A", bg: "rgba(22,163,74,0.08)",   label: "Paid"       },
                            pending: { color: "#D97706", bg: "rgba(217,119,6,0.08)",   label: "Pending"    },
                            overdue: { color: "#DC2626", bg: "rgba(220,38,38,0.08)",   label: "Overdue"    },
                            none:    { color: "#94A3B8", bg: "rgba(148,163,184,0.08)", label: "No Record"  },
                          }[fs]

                          return (
                            <TableRow key={s.id} className="hover:bg-gray-50/60 transition-colors">

                              {/* Student */}
                              <TableCell className="pl-6 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-[10px] font-black text-blue-700 shrink-0">
                                    {s.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{s.email}</p>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Phone */}
                              <TableCell className="text-sm text-gray-500">
                                {s.phone ?? "—"}
                              </TableCell>

                              {/* Enrolled */}
                              <TableCell className="text-sm text-gray-500">
                                {s.enrolled_at
                                  ? new Date(s.enrolled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                  : "—"
                                }
                              </TableCell>

                              {/* Status */}
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  s.status === "active"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : "bg-gray-100 text-gray-500 border-gray-200"
                                }`}>
                                  {s.status}
                                </span>
                              </TableCell>

                              {/* Attendance */}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {pct !== null && (
                                    <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                      <div className="h-full rounded-full"
                                        style={{
                                          width: `${pct}%`,
                                          background: pct >= 75 ? "#16A34A" : pct >= 50 ? "#D97706" : "#DC2626"
                                        }} />
                                    </div>
                                  )}
                                  <AttBadge pct={pct} />
                                </div>
                              </TableCell>

                              {/* Fee */}
                              <TableCell>
                                <span
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
                                  style={{ background: feeStyle.bg, color: feeStyle.color }}
                                >
                                  {feeStyle.label}
                                </span>
                              </TableCell>

                              {/* Actions */}
                              <TableCell className="pr-6 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-36 text-xs">
                                    <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => { setSelected(s); setViewOpen(true) }}>
                                      <Eye className="h-3.5 w-3.5 mr-2" /> View Profile
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>

                            </TableRow>
                          )
                        })
                  }
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!loading && filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
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
                          onClick={() => setPage(p)}>{p}</Button>
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
          </CardContent>
        </Card>
      </div>

      {/* ════ VIEW PROFILE DIALOG ════ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>
          {selected && (() => {
            const pct = attPct(selected.id)
            const fs  = feeStatus(selected.id)
            return (
              <div className="space-y-4 py-2">

                {/* Avatar + name */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shrink-0">
                    {selected.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <p className="font-black text-gray-800 text-base">{selected.name}</p>
                    <p className="text-xs text-gray-500">{selected.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {depts.find(d => d.id === selected.dept_id)?.name ?? "—"}
                    </p>
                  </div>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Phone",      value: selected.phone ?? "—",  icon: Phone    },
                    { label: "Status",     value: selected.status,         icon: CheckCircle2 },
                    { label: "Enrolled",   value: selected.enrolled_at
                        ? new Date(selected.enrolled_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                        : "—",                                              icon: Calendar },
                    { label: "Fee Status", value: fs === "none" ? "No Record" : fs, icon: BarChart2 },
                  ].map(row => (
                    <div key={row.label} className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                      <row.icon className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{row.label}</p>
                        <p className="text-xs font-bold text-gray-800 capitalize">{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Attendance summary */}
                <div className="p-3 rounded-xl bg-gray-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-700">Overall Attendance</p>
                    <AttBadge pct={pct} />
                  </div>
                  {pct !== null && (
                    <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 75 ? "#16A34A" : pct >= 50 ? "#D97706" : "#DC2626"
                        }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    Based on {attendance.filter(a => a.student_id === selected.id).length} recorded sessions
                  </p>
                </div>

                {/* Recent attendance */}
                {selectedAtt.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-gray-600">Recent Sessions</p>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {selectedAtt.map(a => {
                        const c = {
                          present: { color: "#16A34A", bg: "rgba(22,163,74,0.08)",  icon: CheckCircle2 },
                          absent:  { color: "#DC2626", bg: "rgba(220,38,38,0.08)",  icon: XCircle      },
                          late:    { color: "#D97706", bg: "rgba(217,119,6,0.08)",  icon: Clock        },
                        }[a.status as "present" | "absent" | "late"]
                        return (
                          <div key={a.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-gray-50">
                            <span className="text-gray-600 font-medium">
                              {new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold"
                              style={{ background: c.bg, color: c.color }}>
                              <c.icon className="h-3 w-3" />
                              {a.status}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}
