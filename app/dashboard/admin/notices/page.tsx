"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo } from "react"
import {
  Plus, Edit3, Trash2, Search, Bell,
  AlertCircle, Loader2, RefreshCw, AlertTriangle,
  MoreVertical, Eye, Users, GraduationCap,
  BookOpen, CheckCircle2, Clock, Filter,
  ChevronLeft, ChevronRight, Megaphone
} from "lucide-react"
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
  getNotices, addNotice, updateNotice, deleteNotice,
} from "@/lib/db"
import type { Notice } from "@/lib/types"

// ─── Constants ───────────────────────────────────────────────────
const PAGE_SIZE = 10

const targetConfig = {
  All:      { label: "All",      color: "#64748B", bg: "rgba(100,116,139,0.08)", icon: Users         },
  Students: { label: "Students", color: "#2563EB", bg: "rgba(37,99,235,0.08)",  icon: GraduationCap },
  Faculty:  { label: "Faculty",  color: "#9333EA", bg: "rgba(147,51,234,0.08)", icon: BookOpen      },
}

interface FormData {
  title:  string
  body:   string
  target: "All" | "Students" | "Faculty"
  urgent: boolean
}

const emptyForm: FormData = {
  title: "", body: "", target: "All", urgent: false,
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

// ════════════════════════════════════════════════════════════════
export default function NoticesPage() {
  const me = useAuth("admin")
  if (!me) return null

  // ── Data ─────────────────────────────────────────────────────
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // ── UI ───────────────────────────────────────────────────────
  const [search,       setSearch]       = useState("")
  const [filterTarget, setFilterTarget] = useState("all")
  const [filterUrgent, setFilterUrgent] = useState("all")
  const [page,         setPage]         = useState(1)

  // ── Dialogs ──────────────────────────────────────────────────
  const [addOpen,    setAddOpen]    = useState(false)
  const [editOpen,   setEditOpen]   = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [viewOpen,   setViewOpen]   = useState(false)
  const [selected,   setSelected]   = useState<Notice | null>(null)
  const [form,       setForm]       = useState<FormData>(emptyForm)

  // ── Load ─────────────────────────────────────────────────────
  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getNotices()
      setNotices(data)
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { setPage(1) }, [search, filterTarget, filterUrgent])

  // ── Stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    notices.length,
    urgent:   notices.filter(n => n.urgent).length,
    students: notices.filter(n => n.target === "Students" || n.target === "All").length,
    faculty:  notices.filter(n => n.target === "Faculty"  || n.target === "All").length,
  }), [notices])

  // ── Filtered ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return notices.filter(n => {
      const q = search.toLowerCase()
      if (q && !n.title.toLowerCase().includes(q) &&
               !(n.body ?? "").toLowerCase().includes(q)) return false
      if (filterTarget !== "all" && n.target !== filterTarget) return false
      if (filterUrgent === "urgent"  &&  !n.urgent) return false
      if (filterUrgent === "normal"  &&   n.urgent) return false
      return true
    })
  }, [notices, search, filterTarget, filterUrgent])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Handlers ─────────────────────────────────────────────────
  function openAdd() { setForm(emptyForm); setAddOpen(true) }

  function openEdit(n: Notice) {
    setSelected(n)
    setForm({ title: n.title, body: n.body ?? "", target: n.target, urgent: n.urgent })
    setEditOpen(true)
  }

  function openView(n: Notice)   { setSelected(n); setViewOpen(true)   }
  function openDelete(n: Notice) { setSelected(n); setDeleteOpen(true) }

  async function handleAdd() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const notice = await addNotice({
        title:      form.title,
        body:       form.body      || null,
        target:     form.target,
        urgent:     form.urgent,
        created_by: null,
      })
      setNotices(prev => [notice, ...prev])
      setAddOpen(false)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleEdit() {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await updateNotice(selected.id, {
        title:  form.title,
        body:   form.body   || null,
        target: form.target,
        urgent: form.urgent,
      })
      setNotices(prev => prev.map(n => n.id === updated.id ? updated : n))
      setEditOpen(false)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!selected) return
    setSaving(true)
    try {
      await deleteNotice(selected.id)
      setNotices(prev => prev.filter(n => n.id !== selected.id))
      setDeleteOpen(false)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  // ── Shared form ───────────────────────────────────────────────
  function NoticeForm() {
    return (
      <div className="space-y-4 py-2">

        {/* Title */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Title *</Label>
          <Input
            placeholder="e.g. Mid-semester exam schedule released"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="h-9 text-sm"
          />
        </div>

        {/* Body */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Body</Label>
          <textarea
            placeholder="Detailed notice content..."
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            rows={4}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Target */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Target Audience</Label>
            <Select
              value={form.target}
              onValueChange={v => setForm(f => ({ ...f, target: v as any }))}
            >
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Students">Students Only</SelectItem>
                <SelectItem value="Faculty">Faculty Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Priority</Label>
            <Select
              value={form.urgent ? "urgent" : "normal"}
              onValueChange={v => setForm(f => ({ ...f, urgent: v === "urgent" }))}
            >
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="urgent">🔴 Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview */}
        {form.title && (
          <div className={`p-3 rounded-xl border text-sm ${
            form.urgent
              ? "bg-red-50 border-red-200"
              : "bg-gray-50 border-gray-200"
          }`}>
            <div className="flex items-start gap-2">
              {form.urgent
                ? <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                : <Bell        className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              }
              <div className="min-w-0">
                <p className="font-bold text-gray-800 text-xs">{form.title}</p>
                {form.body && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{form.body}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    form.target === "All"      ? "bg-gray-100 text-gray-600"   :
                    form.target === "Students" ? "bg-blue-50 text-blue-700"   :
                                                 "bg-purple-50 text-purple-700"
                  }`}>{form.target}</span>
                  {form.urgent && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">Urgent</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="admin"
      userName="Admin"
      pageTitle="Notices"
      pageSubtitle="Publish and manage announcements"
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
            { label: "Total Notices",  value: stats.total,    icon: Bell,         color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100"    },
            { label: "Urgent",         value: stats.urgent,   icon: AlertCircle,  color: "text-red-600",     bg: "bg-red-50",     border: "border-red-100"     },
            { label: "For Students",   value: stats.students, icon: GraduationCap,color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-100"  },
            { label: "For Faculty",    value: stats.faculty,  icon: BookOpen,     color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-100"  },
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
                    placeholder="Search notices..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-8 text-xs"
                  />
                </div>

                {/* Target filter */}
                <Select value={filterTarget} onValueChange={setFilterTarget}>
                  <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Audiences</SelectItem>
                    <SelectItem value="All">General</SelectItem>
                    <SelectItem value="Students">Students</SelectItem>
                    <SelectItem value="Faculty">Faculty</SelectItem>
                  </SelectContent>
                </Select>

                {/* Urgency filter */}
                <Select value={filterUrgent} onValueChange={setFilterUrgent}>
                  <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent Only</SelectItem>
                    <SelectItem value="normal">Normal Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={load} className="h-8 w-8 p-0" title="Refresh">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </Button>
                <Button size="sm" onClick={openAdd}
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-semibold">
                  <Plus className="h-3.5 w-3.5" /> Post Notice
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-xs font-bold text-gray-600 pl-6">Notice</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Target</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Priority</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">Published</TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <TableCell key={j} className={j === 0 ? "pl-6" : j === 4 ? "pr-6" : ""}>
                              <Skeleton className="h-5 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : paginated.length === 0
                      ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                            No notices found
                          </TableCell>
                        </TableRow>
                      )
                      : paginated.map(notice => {
                          const tc = targetConfig[notice.target]
                          return (
                            <TableRow key={notice.id} className="hover:bg-gray-50/60 transition-colors">

                              {/* Notice title + body */}
                              <TableCell className="pl-6 py-3 max-w-sm">
                                <div className="flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                    notice.urgent ? "bg-red-50" : "bg-gray-50"
                                  }`}>
                                    {notice.urgent
                                      ? <AlertCircle className="h-4 w-4 text-red-500" />
                                      : <Bell        className="h-4 w-4 text-gray-400" />
                                    }
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 leading-tight truncate">
                                      {notice.title}
                                    </p>
                                    {notice.body && (
                                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                                        {notice.body}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>

                              {/* Target */}
                              <TableCell>
                                <div
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                                  style={{ background: tc.bg, color: tc.color }}
                                >
                                  <tc.icon className="h-3 w-3" />
                                  {tc.label}
                                </div>
                              </TableCell>

                              {/* Priority */}
                              <TableCell>
                                {notice.urgent
                                  ? (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600">
                                      <AlertCircle className="h-3 w-3" /> Urgent
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                                      <CheckCircle2 className="h-3 w-3" /> Normal
                                    </div>
                                  )
                                }
                              </TableCell>

                              {/* Date */}
                              <TableCell className="text-sm text-gray-500">
                                <div>
                                  <p className="font-medium">
                                    {new Date(notice.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {new Date(notice.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
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
                                    <DropdownMenuItem onClick={() => openView(notice)}>
                                      <Eye   className="h-3.5 w-3.5 mr-2" /> View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openEdit(notice)}>
                                      <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
                                    </DropdownMenuItem>
                                    {/* Toggle urgent */}
                                    <DropdownMenuItem onClick={async () => {
                                      try {
                                        const updated = await updateNotice(notice.id, { urgent: !notice.urgent })
                                        setNotices(prev => prev.map(n => n.id === updated.id ? updated : n))
                                      } catch (e: any) { setError(e.message) }
                                    }}>
                                      {notice.urgent
                                        ? <><CheckCircle2 className="h-3.5 w-3.5 mr-2 text-gray-500" /> Mark Normal</>
                                        : <><AlertCircle  className="h-3.5 w-3.5 mr-2 text-red-500"  /> Mark Urgent</>
                                      }
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onClick={() => openDelete(notice)}
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
              <Megaphone className="h-4 w-4 text-blue-600" /> Post New Notice
            </DialogTitle>
            <DialogDescription>
              Published immediately and visible to the selected audience.
            </DialogDescription>
          </DialogHeader>
          <NoticeForm />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={handleAdd}
              disabled={saving || !form.title.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ EDIT ════ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-blue-600" /> Edit Notice
            </DialogTitle>
          </DialogHeader>
          <NoticeForm />
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
          <DialogHeader>
            <DialogTitle>Notice Details</DialogTitle>
          </DialogHeader>
          {selected && (() => {
            const tc = targetConfig[selected.target]
            return (
              <div className="space-y-4 py-2">
                {/* Header */}
                <div className={`p-4 rounded-xl border ${
                  selected.urgent ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
                }`}>
                  <div className="flex items-start gap-3">
                    {selected.urgent
                      ? <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                      : <Bell        className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                    }
                    <div>
                      <p className="font-black text-gray-800 text-sm leading-snug">{selected.title}</p>
                      {selected.body && (
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{selected.body}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Target",   value:
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: tc.bg, color: tc.color }}>
                        <tc.icon className="h-3 w-3" />{tc.label}
                      </div>
                    },
                    { label: "Priority", value:
                      selected.urgent
                        ? <span className="text-red-600 font-black text-xs">🔴 Urgent</span>
                        : <span className="text-gray-500 font-bold text-xs">Normal</span>
                    },
                    { label: "Published", value:
                      new Date(selected.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                    },
                    { label: "Time", value:
                      new Date(selected.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                    },
                  ].map(row => (
                    <div key={row.label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{row.label}</p>
                      <div className="text-sm font-bold text-gray-800">{row.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewOpen(false)}>Close</Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => { setViewOpen(false); if (selected) openEdit(selected) }}>
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ DELETE ════ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" /> Delete Notice
            </DialogTitle>
            <DialogDescription>
              Permanently delete <strong>"{selected?.title}"</strong>? This cannot be undone.
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
