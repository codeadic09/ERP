"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Users, UserCheck, UserPlus, UserMinus, Send, Search,
  ShieldCheck, Calendar, GraduationCap, Layers, Building2,
  Loader2, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, XCircle, Info, Plus, ChevronRight, Mail, Phone,
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  getDepartments,
  getClassTeacherByFaculty,
  addClassTeacherRequest,
  getStudentsByDivision,
  updateStudentDivision,
  getUsersByRole,
} from "@/lib/db"
import type { User, Department, ClassTeacher } from "@/lib/types"

// ════════════════════════════════════════════════════════════════
export default function FacultyClassTeacherPage() {
  const authUser = useAuth("faculty")
  if (!authUser) return null

  /* ── State ──────────────────────────────────────────────── */
  const [me, setMe] = useState<User | null>(null)
  const [depts, setDepts] = useState<Department[]>([])
  const [myAssignments, setMyAssignments] = useState<ClassTeacher[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [allDeptStudents, setAllDeptStudents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  /* ── Active division (for approved class teacher) ──────── */
  const [activeCT, setActiveCT] = useState<ClassTeacher | null>(null)

  /* ── Request dialog ─────────────────────────────────────── */
  const [requestOpen, setRequestOpen] = useState(false)
  const [reqSection, setReqSection] = useState("A")
  const [reqSemester, setReqSemester] = useState("4")
  const [reqMsg, setReqMsg] = useState("")
  const [requesting, setRequesting] = useState(false)

  /* ── Add student dialog ─────────────────────────────────── */
  const [addOpen, setAddOpen] = useState(false)
  const [searchQ, setSearchQ] = useState("")
  const [assigning, setAssigning] = useState<string | null>(null)

  /* ── Remove confirm ─────────────────────────────────────── */
  const [removeStudent, setRemoveStudent] = useState<User | null>(null)
  const [removing, setRemoving] = useState(false)

  // ── Load ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const user = authUser.user; setMe(user)
      if (!user?.dept_id) return
      const [deps, cts] = await Promise.all([
        getDepartments(),
        getClassTeacherByFaculty(user.id, user.dept_id),
      ])
      setDepts(deps); setMyAssignments(cts)

      // Auto-select first approved assignment
      const approved = cts.filter(c => c.status === "approved")
      if (approved.length > 0 && !activeCT) {
        setActiveCT(approved[0])
      }
    } catch (e: any) { setError(e.message ?? "Failed to load") }
    finally { setLoading(false) }
  }, [authUser.user])

  useEffect(() => { if (authUser.user) load() }, [authUser.user, load])

  // ── Load students when active CT changes ──────────────────
  useEffect(() => {
    if (!activeCT || !me?.dept_id) return
    async function fetchStudents() {
      try {
        const [divStudents, allStudents] = await Promise.all([
          getStudentsByDivision(activeCT!.dept_id, activeCT!.section, activeCT!.semester),
          getStudentsByDivision(activeCT!.dept_id),
        ])
        setStudents(divStudents)
        setAllDeptStudents(allStudents)
      } catch {}
    }
    fetchStudents()
  }, [activeCT, me])

  // ── Derived ───────────────────────────────────────────────
  const myDept = useMemo(() => depts.find(d => d.id === me?.dept_id) ?? null, [depts, me])
  const approvedCTs = useMemo(() => myAssignments.filter(c => c.status === "approved"), [myAssignments])
  const pendingCTs = useMemo(() => myAssignments.filter(c => c.status === "pending"), [myAssignments])
  const rejectedCTs = useMemo(() => myAssignments.filter(c => c.status === "rejected"), [myAssignments])

  // Students NOT in this division (available to add)
  const availableStudents = useMemo(() => {
    const inDiv = new Set(students.map(s => s.id))
    return allDeptStudents
      .filter(s => !inDiv.has(s.id))
      .filter(s => {
        if (!searchQ.trim()) return true
        const q = searchQ.toLowerCase()
        return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      })
  }, [allDeptStudents, students, searchQ])

  // ── Request class teacher ─────────────────────────────────
  async function handleRequest() {
    if (!me?.dept_id) return; setRequesting(true)
    try {
      const ct = await addClassTeacherRequest({
        faculty_id: me.id, dept_id: me.dept_id,
        section: reqSection, semester: parseInt(reqSemester),
        message: reqMsg.trim() || undefined,
      })
      setMyAssignments(prev => [...prev, ct])
      setRequestOpen(false); setReqMsg("")
      setSuccess("Request sent! Waiting for admin approval.")
      setTimeout(() => setSuccess(null), 4000)
    } catch (e: any) { setError(e.message) }
    finally { setRequesting(false) }
  }

  // ── Add student to division ───────────────────────────────
  async function handleAddStudent(studentId: string) {
    if (!activeCT) return; setAssigning(studentId)
    try {
      const updated = await updateStudentDivision(studentId, {
        section: activeCT.section, semester: activeCT.semester,
      })
      setStudents(prev => [...prev, updated])
      setAllDeptStudents(prev => prev.map(s => s.id === studentId ? updated : s))
      setSuccess(`Student added to Sec ${activeCT.section}`)
      setTimeout(() => setSuccess(null), 2500)
    } catch (e: any) { setError(e.message) }
    finally { setAssigning(null) }
  }

  // ── Remove student from division ──────────────────────────
  async function handleRemoveStudent() {
    if (!removeStudent) return; setRemoving(true)
    try {
      const updated = await updateStudentDivision(removeStudent.id, {
        section: undefined, semester: undefined,
      })
      setStudents(prev => prev.filter(s => s.id !== removeStudent.id))
      setAllDeptStudents(prev => prev.map(s => s.id === removeStudent.id ? updated : s))
      setRemoveStudent(null)
      setSuccess("Student removed from division.")
      setTimeout(() => setSuccess(null), 2500)
    } catch (e: any) { setError(e.message) }
    finally { setRemoving(false) }
  }

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="faculty"
      userName={me?.name ?? "Faculty"}
      avatarUrl={me?.avatar_url}
      pageTitle="Class Teacher"
      pageSubtitle={`Manage your division students — ${myDept?.name ?? "Department"}`}
      loading={loading}
    >
      <div className="p-4 sm:p-6 md:p-8 space-y-5 w-full min-w-0">

        {/* Toasts */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />{error}
            <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />{success}
          </div>
        )}

        {/* ── Status & request banner ─────────────────────── */}
        <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm overflow-hidden">
          <div className={`h-1 ${approvedCTs.length > 0 ? "bg-emerald-500" : pendingCTs.length > 0 ? "bg-amber-400" : "bg-blue-400"}`} />
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  approvedCTs.length > 0 ? "bg-emerald-50 border border-emerald-200" : "bg-blue-50 border border-blue-200"
                }`}>
                  {approvedCTs.length > 0 ? <UserCheck className="h-5 w-5 text-emerald-600" /> : <Users className="h-5 w-5 text-blue-600" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {approvedCTs.length > 0 ? `Class Teacher — ${approvedCTs.length} Division${approvedCTs.length > 1 ? "s" : ""}`
                      : pendingCTs.length > 0 ? "Request Pending"
                      : "Class Teacher Assignment"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {approvedCTs.length > 0
                      ? `You manage students for ${approvedCTs.map(c => `Sem ${c.semester} Sec ${c.section}`).join(", ")} in ${myDept?.name ?? "your department"}.`
                      : pendingCTs.length > 0 ? "Your request is being reviewed by an admin."
                      : "Request admin approval to become class teacher for a division."}
                  </p>
                  {rejectedCTs.length > 0 && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {rejectedCTs.length} rejected request{rejectedCTs.length > 1 ? "s" : ""}: {rejectedCTs.map(c => c.admin_note || "No reason").join("; ")}
                    </p>
                  )}
                </div>
              </div>
              <Button size="sm" onClick={() => setRequestOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs shrink-0">
                <Send className="h-3.5 w-3.5" /> Request Division
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Division picker (for approved CTs) ─────────── */}
        {approvedCTs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Layers className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-600">Your Divisions:</span>
            {approvedCTs.map(ct => (
              <button
                key={ct.id}
                onClick={() => setActiveCT(ct)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeCT?.id === ct.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                Sem {ct.semester} · Sec {ct.section}
              </button>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
             STUDENT LIST (approved class teacher only)
           ══════════════════════════════════════════════════ */}
        {activeCT && (
          <>
            {/* Toolbar */}
            <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 font-bold">
                        Sem {activeCT.semester}
                      </span>
                      <span className="text-[10px] px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 font-bold">
                        Sec {activeCT.section}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      <span className="font-bold text-gray-800">{students.length}</span> students
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => { setSearchQ(""); setAddOpen(true) }}
                      className="h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-semibold">
                      <UserPlus className="h-3.5 w-3.5" /> Add Students
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={load}>
                      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student list */}
            {students.length === 0 ? (
              <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
                <CardContent className="py-16 flex flex-col items-center gap-3 text-gray-400">
                  <Users className="h-10 w-10 text-gray-200" />
                  <p className="text-sm font-medium">No students in this division yet</p>
                  <p className="text-xs text-gray-300">Click &quot;Add Students&quot; to assign students to Sem {activeCT.semester} Sec {activeCT.section}.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {students.map(student => (
                  <Card key={student.id} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm group hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 border border-blue-200 flex items-center justify-center shrink-0">
                          <span className="text-sm font-black text-blue-700">
                            {student.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{student.name}</p>
                          <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {student.email}
                          </p>
                          {student.phone && (
                            <p className="text-[11px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" /> {student.phone}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setRemoveStudent(student)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50"
                          title="Remove from division"
                        >
                          <UserMinus className="h-3.5 w-3.5 text-red-400" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* No approved — info */}
        {!loading && approvedCTs.length === 0 && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-700 space-y-1">
              <p className="font-bold">How Class Teacher Works</p>
              <p>1. Request a division (semester + section) — admin approves it.</p>
              <p>2. Once approved, you can see and manage the student list for your division.</p>
              <p>3. Add students from your department to your section — they&apos;ll automatically see you as their class teacher.</p>
            </div>
          </div>
        )}
      </div>

      {/* ════ REQUEST DIVISION DIALOG ════ */}
      <Dialog open={requestOpen} onOpenChange={o => { if (!o) setRequestOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-blue-600" />
              </div>
              Request Class Teacher Assignment
            </DialogTitle>
            <DialogDescription>
              Ask admin to assign you as the class teacher for a specific division in <strong>{myDept?.name ?? "your department"}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Semester *</Label>
                <Select value={reqSemester} onValueChange={setReqSemester}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Section *</Label>
                <Select value={reqSection} onValueChange={setReqSection}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["A", "B", "C", "D", "E", "F"].map(s => (
                      <SelectItem key={s} value={s}>Section {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Message to Admin (optional)</Label>
              <Textarea
                placeholder="e.g. I'm the class teacher for AIDS Sem 4 Sec A…"
                value={reqMsg} onChange={e => setReqMsg(e.target.value)}
                rows={3} className="resize-none text-sm" maxLength={500}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
            <Button onClick={handleRequest} disabled={requesting}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              {requesting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...</> : <><Send className="h-3.5 w-3.5" /> Send Request</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ ADD STUDENTS DIALOG ════ */}
      <Dialog open={addOpen} onOpenChange={o => { if (!o) setAddOpen(false) }}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-emerald-600" />
              </div>
              Add Students — Sem {activeCT?.semester} Sec {activeCT?.section}
            </DialogTitle>
            <DialogDescription>
              Assign students from {myDept?.name} to this division. Students not yet in any section are shown.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search by name or email…"
              value={searchQ} onChange={e => setSearchQ(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex-1 overflow-auto min-h-0 space-y-1 mt-2">
            {availableStudents.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                <p className="text-xs font-medium">No available students found</p>
                <p className="text-[10px] text-gray-300">All department students might already be assigned.</p>
              </div>
            ) : (
              availableStudents.map(student => (
                <div key={student.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50/50 transition-colors border border-transparent hover:border-blue-100"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-600">
                    {student.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{student.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{student.email}</p>
                    {student.section && student.semester && (
                      <p className="text-[10px] text-amber-500 mt-0.5">Currently in Sem {student.semester} Sec {student.section}</p>
                    )}
                  </div>
                  <Button size="sm" variant="outline"
                    disabled={assigning === student.id}
                    onClick={() => handleAddStudent(student.id)}
                    className="h-7 text-[10px] font-semibold gap-1 shrink-0"
                  >
                    {assigning === student.id
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Plus className="h-3 w-3" />
                    }
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ════ REMOVE STUDENT DIALOG ════ */}
      <Dialog open={!!removeStudent} onOpenChange={o => { if (!o) setRemoveStudent(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Remove Student
            </DialogTitle>
            <DialogDescription>
              Remove <strong>{removeStudent?.name}</strong> from Sem {activeCT?.semester} Sec {activeCT?.section}?
              Their section and semester will be cleared.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setRemoveStudent(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemoveStudent} disabled={removing}>
              {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <UserMinus className="h-3.5 w-3.5 mr-2" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}
