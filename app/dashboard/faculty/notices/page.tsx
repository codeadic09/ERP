"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo } from "react"
import {
  Megaphone, Plus, Search, Bell, Pin,
  Calendar, Users, GraduationCap, BookOpen,
  AlertTriangle, RefreshCw, Eye, Trash2,
  ChevronLeft, ChevronRight, Loader2,
  CheckCircle2, Info, AlertCircle, X,
  MoreVertical, Filter
} from "lucide-react"
import { DashboardLayout }  from "@/components/layout/dashboard-layout"
import { Button }           from "@/components/ui/button"
import { Input }            from "@/components/ui/input"
import { Textarea }         from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label }            from "@/components/ui/label"
import { getNotices, addNotice, deleteNotice, getUsers } from "@/lib/db"
import type { Notice, User } from "@/lib/types"

// ─── Types ────────────────────────────────────────────────────────
type Priority = "low" | "medium" | "high" | "urgent"
type Target   = "All" | "Students" | "Faculty"
type Filter_  = "all" | Target | Priority

const PAGE_SIZE = 6

// ─── Helpers ─────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1)  return "Just now"
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (d < 7)  return `${d}d ago`
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

const priorityConfig: Record<Priority, {
  label: string; color: string; bg: string; border: string; dot: string
}> = {
  low:    { label: "Low",    color: "#64748B", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.18)", dot: "#94A3B8" },
  medium: { label: "Medium", color: "#2563EB", bg: "rgba(37,99,235,0.08)",  border: "rgba(37,99,235,0.18)",  dot: "#3B82F6" },
  high:   { label: "High",   color: "#D97706", bg: "rgba(217,119,6,0.08)",  border: "rgba(217,119,6,0.18)",  dot: "#F59E0B" },
  urgent: { label: "Urgent", color: "#DC2626", bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.18)",  dot: "#EF4444" },
}

const targetConfig: Record<Target, { label: string; color: string; bg: string; icon: any }> = {
  All:      { label: "Everyone",  color: "#2563EB", bg: "rgba(37,99,235,0.07)",  icon: Users        },
  Students: { label: "Students",  color: "#16A34A", bg: "rgba(22,163,74,0.07)",  icon: GraduationCap },
  Faculty:  { label: "Faculty",   color: "#9333EA", bg: "rgba(147,51,234,0.07)", icon: BookOpen     },
}

// ════════════════════════════════════════════════════════════════
export default function FacultyNoticesPage() {
  const authUser = useAuth("faculty")
  if (!authUser) return null

  // ── Data ─────────────────────────────────────────────────────
  const [notices,  setNotices]  = useState<Notice[]>([])
  const [users,    setUsers]    = useState<User[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState<string | null>(null)

  // ── Faculty session ───────────────────────────────────────────
  const [me, setMe] = useState<User | null>(null)

  // ── Filters ───────────────────────────────────────────────────
  const [search,  setSearch]  = useState("")
  const [filter,  setFilter]  = useState<Filter_>("all")
  const [page,    setPage]    = useState(1)

  // ── Dialogs ───────────────────────────────────────────────────
  const [composeOpen,  setComposeOpen]  = useState(false)
  const [viewNotice,   setViewNotice]   = useState<Notice | null>(null)
  const [deleteNotice_, setDeleteNotice_] = useState<Notice | null>(null)

  // ── Form state ────────────────────────────────────────────────
  const blankForm = {
    title:    "",
    content:  "",
    target:   "Students" as Target,
    priority: "medium"   as Priority,
    pinned:   false,
  }
  const [form, setForm] = useState(blankForm)

  // ── Load ─────────────────────────────────────────────────────
  async function load() {
    setLoading(true); setError(null)
    try {
      const [n, u] = await Promise.all([getNotices(), getUsers()])
      setNotices(n); setUsers(u)
      setMe(authUser.user)
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (authUser.user) load() }, [authUser.user])
  useEffect(() => { setPage(1) }, [search, filter])

  // ── Stats ─────────────────────────────────────────────────────
  const myNotices = useMemo(
    () => notices.filter(n => n.created_by === me?.id),
    [notices, me]
  )

  const stats = useMemo(() => ({
    total:   myNotices.length,
    pinned:  myNotices.filter(n => n.pinned).length,
    urgent:  myNotices.filter(n => (n as any).priority === "urgent").length,
    recent:  myNotices.filter(n => {
      const d = Date.now() - new Date(n.created_at).getTime()
      return d < 86400000 * 7
    }).length,
  }), [myNotices])

  // ── Filtered ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return notices.filter(n => {
      if (search && !n.title.toLowerCase().includes(search.toLowerCase()) &&
                    !n.content.toLowerCase().includes(search.toLowerCase())) return false
      if (filter === "all")                 return true
      if (filter === "All"      )           return n.target === "All"
      if (filter === "Students" )           return n.target === "Students"
      if (filter === "Faculty"  )           return n.target === "Faculty"
      if (["low","medium","high","urgent"].includes(filter))
        return (n as any).priority === filter
      return true
    })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [notices, search, filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Author helper ─────────────────────────────────────────────
  function authorName(createdBy: string) {
    const u = users.find(u => u.id === createdBy)
    return u?.name ?? "Unknown"
  }

  // ── Compose ───────────────────────────────────────────────────
  async function handleCompose() {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    try {
      const newNotice = await addNotice({
        title:      form.title.trim(),
        content:    form.content.trim(),
        target:     form.target,
        priority:   form.priority,
        pinned:     form.pinned,
        created_by: me?.id ?? "",
      } as any)
      setNotices(prev => [newNotice, ...prev])
      setComposeOpen(false)
      setForm(blankForm)
      setSuccess("Notice published successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteNotice_) return
    setDeleting(deleteNotice_.id)
    try {
      await deleteNotice(deleteNotice_.id)
      setNotices(prev => prev.filter(n => n.id !== deleteNotice_.id))
      setDeleteNotice_(null)
      setSuccess("Notice deleted.")
      setTimeout(() => setSuccess(null), 2500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDeleting(null)
    }
  }

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="faculty"
      userName={me?.name ?? "Faculty"}
      pageTitle="Notices"
      pageSubtitle="Publish and manage announcements"
      loading={loading}
    >
      <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full min-w-0">

        {/* ── Error / Success toasts ──────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {/* ── Stat cards ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "My Notices",   value: stats.total,  icon: Megaphone,   color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100"    },
            { label: "Pinned",       value: stats.pinned, icon: Pin,         color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-100"  },
            { label: "Urgent",       value: stats.urgent, icon: AlertCircle, color: "text-red-600",     bg: "bg-red-50",     border: "border-red-100"     },
            { label: "This Week",    value: stats.recent, icon: Calendar,    color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          ].map(s => (
            <Card key={s.label} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-3`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
                {loading
                  ? <Skeleton className="h-6 w-12" />
                  : <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                }
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Toolbar ────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search notices..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-white/80"
            />
          </div>

          {/* Filter */}
          <Select value={filter} onValueChange={v => setFilter(v as Filter_)}>
            <SelectTrigger className="h-9 text-sm w-36 bg-white/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notices</SelectItem>
              <SelectItem value="All">→ Everyone</SelectItem>
              <SelectItem value="Students">→ Students</SelectItem>
              <SelectItem value="Faculty">→ Faculty</SelectItem>
              <SelectItem value="urgent">🔴 Urgent</SelectItem>
              <SelectItem value="high">🟠 High</SelectItem>
              <SelectItem value="medium">🔵 Medium</SelectItem>
              <SelectItem value="low">⚪ Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh */}
          <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={load}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>

          {/* Compose */}
          <Button
            size="sm"
            onClick={() => { setForm(blankForm); setComposeOpen(true) }}
            className="h-9 bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" /> New Notice
          </Button>
        </div>

        {/* ── Notices grid ────────────────────────────────── */}
        {loading
          ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <div className="flex gap-2 pt-1">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
          : paginated.length === 0
            ? (
              <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
                <CardContent className="py-20 flex flex-col items-center gap-3 text-gray-400">
                  <Bell className="h-12 w-12 text-gray-200" />
                  <p className="text-sm font-semibold">No notices found</p>
                  <p className="text-xs">Try adjusting your search or filter</p>
                </CardContent>
              </Card>
            )
            : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginated.map(notice => {
                  const prio   = ((notice as any).priority ?? "medium") as Priority
                  const pc     = priorityConfig[prio]
                  const tc     = targetConfig[notice.target as Target] ?? targetConfig["All"]
                  const isMine = notice.created_by === me?.id
                  const TIcon  = tc.icon

                  return (
                    <Card
                      key={notice.id}
                      className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden"
                    >
                      {/* Priority top bar */}
                      <div className="absolute top-0 left-0 right-0 h-0.5"
                        style={{ background: pc.dot }} />

                      <CardContent className="p-5">

                        {/* Header row */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">

                            {/* Priority badge */}
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: pc.dot }} />
                              {pc.label}
                            </span>

                            {/* Target badge */}
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: tc.bg, color: tc.color }}
                            >
                              <TIcon className="h-2.5 w-2.5" />
                              {tc.label}
                            </span>

                            {/* Pinned */}
                            {notice.pinned && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                <Pin className="h-2.5 w-2.5" /> Pinned
                              </span>
                            )}
                          </div>

                          {/* Actions menu — only for own notices */}
                          {isMine && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm"
                                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-32 text-xs">
                                <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setViewNotice(notice)}>
                                  <Eye className="h-3.5 w-3.5 mr-2" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteNotice_(notice)}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          {/* View only for others */}
                          {!isMine && (
                            <Button variant="ghost" size="sm"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              onClick={() => setViewNotice(notice)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>

                        {/* Title */}
                        <h3
                          className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-2 leading-snug cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => setViewNotice(notice)}
                        >
                          {notice.title}
                        </h3>

                        {/* Content preview */}
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                          {notice.content}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-[8px] font-black text-blue-700">
                              {authorName(notice.created_by).split(" ").map(n => n[0]).slice(0,2).join("")}
                            </div>
                            <span className="text-xs text-gray-500 font-medium truncate max-w-[100px]">
                              {isMine ? "You" : authorName(notice.created_by)}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400 font-medium shrink-0">
                            {timeAgo(notice.created_at)}
                          </span>
                        </div>

                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )
        }

        {/* ── Pagination ──────────────────────────────────── */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between">
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
                      onClick={() => setPage(p)}>{p}
                    </Button>
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
      </div>

      {/* ════ COMPOSE DIALOG ════ */}
      <Dialog open={composeOpen} onOpenChange={open => { if (!open) setComposeOpen(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Megaphone className="h-4 w-4 text-blue-600" />
              </div>
              Publish New Notice
            </DialogTitle>
            <DialogDescription>
              This notice will be visible to the selected audience immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">

            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Title <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Notice title..."
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                maxLength={120}
              />
              <p className="text-xs text-gray-400 text-right">{form.title.length}/120</p>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Content <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Write your notice here..."
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={4}
                className="resize-none text-sm"
                maxLength={1000}
              />
              <p className="text-xs text-gray-400 text-right">{form.content.length}/1000</p>
            </div>

            {/* Target + Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Audience</Label>
                <Select value={form.target} onValueChange={v => setForm(f => ({ ...f, target: v as Target }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">Everyone</SelectItem>
                    <SelectItem value="Students">Students Only</SelectItem>
                    <SelectItem value="Faculty">Faculty Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as Priority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">⚪ Low</SelectItem>
                    <SelectItem value="medium">🔵 Medium</SelectItem>
                    <SelectItem value="high">🟠 High</SelectItem>
                    <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pin toggle */}
            <div
              onClick={() => setForm(f => ({ ...f, pinned: !f.pinned }))}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
                form.pinned
                  ? "bg-amber-50 border-amber-200"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                form.pinned ? "bg-amber-100" : "bg-gray-100"
              }`}>
                <Pin className={`h-4 w-4 ${form.pinned ? "text-amber-600" : "text-gray-400"}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${form.pinned ? "text-amber-700" : "text-gray-700"}`}>
                  Pin this notice
                </p>
                <p className="text-xs text-gray-400">Pinned notices appear at the top</p>
              </div>
              {/* Toggle pill */}
              <div className={`w-9 h-5 rounded-full transition-colors ${form.pinned ? "bg-amber-400" : "bg-gray-200"}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow m-0.5 transition-transform ${
                  form.pinned ? "translate-x-4" : "translate-x-0"
                }`} />
              </div>
            </div>

          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCompose}
              disabled={saving || !form.title.trim() || !form.content.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {saving
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Publishing...</>
                : <><Megaphone className="h-3.5 w-3.5" /> Publish Notice</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ VIEW DIALOG ════ */}
      <Dialog open={!!viewNotice} onOpenChange={open => { if (!open) setViewNotice(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Notice</DialogTitle>
          </DialogHeader>
          {viewNotice && (() => {
            const prio = ((viewNotice as any).priority ?? "medium") as Priority
            const pc   = priorityConfig[prio]
            const tc   = targetConfig[viewNotice.target as Target] ?? targetConfig["All"]
            const TI   = tc.icon
            return (
              <div className="space-y-4 py-2">

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: pc.dot }} />
                    {pc.label}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: tc.bg, color: tc.color }}>
                    <TI className="h-3 w-3" /> {tc.label}
                  </span>
                  {viewNotice.pinned && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                      <Pin className="h-3 w-3" /> Pinned
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-base font-black text-gray-900 leading-snug">
                  {viewNotice.title}
                </h2>

                {/* Content */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {viewNotice.content}
                  </p>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Published by", value: authorName(viewNotice.created_by) },
                    { label: "Date",          value: new Date(viewNotice.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
                  ].map(m => (
                    <div key={m.label} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{m.label}</p>
                      <p className="text-xs font-bold text-gray-800">{m.value}</p>
                    </div>
                  ))}
                </div>

              </div>
            )
          })()}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewNotice(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ DELETE CONFIRM DIALOG ════ */}
      <Dialog open={!!deleteNotice_} onOpenChange={open => { if (!open) setDeleteNotice_(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Delete Notice
            </DialogTitle>
            <DialogDescription>
              Permanently delete <strong>"{deleteNotice_?.title}"</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteNotice_(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!!deleting}
            >
              {deleting
                ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                : <Trash2  className="h-3.5 w-3.5 mr-2" />
              }
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}
