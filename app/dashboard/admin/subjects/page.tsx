"use client"

import { useAuth }        from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo } from "react"
import {
  Plus, Edit3, Trash2, Search, BookOpen,
  Loader2, RefreshCw, AlertTriangle,
  MoreVertical, Building2, GraduationCap,
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button }          from "@/components/ui/button"
import { Input }           from "@/components/ui/input"
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
  getSubjects, addSubject, updateSubject,
  deleteSubject, getDepartments, getUsersByRole,
  getFacultySubjects, setSubjectFaculty,
} from "@/lib/db"
import type { Subject, Department, User, FacultySubject } from "@/lib/types"

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

// ─── Form state type & default ──────────────────────────────────────────
type SubjectFormData = { name: string; code: string; semester: string; dept_id: string; faculty_ids: string[] }
const emptyForm: SubjectFormData = { name: "", code: "", semester: "", dept_id: "", faculty_ids: [] }

// ─── SubjectForm — defined OUTSIDE SubjectsPage to prevent focus loss ──
interface SubjectFormProps {
  form:            SubjectFormData
  setForm:         React.Dispatch<React.SetStateAction<SubjectFormData>>
  filteredFaculty: User[]
  toggleFaculty:   (fid: string) => void
  depts:           Department[]
}

function SubjectForm({ form, setForm, filteredFaculty, toggleFaculty, depts }: SubjectFormProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">

      {/* Name */}
      <div className="col-span-2 space-y-1.5">
        <Label className="text-xs font-semibold">Subject Name *</Label>
        <Input
          placeholder="e.g. Data Structures & Algorithms"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="h-9 text-sm"
        />
      </div>

      {/* Code */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Subject Code *</Label>
        <Input
          placeholder="e.g. CS301"
          value={form.code}
          onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
          className="h-9 text-sm font-mono"
          maxLength={10}
        />
      </div>

      {/* Semester */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Semester</Label>
        <Select
          value={form.semester}
          onValueChange={v => setForm(f => ({ ...f, semester: v }))}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {[1,2,3,4,5,6,7,8].map(n => (
              <SelectItem key={n} value={String(n)}>Semester {n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Department */}
      <div className="col-span-2 space-y-1.5">
        <Label className="text-xs font-semibold">Department *</Label>
        <Select
          value={form.dept_id}
          onValueChange={v => setForm(f => ({ ...f, dept_id: v, faculty_id: "" }))}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {depts.map(d => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Faculty (multi-select checkboxes) */}
      <div className="col-span-2 space-y-1.5">
        <Label className="text-xs font-semibold">
          Assign Faculty {form.faculty_ids.length > 0 && <span className="text-blue-600">({form.faculty_ids.length})</span>}
        </Label>
        {!form.dept_id ? (
          <p className="text-xs text-gray-400 italic py-2">Select a department first</p>
        ) : filteredFaculty.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-2">No faculty in this department</p>
        ) : (
          <div className="border rounded-lg max-h-36 overflow-y-auto divide-y divide-gray-50">
            {filteredFaculty.map(f => {
              const checked = form.faculty_ids.includes(f.id)
              return (
                <label
                  key={f.id}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                    checked ? "bg-blue-50/60" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFaculty(f.id)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-[9px] font-black text-purple-700 shrink-0">
                    {f.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">{f.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{f.email}</p>
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

export default function SubjectsPage() {
  const me = useAuth("admin")
  if (!me) return null

  const [subjects,  setSubjects]  = useState<Subject[]>([])
  const [depts,     setDepts]     = useState<Department[]>([])
  const [faculty,   setFaculty]   = useState<User[]>([])
  const [fsLinks,   setFsLinks]   = useState<FacultySubject[]>([])  // junction rows
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const [search,     setSearch]     = useState("")
  const [filterDept, setFilterDept] = useState("all")

  const [addOpen,    setAddOpen]    = useState(false)
  const [editOpen,   setEditOpen]   = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected,   setSelected]   = useState<Subject | null>(null)
  const [form,       setForm]       = useState<SubjectFormData>(emptyForm)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [s, d, f, fs] = await Promise.all([
        getSubjects(),
        getDepartments(),
        getUsersByRole("faculty"),
        getFacultySubjects(),
      ])
      setSubjects(s)
      setDepts(d)
      setFaculty(f)
      setFsLinks(fs)
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Faculty assigned to a given subject (from junction table)
  function facultyForSubject(subjectId: string): User[] {
    return fsLinks
      .filter(fs => fs.subject_id === subjectId && fs.users)
      .map(fs => fs.users!)
  }

  // Faculty filtered by selected dept in form
  const filteredFaculty = useMemo(() => {
    if (!form.dept_id) return faculty
    return faculty.filter(f => f.dept_id === form.dept_id)
  }, [faculty, form.dept_id])

  function toggleFaculty(fid: string) {
    setForm(f => ({
      ...f,
      faculty_ids: f.faculty_ids.includes(fid)
        ? f.faculty_ids.filter(id => id !== fid)
        : [...f.faculty_ids, fid],
    }))
  }

  const filtered = useMemo(() => {
    return subjects.filter(s => {
      const q = search.toLowerCase()
      if (q && !s.name.toLowerCase().includes(q) &&
               !s.code.toLowerCase().includes(q)) return false
      if (filterDept !== "all" && s.dept_id !== filterDept) return false
      return true
    })
  }, [subjects, search, filterDept])

  function openAdd() {
    setForm(emptyForm)
    setAddOpen(true)
  }

  function openEdit(s: Subject) {
    setSelected(s)
    const assignedIds = fsLinks
      .filter(fs => fs.subject_id === s.id)
      .map(fs => fs.faculty_id)
    setForm({
      name:        s.name,
      code:        s.code,
      dept_id:     s.dept_id,
      faculty_ids: assignedIds,
      semester:    s.semester?.toString() ?? "",
    })
    setEditOpen(true)
  }

  function openDelete(s: Subject) {
    setSelected(s)
    setDeleteOpen(true)
  }

  async function handleAdd() {
    if (!form.name || !form.code || !form.dept_id) return
    setSaving(true)
    try {
      const s = await addSubject({
        name:       form.name,
        code:       form.code.toUpperCase(),
        dept_id:    form.dept_id,
        faculty_id: form.faculty_ids[0] || null,
        semester:   form.semester ? parseInt(form.semester) : null,
      })
      // Save multi-faculty via junction table
      if (form.faculty_ids.length) {
        await setSubjectFaculty(s.id, form.faculty_ids)
      }
      setSubjects(prev => [s, ...prev])
      // Reload junction links
      const fs = await getFacultySubjects()
      setFsLinks(fs)
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
      const updated = await updateSubject(selected.id, {
        name:       form.name,
        code:       form.code.toUpperCase(),
        dept_id:    form.dept_id,
        faculty_id: form.faculty_ids[0] || null,
        semester:   form.semester ? parseInt(form.semester) : null,
      })
      // Update multi-faculty via junction table
      await setSubjectFaculty(selected.id, form.faculty_ids)
      setSubjects(prev => prev.map(s => s.id === updated.id ? updated : s))
      // Reload junction links
      const fs = await getFacultySubjects()
      setFsLinks(fs)
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
      await deleteSubject(selected.id)
      setSubjects(prev => prev.filter(s => s.id !== selected.id))
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
      avatarUrl={me.user?.avatar_url}
      pageTitle="Subjects"
      pageSubtitle="Manage subjects and faculty assignments"
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

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Subjects",  value: subjects.length,                                                       icon: BookOpen,      color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100"   },
            { label: "Assigned",        value: subjects.filter(s => facultyForSubject(s.id).length > 0).length,       icon: GraduationCap, color: "text-emerald-600",bg: "bg-emerald-50",border: "border-emerald-100" },
            { label: "Unassigned",      value: subjects.filter(s => facultyForSubject(s.id).length === 0).length,     icon: AlertTriangle, color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-100"  },
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

        {/* Main card */}
        <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
          <CardHeader className="pb-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">

              {/* Search + filter */}
              <div className="flex flex-wrap gap-2 flex-1 min-w-0">
                <div className="relative min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Search subjects..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-8 text-xs"
                  />
                </div>
                <Select value={filterDept} onValueChange={setFilterDept}>
                  <SelectTrigger className="h-8 text-xs w-48">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {depts.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={load} className="h-8 w-8 p-0" title="Refresh">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </Button>
                <Button
                  size="sm" onClick={openAdd}
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Subject
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-xs font-bold text-gray-600 pl-6">Subject</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Department</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Semester</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Assigned Faculty</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 pr-6 text-right">Actions</TableHead>
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
                    : filtered.length === 0
                      ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-16 text-gray-400 text-sm">
                            <div className="flex flex-col items-center gap-2">
                              <BookOpen className="h-8 w-8 text-gray-200" />
                              No subjects found
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                      : filtered.map(subject => (
                          <TableRow key={subject.id} className="hover:bg-gray-50/60 transition-colors">

                            {/* Subject */}
                            <TableCell className="pl-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                                  <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">{subject.name}</p>
                                  <p className="text-xs font-mono text-gray-400">{subject.code}</p>
                                </div>
                              </div>
                            </TableCell>

                            {/* Department */}
                            <TableCell>
                              {subject.departments ? (
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ background: subject.departments.color ?? "#3B82F6" }}
                                  />
                                  <span className="text-sm text-gray-600">{subject.departments.name}</span>
                                </div>
                              ) : "—"}
                            </TableCell>

                            {/* Semester */}
                            <TableCell>
                              {subject.semester
                                ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">Sem {subject.semester}</span>
                                : <span className="text-gray-400 text-sm">—</span>
                              }
                            </TableCell>

                            {/* Faculty (many-to-many) */}
                            <TableCell>
                              {(() => {
                                const assigned = facultyForSubject(subject.id)
                                if (assigned.length === 0) {
                                  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Unassigned</span>
                                }
                                return (
                                  <div className="flex flex-wrap gap-1.5">
                                    {assigned.slice(0, 3).map(f => (
                                      <div key={f.id} className="flex items-center gap-1.5 bg-purple-50 rounded-full pl-0.5 pr-2 py-0.5">
                                        <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-[8px] font-black text-purple-700">
                                          {f.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                                        </div>
                                        <span className="text-xs text-purple-700 font-medium">{f.name.split(" ")[0]}</span>
                                      </div>
                                    ))}
                                    {assigned.length > 3 && (
                                      <span className="text-xs text-gray-400 self-center">+{assigned.length - 3}</span>
                                    )}
                                  </div>
                                )
                              })()}
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="pr-6 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="text-xs w-36">
                                  <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openEdit(subject)}>
                                    <Edit3  className="h-3.5 w-3.5 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => openDelete(subject)}
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
          </CardContent>
        </Card>
      </div>

      {/* ════ ADD DIALOG ════ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" /> Add Subject
            </DialogTitle>
            <DialogDescription>
              Faculty dropdown filters by selected department.
            </DialogDescription>
          </DialogHeader>
          <SubjectForm form={form} setForm={setForm} filteredFaculty={filteredFaculty} toggleFaculty={toggleFaculty} depts={depts} />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
            <Button
              size="sm" onClick={handleAdd}
              disabled={saving || !form.name || !form.code || !form.dept_id}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Add Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ EDIT DIALOG ════ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-blue-600" /> Edit Subject
            </DialogTitle>
          </DialogHeader>
          <SubjectForm form={form} setForm={setForm} filteredFaculty={filteredFaculty} toggleFaculty={toggleFaculty} depts={depts} />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button
              size="sm" onClick={handleEdit}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ DELETE DIALOG ════ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" /> Delete Subject
            </DialogTitle>
            <DialogDescription>
              Permanently delete <strong>{selected?.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)} disabled={saving}>Cancel</Button>
            <Button
              size="sm" onClick={handleDelete}
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
