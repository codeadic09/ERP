"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Plus, Edit3, Trash2, Search, Building2,
  Users, GraduationCap, BookOpen, LayoutGrid,
  List, Loader2, RefreshCw, AlertTriangle,
  MoreVertical, Eye, CheckCircle2, XCircle
} from "lucide-react"
import { DashboardLayout }  from "@/components/layout/dashboard-layout"
import { useAuth } from "@/lib/hooks/useAuth"
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
  getDepartments, addDepartment,
  updateDepartment, deleteDepartment,
  getUsers, getSubjects, getFacultySubjects,
} from "@/lib/db"
import type { Department, User, Subject, FacultySubject } from "@/lib/types"



// ─── Constants ───────────────────────────────────────────────────
const PRESET_COLORS = [
  "#3B82F6","#8B5CF6","#EC4899",
  "#F59E0B","#10B981","#F97316",
  "#06B6D4","#EF4444","#6366F1",
]

type ViewMode = "grid" | "list"

interface FormData {
  name:        string
  code:        string
  head:        string
  description: string
  status:      "active" | "inactive"
  color:       string
  established: string
}

const emptyForm: FormData = {
  name: "", code: "", head: "", description: "",
  status: "active", color: "#3B82F6", established: "",
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

// ─── DeptForm — defined OUTSIDE DepartmentsPage to prevent focus loss ──
interface DeptFormProps {
  form:    FormData
  setForm: React.Dispatch<React.SetStateAction<FormData>>
}

function DeptForm({ form, setForm }: DeptFormProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
      {/* Name */}
      <div className="col-span-2 space-y-1.5">
        <Label className="text-xs font-semibold">Department Name *</Label>
        <Input
          placeholder="e.g. Computer Science"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="h-9 text-sm"
        />
      </div>

      {/* Code */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Code *</Label>
        <Input
          placeholder="e.g. CS"
          value={form.code}
          onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
          className="h-9 text-sm font-mono"
          maxLength={6}
        />
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Status</Label>
        <Select
          value={form.status}
          onValueChange={v => setForm(f => ({ ...f, status: v as "active" | "inactive" }))}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Head */}
      <div className="col-span-2 space-y-1.5">
        <Label className="text-xs font-semibold">Department Head</Label>
        <Input
          placeholder="e.g. Dr. Meera Desai"
          value={form.head}
          onChange={e => setForm(f => ({ ...f, head: e.target.value }))}
          className="h-9 text-sm"
        />
      </div>

      {/* Description */}
      <div className="col-span-2 space-y-1.5">
        <Label className="text-xs font-semibold">Description</Label>
        <textarea
          placeholder="Short description..."
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={2}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>

      {/* Established */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Established Year</Label>
        <Input
          placeholder="e.g. 1998"
          value={form.established}
          onChange={e => setForm(f => ({ ...f, established: e.target.value }))}
          className="h-9 text-sm"
          maxLength={4}
        />
      </div>

      {/* Color */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Color</Label>
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setForm(f => ({ ...f, color: c }))}
                className="w-6 h-6 rounded-full border-2 transition-all"
                style={{
                  background:   c,
                  borderColor:  form.color === c ? "#1E293B" : "transparent",
                  transform:    form.color === c ? "scale(1.2)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
export default function DepartmentsPage() {
  const me = useAuth("admin")
  if (!me) return null
  // ── Data ─────────────────────────────────────────────────────
  const [depts,    setDepts]    = useState<Department[]>([])
  const [users,    setUsers]    = useState<User[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [fsLinks,  setFsLinks]  = useState<FacultySubject[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // ── UI ───────────────────────────────────────────────────────
  const [view,        setView]        = useState<ViewMode>("grid")
  const [search,      setSearch]      = useState("")
  const [filterStatus,setFilterStatus]= useState("all")

  // ── Dialogs ──────────────────────────────────────────────────
  const [addOpen,    setAddOpen]    = useState(false)
  const [editOpen,   setEditOpen]   = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [viewOpen,   setViewOpen]   = useState(false)
  const [selected,   setSelected]   = useState<Department | null>(null)
  const [form,       setForm]       = useState<FormData>(emptyForm)

  // ── Load ─────────────────────────────────────────────────────
  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [d, u, s, fs] = await Promise.all([
        getDepartments(), getUsers(), getSubjects(), getFacultySubjects(),
      ])
      setDepts(d)
      setUsers(u)
      setSubjects(s)
      setFsLinks(fs)
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Derived counts ───────────────────────────────────────────
  function deptStats(deptId: string) {
    const members  = users.filter(u => u.dept_id === deptId)
    return {
      students: members.filter(u => u.role === "student").length,
      faculty:  members.filter(u => u.role === "faculty").length,
      total:    members.length,
      subjects: subjects.filter(s => s.dept_id === deptId).length,
    }
  }

  // ── Filtered ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return depts.filter(d => {
      const q = search.toLowerCase()
      if (q && !d.name.toLowerCase().includes(q) &&
               !d.code.toLowerCase().includes(q)) return false
      if (filterStatus !== "all" && d.status !== filterStatus) return false
      return true
    })
  }, [depts, search, filterStatus])

  // ── Handlers ─────────────────────────────────────────────────
  function openAdd() {
    setForm(emptyForm)
    setAddOpen(true)
  }

  function openEdit(d: Department) {
    setSelected(d)
    setForm({
      name:        d.name,
      code:        d.code,
      head:        d.head        ?? "",
      description: d.description ?? "",
      status:      d.status,
      color:       d.color       ?? "#3B82F6",
      established: d.established ?? "",
    })
    setEditOpen(true)
  }

  function openView(d: Department) {
    setSelected(d)
    setViewOpen(true)
  }

  function openDelete(d: Department) {
    setSelected(d)
    setDeleteOpen(true)
  }

  async function handleAdd() {
    if (!form.name || !form.code) return
    setSaving(true)
    try {
      const dept = await addDepartment({
        name:        form.name,
        code:        form.code.toUpperCase(),
        head:        form.head        || null,
        description: form.description || null,
        status:      form.status,
        color:       form.color,
        established: form.established || null,
      })
      setDepts(prev => [...prev, dept].sort((a, b) => a.name.localeCompare(b.name)))
      setAddOpen(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit() {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await updateDepartment(selected.id, {
        name:        form.name,
        code:        form.code.toUpperCase(),
        head:        form.head        || null,
        description: form.description || null,
        status:      form.status,
        color:       form.color,
        established: form.established || null,
      })
      setDepts(prev => prev.map(d => d.id === updated.id ? updated : d))
      setEditOpen(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selected) return
    setSaving(true)
    try {
      await deleteDepartment(selected.id)
      setDepts(prev => prev.filter(d => d.id !== selected.id))
      setDeleteOpen(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="admin"
      userName="Admin"
      pageTitle="Departments"
      pageSubtitle="Manage university departments"
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
            { label: "Total Depts",    value: depts.length,                              icon: Building2,     color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100"    },
            { label: "Active",         value: depts.filter(d => d.status==="active").length, icon: CheckCircle2, color: "text-emerald-600",  bg: "bg-emerald-50", border: "border-emerald-100" },
            { label: "Total Students", value: users.filter(u => u.role === "student").length, icon: GraduationCap,color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100"  },
            { label: "Total Faculty",  value: users.filter(u => u.role === "faculty").length, icon: BookOpen,    color: "text-purple-600",   bg: "bg-purple-50",  border: "border-purple-100"  },
          ].map(s => (
            <Card key={s.label} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center shrink-0`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                  {loading
                    ? <Skeleton className="h-6 w-10 mt-1" />
                    : <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Main card ─────────────────────────────────────── */}
        <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
          <CardHeader className="pb-0">

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap gap-2 flex-1 min-w-0">
                {/* Search */}
                <div className="relative min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Search departments..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-8 text-xs"
                  />
                </div>

                {/* Status filter */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* View toggle */}
                <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
                  {(["grid", "list"] as ViewMode[]).map(v => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`p-1.5 rounded-md transition-all ${
                        view === v ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {v === "grid" ? <LayoutGrid className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>

                <Button variant="outline" size="sm" onClick={load} className="h-8 w-8 p-0" title="Refresh">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </Button>

                <Button
                  size="sm"
                  onClick={openAdd}
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Dept
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className={view === "grid" ? "p-4 sm:p-6" : "p-0"}>

            {/* ── GRID VIEW ─────────────────────────────────── */}
            {view === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-44" />
                    ))
                  : filtered.length === 0
                    ? (
                      <div className="col-span-full text-center py-16 text-gray-400 text-sm">
                        No departments found
                      </div>
                    )
                    : filtered.map(dept => {
                        const stats = deptStats(dept.id)
                        return (
                          <div
                            key={dept.id}
                            className="group relative rounded-2xl border border-gray-100 bg-white/80 p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
                          >
                            {/* Color accent bar */}
                            <div
                              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                              style={{ background: dept.color ?? "#3B82F6" }}
                            />

                            {/* Header row */}
                            <div className="flex items-start justify-between mt-1 mb-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
                                  style={{ background: dept.color ?? "#3B82F6" }}
                                >
                                  {dept.code.slice(0, 2)}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-gray-800 leading-tight">{dept.name}</p>
                                  <p className="text-xs text-gray-400 font-mono">{dept.code}</p>
                                </div>
                              </div>

                              {/* Actions menu */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36 text-xs">
                                  <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openView(dept)}>
                                    <Eye className="h-3.5 w-3.5 mr-2" /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEdit(dept)}>
                                    <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => openDelete(dept)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2 min-h-[2rem]">
                              {dept.description ?? "No description provided."}
                            </p>

                            {/* Stats row */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <GraduationCap className="h-3.5 w-3.5" style={{ color: dept.color }} />
                                <span className="font-bold">{stats.students}</span>
                                <span className="text-gray-400">students</span>
                              </div>
                              <div className="w-px h-3 bg-gray-200" />
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <BookOpen className="h-3.5 w-3.5" style={{ color: dept.color }} />
                                <span className="font-bold">{stats.faculty}</span>
                                <span className="text-gray-400">faculty</span>
                              </div>
                              <div className="w-px h-3 bg-gray-200" />
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                                <span className="font-bold">{stats.subjects}</span>
                                <span className="text-gray-400">subjects</span>
                              </div>
                              <div className="ml-auto">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  dept.status === "active"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}>
                                  {dept.status}
                                </span>
                              </div>
                            </div>

                            {/* Head */}
                            {dept.head && (
                              <p className="text-[11px] text-gray-400 mt-2 truncate">
                                🎓 {dept.head}
                              </p>
                            )}
                          </div>
                        )
                      })
                }
              </div>
            )}

            {/* ── LIST VIEW ─────────────────────────────────── */}
            {view === "list" && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="text-xs font-bold text-gray-600 pl-6">Department</TableHead>
                      <TableHead className="text-xs font-bold text-gray-600">Head</TableHead>
                      <TableHead className="text-xs font-bold text-gray-600">Students</TableHead>
                      <TableHead className="text-xs font-bold text-gray-600">Faculty</TableHead>
                      <TableHead className="text-xs font-bold text-gray-600">Est.</TableHead>
                      <TableHead className="text-xs font-bold text-gray-600">Status</TableHead>
                      <TableHead className="text-xs font-bold text-gray-600 pr-6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 7 }).map((_, j) => (
                              <TableCell key={j} className={j === 0 ? "pl-6" : j === 6 ? "pr-6" : ""}>
                                <Skeleton className="h-5 w-full" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      : filtered.length === 0
                        ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                              No departments found
                            </TableCell>
                          </TableRow>
                        )
                        : filtered.map(dept => {
                            const stats = deptStats(dept.id)
                            return (
                              <TableRow key={dept.id} className="hover:bg-gray-50/60 transition-colors">
                                {/* Dept name */}
                                <TableCell className="pl-6 py-3">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0"
                                      style={{ background: dept.color ?? "#3B82F6" }}
                                    >
                                      {dept.code.slice(0, 2)}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-800">{dept.name}</p>
                                      <p className="text-xs font-mono text-gray-400">{dept.code}</p>
                                    </div>
                                  </div>
                                </TableCell>

                                <TableCell className="text-sm text-gray-600">{dept.head ?? "—"}</TableCell>

                                <TableCell>
                                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                    <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
                                    {stats.students}
                                  </div>
                                </TableCell>

                                <TableCell>
                                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                    <BookOpen className="h-3.5 w-3.5 text-purple-400" />
                                    {stats.faculty}
                                  </div>
                                </TableCell>

                                <TableCell className="text-sm text-gray-500">{dept.established ?? "—"}</TableCell>

                                <TableCell>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                                    dept.status === "active"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-gray-100 text-gray-500"
                                  }`}>
                                    {dept.status === "active"
                                      ? <CheckCircle2 className="h-3 w-3" />
                                      : <XCircle      className="h-3 w-3" />
                                    }
                                    {dept.status}
                                  </span>
                                </TableCell>

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
                                      <DropdownMenuItem onClick={() => openView(dept)}>
                                        <Eye    className="h-3.5 w-3.5 mr-2" /> View
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openEdit(dept)}>
                                        <Edit3  className="h-3.5 w-3.5 mr-2" /> Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => openDelete(dept)}
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════
          ADD DIALOG
      ════════════════════════════════════════════════════ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" /> Add Department
            </DialogTitle>
          </DialogHeader>
          <DeptForm form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={saving || !form.name || !form.code}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Add Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════
          EDIT DIALOG
      ════════════════════════════════════════════════════ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-blue-600" /> Edit Department
            </DialogTitle>
          </DialogHeader>
          <DeptForm form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleEdit}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════
          VIEW DIALOG
      ════════════════════════════════════════════════════ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Department Details</DialogTitle>
          </DialogHeader>
          {selected && (() => {
            const stats = deptStats(selected.id)
            const deptSubjects = subjects.filter(s => s.dept_id === selected.id)
            return (
              <div className="space-y-4 py-2">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg"
                    style={{ background: selected.color ?? "#3B82F6" }}
                  >
                    {selected.code.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-black text-gray-800 text-base">{selected.name}</p>
                    <p className="text-xs font-mono text-gray-500">{selected.code}</p>
                    {selected.description && (
                      <p className="text-xs text-gray-400 mt-1">{selected.description}</p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-blue-600">{stats.students}</p>
                    <p className="text-xs text-blue-500 font-semibold">Students</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-purple-600">{stats.faculty}</p>
                    <p className="text-xs text-purple-500 font-semibold">Faculty</p>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-indigo-600">{stats.subjects}</p>
                    <p className="text-xs text-indigo-500 font-semibold">Subjects</p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Head",        value: selected.head        ?? "—" },
                    { label: "Status",      value: selected.status            },
                    { label: "Established", value: selected.established ?? "—" },
                    { label: "Created",     value: new Date(selected.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
                  ].map(row => (
                    <div key={row.label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{row.label}</p>
                      <p className="text-sm font-bold text-gray-800 capitalize">{row.value}</p>
                    </div>
                  ))}
                </div>

                {/* Subjects list */}
                {deptSubjects.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                      Subjects ({deptSubjects.length})
                    </p>
                    <div className="border rounded-xl divide-y divide-gray-50 max-h-48 overflow-y-auto">
                      {deptSubjects.map(sub => {
                        const assigned = fsLinks
                          .filter(fs => fs.subject_id === sub.id && fs.users)
                          .map(fs => fs.users!)
                        return (
                          <div key={sub.id} className="flex items-center gap-3 px-3 py-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                              <BookOpen className="h-3 w-3 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{sub.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-gray-400">{sub.code}</span>
                                {sub.semester && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600">Sem {sub.semester}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex -space-x-1.5 shrink-0">
                              {assigned.length === 0 ? (
                                <span className="text-[10px] text-amber-500 font-semibold">Unassigned</span>
                              ) : (
                                assigned.slice(0, 3).map(f => (
                                  <div key={f.id} className="w-5 h-5 rounded-full bg-purple-100 border border-white flex items-center justify-center text-[7px] font-black text-purple-700" title={f.name}>
                                    {f.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                                  </div>
                                ))
                              )}
                              {assigned.length > 3 && (
                                <div className="w-5 h-5 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[7px] font-bold text-gray-500">
                                  +{assigned.length - 3}
                                </div>
                              )}
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
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => { setViewOpen(false); if (selected) openEdit(selected) }}
            >
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════
          DELETE DIALOG
      ════════════════════════════════════════════════════ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" /> Delete Department
            </DialogTitle>
            <DialogDescription>
              Permanently delete <strong>{selected?.name}</strong>? All users in this department will lose their department assignment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)} disabled={saving}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleDelete}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}
