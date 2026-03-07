"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  Calendar, Clock, Plus, Trash2, AlertTriangle,
  CheckCircle2, Loader2, RefreshCw, ChevronRight,
  Users, BookOpen, GraduationCap, Building2,
  ShieldCheck, Send, Info, X, AlertCircle, Edit3,
  Upload, Download, FileSpreadsheet, Filter, Layers,
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  getTimetableSlots,
  getTimetableSlotsByFaculty,
  getTimetableRequestByFaculty,
  addTimetableRequest,
  addTimetableSlot,
  deleteTimetableSlot,
  deleteTimetableSlotsBySection,
  checkFacultyConflict,
  bulkAddTimetableSlots,
  getSubjectsByDept,
  getUsersByRole,
  getDepartments,
} from "@/lib/db"
import type {
  User, Department, Subject,
  TimetableSlot, TimetableRequest,
} from "@/lib/types"
import * as XLSX from "xlsx"

// ─── Constants ──────────────────────────────────────────────────
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DAY_MAP: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
  mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6,
}
const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00",
]

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}
function fmtTime(t: string) { return t.slice(0, 5) }

const SUBJECT_COLORS = [
  { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700",    dot: "bg-blue-500"    },
  { bg: "bg-purple-50",  border: "border-purple-200",  text: "text-purple-700",  dot: "bg-purple-500"  },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-500"   },
  { bg: "bg-pink-50",    border: "border-pink-200",    text: "text-pink-700",    dot: "bg-pink-500"    },
  { bg: "bg-cyan-50",    border: "border-cyan-200",    text: "text-cyan-700",    dot: "bg-cyan-500"    },
  { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700",     dot: "bg-red-500"     },
  { bg: "bg-indigo-50",  border: "border-indigo-200",  text: "text-indigo-700",  dot: "bg-indigo-500"  },
]

type Tab = "schedule" | "build"

// ── Fuzzy matching helpers ────────────────────────────────────
function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function fuzzyFindSubject(input: string, subjects: Subject[]): { subject: Subject; quality: "exact" | "fuzzy" } | null {
  const q = input.toLowerCase().trim()
  if (!q) return null
  // 1. Exact code/name match
  const exact = subjects.find(s => s.code.toLowerCase() === q || s.name.toLowerCase() === q)
  if (exact) return { subject: exact, quality: "exact" }
  // 2. Normalised match (strip special chars)
  const nq = normalize(q)
  const normMatch = subjects.find(s => normalize(s.code) === nq || normalize(s.name) === nq)
  if (normMatch) return { subject: normMatch, quality: "fuzzy" }
  // 3. Partial — input contained in subject or vice-versa
  const partial = subjects.find(s =>
    s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) ||
    q.includes(s.code.toLowerCase()) || q.includes(s.name.toLowerCase())
  )
  if (partial) return { subject: partial, quality: "fuzzy" }
  // 4. Normalised partial
  const normPartial = subjects.find(s =>
    normalize(s.code).includes(nq) || normalize(s.name).includes(nq) ||
    nq.includes(normalize(s.code)) || nq.includes(normalize(s.name))
  )
  if (normPartial) return { subject: normPartial, quality: "fuzzy" }
  // 5. Word-based: any significant word overlap
  const qWords = q.split(/\s+/).filter(w => w.length > 2)
  if (qWords.length > 0) {
    const wordMatch = subjects.find(s => {
      const sWords = s.name.toLowerCase().split(/\s+/)
      return qWords.some(qw => sWords.some(sw => sw.includes(qw) || qw.includes(sw)))
    })
    if (wordMatch) return { subject: wordMatch, quality: "fuzzy" }
  }
  return null
}

function fuzzyFindFaculty(input: string, faculty: User[]): { user: User; quality: "exact" | "fuzzy" } | null {
  const q = input.toLowerCase().trim()
  if (!q) return null
  // 1. Exact name/email
  const exact = faculty.find(f => f.name.toLowerCase() === q || f.email.toLowerCase() === q)
  if (exact) return { user: exact, quality: "exact" }
  // 2. Normalised match
  const nq = normalize(q)
  const normMatch = faculty.find(f => normalize(f.name) === nq || normalize(f.email.split("@")[0]) === nq)
  if (normMatch) return { user: normMatch, quality: "fuzzy" }
  // 3. Partial — name contains input or vice-versa
  const partial = faculty.find(f =>
    f.name.toLowerCase().includes(q) || q.includes(f.name.toLowerCase())
  )
  if (partial) return { user: partial, quality: "fuzzy" }
  // 4. Word-based (last name, first name, etc.)
  const qWords = q.split(/\s+/).filter(w => w.length > 1)
  if (qWords.length > 0) {
    // Try matching all query words
    const allWordsMatch = faculty.find(f => {
      const fLower = f.name.toLowerCase()
      return qWords.every(qw => fLower.includes(qw))
    })
    if (allWordsMatch) return { user: allWordsMatch, quality: "fuzzy" }
    // Try matching any significant word (>2 chars)
    const anyWordMatch = faculty.find(f => {
      const fWords = f.name.toLowerCase().split(/\s+/)
      return qWords.filter(w => w.length > 2).some(qw => fWords.some(fw => fw === qw || fw.includes(qw)))
    })
    if (anyWordMatch) return { user: anyWordMatch, quality: "fuzzy" }
  }
  return null
}

// ════════════════════════════════════════════════════════════════
export default function FacultyTimetablePage() {
  const authUser = useAuth("faculty")
  if (!authUser) return null

  /* ── Core state ─────────────────────────────────────────── */
  const [me, setMe] = useState<User | null>(null)
  const [depts, setDepts] = useState<Department[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [faculty, setFaculty] = useState<User[]>([])
  const [slots, setSlots] = useState<TimetableSlot[]>([])
  const [mySlots, setMySlots] = useState<TimetableSlot[]>([])
  const [request, setRequest] = useState<TimetableRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isCoordinator = request?.status === "approved"

  /* ── Tab ────────────────────────────────────────────────── */
  const [tab, setTab] = useState<Tab>("schedule")

  /* ── Build Timetable: active section + semester filter ──── */
  const [activeSection, setActiveSection] = useState("A")
  const [activeSemester, setActiveSemester] = useState<number>(4)

  /* ── Request dialog ─────────────────────────────────────── */
  const [requestOpen, setRequestOpen] = useState(false)
  const [requestMsg, setRequestMsg] = useState("")
  const [requesting, setRequesting] = useState(false)

  /* ── Add slot dialog ────────────────────────────────────── */
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [conflicts, setConflicts] = useState<TimetableSlot[]>([])
  const blankSlot = {
    subject_id: "", faculty_id: "", day_of_week: 0,
    start_time: "09:00", end_time: "10:00",
    room: "", section: activeSection, semester: 1,
  }
  const [form, setForm] = useState(blankSlot)

  /* ── Delete ─────────────────────────────────────────────── */
  const [deleteSlot, setDeleteSlot] = useState<TimetableSlot | null>(null)
  const [deleting, setDeleting] = useState(false)

  /* ── Excel upload ───────────────────────────────────────── */
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadPreview, setUploadPreview] = useState<any[] | null>(null)
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)

  /* ── Clear section ──────────────────────────────────────── */
  const [clearOpen, setClearOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  // ── Load ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const user = authUser.user; setMe(user)
      if (!user) return
      const [allDepts, allFaculty] = await Promise.all([getDepartments(), getUsersByRole("faculty")])
      setDepts(allDepts); setFaculty(allFaculty)
      if (user.dept_id) {
        const [deptSubjects, deptSlots, myTTSlots, req] = await Promise.all([
          getSubjectsByDept(user.dept_id), getTimetableSlots(user.dept_id),
          getTimetableSlotsByFaculty(user.id), getTimetableRequestByFaculty(user.id, user.dept_id),
        ])
        setSubjects(deptSubjects); setSlots(deptSlots)
        setMySlots(myTTSlots); setRequest(req)
      }
    } catch (e: any) { setError(e.message ?? "Failed to load") }
    finally { setLoading(false) }
  }, [authUser.user])

  useEffect(() => { if (authUser.user) load() }, [authUser.user, load])

  // ── Derived ───────────────────────────────────────────────
  const myDept = useMemo(() => depts.find(d => d.id === me?.dept_id) ?? null, [depts, me])

  const sections = useMemo(() => {
    const s = new Set(slots.map(sl => sl.section ?? "A"))
    if (s.size === 0) s.add("A")
    return Array.from(s).sort()
  }, [slots])

  const semesters = useMemo(() => {
    const s = new Set(slots.map(sl => sl.semester ?? 1))
    if (s.size === 0) s.add(4)
    return Array.from(s).sort((a, b) => a - b)
  }, [slots])

  const sectionSlots = useMemo(
    () => slots.filter(s => (s.section ?? "A") === activeSection && (s.semester ?? 1) === activeSemester),
    [slots, activeSection, activeSemester]
  )

  const subjectColorMap = useMemo(() => {
    const map: Record<string, typeof SUBJECT_COLORS[0]> = {}
    subjects.forEach((s, i) => { map[s.id] = SUBJECT_COLORS[i % SUBJECT_COLORS.length] })
    return map
  }, [subjects])

  // ── Dept faculty for fuzzy match ──────────────────────────
  const deptFaculty = useMemo(
    () => faculty.filter(f => f.dept_id === me?.dept_id),
    [faculty, me]
  )

  // ── Request coordinator access ────────────────────────────
  async function handleRequest() {
    if (!me?.dept_id) return
    setRequesting(true)
    try {
      const r = await addTimetableRequest({ faculty_id: me.id, dept_id: me.dept_id, message: requestMsg.trim() || undefined })
      setRequest(r); setRequestOpen(false); setRequestMsg("")
      setSuccess("Request sent! Waiting for admin approval.")
      setTimeout(() => setSuccess(null), 4000)
    } catch (e: any) { setError(e.message) }
    finally { setRequesting(false) }
  }

  // ── Conflict check ────────────────────────────────────────
  async function handleCheckConflict(fid: string, day: number, start: string, end: string) {
    if (!fid || !start || !end) { setConflicts([]); return }
    try { setConflicts(await checkFacultyConflict(fid, day, start + ":00", end + ":00")) }
    catch { setConflicts([]) }
  }

  // ── Add slot ──────────────────────────────────────────────
  async function handleAddSlot() {
    if (!form.subject_id || !form.faculty_id || conflicts.length > 0) return
    setSaving(true)
    try {
      const ns = await addTimetableSlot({
        dept_id: me?.dept_id ?? "", subject_id: form.subject_id,
        faculty_id: form.faculty_id, day_of_week: form.day_of_week,
        start_time: form.start_time + ":00", end_time: form.end_time + ":00",
        room: form.room || null, section: form.section || "A",
        semester: form.semester, created_by: me?.id ?? null,
      })
      setSlots(prev => [...prev, ns]); setAddOpen(false)
      setForm({ ...blankSlot, section: activeSection }); setConflicts([])
      setSuccess("Slot added!"); setTimeout(() => setSuccess(null), 3000)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  // ── Delete slot ───────────────────────────────────────────
  async function handleDeleteSlot() {
    if (!deleteSlot) return; setDeleting(true)
    try {
      await deleteTimetableSlot(deleteSlot.id)
      setSlots(prev => prev.filter(s => s.id !== deleteSlot.id)); setDeleteSlot(null)
      setSuccess("Slot deleted."); setTimeout(() => setSuccess(null), 2500)
    } catch (e: any) { setError(e.message) }
    finally { setDeleting(false) }
  }

  // ── Clear entire section ──────────────────────────────────
  async function handleClearSection() {
    if (!me?.dept_id) return; setClearing(true)
    try {
      await deleteTimetableSlotsBySection(me.dept_id, activeSection)
      setSlots(prev => prev.filter(s => (s.section ?? "A") !== activeSection))
      setClearOpen(false)
      setSuccess(`Section ${activeSection} cleared.`); setTimeout(() => setSuccess(null), 3000)
    } catch (e: any) { setError(e.message) }
    finally { setClearing(false) }
  }

  // ── Excel: parse file ─────────────────────────────────────
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "array" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" })
        if (rows.length === 0) { setUploadErrors(["File is empty"]); setUploadOpen(true); return }
        // Flexible header detection — accept many column name variations
        const headers = Object.keys(rows[0]).map(h => h.toLowerCase().trim().replace(/[\s_-]+/g, "_"))
        const hasDay     = headers.some(h => h.includes("day") || h.includes("weekday"))
        const hasStart   = headers.some(h => h.includes("start") || h.includes("from") || h === "begin")
        const hasEnd     = headers.some(h => h.includes("end") || h.includes("to") || h === "finish")
        const hasSubject = headers.some(h => h.includes("subject") || h.includes("course") || h.includes("paper"))
        const missingCols: string[] = []
        if (!hasDay)     missingCols.push("Day")
        if (!hasStart)   missingCols.push("Start Time")
        if (!hasEnd)     missingCols.push("End Time")
        if (!hasSubject) missingCols.push("Subject")
        if (missingCols.length) {
          setUploadErrors([`Missing columns: ${missingCols.join(", ")}. Accepted names: Day/Weekday, Start_Time/Start/From, End_Time/End/To, Subject/Course/Paper, Faculty/Teacher (optional: Room, Section, Semester)`])
          setUploadOpen(true); return
        }
        setUploadPreview(rows); setUploadErrors([]); setUploadWarnings([]); setUploadOpen(true)
      } catch { setUploadErrors(["Failed to parse file. Make sure it's a valid .xlsx or .xls file."]); setUploadOpen(true) }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ""   // reset input
  }

  // ── Excel: import rows (with fuzzy matching) ──────────────
  async function handleImport() {
    if (!uploadPreview || !me?.dept_id) return; setUploading(true); setUploadErrors([]); setUploadWarnings([])
    const errors: string[] = []
    const warnings: string[] = []
    const toInsert: any[] = []

    for (let i = 0; i < uploadPreview.length; i++) {
      const row = uploadPreview[i]; const rowNum = i + 2 // header = row 1
      // Normalise keys — collapse spaces/dashes/underscores
      const norm: Record<string, string> = {}
      Object.entries(row).forEach(([k, v]) => { norm[k.toLowerCase().trim().replace(/[\s_-]+/g, "_")] = String(v).trim() })

      // Day — accept multiple column names
      const dayRaw = norm["day"] || norm["day_of_week"] || norm["weekday"] || ""
      const dayKey = dayRaw.toLowerCase()
      const dayIdx = DAY_MAP[dayKey] ?? DAY_MAP[dayKey?.slice(0, 3)] ?? -1
      if (dayIdx < 0) { errors.push(`Row ${rowNum}: Invalid day "${dayRaw}"`); continue }

      // Times — accept many column names
      const start = norm["start_time"] || norm["start"] || norm["from"] || norm["time_start"] || norm["begin"] || ""
      const end   = norm["end_time"]   || norm["end"]   || norm["to"]   || norm["time_end"]   || norm["finish"] || ""
      if (!start || !end) { errors.push(`Row ${rowNum}: Missing start/end time`); continue }
      const fmtT = (t: string) => { const [h, m] = t.split(":"); return `${h.padStart(2, "0")}:${(m || "00").padStart(2, "0")}` }
      const st = fmtT(start) + ":00"
      const et = fmtT(end) + ":00"

      // Subject — fuzzy match
      const subInput = (norm["subject"] || norm["subject_code"] || norm["subject_name"] || norm["course"] || norm["course_code"] || norm["paper"] || "").trim()
      if (!subInput) { errors.push(`Row ${rowNum}: No subject specified`); continue }
      const subMatch = fuzzyFindSubject(subInput, subjects)
      if (!subMatch) { errors.push(`Row ${rowNum}: Subject "${subInput}" not found (no close match in department)`); continue }
      if (subMatch.quality === "fuzzy") {
        warnings.push(`Row ${rowNum}: Subject "${subInput}" → auto-matched to "${subMatch.subject.name}" (${subMatch.subject.code})`)
      }

      // Faculty — fuzzy match with fallback to coordinator
      const facInput = (norm["faculty"] || norm["teacher"] || norm["faculty_name"] || norm["professor"] || norm["instructor"] || norm["prof"] || "").trim()
      let fac: User = me!
      if (facInput) {
        const facMatch = fuzzyFindFaculty(facInput, deptFaculty)
        if (facMatch) {
          fac = facMatch.user
          if (facMatch.quality === "fuzzy") {
            warnings.push(`Row ${rowNum}: Faculty "${facInput}" → auto-matched to "${fac.name}"`)
          }
        } else {
          // No match at all — assign to coordinator (yourself) instead of failing
          warnings.push(`Row ${rowNum}: Faculty "${facInput}" not found → assigned to you (${me!.name})`)
        }
      }

      const room    = norm["room"] || norm["room_no"] || norm["classroom"] || null
      const section = norm["section"] || norm["sec"] || norm["division"] || norm["div"] || activeSection
      const sem     = parseInt(norm["semester"] || norm["sem"] || String(activeSemester)) || activeSemester

      toInsert.push({
        dept_id: me.dept_id, subject_id: subMatch.subject.id, faculty_id: fac.id,
        day_of_week: dayIdx, start_time: st, end_time: et,
        room, section, semester: sem, created_by: me.id,
      })
    }

    if (errors.length > 0 && toInsert.length === 0) {
      setUploadErrors(errors); setUploadWarnings(warnings); setUploading(false); return
    }

    try {
      const inserted = await bulkAddTimetableSlots(toInsert)
      setSlots(prev => [...prev, ...inserted])
      const msg = `Imported ${inserted.length} slot${inserted.length !== 1 ? "s" : ""} successfully!`
      setSuccess(errors.length ? msg + ` (${errors.length} rows skipped)` : msg)
      setTimeout(() => setSuccess(null), 5000)
      if (errors.length || warnings.length) { setUploadErrors(errors); setUploadWarnings(warnings) }
      else { setUploadOpen(false); setUploadPreview(null) }
    } catch (e: any) { setUploadErrors([...errors, `Insert failed: ${e.message}`]) }
    finally { setUploading(false) }
  }

  // ── Excel: download template ──────────────────────────────
  function downloadTemplate() {
    const data = [
      { Day: "Monday", Start_Time: "09:00", End_Time: "10:00", Subject: "CSE301", Faculty: "Dr. Sharma", Room: "A-101", Section: "A", Semester: 4 },
      { Day: "Monday", Start_Time: "10:00", End_Time: "11:00", Subject: "CSE302", Faculty: "Prof. Raj",  Room: "A-102", Section: "A", Semester: 4 },
      { Day: "Tuesday",Start_Time: "09:00", End_Time: "10:00", Subject: "CSE303", Faculty: "Dr. Meera",  Room: "Lab-1", Section: "B", Semester: 4 },
    ]
    const ws = XLSX.utils.json_to_sheet(data)
    // Set column widths
    ws["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 10 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Timetable")
    XLSX.writeFile(wb, `Timetable_Template_${myDept?.code ?? "DEPT"}.xlsx`)
  }

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="faculty"
      userName={me?.name ?? "Faculty"}
      avatarUrl={me?.avatar_url}
      pageTitle="Timetable"
      pageSubtitle={`${myDept?.name ?? "Department"} schedule & management`}
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

        {/* ── Coordinator status banner ──────────────────── */}
        {!loading && (
          <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm overflow-hidden">
            <div className={`h-1 ${isCoordinator ? "bg-emerald-500" : request?.status === "pending" ? "bg-amber-400" : request?.status === "rejected" ? "bg-red-400" : "bg-blue-400"}`} />
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCoordinator ? "bg-emerald-50 border border-emerald-200" : "bg-blue-50 border border-blue-200"}`}>
                    {isCoordinator ? <ShieldCheck className="h-5 w-5 text-emerald-600" /> : <Calendar className="h-5 w-5 text-blue-600" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      {isCoordinator ? "You are the Timetable Coordinator" : request?.status === "pending" ? "Request Pending" : request?.status === "rejected" ? "Request Rejected" : "Timetable Coordinator Access"}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isCoordinator
                        ? `You can create & manage the timetable for ${myDept?.name ?? "your department"} across all divisions.`
                        : request?.status === "pending" ? "Your request is being reviewed by an admin."
                        : request?.status === "rejected" ? `Rejected: ${request.admin_note || "No reason provided."}`
                        : "Request admin approval to create and manage the department timetable."}
                    </p>
                  </div>
                </div>
                {!request && (
                  <Button size="sm" onClick={() => setRequestOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs shrink-0">
                    <Send className="h-3.5 w-3.5" /> Request Access
                  </Button>
                )}
                {request?.status === "rejected" && (
                  <Button size="sm" variant="outline" onClick={() => setRequestOpen(true)} className="gap-2 text-xs shrink-0">
                    <Send className="h-3.5 w-3.5" /> Re-request
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════════ TAB BAR ══════════ */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100/80 w-fit">
          {([
            { key: "schedule" as Tab, label: "My Schedule",      icon: Clock,  coordinatorOnly: false as boolean },
            { key: "build"    as Tab, label: "Build Timetable",  icon: Layers, coordinatorOnly: true  as boolean },
          ]).filter(t => !t.coordinatorOnly || isCoordinator).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════
             TAB 1: MY SCHEDULE
           ══════════════════════════════════════════════════════ */}
        {tab === "schedule" && (
          <>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={load}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Upcoming</div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Now</div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500"><div className="w-2 h-2 rounded-full bg-gray-300" /> Past</div>
              </div>
            </div>

            {/* My Weekly Schedule */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
              </div>
            ) : mySlots.length === 0 ? (
              <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
                <CardContent className="py-16 flex flex-col items-center gap-3 text-gray-400">
                  <Calendar className="h-10 w-10 text-gray-200" />
                  <p className="text-sm font-medium">No classes assigned to you yet</p>
                  <p className="text-xs text-gray-300">When the coordinator assigns classes, they&apos;ll appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DAYS.map((day, dayIdx) => {
                  const daySlots = mySlots
                    .filter(s => s.day_of_week === dayIdx)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  const isToday = (new Date().getDay() + 6) % 7 === dayIdx
                  return (
                    <Card key={day} className={`backdrop-blur-xl bg-white/70 border-white/50 shadow-sm transition-all ${isToday ? "ring-2 ring-blue-200" : ""}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${isToday ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>{day.slice(0, 2)}</div>
                            {day}
                            {isToday && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">TODAY</span>}
                          </CardTitle>
                          <span className="text-[10px] text-gray-400 font-medium">{daySlots.length} class{daySlots.length !== 1 ? "es" : ""}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        {daySlots.length === 0 ? (
                          <div className="py-6 text-center text-gray-300">
                            <Calendar className="h-6 w-6 mx-auto mb-1 text-gray-200" /><p className="text-[10px]">Free day</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {daySlots.map(slot => {
                              const sc = subjectColorMap[slot.subject_id] ?? SUBJECT_COLORS[0]
                              const now = new Date()
                              const [sh, sm] = slot.start_time.split(":").map(Number)
                              const [eh, em] = slot.end_time.split(":").map(Number)
                              const startMin = sh * 60 + sm, endMin = eh * 60 + em
                              const nowMin = now.getHours() * 60 + now.getMinutes()
                              const isActive = isToday && nowMin >= startMin && nowMin < endMin
                              const isPast = isToday && nowMin >= endMin
                              return (
                                <div key={slot.id} className={`p-2.5 rounded-xl border transition-all ${sc.bg} ${sc.border} ${isActive ? "ring-1 ring-blue-300" : isPast ? "opacity-50" : ""}`}>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-blue-500 animate-pulse" : sc.dot}`} />
                                    <span className="text-[10px] font-bold text-gray-500">{fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}</span>
                                    {isActive && <span className="text-[8px] font-bold text-blue-600 bg-blue-100 px-1 py-0.5 rounded-full">NOW</span>}
                                  </div>
                                  <p className={`text-xs font-bold ${sc.text} truncate`}>{slot.subjects?.name ?? "—"}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {slot.room && <span className="text-[10px] text-gray-400">Room {slot.room}</span>}
                                    {slot.section && <span className="text-[10px] text-gray-400">· Sec {slot.section}</span>}
                                    {slot.departments?.name && <span className="text-[10px] text-gray-400">· {slot.departments.name}</span>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════
             TAB 2: BUILD TIMETABLE  (coordinator only)
           ══════════════════════════════════════════════════════ */}
        {tab === "build" && isCoordinator && (
          <>
            {/* Section selector + actions bar */}
            <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  {/* Semester pills */}
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-600 mr-1">Sem:</span>
                    {semesters.map(sem => (
                      <button
                        key={sem}
                        onClick={() => setActiveSemester(sem)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          activeSemester === sem
                            ? "bg-purple-600 text-white shadow-sm"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {sem}
                      </button>
                    ))}
                    {/* Quick add a semester */}
                    <button
                      onClick={() => {
                        const next = (semesters.length > 0 ? Math.max(...semesters) + 1 : 1)
                        if (next <= 8 && !semesters.includes(next)) setActiveSemester(next)
                      }}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold transition-all"
                      title="Add semester"
                    >+</button>
                  </div>

                  {/* Section pills */}
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-600 mr-1">Division:</span>
                    {sections.map(sec => (
                      <button
                        key={sec}
                        onClick={() => setActiveSection(sec)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          activeSection === sec
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        Sec {sec}
                      </button>
                    ))}
                    {/* Quick add a new section */}
                    <button
                      onClick={() => {
                        const next = String.fromCharCode(65 + sections.length) // A, B, C…
                        if (!sections.includes(next)) { setActiveSection(next) }
                      }}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold transition-all"
                      title="Add division"
                    >+</button>
                  </div>

                  <div className="sm:ml-auto flex flex-wrap items-center gap-2">
                    {/* Add slot */}
                    <Button size="sm" onClick={() => { setForm({ ...blankSlot, section: activeSection, semester: activeSemester }); setConflicts([]); setAddOpen(true) }}
                      className="h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-semibold">
                      <Plus className="h-3.5 w-3.5" /> Add Slot
                    </Button>
                    {/* Upload Excel */}
                    <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}
                      className="h-8 gap-1.5 text-xs font-semibold">
                      <Upload className="h-3.5 w-3.5" /> Upload Excel
                    </Button>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileSelect} />
                    {/* Download template */}
                    <Button size="sm" variant="outline" onClick={downloadTemplate}
                      className="h-8 gap-1.5 text-xs font-semibold">
                      <Download className="h-3.5 w-3.5" /> Template
                    </Button>
                    {/* Clear section */}
                    {sectionSlots.length > 0 && (
                      <Button size="sm" variant="outline" onClick={() => setClearOpen(true)}
                        className="h-8 gap-1.5 text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" /> Clear Sec {activeSection}
                      </Button>
                    )}
                    {/* Refresh */}
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={load}>
                      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    <span className="font-bold text-gray-800">{sectionSlots.length}</span> slots in Sem {activeSemester} · Sec {activeSection}
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="font-bold text-gray-800">{new Set(sectionSlots.map(s => s.subject_id)).size}</span> subjects
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="font-bold text-gray-800">{new Set(sectionSlots.map(s => s.faculty_id)).size}</span> faculty assigned
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="font-bold text-gray-800">{slots.length}</span> total dept slots
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info card about Excel upload */}
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-700 space-y-1">
                <p className="font-bold">Excel Upload Format</p>
                <p>Columns: <strong>Day</strong>, <strong>Start_Time</strong>, <strong>End_Time</strong>, <strong>Subject</strong> (code or name), Faculty (name or email), Room, Section, Semester.</p>
                <p>The system matches Subject codes and Faculty names from your department. If a teacher is already booked at that time in another division/department, the DB constraint will prevent the conflict.</p>
              </div>
            </div>

            {/* Weekly grid for active section */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DAYS.map((day, dayIdx) => {
                  const daySlots = sectionSlots
                    .filter(s => s.day_of_week === dayIdx)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  const isToday = (new Date().getDay() + 6) % 7 === dayIdx
                  return (
                    <Card key={day} className={`backdrop-blur-xl bg-white/70 border-white/50 shadow-sm transition-all ${isToday ? "ring-2 ring-blue-200" : ""}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${isToday ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>{day.slice(0, 2)}</div>
                            {day}
                            {isToday && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">TODAY</span>}
                          </CardTitle>
                          <span className="text-[10px] text-gray-400 font-medium">{daySlots.length} class{daySlots.length !== 1 ? "es" : ""}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        {daySlots.length === 0 ? (
                          <div className="py-6 text-center text-gray-300">
                            <Calendar className="h-6 w-6 mx-auto mb-1 text-gray-200" /><p className="text-[10px]">No classes</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {daySlots.map(slot => {
                              const sc = subjectColorMap[slot.subject_id] ?? SUBJECT_COLORS[0]
                              return (
                                <div key={slot.id} className={`p-2.5 rounded-xl border transition-all group ${sc.bg} ${sc.border}`}>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                      <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                      <span className="text-[10px] font-bold text-gray-500">{fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}</span>
                                    </div>
                                    <button onClick={() => setDeleteSlot(slot)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50">
                                      <Trash2 className="h-3 w-3 text-red-400" />
                                    </button>
                                  </div>
                                  <p className={`text-xs font-bold ${sc.text} truncate`}>{slot.subjects?.name ?? "—"}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-gray-400 truncate">{slot.users?.name ?? "—"}</span>
                                    {slot.room && <span className="text-[10px] text-gray-400">· {slot.room}</span>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ════ REQUEST ACCESS DIALOG ════ */}
      <Dialog open={requestOpen} onOpenChange={o => { if (!o) setRequestOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"><ShieldCheck className="h-4 w-4 text-blue-600" /></div>
              Request Coordinator Access
            </DialogTitle>
            <DialogDescription>
              Ask admin to grant you timetable coordinator privileges for <strong>{myDept?.name ?? "your department"}</strong>.
              You&apos;ll be able to create timetables for all divisions (sections).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs font-semibold">Message to Admin (optional)</Label>
            <Textarea placeholder="e.g. I'm the class coordinator for AIDS 3rd year…" value={requestMsg} onChange={e => setRequestMsg(e.target.value)} rows={3} className="resize-none text-sm" maxLength={500} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
            <Button onClick={handleRequest} disabled={requesting} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              {requesting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...</> : <><Send className="h-3.5 w-3.5" /> Send Request</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ ADD SLOT DIALOG ════ */}
      <Dialog open={addOpen} onOpenChange={o => { if (!o) { setAddOpen(false); setConflicts([]) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center"><Plus className="h-4 w-4 text-emerald-600" /></div>
              Add Timetable Slot — Sec {form.section}
            </DialogTitle>
            <DialogDescription>Create a new class slot. Conflict detection is automatic.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Subject *</Label>
              <Select value={form.subject_id} onValueChange={v => setForm(f => ({ ...f, subject_id: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Faculty */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Faculty *</Label>
              <Select value={form.faculty_id} onValueChange={v => { setForm(f => ({ ...f, faculty_id: v })); handleCheckConflict(v, form.day_of_week, form.start_time, form.end_time) }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Assign faculty" /></SelectTrigger>
                <SelectContent>{faculty.filter(f => f.dept_id === me?.dept_id).map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Day + Time */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Day *</Label>
                <Select value={String(form.day_of_week)} onValueChange={v => { const d = Number(v); setForm(f => ({ ...f, day_of_week: d })); handleCheckConflict(form.faculty_id, d, form.start_time, form.end_time) }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Start *</Label>
                <Select value={form.start_time} onValueChange={v => { setForm(f => ({ ...f, start_time: v })); handleCheckConflict(form.faculty_id, form.day_of_week, v, form.end_time) }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">End *</Label>
                <Select value={form.end_time} onValueChange={v => { setForm(f => ({ ...f, end_time: v })); handleCheckConflict(form.faculty_id, form.day_of_week, form.start_time, v) }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIME_SLOTS.filter(t => t > form.start_time).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {/* Conflict warning */}
            {conflicts.length > 0 && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-2"><AlertCircle className="h-4 w-4 text-red-500" /><span className="text-xs font-bold text-red-700">Faculty Conflict!</span></div>
                {conflicts.map(c => (
                  <p key={c.id} className="text-[11px] text-red-600">{c.subjects?.name ?? "?"} · {fmtTime(c.start_time)}–{fmtTime(c.end_time)} · {c.departments?.name ?? ""}</p>
                ))}
                <p className="text-[10px] text-red-500 mt-2">This teacher is already booked. Choose a different slot or teacher.</p>
              </div>
            )}
            {/* Room + Section + Semester */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Room</Label>
                <Input placeholder="e.g. A-101" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Section</Label>
                <Input value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value.toUpperCase() }))} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Semester</Label>
                <Select value={String(form.semester)} onValueChange={v => setForm(f => ({ ...f, semester: Number(v) }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{[1, 2, 3, 4, 5, 6, 7, 8].map(s => <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setAddOpen(false); setConflicts([]) }}>Cancel</Button>
            <Button onClick={handleAddSlot} disabled={saving || !form.subject_id || !form.faculty_id || conflicts.length > 0} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : <><Plus className="h-3.5 w-3.5" /> Add Slot</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ EXCEL UPLOAD PREVIEW DIALOG ════ */}
      <Dialog open={uploadOpen} onOpenChange={o => { if (!o) { setUploadOpen(false); setUploadPreview(null); setUploadErrors([]); setUploadWarnings([]) } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center"><FileSpreadsheet className="h-4 w-4 text-green-600" /></div>
              Excel Upload Preview
            </DialogTitle>
            <DialogDescription>Review the data before importing. Subjects &amp; faculty are auto-matched even with approximate names.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto min-h-0 space-y-3">
            {/* Warnings — auto-resolved fuzzy matches */}
            {uploadWarnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs font-bold text-amber-700 mb-1">⚡ {uploadWarnings.length} auto-resolved:</p>
                <div className="max-h-28 overflow-auto space-y-0.5">
                  {uploadWarnings.map((w, i) => <p key={i} className="text-[11px] text-amber-600">{w}</p>)}
                </div>
              </div>
            )}
            {/* Errors — could not be resolved */}
            {uploadErrors.length > 0 && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs font-bold text-red-700 mb-1">{uploadErrors.length} issue{uploadErrors.length !== 1 ? "s" : ""} (rows skipped):</p>
                <div className="max-h-28 overflow-auto space-y-0.5">
                  {uploadErrors.map((e, i) => <p key={i} className="text-[11px] text-red-600">{e}</p>)}
                </div>
              </div>
            )}
            {/* Info about fuzzy matching */}
            {!uploadErrors.length && !uploadWarnings.length && uploadPreview && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-[11px] text-blue-700"><strong>Smart matching enabled:</strong> Subject codes/names and faculty names will be fuzzy-matched. Unrecognised faculty defaults to you.</p>
              </div>
            )}
            {/* Preview table */}
            {uploadPreview && uploadPreview.length > 0 && (
              <div className="border rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>{Object.keys(uploadPreview[0]).map(h => <th key={h} className="px-3 py-2 text-left font-bold text-gray-600 whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {uploadPreview.slice(0, 50).map((row, i) => (
                        <tr key={i} className="border-t border-gray-100 hover:bg-blue-50/30">
                          {Object.values(row).map((v, j) => <td key={j} className="px-3 py-1.5 text-gray-700 whitespace-nowrap">{String(v)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {uploadPreview.length > 50 && <p className="text-[10px] text-gray-400 p-2 text-center">Showing 50 of {uploadPreview.length} rows</p>}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 pt-3 border-t border-gray-100">
            <Button variant="outline" onClick={() => { setUploadOpen(false); setUploadPreview(null); setUploadErrors([]); setUploadWarnings([]) }}>Cancel</Button>
            {uploadPreview && uploadPreview.length > 0 && (
              <Button onClick={handleImport} disabled={uploading} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                {uploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Importing...</> : <><Upload className="h-3.5 w-3.5" /> Import {uploadPreview.length} Rows</>}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ DELETE SLOT DIALOG ════ */}
      <Dialog open={!!deleteSlot} onOpenChange={o => { if (!o) setDeleteSlot(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" /> Delete Slot</DialogTitle>
            <DialogDescription>
              Remove <strong>{deleteSlot?.subjects?.name}</strong> on <strong>{DAYS[deleteSlot?.day_of_week ?? 0]}</strong> {deleteSlot && `${fmtTime(deleteSlot.start_time)}–${fmtTime(deleteSlot.end_time)}`}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteSlot(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSlot} disabled={deleting}>
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Trash2 className="h-3.5 w-3.5 mr-2" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ CLEAR SECTION DIALOG ════ */}
      <Dialog open={clearOpen} onOpenChange={o => { if (!o) setClearOpen(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" /> Clear Section {activeSection}</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>all {sectionSlots.length} slots</strong> for Section {activeSection} in {myDept?.name}. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setClearOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleClearSection} disabled={clearing}>
              {clearing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Trash2 className="h-3.5 w-3.5 mr-2" />} Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}
