"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo } from "react"
import {
  Plus, Edit3, Trash2, Search, Wallet,
  GraduationCap, CheckCircle2, Clock, XCircle,
  Loader2, RefreshCw, AlertTriangle, MoreVertical,
  Eye, TrendingUp, TrendingDown, CreditCard,
  ChevronLeft, ChevronRight, Download
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts"
import { DashboardLayout }  from "@/components/layout/dashboard-layout"
import { Button }           from "@/components/ui/button"
import { Input }            from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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
  getFees, addFee, updateFee, deleteFee,
  getUsers, getDepartments,
} from "@/lib/db"
import type { Fee, User, Department } from "@/lib/types"

// ─── Constants ───────────────────────────────────────────────────
const PAGE_SIZE = 10

const statusStyle = {
  paid:    { label: "Paid",    bg: "rgba(22,163,74,0.08)",  color: "#16A34A", icon: CheckCircle2 },
  pending: { label: "Pending", bg: "rgba(217,119,6,0.08)",  color: "#D97706", icon: Clock        },
  overdue: { label: "Overdue", bg: "rgba(220,38,38,0.08)",  color: "#DC2626", icon: XCircle      },
}

interface FormData {
  student_id:  string
  amount:      string
  status:      "paid" | "pending" | "overdue"
  due_date:    string
  paid_date:   string
  description: string
}

const emptyForm: FormData = {
  student_id: "", amount: "", status: "pending",
  due_date: "", paid_date: "", description: "",
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

// ─── FeeForm — defined OUTSIDE FeesPage to prevent focus loss ──
interface FeeFormProps {
  form:     FormData
  setForm:  React.Dispatch<React.SetStateAction<FormData>>
  students: User[]
  depts:    Department[]
}

function FeeForm({ form, setForm, students, depts }: FeeFormProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
      <div className="col-span-2 space-y-1.5">
        <Label className="text-xs font-semibold">Student *</Label>
        <Select value={form.student_id} onValueChange={v => setForm(f => ({ ...f, student_id: v }))}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select student" /></SelectTrigger>
          <SelectContent>
            {students.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} — {depts.find(d => d.id === s.dept_id)?.code ?? "?"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Amount (₹) *</Label>
        <Input type="number" placeholder="e.g. 24500" value={form.amount}
          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          className="h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Status</Label>
        <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Due Date</Label>
        <Input type="date" value={form.due_date}
          onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
          className="h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Paid Date</Label>
        <Input type="date" value={form.paid_date}
          onChange={e => setForm(f => ({ ...f, paid_date: e.target.value }))}
          className="h-9 text-sm"
          disabled={form.status !== "paid"} />
      </div>

      <div className="col-span-2 space-y-1.5">
        <Label className="text-xs font-semibold">Description</Label>
        <Input placeholder="e.g. Semester 4 Tuition Fee" value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="h-9 text-sm" />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
export default function FeesPage() {
  const me = useAuth("admin")
  if (!me) return null

  // ── Data ─────────────────────────────────────────────────────
  const [fees,     setFees]     = useState<Fee[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [depts,    setDepts]    = useState<Department[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // ── UI ───────────────────────────────────────────────────────
  const [search,       setSearch]       = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDept,   setFilterDept]   = useState("all")
  const [page,         setPage]         = useState(1)

  // ── Dialogs ──────────────────────────────────────────────────
  const [addOpen,    setAddOpen]    = useState(false)
  const [editOpen,   setEditOpen]   = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [viewOpen,   setViewOpen]   = useState(false)
  const [selected,   setSelected]   = useState<Fee | null>(null)
  const [form,       setForm]       = useState<FormData>(emptyForm)

  // ── Load ─────────────────────────────────────────────────────
  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [f, u, d] = await Promise.all([
        getFees(), getUsers(), getDepartments(),
      ])
      setFees(f)
      setStudents(u.filter(u => u.role === "student"))
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
    const total     = fees.reduce((s, f) => s + Number(f.amount), 0)
    const collected = fees.filter(f => f.status === "paid")   .reduce((s, f) => s + Number(f.amount), 0)
    const pending   = fees.filter(f => f.status === "pending").reduce((s, f) => s + Number(f.amount), 0)
    const overdue   = fees.filter(f => f.status === "overdue").reduce((s, f) => s + Number(f.amount), 0)
    return {
      total, collected, pending, overdue,
      paidCount:    fees.filter(f => f.status === "paid").length,
      pendingCount: fees.filter(f => f.status === "pending").length,
      overdueCount: fees.filter(f => f.status === "overdue").length,
    }
  }, [fees])

  // ── Monthly trend (last 6 months) ────────────────────────────
  const monthlyTrend = useMemo(() => {
    const months: Record<string, { collected: number; pending: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
      months[key] = { collected: 0, pending: 0 }
    }
    fees.forEach(f => {
      const d   = new Date(f.created_at)
      const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
      if (!months[key]) return
      if (f.status === "paid") months[key].collected += Number(f.amount)
      else                     months[key].pending   += Number(f.amount)
    })
    return Object.entries(months).map(([month, v]) => ({ month, ...v }))
  }, [fees])

  // ── Pie data ──────────────────────────────────────────────────
  const pieData = useMemo(() => [
    { name: "Collected", value: stats.collected, color: "#16A34A" },
    { name: "Pending",   value: stats.pending,   color: "#D97706" },
    { name: "Overdue",   value: stats.overdue,   color: "#DC2626" },
  ].filter(d => d.value > 0), [stats])

  // ── Dept bar data ─────────────────────────────────────────────
  const deptChartData = useMemo(() => {
    return depts.map(d => {
      const deptStudentIds = students
        .filter(s => s.dept_id === d.id)
        .map(s => s.id)
      const collected = fees
        .filter(f => deptStudentIds.includes(f.student_id) && f.status === "paid")
        .reduce((sum, f) => sum + Number(f.amount), 0)
      return { dept: d.code, collected, color: d.color ?? "#3B82F6" }
    }).filter(d => d.collected > 0)
  }, [fees, depts, students])

  // ── Filtered + paginated ──────────────────────────────────────
  const filtered = useMemo(() => {
    return fees.filter(f => {
      const usr  = (f as any).users
      const name = usr?.name?.toLowerCase() ?? ""
      const deptId = usr?.dept_id ?? ""
      if (search       && !name.includes(search.toLowerCase())) return false
      if (filterStatus !== "all" && f.status !== filterStatus)  return false
      if (filterDept   !== "all" && deptId   !== filterDept)    return false
      return true
    })
  }, [fees, search, filterStatus, filterDept])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Helpers ───────────────────────────────────────────────────
  function deptOfStudent(studentId: string) {
    const s = students.find(s => s.id === studentId)
    if (!s) return "—"
    return depts.find(d => d.id === s.dept_id)?.name ?? "—"
  }

  // ── Handlers ──────────────────────────────────────────────────
  function openAdd() { setForm(emptyForm); setAddOpen(true) }

  function openEdit(f: Fee) {
    setSelected(f)
    setForm({
      student_id:  f.student_id,
      amount:      String(f.amount),
      status:      f.status,
      due_date:    f.due_date    ?? "",
      paid_date:   f.paid_date   ?? "",
      description: f.description ?? "",
    })
    setEditOpen(true)
  }

  function openView(f: Fee)   { setSelected(f); setViewOpen(true)   }
  function openDelete(f: Fee) { setSelected(f); setDeleteOpen(true) }

  async function handleAdd() {
    if (!form.student_id || !form.amount) return
    setSaving(true)
    try {
      const fee = await addFee({
        student_id:  form.student_id,
        amount:      Number(form.amount),
        status:      form.status,
        due_date:    form.due_date    || null,
        paid_date:   form.status === "paid"
          ? (form.paid_date || new Date().toISOString().split("T")[0])
          : null,
        description: form.description || null,
      })
      setFees(prev => [fee, ...prev])
      setAddOpen(false)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleEdit() {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await updateFee(selected.id, {
        student_id:  form.student_id,
        amount:      Number(form.amount),
        status:      form.status,
        due_date:    form.due_date    || null,
        paid_date:   form.status === "paid"
          ? (form.paid_date || new Date().toISOString().split("T")[0])
          : null,
        description: form.description || null,
      })
      setFees(prev => prev.map(f => f.id === updated.id ? updated : f))
      setEditOpen(false)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!selected) return
    setSaving(true)
    try {
      await deleteFee(selected.id)
      setFees(prev => prev.filter(f => f.id !== selected.id))
      setDeleteOpen(false)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function markPaid(f: Fee) {
    try {
      const updated = await updateFee(f.id, {
        status:    "paid",
        paid_date: new Date().toISOString().split("T")[0],
      })
      setFees(prev => prev.map(x => x.id === updated.id ? updated : x))
    } catch (e: any) { setError(e.message) }
  }

  function exportCSV() {
    const rows = [
      ["Name", "Department", "Amount", "Status", "Due Date", "Paid Date", "Description"],
      ...fees.map(f => {
        const usr = (f as any).users
        return [
          usr?.name          ?? "—",
          usr?.departments?.name ?? "—",
          f.amount,
          f.status,
          f.due_date         ?? "—",
          f.paid_date        ?? "—",
          f.description      ?? "—",
        ]
      }),
    ]
    const csv  = rows.map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = `fees-${new Date().toISOString().split("T")[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="admin"
      userName="Admin"
      avatarUrl={me.user?.avatar_url}
      pageTitle="Fee Control"
      pageSubtitle="Manage student fee records and payments"
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
            { label: "Total Billed", value: `₹${(stats.total/1000).toFixed(1)}K`,     sub: `${fees.length} records`,        icon: Wallet,       color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100",    trend: null  },
            { label: "Collected",    value: `₹${(stats.collected/1000).toFixed(1)}K`, sub: `${stats.paidCount} paid`,        icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", trend: true  },
            { label: "Pending",      value: `₹${(stats.pending/1000).toFixed(1)}K`,   sub: `${stats.pendingCount} records`,  icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100",   trend: null  },
            { label: "Overdue",      value: `₹${(stats.overdue/1000).toFixed(1)}K`,   sub: `${stats.overdueCount} records`,  icon: XCircle,      color: "text-red-600",     bg: "bg-red-50",     border: "border-red-100",     trend: false },
          ].map(s => (
            <Card key={s.label} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  {s.trend !== null && (
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${s.trend ? "text-emerald-600" : "text-red-500"}`}>
                      {s.trend ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {s.trend ? "+8%" : "Attention"}
                    </span>
                  )}
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
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Area — Monthly trend */}
            <Card className="lg:col-span-2 backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  Monthly Fee Collection
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}    />
                      </linearGradient>
                      <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                      tickFormatter={v => `₹${v / 1000}K`} />
                    <Tooltip
                      formatter={(v: number, name: string) => [`₹${v.toLocaleString("en-IN")}`, name]}
                      contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    />
                    <Area type="monotone" dataKey="collected" name="Collected" stroke="#3B82F6" strokeWidth={2} fill="url(#gradCollected)" dot={false} />
                    <Area type="monotone" dataKey="pending"   name="Pending"   stroke="#F59E0B" strokeWidth={2} fill="url(#gradPending)"   dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie — Status breakdown */}
            <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center">
                    <CreditCard className="h-3.5 w-3.5 text-purple-600" />
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
                      formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`]}
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
                        ₹{d.value.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bar — Dept-wise */}
            <Card className="lg:col-span-3 backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <Wallet className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  Department-wise Fee Collection
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={deptChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="dept" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                      tickFormatter={v => `₹${v / 1000}K`} />
                    <Tooltip
                      formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Collected"]}
                      contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E2E8F0" }}
                    />
                    <Bar dataKey="collected" radius={[6, 6, 0, 0]}>
                      {deptChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
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
                    placeholder="Search student name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-8 text-xs"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
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
                <Button variant="outline" size="sm" onClick={exportCSV} className="h-8 gap-1.5 text-xs" disabled={loading}>
                  <Download className="h-3.5 w-3.5" /> Export
                </Button>
                <Button variant="outline" size="sm" onClick={load} className="h-8 w-8 p-0" title="Refresh">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </Button>
                <Button size="sm" onClick={openAdd}
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-semibold">
                  <Plus className="h-3.5 w-3.5" /> Add Fee
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-xs font-bold text-gray-600 pl-6">Student</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Department</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Description</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Amount</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Status</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Due Date</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Paid Date</TableHead>
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
                            No fee records found
                          </TableCell>
                        </TableRow>
                      )
                      : paginated.map(fee => {
                          const ss  = statusStyle[fee.status]
                          const usr = (fee as any).users
                          return (
                            <TableRow key={fee.id} className="hover:bg-gray-50/60 transition-colors">

                              {/* Student */}
                              <TableCell className="pl-6 py-3">
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
                                {usr?.departments?.name ?? deptOfStudent(fee.student_id)}
                              </TableCell>

                              {/* Description */}
                              <TableCell className="text-sm text-gray-500 max-w-[160px] truncate">
                                {fee.description ?? "—"}
                              </TableCell>

                              {/* Amount */}
                              <TableCell className="text-sm font-black text-gray-800">
                                ₹{Number(fee.amount).toLocaleString("en-IN")}
                              </TableCell>

                              {/* Status */}
                              <TableCell>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                                  style={{ background: ss.bg, color: ss.color }}>
                                  <ss.icon className="h-3 w-3" />
                                  {ss.label}
                                </div>
                              </TableCell>

                              {/* Due */}
                              <TableCell className="text-sm text-gray-500">
                                {fee.due_date
                                  ? new Date(fee.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                  : "—"}
                              </TableCell>

                              {/* Paid */}
                              <TableCell className="text-sm text-gray-500">
                                {fee.paid_date
                                  ? new Date(fee.paid_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                  : "—"}
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
                                    <DropdownMenuItem onClick={() => openView(fee)}>
                                      <Eye   className="h-3.5 w-3.5 mr-2" /> View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openEdit(fee)}>
                                      <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
                                    </DropdownMenuItem>
                                    {fee.status !== "paid" && (
                                      <DropdownMenuItem onClick={() => markPaid(fee)}
                                        className="text-emerald-600 focus:text-emerald-600">
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Mark Paid
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600 focus:text-red-600"
                                      onClick={() => openDelete(fee)}>
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
                      <>
                        {i > 0 && arr[i - 1] !== p - 1 && (
                          <span key={`d${p}`} className="text-xs text-gray-400 px-1">…</span>
                        )}
                        <Button key={p}
                          variant={page === p ? "default" : "outline"}
                          size="sm"
                          className={`h-7 w-7 p-0 text-xs ${page === p ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                          onClick={() => setPage(p)}
                        >{p}</Button>
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

      {/* ════ ADD ════ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" /> Add Fee Record
            </DialogTitle>
          </DialogHeader>
          <FeeForm form={form} setForm={setForm} students={students} depts={depts} />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={handleAdd}
              disabled={saving || !form.student_id || !form.amount}
              className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Add Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ EDIT ════ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-blue-600" /> Edit Fee Record
            </DialogTitle>
          </DialogHeader>
          <FeeForm form={form} setForm={setForm} students={students} depts={depts} />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={handleEdit} disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ VIEW ════ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Fee Record Details</DialogTitle></DialogHeader>
          {selected && (() => {
            const ss  = statusStyle[selected.status]
            const usr = (selected as any).users
            return (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-sm font-black text-blue-700">
                    {(usr?.name ?? "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <p className="font-black text-gray-800">{usr?.name ?? "Unknown"}</p>
                    <p className="text-xs text-gray-500">{usr?.email ?? "—"}</p>
                    <p className="text-xs text-gray-400">{usr?.departments?.name ?? "—"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Amount",      value: `₹${Number(selected.amount).toLocaleString("en-IN")}` },
                    { label: "Status",      value: <span style={{ color: ss.color }} className="font-black capitalize">{selected.status}</span> },
                    { label: "Due Date",    value: selected.due_date  ? new Date(selected.due_date).toLocaleDateString("en-IN",  { day: "numeric", month: "long", year: "numeric" }) : "—" },
                    { label: "Paid Date",   value: selected.paid_date ? new Date(selected.paid_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—" },
                    { label: "Description", value: selected.description ?? "—" },
                    { label: "Created",     value: new Date(selected.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
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
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => { setViewOpen(false); if (selected) openEdit(selected) }}>Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ DELETE ════ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" /> Delete Fee Record
            </DialogTitle>
            <DialogDescription>
              Permanently delete this record for <strong>{(selected as any)?.users?.name ?? "this student"}</strong>? This cannot be undone.
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

    </DashboardLayout>
  )
}
