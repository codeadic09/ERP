"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo } from "react"
import {
  Bell, Search, Filter,
  Calendar, Users, GraduationCap,
  AlertCircle, CheckCircle2, Info,
  ChevronLeft, ChevronRight,
  AlertTriangle, RefreshCw, Eye, X
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button }  from "@/components/ui/button"
import { Input }   from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { getNotices, getUsers } from "@/lib/db"
import type { Notice, User } from "@/lib/types"

// ─── Helpers ─────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1)   return "Just now"
  if (m < 60)  return `${m}m ago`
  if (h < 24)  return `${h}h ago`
  if (d < 7)   return `${d}d ago`
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

type FilterVal = "all" | "urgent"

const PAGE_SIZE = 9

// ════════════════════════════════════════════════════════════════
export default function StudentNoticesPage() {
  const authUser = useAuth("student")
  if (!authUser) return null

  // ── Data ─────────────────────────────────────────────────────
  const [me,      setMe]      = useState<User | null>(null)
  const [notices, setNotices] = useState<Notice[]>([])
  const [users,   setUsers]   = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  // ── UI ───────────────────────────────────────────────────────
  const [search,  setSearch]  = useState("")
  const [filter,  setFilter]  = useState<FilterVal>("all")
  const [page,    setPage]    = useState(1)
  const [viewing, setViewing] = useState<Notice | null>(null)
  const [read,    setRead]    = useState<Set<string>>(new Set())

  // ── Load ─────────────────────────────────────────────────────
  async function load() {
    setLoading(true); setError(null)
    try {
      const [allUsers, allNotices] = await Promise.all([getUsers(), getNotices()])
      const student = authUser.user
      setMe(student)
      setUsers(allUsers)
      // Students only see notices targeted to All or Students
      setNotices(
        allNotices.filter(n => n.target === "All" || n.target === "Students")
      )
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (authUser.user) load() }, [authUser.user])
  useEffect(() => { setPage(1) }, [search, filter])

  // ── Mark as read on view ──────────────────────────────────────
  function openNotice(n: Notice) {
    setViewing(n)
    setRead(prev => new Set(prev).add(n.id))
  }

  // ── Stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:  notices.length,
    unread: notices.filter(n => !read.has(n.id)).length,
    urgent: notices.filter(n => n.urgent).length,
  }), [notices, read])

  // ── Filtered + sorted ─────────────────────────────────────────
  const filtered = useMemo(() => {
    return notices
      .filter(n => {
        if (search) {
          const q = search.toLowerCase()
          if (!n.title.toLowerCase().includes(q) &&
              !(n.body ?? "").toLowerCase().includes(q)) return false
        }
        if (filter === "urgent")
          return n.urgent
        return true
      })
      .sort((a, b) => {
        // Urgent first, then by date
        if (a.urgent && !b.urgent) return -1
        if (!a.urgent && b.urgent) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [notices, search, filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Author helper ─────────────────────────────────────────────
  function authorName(id: string) {
    return users.find(u => u.id === id)?.name ?? "Administration"
  }

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="student"
      userName={me?.name ?? "Student"}
      avatarUrl={me?.avatar_url}
      pageTitle="Notices"
      pageSubtitle="Announcements and updates from your institution"
      loading={loading}
    >
      <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full min-w-0">

        {/* ── Error ─────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />{error}
            <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}

        {/* ── Urgent notice banner ──────────────────────────── */}
        {!loading && stats.urgent > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 animate-pulse" />
            <span>
              You have <strong>{stats.urgent}</strong> urgent notice{stats.urgent > 1 ? "s" : ""} — please read immediately.
            </span>
            <button
              onClick={() => setFilter("urgent")}
              className="ml-auto text-xs font-bold underline shrink-0"
            >
              View
            </button>
          </div>
        )}

        {/* ── Stat cards ────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Total",   value: stats.total,  icon: Bell,         color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100"   },
            { label: "Unread",  value: stats.unread, icon: Info,         color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
            { label: "Urgent",  value: stats.urgent, icon: AlertCircle,  color: "text-red-600",    bg: "bg-red-50",    border: "border-red-100"    },
          ].map(s => (
            <Card key={s.label} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-3`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
                {loading
                  ? <Skeleton className="h-6 w-10" />
                  : <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                }
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Toolbar ───────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search notices..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-white/80"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Select value={filter} onValueChange={v => setFilter(v as FilterVal)}>
            <SelectTrigger className="h-9 text-sm w-36 bg-white/80"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notices</SelectItem>
              <SelectItem value="pinned">📌 Pinned</SelectItem>
              <SelectItem value="urgent">🔴 Urgent</SelectItem>
              <SelectItem value="high">🟠 High</SelectItem>
              <SelectItem value="medium">🔵 Medium</SelectItem>
              <SelectItem value="low">⚪ Low</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={load}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>

          {/* Unread badge */}
          {!loading && stats.unread > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-600">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              {stats.unread} unread
            </div>
          )}
        </div>

        {/* ── Notices grid ──────────────────────────────────── */}
        {loading
          ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <div className="flex justify-between pt-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-12" />
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
                  {filter !== "all" && (
                    <Button variant="outline" size="sm" onClick={() => setFilter("all")}
                      className="mt-2 text-xs">
                      Clear filter
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
            : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginated.map(n => {
                  const isUnread = !read.has(n.id)
                  const isUrgent = n.urgent

                  return (
                    <Card
                      key={n.id}
                      onClick={() => openNotice(n)}
                      className={`backdrop-blur-xl border-white/50 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden cursor-pointer ${
                        isUnread ? "bg-white/90" : "bg-white/60"
                      }`}
                    >
                      {/* Urgent accent bar */}
                      <div className="absolute top-0 left-0 right-0 h-0.5"
                        style={{ background: isUrgent ? "#EF4444" : "#3B82F6" }} />

                      {/* Unread dot */}
                      {isUnread && (
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-400" />
                      )}

                      <CardContent className="p-5">

                        {/* Badges row */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-3 pr-4">
                          {/* Urgent pulse badge */}
                          {isUrgent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                              Urgent
                            </span>
                          )}

                          {/* Target */}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                            <GraduationCap className="h-2.5 w-2.5" /> {n.target}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className={`text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors ${
                          isUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"
                        }`}>
                          {n.title}
                        </h3>

                        {/* Content preview */}
                        {n.body && (
                          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4">
                            {n.body}
                          </p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-[8px] font-black text-blue-700 shrink-0">
                              {authorName(n.created_by).split(" ").map(x => x[0]).slice(0,2).join("")}
                            </div>
                            <span className="text-[11px] text-gray-400 font-medium truncate max-w-[90px]">
                              {authorName(n.created_by)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-gray-400">{timeAgo(n.created_at)}</span>
                            <Eye className="h-3 w-3 text-gray-300 group-hover:text-blue-400 transition-colors" />
                          </div>
                        </div>

                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )
        }

        {/* ── Pagination ────────────────────────────────────── */}
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

      {/* ════ VIEW DIALOG ════ */}
      <Dialog open={!!viewing} onOpenChange={open => { if (!open) setViewing(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Notice</DialogTitle>
          </DialogHeader>
          {viewing && (() => {
            return (
              <div className="space-y-4 py-2">

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {viewing.urgent && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                      <AlertCircle className="h-3 w-3" /> Urgent
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                    <GraduationCap className="h-3 w-3" />
                    {viewing.target}
                  </span>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckCircle2 className="h-3 w-3" /> Read
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-base font-black text-gray-900 leading-snug">
                  {viewing.title}
                </h2>

                {/* Content */}
                {viewing.body && (
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 max-h-[240px] overflow-y-auto">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {viewing.body}
                    </p>
                  </div>
                )}

                {/* Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Published by", value: authorName(viewing.created_by) },
                    { label: "Published on",  value: new Date(viewing.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
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
            <Button variant="outline" size="sm" onClick={() => setViewing(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}
