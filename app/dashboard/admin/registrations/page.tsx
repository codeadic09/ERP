"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo } from "react"
import {
  Search, ClipboardCheck, CheckCircle2, Clock, XCircle,
  Loader2, RefreshCw, AlertTriangle, MoreVertical,
  Eye, ChevronLeft, ChevronRight, Download,
  BookOpen, GraduationCap, Trash2, Check, X,
} from "lucide-react"
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"
import { DashboardLayout }  from "@/components/layout/dashboard-layout"
import { Button }           from "@/components/ui/button"
import { Input }            from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
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
  getRegistrations, updateRegistrationStatus,
  deleteRegistration, unenrollFromSubject, getDepartments,
} from "@/lib/db"
import type { Registration, Department } from "@/lib/types"

// ─── Constants ───────────────────────────────────────────────────
const PAGE_SIZE = 10

const statusStyle = {
  pending:  { label: "Pending",  bg: "rgba(217,119,6,0.08)",  color: "#D97706", icon: Clock        },
  approved: { label: "Approved", bg: "rgba(22,163,74,0.08)",  color: "#16A34A", icon: CheckCircle2 },
  rejected: { label: "Rejected", bg: "rgba(220,38,38,0.08)",  color: "#DC2626", icon: XCircle      },
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

// ════════════════════════════════════════════════════════════════
export default function RegistrationsPage() {
  const me = useAuth("admin")
  if (!me) return null

  // ── Data ─────────────────────────────────────────────────────
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [depts,         setDepts]         = useState<Department[]>([])
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  // ── UI ───────────────────────────────────────────────────────
  const [search,       setSearch]       = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDept,   setFilterDept]   = useState("all")
  const [page,         setPage]         = useState(1)

  // ── Dialogs ──────────────────────────────────────────────────
  const [viewOpen,     setViewOpen]     = useState(false)
  const [deleteOpen,   setDeleteOpen]   = useState(false)
  const [bulkOpen,     setBulkOpen]     = useState(false)
  const [bulkAction,   setBulkAction]   = useState<"approved" | "rejected">("approved")
  const [selected,     setSelected]     = useState<Registration | null>(null)
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set())

  // ── Load ─────────────────────────────────────────────────────
  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [r, d] = await Promise.all([
        getRegistrations(), getDepartments(),
      ])
      setRegistrations(r)
      setDepts(d)
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { setPage(1) }, [search, filterStatus, filterDept])

  // ── Stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total    = registrations.length
    const pending  = registrations.filter(r => r.status === "pending").length
    const approved = registrations.filter(r => r.status === "approved").length
    const rejected = registrations.filter(r => r.status === "rejected").length
    return { total, pending, approved, rejected }
  }, [registrations])

  // ── Pie data ──────────────────────────────────────────────────
  const pieData = useMemo(() => [
    { name: "Pending",  value: stats.pending,  color: "#D97706" },
    { name: "Approved", value: stats.approved, color: "#16A34A" },
    { name: "Rejected", value: stats.rejected, color: "#DC2626" },
  ].filter(d => d.value > 0), [stats])

  // ── Dept bar data ─────────────────────────────────────────────
  const deptChartData = useMemo(() => {
    return depts.map(d => {
      const pending  = registrations.filter(r => (r as any).users?.dept_id === d.id && r.status === "pending").length
      const approved = registrations.filter(r => (r as any).users?.dept_id === d.id && r.status === "approved").length
      return { dept: d.code, pending, approved, color: d.color ?? "#3B82F6" }
    }).filter(d => d.pending > 0 || d.approved > 0)
  }, [registrations, depts])

  // ── Filtered + paginated ──────────────────────────────────────
  const filtered = useMemo(() => {
    return registrations.filter(r => {
      const usr  = (r as any).users
      const sub  = (r as any).subjects
      const name = usr?.name?.toLowerCase() ?? ""
      const subName = sub?.name?.toLowerCase() ?? ""
      const subCode = sub?.code?.toLowerCase() ?? ""
      const q = search.toLowerCase()
      if (search && !name.includes(q) && !subName.includes(q) && !subCode.includes(q)) return false
      if (filterStatus !== "all" && r.status !== filterStatus)       return false
      if (filterDept   !== "all" && usr?.dept_id !== filterDept)     return false
      return true
    })
  }, [registrations, search, filterStatus, filterDept])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Pending filtered for bulk ─────────────────────────────────
  const pendingFiltered = useMemo(
    () => filtered.filter(r => r.status === "pending"),
    [filtered]
  )

  // ── Selection helpers ─────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    const pendingOnPage = paginated.filter(r => r.status === "pending")
    const allSelected = pendingOnPage.every(r => selectedIds.has(r.id))
    setSelectedIds(prev => {
      const next = new Set(prev)
      pendingOnPage.forEach(r => allSelected ? next.delete(r.id) : next.add(r.id))
      return next
    })
  }

  // ── Handlers ──────────────────────────────────────────────────
  function openView(r: Registration)   { setSelected(r); setViewOpen(true) }
  function openDelete(r: Registration) { setSelected(r); setDeleteOpen(true) }

  async function handleStatus(reg: Registration, status: "approved" | "rejected") {
    setSaving(true)
    try {
      const updated = await updateRegistrationStatus(reg.id, status)
      setRegistrations(prev => prev.map(r => r.id === updated.id ? { ...r, status: updated.status } : r))
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!selected) return
    setSaving(true)
    try {
      // If approved, cascade: also remove attendance records for this subject
      if (selected.status === "approved") {
        const sub = (selected as any).subjects
        await unenrollFromSubject(
          selected.id,
          selected.student_id,
          sub?.name ?? ""
        )
      } else {
        await deleteRegistration(selected.id)
      }
      setRegistrations(prev => prev.filter(r => r.id !== selected.id))
      setDeleteOpen(false)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleBulk() {
    if (selectedIds.size === 0) return
    setSaving(true)
    try {
      const ids = Array.from(selectedIds)
      await Promise.all(ids.map(id => updateRegistrationStatus(id, bulkAction)))
      setRegistrations(prev =>
        prev.map(r => ids.includes(r.id) ? { ...r, status: bulkAction } : r)
      )
      setSelectedIds(new Set())
      setBulkOpen(false)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  function exportCSV() {
    const rows = [
      ["Student", "Email", "Department", "Subject", "Subject Code", "Semester", "Status", "Date"],
      ...registrations.map(r => {
        const usr = (r as any).users
        const sub = (r as any).subjects
        return [
          usr?.name            ?? "—",
          usr?.email           ?? "—",
          usr?.departments?.name ?? "—",
          sub?.name            ?? "—",
          sub?.code            ?? "—",
          sub?.semester        ?? "—",
          r.status,
          new Date(r.created_at).toLocaleDateString("en-IN"),
        ]
      }),
    ]
    const csv  = rows.map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = `registrations-${new Date().toISOString().split("T")[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="admin"
      userName="Admin"
      avatarUrl={me.user?.avatar_url}
      pageTitle="Registrations"
      pageSubtitle="Review and manage student subject registrations"
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total",    value: stats.total,    sub: "registrations", icon: ClipboardCheck, color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100"    },
            { label: "Pending",  value: stats.pending,  sub: "awaiting review", icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100"   },
            { label: "Approved", value: stats.approved, sub: "accepted",        icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
            { label: "Rejected", value: stats.rejected, sub: "declined",        icon: XCircle,      color: "text-red-600",     bg: "bg-red-50",     border: "border-red-100"     },
          ].map(s => (
            <Card key={s.label} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
                {loading
                  ? <Skeleton className="h-7 w-24 mb-1" />
                  : <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                }
                <p className="text-xs text-gray-400">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Charts ────────────────────────────────────────── */}
        {!loading && registrations.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Pie — Status breakdown */}
            <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center">
                    <ClipboardCheck className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%"
                      innerRadius={45} outerRadius={70}
                      paddingAngle={3} dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [v, "Registrations"]}
                      contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E2E8F0" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-1">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-gray-600 font-medium">{d.name}</span>
                      </div>
                      <span className="font-black" style={{ color: d.color }}>
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bar — Dept-wise */}
            <Card className="lg:col-span-2 backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <GraduationCap className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  Department-wise Registrations
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={deptChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="dept" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E2E8F0" }}
                    />
                    <Bar dataKey="pending"  name="Pending"  fill="#D97706" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="approved" name="Approved" fill="#16A34A" radius={[4, 4, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>
        )}

        {/* ── Main table ────────────────────────────────────── */}
        <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
          <CardHeader className="pb-0">

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap gap-2 flex-1 min-w-0">
                <div className="relative min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Search student or subject..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-8 text-xs"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterDept} onValueChange={setFilterDept}>
                  <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="Department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {depts.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedIds.size > 0 && (
                  <>
                    <Button size="sm" onClick={() => { setBulkAction("approved"); setBulkOpen(true) }}
                      className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                      <Check className="h-3.5 w-3.5" /> Approve ({selectedIds.size})
                    </Button>
                    <Button size="sm" onClick={() => { setBulkAction("rejected"); setBulkOpen(true) }}
                      className="h-8 gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold">
                      <X className="h-3.5 w-3.5" /> Reject ({selectedIds.size})
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={exportCSV} className="h-8 gap-1.5 text-xs" disabled={loading}>
                  <Download className="h-3.5 w-3.5" /> Export
                </Button>
                <Button variant="outline" size="sm" onClick={load} className="h-8 w-8 p-0" title="Refresh">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="w-10 pl-6">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-gray-300 accent-blue-600"
                        checked={
                          paginated.filter(r => r.status === "pending").length > 0 &&
                          paginated.filter(r => r.status === "pending").every(r => selectedIds.has(r.id))
                        }
                        onChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Student</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Department</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Subject</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Semester</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Status</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Date</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 8 }).map((_, j) => (
                            <TableCell key={j} className={j === 0 ? "pl-6" : j === 7 ? "pr-6" : ""}>
                              <Skeleton className="h-5 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : paginated.length === 0
                      ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                            No registrations found
                          </TableCell>
                        </TableRow>
                      )
                      : paginated.map(reg => {
                          const ss  = statusStyle[reg.status]
                          const usr = (reg as any).users
                          const sub = (reg as any).subjects
                          return (
                            <TableRow key={reg.id} className="hover:bg-gray-50/60 transition-colors">

                              {/* Checkbox */}
                              <TableCell className="pl-6">
                                {reg.status === "pending" ? (
                                  <input
                                    type="checkbox"
                                    className="h-3.5 w-3.5 rounded border-gray-300 accent-blue-600"
                                    checked={selectedIds.has(reg.id)}
                                    onChange={() => toggleSelect(reg.id)}
                                  />
                                ) : <div className="w-3.5" />}
                              </TableCell>

                              {/* Student */}
                              <TableCell className="py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-xs font-black text-blue-700 shrink-0">
                                    {(usr?.name ?? "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{usr?.name ?? "Unknown"}</p>
                                    <p className="text-xs text-gray-400 truncate">{usr?.email ?? "—"}</p>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Dept */}
                              <TableCell className="text-sm text-gray-600">
                                {usr?.departments?.name ?? "—"}
                              </TableCell>

                              {/* Subject */}
                              <TableCell>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-800 truncate">{sub?.name ?? "Unknown"}</p>
                                  <p className="text-xs text-gray-400">{sub?.code ?? "—"}</p>
                                </div>
                              </TableCell>

                              {/* Semester */}
                              <TableCell className="text-sm text-gray-600">
                                {sub?.semester ?? usr?.semester ?? "—"}
                              </TableCell>

                              {/* Status */}
                              <TableCell>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                                  style={{ background: ss.bg, color: ss.color }}>
                                  <ss.icon className="h-3 w-3" />
                                  {ss.label}
                                </div>
                              </TableCell>

                              {/* Date */}
                              <TableCell className="text-sm text-gray-500">
                                {new Date(reg.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </TableCell>

                              {/* Actions */}
                              <TableCell className="pr-6 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="text-xs w-40">
                                    <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => openView(reg)}>
                                      <Eye className="h-3.5 w-3.5 mr-2" /> View Details
                                    </DropdownMenuItem>
                                    {reg.status === "pending" && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() => handleStatus(reg, "approved")}
                                          className="text-emerald-600 focus:text-emerald-600"
                                          disabled={saving}
                                        >
                                          <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleStatus(reg, "rejected")}
                                          className="text-red-600 focus:text-red-600"
                                          disabled={saving}
                                        >
                                          <XCircle className="h-3.5 w-3.5 mr-2" /> Reject
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onClick={() => openDelete(reg)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
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
                      <span key={p}>
                        {i > 0 && arr[i - 1] !== p - 1 && (
                          <span className="text-xs text-gray-400 px-1">…</span>
                        )}
                        <Button
                          variant={page === p ? "default" : "outline"}
                          size="sm"
                          className={`h-7 w-7 p-0 text-xs ${page === p ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                          onClick={() => setPage(p)}
                        >{p}</Button>
                      </span>
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

      {/* ════ VIEW ════ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registration Details</DialogTitle></DialogHeader>
          {selected && (() => {
            const ss  = statusStyle[selected.status]
            const usr = (selected as any).users
            const sub = (selected as any).subjects
            return (
              <div className="space-y-4 py-2">
                {/* Student info */}
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-sm font-black text-blue-700">
                    {(usr?.name ?? "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <p className="font-black text-gray-800">{usr?.name ?? "Unknown"}</p>
                    <p className="text-xs text-gray-500">{usr?.email ?? "—"}</p>
                    <p className="text-xs text-gray-400">{usr?.departments?.name ?? "—"} · Sem {usr?.semester ?? "—"}</p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Subject",    value: sub?.name ?? "—"  },
                    { label: "Code",       value: sub?.code ?? "—"  },
                    { label: "Department", value: sub?.departments?.name ?? "—" },
                    { label: "Semester",   value: sub?.semester ?? "—" },
                    { label: "Status",     value: <span style={{ color: ss.color }} className="font-black capitalize">{selected.status}</span> },
                    { label: "Applied On", value: new Date(selected.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
                  ].map(row => (
                    <div key={row.label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{row.label}</p>
                      <p className="text-sm font-bold text-gray-800">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewOpen(false)}>Close</Button>
            {selected?.status === "pending" && (
              <>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={saving}
                  onClick={() => { handleStatus(selected, "approved"); setViewOpen(false) }}>
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Approve
                </Button>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={saving}
                  onClick={() => { handleStatus(selected, "rejected"); setViewOpen(false) }}>
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ DELETE ════ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" /> Delete Registration
            </DialogTitle>
            <DialogDescription>
              Permanently delete the registration for <strong>{(selected as any)?.users?.name ?? "this student"}</strong> in <strong>{(selected as any)?.subjects?.name ?? "this subject"}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={handleDelete} disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ BULK ACTION ════ */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {bulkAction === "approved"
                ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Bulk Approve</>
                : <><XCircle className="h-4 w-4 text-red-600" /> Bulk Reject</>
              }
            </DialogTitle>
            <DialogDescription>
              {bulkAction === "approved"
                ? `Approve ${selectedIds.size} selected registration(s)? Students will be enrolled in the subjects.`
                : `Reject ${selectedIds.size} selected registration(s)? This action can be changed later.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(false)} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={handleBulk} disabled={saving}
              className={bulkAction === "approved"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
              }>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              {bulkAction === "approved" ? "Approve All" : "Reject All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}
