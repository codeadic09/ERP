"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import React, { useState, useEffect, useMemo } from "react"
import {
  Search, Plus, Edit3, Trash2, Eye,
  ChevronLeft, ChevronRight, MoreVertical,
  Copy, Check, AlertTriangle, KeyRound,
  GraduationCap, BookOpen, Users, Loader2,
  RefreshCw, Shield, Upload, Download,
  FileSpreadsheet, CheckCircle2, XCircle, X
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button }           from "@/components/ui/button"
import { Input }            from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { Label }            from "@/components/ui/label"
import { Progress }         from "@/components/ui/progress"
import { Checkbox }         from "@/components/ui/checkbox"
import { ScrollArea }       from "@/components/ui/scroll-area"
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
  userId?:  string
  email?:   string
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">

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

  // ── Bulk import state ────────────────────────────────────────
  const [importOpen,      setImportOpen]      = useState(false)
  const [csvRows,         setCsvRows]         = useState<Record<string, string>[]>([])
  const [csvErrors,       setCsvErrors]       = useState<string[]>([])
  const [importing,       setImporting]       = useState(false)
  const [importProgress,  setImportProgress]  = useState(0)
  const [importResults,   setImportResults]   = useState<{ row: number; name: string; email: string; status: "ok" | "error"; error?: string }[] | null>(null)

  // ── Bulk selection state ─────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

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
      setCredentials({ name: form.name, loginId: form.email, password: form.password, userId: newUser.id, email: form.email })
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

  // ── Reset password for existing users ──────────────────────────
  async function handleResetPassword() {
    if (!credentials?.userId || !credentials?.email) return
    setSaving(true)
    try {
      const namePart = credentials.name.split(" ")[0]
      const digits   = Math.floor(1000 + Math.random() * 9000)
      const newPass  = `${namePart}@${digits}`

      const res = await fetch("/api/users/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          userId:   credentials.userId,
          email:    credentials.email,
          password: newPass,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      // Update local state
      setCredentials(prev => prev ? { ...prev, password: newPass } : prev)
      setUsers(prev => prev.map(u =>
        u.id === credentials.userId ? { ...u, password: newPass } : u
      ))
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

  // ── CSV helpers ──────────────────────────────────────────────
  function parseCSV(text: string): { rows: Record<string, string>[]; errors: string[] } {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) return { rows: [], errors: ["CSV must have a header row and at least one data row"] }

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"))
    const required = ["name", "role"]
    const missing = required.filter(r => !headers.includes(r))
    if (missing.length) return { rows: [], errors: [`Missing required columns: ${missing.join(", ")}`] }

    const errors: string[] = []
    const rows: Record<string, string>[] = []

    for (let i = 1; i < lines.length; i++) {
      // Handle quoted commas in CSV
      const values: string[] = []
      let current = ""
      let inQuote = false
      for (const ch of lines[i]) {
        if (ch === '"') { inQuote = !inQuote; continue }
        if (ch === ',' && !inQuote) { values.push(current.trim()); current = ""; continue }
        current += ch
      }
      values.push(current.trim())

      if (values.length !== headers.length) {
        errors.push(`Row ${i}: expected ${headers.length} columns, got ${values.length}`)
        continue
      }

      const row: Record<string, string> = {}
      headers.forEach((h, j) => { row[h] = values[j] })

      // Basic validation
      if (!row.name?.trim()) { errors.push(`Row ${i}: name is empty`); continue }
      if (row.role && !["student", "faculty"].includes(row.role.toLowerCase())) {
        errors.push(`Row ${i}: role must be "student" or "faculty", got "${row.role}"`)
        continue
      }
      row.role = row.role.toLowerCase()

      rows.push(row)
    }

    return { rows, errors }
  }

  function handleCSVFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvErrors([])
    setCsvRows([])
    setImportResults(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { rows, errors } = parseCSV(text)
      setCsvRows(rows)
      setCsvErrors(errors)
    }
    reader.readAsText(file)
    // Reset file input so the same file can be re-selected
    e.target.value = ""
  }

  function buildImportPayload() {
    return csvRows.map(row => {
      const name = row.name.trim()
      const role = row.role as "student" | "faculty"

      // Auto-generate email/password if not provided
      const creds = generateCredentials(name, role)
      const email    = row.email?.trim()    || creds.email
      const password = row.password?.trim()  || creds.password

      // Resolve dept_id from name if needed
      let dept_id: string | null = row.dept_id?.trim() || null
      if (!dept_id && row.department?.trim()) {
        const match = depts.find(d =>
          d.name.toLowerCase() === row.department.trim().toLowerCase() ||
          d.code?.toLowerCase() === row.department.trim().toLowerCase()
        )
        if (match) dept_id = match.id
      }

      return {
        name,
        email,
        password,
        role,
        dept_id,
        phone:       row.phone?.trim()       || null,
        status:      (row.status?.trim() as "active" | "inactive") || "active",
        enrolled_at: row.enrolled_at?.trim()  || new Date().toISOString().split("T")[0],
      }
    })
  }

  async function handleBulkImport() {
    setImporting(true)
    setImportProgress(0)
    setImportResults(null)

    try {
      const payload = buildImportPayload()

      // Send in batches of 50
      const BATCH = 50
      const allResults: typeof importResults = []
      let totalCreated = 0, totalFailed = 0

      for (let i = 0; i < payload.length; i += BATCH) {
        const batch = payload.slice(i, i + BATCH)
        const res = await fetch("/api/users/bulk-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ users: batch }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)

        // Adjust row numbers to be global
        const adjusted = (json.results as typeof allResults)!.map((r: any) => ({
          ...r,
          row: r.row + i,
        }))
        allResults!.push(...adjusted)
        totalCreated += json.created
        totalFailed  += json.failed
        setImportProgress(Math.round(((i + batch.length) / payload.length) * 100))
      }

      setImportResults(allResults)
      setImportProgress(100)

      // Reload users list
      if (totalCreated > 0) await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setImporting(false)
    }
  }

  function downloadTemplate() {
    const header = "name,role,department,email,password,phone,status,enrolled_at"
    const sample1 = "Aarav Sharma,student,Computer Science,,,+91 98765 43210,active,2024-08-01"
    const sample2 = "Priya Gupta,faculty,Computer Science,,,+91 87654 32109,active,2023-07-15"
    const csv = [header, sample1, sample2].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "users-import-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Bulk selection helpers ───────────────────────────────────
  const allPageSelected = paginated.length > 0 && paginated.every(u => selected.has(u.id))
  const someSelected    = selected.size > 0

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        paginated.forEach(u => next.delete(u.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        paginated.forEach(u => next.add(u.id))
        return next
      })
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleBulkDelete() {
    setBulkDeleting(true)
    try {
      const ids = Array.from(selected)
      const usersToDelete = users.filter(u => ids.includes(u.id))
      let deleted = 0

      for (const u of usersToDelete) {
        try {
          await deleteUser(u.id, u.email)
          deleted++
        } catch (e: any) {
          console.error(`Failed to delete ${u.name}:`, e.message)
        }
      }

      if (deleted > 0) {
        setUsers(prev => prev.filter(u => !selected.has(u.id)))
        setSelected(new Set())
      }
      setBulkDeleteOpen(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBulkDeleting(false)
    }
  }

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="admin"
      userName="Admin"
      avatarUrl={me.user?.avatar_url}
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
                  variant="outline" size="sm"
                  onClick={() => { setImportOpen(true); setCsvRows([]); setCsvErrors([]); setImportResults(null) }}
                  className="h-8 gap-1.5 text-xs font-semibold"
                >
                  <Upload className="h-3.5 w-3.5" /> Import CSV
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

          {/* ── Bulk action bar ──────────────────────────────── */}
          {someSelected && (
            <div className="mx-4 mb-2 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">{selected.size} selected</span>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => setSelected(new Set())}
                  className="h-7 text-xs"
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => setBulkDeleteOpen(true)}
                  className="h-7 bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5"
                >
                  <Trash2 className="h-3 w-3" /> Delete Selected
                </Button>
              </div>
            </div>
          )}

          {/* ── Table ───────────────────────────────────────── */}
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="w-10 pl-4">
                      <Checkbox
                        checked={allPageSelected}
                        onCheckedChange={toggleSelectAll}
                        className="border-gray-300"
                      />
                    </TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">User</TableHead>
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
                          {Array.from({ length: 8 }).map((_, j) => (
                            <TableCell key={j} className={j === 0 ? "pl-4 w-10" : j === 7 ? "pr-6" : ""}>
                              <Skeleton className="h-5 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : paginated.length === 0
                      ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-16 text-gray-400 text-sm">
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
                            className={`hover:bg-gray-50/60 transition-colors ${selected.has(user.id) ? "bg-blue-50/40" : ""}`}
                          >
                            {/* Checkbox */}
                            <TableCell className="pl-4 w-10">
                              <Checkbox
                                checked={selected.has(user.id)}
                                onCheckedChange={() => toggleSelect(user.id)}
                                className="border-gray-300"
                              />
                            </TableCell>

                            {/* User */}
                            <TableCell className="py-3">
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
                                      password: user.password || "Not available",
                                      userId:   user.id,
                                      email:    user.email,
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-xs text-gray-400 font-semibold mb-1">Login ID</p>
                <p className="text-sm font-mono font-bold text-gray-800 break-all">{credentials.loginId}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-xs text-gray-400 font-semibold mb-1">Password</p>
                {credentials.password === "Not available" ? (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400 italic">Not available</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleResetPassword}
                      disabled={saving}
                      className="h-7 text-xs gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      {saving
                        ? <><Loader2 className="h-3 w-3 animate-spin" /> Resetting...</>
                        : <><RefreshCw className="h-3 w-3" /> Reset Password</>
                      }
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm font-mono font-bold text-gray-800 break-all">{credentials.password}</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCredOpen(false)}>Close</Button>
            <Button
              size="sm"
              onClick={copyCredentials}
              disabled={credentials?.password === "Not available"}
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

      {/* ════ BULK DELETE CONFIRM ════ */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" /> Delete {selected.size} Users
            </DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{selected.size} users</strong> and all their data (attendance, registrations, fees). This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
            >
              {bulkDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ IMPORT CSV DIALOG ════ */}
      <Dialog open={importOpen} onOpenChange={v => { if (!importing) setImportOpen(v) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" /> Bulk Import Users
            </DialogTitle>
            <DialogDescription>
              Upload a CSV file to add multiple students or faculty at once. Email &amp; password are auto-generated if left blank.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">

            {/* Step 1 — Upload */}
            {!importResults && (
              <>
                <div className="flex items-center gap-3">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVFile}
                      className="hidden"
                      disabled={importing}
                    />
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                      <Upload className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Choose CSV file</p>
                        <p className="text-xs text-gray-400">or drag and drop</p>
                      </div>
                    </div>
                  </label>
                  <Button
                    variant="outline" size="sm"
                    onClick={downloadTemplate}
                    className="h-9 gap-1.5 text-xs shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" /> Template
                  </Button>
                </div>

                {/* CSV format hint */}
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs font-bold text-gray-600 mb-1">CSV Format</p>
                  <p className="text-xs text-gray-500 font-mono">
                    name, role, department, email, password, phone, status, enrolled_at
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Required: <strong>name</strong>, <strong>role</strong> (student/faculty). Department matches by name or code. Other fields are optional.
                  </p>
                </div>

                {/* Errors from parsing */}
                {csvErrors.length > 0 && (
                  <div className="bg-red-50 rounded-xl p-3 border border-red-200 space-y-1">
                    <p className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5" /> {csvErrors.length} issue{csvErrors.length > 1 ? "s" : ""} found
                    </p>
                    {csvErrors.slice(0, 10).map((err, i) => (
                      <p key={i} className="text-xs text-red-600">{err}</p>
                    ))}
                    {csvErrors.length > 10 && (
                      <p className="text-xs text-red-400">...and {csvErrors.length - 10} more</p>
                    )}
                  </div>
                )}

                {/* Preview */}
                {csvRows.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-700">
                        <CheckCircle2 className="inline h-3.5 w-3.5 text-emerald-600 mr-1" />
                        {csvRows.length} user{csvRows.length > 1 ? "s" : ""} ready to import
                      </p>
                    </div>

                    <div className="border rounded-xl overflow-hidden">
                      <div className="overflow-x-auto max-h-56">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="px-3 py-2 text-left font-bold text-gray-600">#</th>
                              <th className="px-3 py-2 text-left font-bold text-gray-600">Name</th>
                              <th className="px-3 py-2 text-left font-bold text-gray-600">Role</th>
                              <th className="px-3 py-2 text-left font-bold text-gray-600">Dept</th>
                              <th className="px-3 py-2 text-left font-bold text-gray-600">Email</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvRows.slice(0, 20).map((row, i) => (
                              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                                <td className="px-3 py-1.5 font-semibold text-gray-800">{row.name}</td>
                                <td className="px-3 py-1.5">
                                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    row.role === "student" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                                  }`}>
                                    {row.role}
                                  </span>
                                </td>
                                <td className="px-3 py-1.5 text-gray-500">{row.department || row.dept_id || "—"}</td>
                                <td className="px-3 py-1.5 text-gray-400 font-mono">{row.email || "auto"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {csvRows.length > 20 && (
                        <p className="text-center py-2 text-xs text-gray-400 bg-gray-50 border-t">
                          ...and {csvRows.length - 20} more rows
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                {importing && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <p className="text-sm font-semibold text-gray-700">Importing... {importProgress}%</p>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                  </div>
                )}
              </>
            )}

            {/* Step 2 — Results */}
            {importResults && (
              <div className="space-y-3">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total",   value: importResults.length, color: "text-gray-700", bg: "bg-gray-50" },
                    { label: "Created", value: importResults.filter(r => r.status === "ok").length, color: "text-emerald-700", bg: "bg-emerald-50" },
                    { label: "Failed",  value: importResults.filter(r => r.status === "error").length, color: "text-red-700", bg: "bg-red-50" },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                      <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Failed rows */}
                {importResults.some(r => r.status === "error") && (
                  <div className="bg-red-50 rounded-xl p-3 border border-red-200 space-y-1.5">
                    <p className="text-xs font-bold text-red-700">Failed rows:</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResults.filter(r => r.status === "error").map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                          <span>
                            <strong>Row {r.row}</strong> ({r.name}) — {r.error}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success rows */}
                {importResults.some(r => r.status === "ok") && (
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                    <p className="text-xs font-bold text-emerald-700 mb-1">
                      <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />
                      {importResults.filter(r => r.status === "ok").length} users created successfully
                    </p>
                    <p className="text-[10px] text-emerald-600">
                      Credentials were auto‑generated. You can view them in each user&apos;s &ldquo;View Credentials&rdquo; action.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-3 border-t">
            {!importResults ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setImportOpen(false)} disabled={importing}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkImport}
                  disabled={importing || csvRows.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  {importing
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Importing...</>
                    : <><Upload className="h-3.5 w-3.5" /> Import {csvRows.length} User{csvRows.length !== 1 ? "s" : ""}</>
                  }
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setImportOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}
