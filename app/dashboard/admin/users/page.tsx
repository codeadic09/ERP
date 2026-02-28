"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import React, { useState, useEffect, useMemo } from "react"
import {
  Search, Plus, Edit3, Trash2, Eye,
  ChevronLeft, ChevronRight, MoreVertical,
  Copy, Check, AlertTriangle, KeyRound,
  GraduationCap, BookOpen, Users, Loader2,
  RefreshCw, Shield
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button }           from "@/components/ui/button"
import { Input }            from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
  getUsers, addUser, updateUser, deleteUser,
  getDepartments, getSubjects, getFacultySubjects,
  setFacultySubjectsForUser,
} from "@/lib/db"
import type { User, Department, Subject, FacultySubject } from "@/lib/types"

// ─── Types ───────────────────────────────────────────────────────
type Tab = "all" | "students" | "faculty"

interface FormData {
  name:        string
  email:       string
  password:    string
  role:        "student" | "faculty"
  dept_id:     string
  phone:       string
  status:      "active" | "inactive"
  enrolled_at: string
  subject_ids: string[]   // subjects assigned to faculty
}

interface Credentials {
  name:     string
  loginId:  string
  password: string
}

// ─── Helpers ─────────────────────────────────────────────────────
function generateCredentials(name: string, role: "student" | "faculty") {
  const first    = name.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "")
  const roleCode = role === "student" ? "s" : "f"
  const digits   = Math.floor(1000 + Math.random() * 9000)
  return {
    email:    `${first}@pcu.edu.in`,
    password: `${name.split(" ")[0]}@${digits}`,
  }
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

const PAGE_SIZE = 10

// ─── UserForm — defined OUTSIDE UsersPage to prevent focus loss ──
interface UserFormProps {
  form:         FormData
  depts:        Department[]
  subjects:     Subject[]
  isEdit?:      boolean
  onNameChange: (name: string) => void
  onRoleChange: (role: "student" | "faculty") => void
  onFormChange: (f: FormData) => void
}

function UserForm({
  form, depts, subjects, isEdit = false,
  onNameChange, onRoleChange, onFormChange,
}: UserFormProps) {
  // Subjects filtered by selected dept
  const deptSubjects = subjects.filter(s => s.dept_id === form.dept_id)

  function toggleSubject(sid: string) {
    const ids = form.subject_ids.includes(sid)
      ? form.subject_ids.filter(id => id !== sid)
      : [...form.subject_ids, sid]
    onFormChange({ ...form, subject_ids: ids })
  }

  return (
    <div className="grid grid-cols-2 gap-4 py-2">

      {/* Name */}
      <div className="col-span-2 space-y-1.5">
        <Label className="text-xs font-semibold">Full Name *</Label>
        <Input
          placeholder="e.g. Aarav Sharma"
          value={form.name}
          onChange={e =>
            isEdit
              ? onFormChange({ ...form, name: e.target.value })
              : onNameChange(e.target.value)
          }
          className="h-9 text-sm"
        />
      </div>

      {/* Role */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Role *</Label>
        <Select
          value={form.role}
          onValueChange={v =>
            isEdit
              ? onFormChange({ ...form, role: v as "student" | "faculty" })
              : onRoleChange(v as "student" | "faculty")
          }
        >
          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="faculty">Faculty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Department */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Department *</Label>
        <Select
          value={form.dept_id}
          onValueChange={v => onFormChange({ ...form, dept_id: v })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select dept" />
          </SelectTrigger>
          <SelectContent>
            {depts.map(d => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Email */}
      <div className="col-span-2 space-y-1.5">
        <Label className="text-xs font-semibold">Login ID (Email)</Label>
        <Input
          value={form.email}
          onChange={e => onFormChange({ ...form, email: e.target.value })}
          className="h-9 text-sm font-mono"
        />
      </div>

      {/* Password */}
      <div className="col-span-2 space-y-1.5">
        <Label className="text-xs font-semibold">Password</Label>
        <Input
          value={form.password}
          onChange={e => onFormChange({ ...form, password: e.target.value })}
          className="h-9 text-sm font-mono"
        />
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Phone</Label>
        <Input
          placeholder="+91 98765 43210"
          value={form.phone}
          onChange={e => onFormChange({ ...form, phone: e.target.value })}
          className="h-9 text-sm"
        />
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Status</Label>
        <Select
          value={form.status}
          onValueChange={v => onFormChange({ ...form, status: v as "active" | "inactive" })}
        >
          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Enrolled / Joining date */}
      <div className="col-span-2 space-y-1.5">
        <Label className="text-xs font-semibold">
          {form.role === "faculty" ? "Joining Date" : "Enrollment Date"}
        </Label>
        <Input
          type="date"
          value={form.enrolled_at}
          onChange={e => onFormChange({ ...form, enrolled_at: e.target.value })}
          className="h-9 text-sm"
        />
      </div>

      {/* Subject assignment for faculty */}
      {form.role === "faculty" && form.dept_id && (
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs font-semibold">
            Assign Subjects {form.subject_ids.length > 0 && <span className="text-blue-600">({form.subject_ids.length})</span>}
          </Label>
          {deptSubjects.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2">No subjects in this department yet</p>
          ) : (
            <div className="border rounded-lg max-h-36 overflow-y-auto divide-y divide-gray-50">
              {deptSubjects.map(s => {
                const checked = form.subject_ids.includes(s.id)
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                      checked ? "bg-blue-50/60" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSubject(s.id)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <BookOpen className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{s.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{s.code}{s.semester ? ` • Sem ${s.semester}` : ""}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      )}

    </div>
  )
}

// ════════════════════════════════════════════════════════════════
export default function UsersPage() {
  const me = useAuth("admin")
  if (!me) return null

  // ── Data state ───────────────────────────────────────────────
  const [users,    setUsers]    = useState<User[]>([])
  const [depts,    setDepts]    = useState<Department[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [fsLinks,  setFsLinks]  = useState<FacultySubject[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // ── UI state ─────────────────────────────────────────────────
  const [tab,          setTab]          = useState<Tab>("all")
  const [search,       setSearch]       = useState("")
  const [filterDept,   setFilterDept]   = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [page,         setPage]         = useState(1)

  // ── Dialog state ─────────────────────────────────────────────
  const [addOpen,      setAddOpen]      = useState(false)
  const [editOpen,     setEditOpen]     = useState(false)
  const [deleteOpen,   setDeleteOpen]   = useState(false)
  const [viewOpen,     setViewOpen]     = useState(false)
  const [credOpen,     setCredOpen]     = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [credentials,  setCredentials]  = useState<Credentials | null>(null)
  const [copied,       setCopied]       = useState(false)

  // ── Form state ───────────────────────────────────────────────
  const emptyForm: FormData = {
    name: "", email: "", password: "", role: "student",
    dept_id: "", phone: "", status: "active",
    enrolled_at: new Date().toISOString().split("T")[0],
    subject_ids: [],
  }
  const [form, setForm] = useState<FormData>(emptyForm)

  // ── Load ─────────────────────────────────────────────────────
  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [u, d, s, fs] = await Promise.all([
        getUsers(), getDepartments(), getSubjects(), getFacultySubjects(),
      ])
      setUsers(u)
      setDepts(d)
      setSubjects(s)
      setFsLinks(fs)
    } catch (e: any) {
      setError(e.message ?? "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { setPage(1) }, [tab, search, filterDept, filterStatus])

  // ── Filtered + paginated ──────────────────────────────────────
  const filtered = useMemo(() => {
    return users.filter(u => {
      if (u.role === "admin") return false
      if (tab === "students" && u.role !== "student") return false
      if (tab === "faculty"  && u.role !== "faculty")  return false

      const q = search.toLowerCase()
      if (q && !u.name.toLowerCase().includes(q) &&
               !u.email.toLowerCase().includes(q)) return false

      if (filterDept   !== "all" && u.dept_id !== filterDept)   return false
      if (filterStatus !== "all" && u.status  !== filterStatus) return false

      return true
    })
  }, [users, tab, search, filterDept, filterStatus])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Stats ─────────────────────────────────────────────────────
  const totalStudents = users.filter(u => u.role === "student").length
  const totalFaculty  = users.filter(u => u.role === "faculty").length
  const totalActive   = users.filter(u => u.status === "active" && u.role !== "admin").length

  // ── Handlers ─────────────────────────────────────────────────
  function openAdd() {
    setForm(emptyForm)
    setAddOpen(true)
  }

  function openEdit(u: User) {
    setSelectedUser(u)
    // Populate existing subject assignments from junction links
    const assignedSubjectIds = fsLinks
      .filter(fs => fs.faculty_id === u.id)
      .map(fs => fs.subject_id)
    setForm({
      name:        u.name,
      email:       u.email,
      password:    u.password ?? "",
      role:        u.role as "student" | "faculty",
      dept_id:     u.dept_id ?? "",
      phone:       u.phone   ?? "",
      status:      u.status,
      enrolled_at: u.enrolled_at?.split("T")[0] ?? new Date().toISOString().split("T")[0],
      subject_ids: assignedSubjectIds,
    })
    setEditOpen(true)
  }

  function openView(u: User) {
    setSelectedUser(u)
    setViewOpen(true)
  }

  function openDelete(u: User) {
    setSelectedUser(u)
    setDeleteOpen(true)
  }

  // Auto-generate credentials when name/role changes
  function handleNameChange(name: string) {
    setForm(f => {
      const creds = name.trim()
        ? generateCredentials(name, f.role)
        : { email: "", password: "" }
      return { ...f, name, email: creds.email, password: creds.password }
    })
  }

  function handleRoleChange(role: "student" | "faculty") {
    setForm(f => {
      const creds = f.name.trim()
        ? generateCredentials(f.name, role)
        : { email: "", password: "" }
      return { ...f, role, email: creds.email, password: creds.password }
    })
  }

  async function handleAdd() {
    if (!form.name || !form.email || !form.dept_id) return
    setSaving(true)
    try {
      const newUser = await addUser({
        name:        form.name,
        email:       form.email,
        password:    form.password,
        role:        form.role,
        dept_id:     form.dept_id   || null,
        phone:       form.phone     || null,
        status:      form.status,
        enrolled_at: form.enrolled_at,
      })
      // Save subject assignments for faculty
      if (form.role === "faculty" && form.subject_ids.length > 0) {
        await setFacultySubjectsForUser(newUser.id, form.subject_ids)
        const fs = await getFacultySubjects()
        setFsLinks(fs)
      }
      setUsers(prev => [newUser, ...prev])
      setCredentials({ name: form.name, loginId: form.email, password: form.password })
      setAddOpen(false)
      setCredOpen(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit() {
    if (!selectedUser) return
    setSaving(true)
    try {
      const updated = await updateUser(selectedUser.id, {
        name:        form.name,
        email:       form.email,
        password:    form.password,
        role:        form.role,
        dept_id:     form.dept_id   || null,
        phone:       form.phone     || null,
        status:      form.status,
        enrolled_at: form.enrolled_at,
      })
      // Save subject assignments for faculty
      if (form.role === "faculty") {
        await setFacultySubjectsForUser(selectedUser.id, form.subject_ids)
        const fs = await getFacultySubjects()
        setFsLinks(fs)
      }
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
      setEditOpen(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
  if (!selectedUser) return
  setSaving(true)
  try {
    await deleteUser(selectedUser.id, selectedUser.email)  // ← add email
    setUsers(prev => prev.filter(u => u.id !== selectedUser.id))
    setDeleteOpen(false)
  } catch (e: any) {
    setError(e.message)
  } finally {
    setSaving(false)
  }
}

  // ── Copy credentials (HTTPS-safe) ─────────────────────────────
  function copyCredentials() {
    if (!credentials) return
    const text = `Login ID: ${credentials.loginId}\nPassword: ${credentials.password}`
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        // Fallback for non-secure contexts
        const el = document.createElement("textarea")
        el.value = text
        el.style.position = "fixed"
        el.style.opacity  = "0"
        document.body.appendChild(el)
        el.focus()
        el.select()
        try {
          document.execCommand("copy")
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } finally {
          document.body.removeChild(el)
        }
      })
  }

  // ── Dept name lookup ─────────────────────────────────────────
  function deptName(deptId: string | null) {
    if (!deptId) return "—"
    return depts.find(d => d.id === deptId)?.name ?? "—"
  }

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="admin"
      userName="Admin"
      pageTitle="Users"
      pageSubtitle="Manage students and faculty accounts"
      loading={loading}
    >
      <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full min-w-0">

        {/* ── Error banner ──────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600 text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── Stat cards ────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: totalStudents + totalFaculty, icon: Users,         color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100"   },
            { label: "Students",    value: totalStudents,                 icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
            { label: "Faculty",     value: totalFaculty,                  icon: BookOpen,      color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
            { label: "Active",      value: totalActive,                   icon: Shield,        color: "text-emerald-600",bg: "bg-emerald-50",border: "border-emerald-100"},
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

            {/* Tabs + actions */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {(["all", "students", "faculty"] as Tab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      tab === t
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t === "all" ? "All Users" : t}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={load}
                  className="h-8 w-8 p-0"
                  title="Refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </Button>
                <Button
                  size="sm"
                  onClick={openAdd}
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" /> Add User
                </Button>
              </div>
            </div>

            {/* Search + filters */}
            <div className="flex flex-wrap gap-2 pb-4">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Search name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-8 text-xs"
                />
              </div>

              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger className="h-8 text-xs w-44">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {depts.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          {/* ── Table ───────────────────────────────────────── */}
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-xs font-bold text-gray-600 pl-6">User</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Role</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Department</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Phone</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Enrolled</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Status</TableHead>
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
                          <TableCell colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                            <div className="flex flex-col items-center gap-2">
                              <Users className="h-8 w-8 text-gray-200" />
                              No users found
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                      : paginated.map(user => (
                          <TableRow
                            key={user.id}
                            className="hover:bg-gray-50/60 transition-colors"
                          >
                            {/* User */}
                            <TableCell className="pl-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-xs font-black text-blue-700 shrink-0">
                                  {user.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>

                            {/* Role */}
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                                user.role === "student"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-purple-50 text-purple-700"
                              }`}>
                                {user.role === "student"
                                  ? <GraduationCap className="h-3 w-3" />
                                  : <BookOpen      className="h-3 w-3" />
                                }
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </span>
                            </TableCell>

                            {/* Dept */}
                            <TableCell className="text-sm text-gray-600">
                              {(user as any).departments?.name ?? deptName(user.dept_id)}
                            </TableCell>

                            {/* Phone */}
                            <TableCell className="text-sm text-gray-500">
                              {user.phone ?? "—"}
                            </TableCell>

                            {/* Enrolled */}
                            <TableCell className="text-sm text-gray-500">
                              {user.enrolled_at
                                ? new Date(user.enrolled_at).toLocaleDateString("en-IN", {
                                    day: "numeric", month: "short", year: "numeric"
                                  })
                                : "—"
                              }
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                user.status === "active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}>
                                {user.status === "active" ? "Active" : "Inactive"}
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
                                <DropdownMenuContent align="end" className="text-xs w-40">
                                  <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openView(user)}>
                                    <Eye     className="h-3.5 w-3.5 mr-2" /> View Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEdit(user)}>
                                    <Edit3   className="h-3.5 w-3.5 mr-2" /> Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setCredentials({
                                      name:     user.name,
                                      loginId:  user.email,
                                      password: user.password ?? "—",
                                    })
                                    setCredOpen(true)
                                  }}>
                                    <KeyRound className="h-3.5 w-3.5 mr-2" /> View Credentials
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => openDelete(user)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                  }
                </TableBody>
              </Table>
            </div>

            {/* ── Pagination ──────────────────────────────────── */}
            {!loading && filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline" size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, i, arr) => (
                      <React.Fragment key={p}>
                        {i > 0 && arr[i - 1] !== p - 1 && (
                          <span className="text-xs text-gray-400 px-1">…</span>
                        )}
                        <Button
                          variant={page === p ? "default" : "outline"}
                          size="sm"
                          className={`h-7 w-7 p-0 text-xs ${
                            page === p ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
                          }`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      </React.Fragment>
                    ))
                  }

                  <Button
                    variant="outline" size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ════ ADD DIALOG ════ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" /> Add New User
            </DialogTitle>
            <DialogDescription>
              Credentials are auto-generated from the name and role.
            </DialogDescription>
          </DialogHeader>

          <UserForm
            form={form}
            depts={depts}
            subjects={subjects}
            onNameChange={handleNameChange}
            onRoleChange={handleRoleChange}
            onFormChange={setForm}
          />

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={saving || !form.name || !form.email || !form.dept_id}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ EDIT DIALOG ════ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-blue-600" /> Edit User
            </DialogTitle>
          </DialogHeader>

          <UserForm
            form={form}
            depts={depts}
            subjects={subjects}
            isEdit
            onNameChange={handleNameChange}
            onRoleChange={handleRoleChange}
            onFormChange={setForm}
          />

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleEdit}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ VIEW DIALOG ════ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>

          {selectedUser && (() => {
            const assignedSubjects = fsLinks
              .filter(fs => fs.faculty_id === selectedUser.id && fs.subjects)
              .map(fs => fs.subjects!)
            return (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-lg font-black text-blue-700">
                  {selectedUser.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <p className="font-black text-gray-800 text-base">{selectedUser.name}</p>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Role",       value: selectedUser.role },
                  { label: "Status",     value: selectedUser.status },
                  { label: "Department", value: (selectedUser as any).departments?.name ?? deptName(selectedUser.dept_id) },
                  { label: "Phone",      value: selectedUser.phone ?? "—" },
                  { label: "Enrolled",   value: selectedUser.enrolled_at
                      ? new Date(selectedUser.enrolled_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                      : "—"
                  },
                  { label: "Added",      value: new Date(selectedUser.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
                ].map(row => (
                  <div key={row.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{row.label}</p>
                    <p className="text-sm font-bold text-gray-800 capitalize">{row.value}</p>
                  </div>
                ))}
              </div>

              {/* Assigned subjects (faculty only) */}
              {selectedUser.role === "faculty" && assignedSubjects.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                    Assigned Subjects ({assignedSubjects.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {assignedSubjects.map(s => (
                      <span key={s.id} className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                        <BookOpen className="h-3 w-3" />
                        {s.name}
                        {s.semester && <span className="text-blue-400 text-[10px]">Sem {s.semester}</span>}
                      </span>
                    ))}
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
              onClick={() => { setViewOpen(false); if (selectedUser) openEdit(selectedUser) }}
            >
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ CREDENTIALS DIALOG ════ */}
      <Dialog open={credOpen} onOpenChange={setCredOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-blue-600" /> Login Credentials
            </DialogTitle>
            <DialogDescription>Share these with {credentials?.name}</DialogDescription>
          </DialogHeader>

          {credentials && (
            <div className="space-y-3 py-2">
              {[
                { label: "Login ID", value: credentials.loginId  },
                { label: "Password", value: credentials.password },
              ].map(row => (
                <div key={row.label} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <p className="text-xs text-gray-400 font-semibold mb-1">{row.label}</p>
                  <p className="text-sm font-mono font-bold text-gray-800 break-all">{row.value}</p>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCredOpen(false)}>Close</Button>
            <Button
              size="sm"
              onClick={copyCredentials}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              {copied
                ? <><Check className="h-3.5 w-3.5" /> Copied!</>
                : <><Copy  className="h-3.5 w-3.5" /> Copy</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ DELETE DIALOG ════ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" /> Delete User
            </DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{selectedUser?.name}</strong> and all their data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDelete}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}
