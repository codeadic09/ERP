"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo } from "react"
import {
  Users, Clock, Search, CheckCircle2, XCircle,
  Loader2, RefreshCw, AlertTriangle, ShieldCheck,
  ChevronLeft, ChevronRight, Eye, MoreVertical,
  Building2, FileText, MessageSquare, UserCheck,
  Layers, GraduationCap,
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  getClassTeachers, updateClassTeacher,
  getDepartments, deleteClassTeacher,
} from "@/lib/db"
import type { ClassTeacher, Department } from "@/lib/types"

// ─── Constants ──────────────────────────────────────────────────
const PAGE_SIZE = 10

const statusStyle: Record<string, { label: string; bg: string; color: string; icon: any }> = {
  pending:  { label: "Pending",  bg: "rgba(217,119,6,0.08)",  color: "#D97706", icon: Clock        },
  approved: { label: "Approved", bg: "rgba(22,163,74,0.08)",  color: "#16A34A", icon: CheckCircle2 },
  rejected: { label: "Rejected", bg: "rgba(220,38,38,0.08)",  color: "#DC2626", icon: XCircle      },
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

// ═══════════════════════════════════════════════════════════════
export default function AdminClassTeachersPage() {
  const me = useAuth("admin")
  if (!me) return null

  // ── Data ─────────────────────────────────────────────────────
  const [requests, setRequests] = useState<ClassTeacher[]>([])
  const [depts, setDepts] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // ── Filters ──────────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDept, setFilterDept] = useState("all")
  const [page, setPage] = useState(1)

  // ── Dialogs ──────────────────────────────────────────────────
  const [reviewOpen, setReviewOpen] = useState(false)
  const [selected, setSelected] = useState<ClassTeacher | null>(null)
  const [adminNote, setAdminNote] = useState("")

  // ── Load ─────────────────────────────────────────────────────
  async function load() {
    setLoading(true); setError(null)
    try {
      const [reqs, deps] = await Promise.all([
        getClassTeachers(),
        getDepartments(),
      ])
      setRequests(reqs)
      setDepts(deps)
    } catch (e: any) {
      setError(e.message ?? "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Filtered ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...requests]
    if (filterStatus !== "all") result = result.filter(r => r.status === filterStatus)
    if (filterDept !== "all") result = result.filter(r => r.dept_id === filterDept)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        (r.users?.name ?? "").toLowerCase().includes(q) ||
        (r.users?.email ?? "").toLowerCase().includes(q) ||
        (r.departments?.name ?? "").toLowerCase().includes(q) ||
        r.section.toLowerCase().includes(q)
      )
    }
    return result.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1
      if (b.status === "pending" && a.status !== "pending") return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [requests, filterStatus, filterDept, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Stats ────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  }), [requests])

  // ── Actions ──────────────────────────────────────────────────
  async function handleAction(id: string, status: "approved" | "rejected") {
    setSaving(true)
    try {
      const updated = await updateClassTeacher(id, {
        status,
        admin_note: adminNote.trim() || undefined,
      })
      setRequests(prev =>
        prev.map(r => r.id === id ? { ...r, ...updated } : r)
      )
      setReviewOpen(false)
      setSelected(null)
      setAdminNote("")
      setSuccess(`Class teacher request ${status} successfully!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (e: any) {
      setError(e.message ?? `Failed to ${status} request`)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setSaving(true)
    try {
      await deleteClassTeacher(id)
      setRequests(prev => prev.filter(r => r.id !== id))
      setSuccess("Record deleted.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (e: any) {
      setError(e.message ?? "Failed to delete")
    } finally {
      setSaving(false)
    }
  }

  function openReview(req: ClassTeacher) {
    setSelected(req)
    setAdminNote(req.admin_note || "")
    setReviewOpen(true)
  }

  // ═══════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="admin"
      userName={me.user?.name ?? "Admin"}
      avatarUrl={me.user?.avatar_url}
      pageTitle="Class Teachers"
      pageSubtitle="Review &amp; manage class teacher assignments across departments"
      loading={loading}
    >
      <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full min-w-0">

        {/* ── Toasts ─────────────────────────────────────── */}
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

        {/* ── Stats Cards ────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Requests", value: stats.total, icon: FileText, bg: "bg-blue-50", border: "border-blue-100", iconColor: "text-blue-600" },
              { label: "Pending", value: stats.pending, icon: Clock, bg: "bg-amber-50", border: "border-amber-100", iconColor: "text-amber-600" },
              { label: "Approved", value: stats.approved, icon: CheckCircle2, bg: "bg-emerald-50", border: "border-emerald-100", iconColor: "text-emerald-600" },
              { label: "Rejected", value: stats.rejected, icon: XCircle, bg: "bg-red-50", border: "border-red-100", iconColor: "text-red-600" },
            ].map(s => (
              <Card key={s.label} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center`}>
                      <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-900">{s.value}</p>
                      <p className="text-[10px] text-gray-500 font-medium">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Filters ────────────────────────────────────── */}
        <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search faculty, department, or section..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1) }}>
                <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterDept} onValueChange={v => { setFilterDept(v); setPage(1) }}>
                <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {depts.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 shrink-0" onClick={load}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Table ──────────────────────────────────────── */}
        <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="text-xs font-bold">Faculty</TableHead>
                  <TableHead className="text-xs font-bold">Department</TableHead>
                  <TableHead className="text-xs font-bold">Division</TableHead>
                  <TableHead className="text-xs font-bold">Message</TableHead>
                  <TableHead className="text-xs font-bold">Status</TableHead>
                  <TableHead className="text-xs font-bold">Requested</TableHead>
                  <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : pageItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Users className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No class teacher requests found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageItems.map(req => {
                    const st = statusStyle[req.status] ?? statusStyle.pending
                    const StIcon = st.icon
                    return (
                      <TableRow key={req.id} className="group hover:bg-blue-50/30">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-xs font-black text-purple-600">
                              {(req.users?.name ?? "?")[0]}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900">{req.users?.name ?? "—"}</p>
                              <p className="text-[10px] text-gray-400">{req.users?.email ?? "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-700">{req.departments?.name ?? "—"}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 font-bold">
                              Sem {req.semester}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 font-bold">
                              Sec {req.section}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500 truncate max-w-[200px] block">
                            {req.message || <span className="italic text-gray-300">No message</span>}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold"
                            style={{ backgroundColor: st.bg, color: st.color }}
                          >
                            <StIcon className="h-3 w-3" />{st.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">
                            {new Date(req.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openReview(req)}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> Review
                              </DropdownMenuItem>
                              {req.status !== "approved" && (
                                <DropdownMenuItem onClick={() => handleAction(req.id, "approved")}>
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Approve
                                </DropdownMenuItem>
                              )}
                              {req.status !== "rejected" && (
                                <DropdownMenuItem onClick={() => handleAction(req.id, "rejected")}>
                                  <XCircle className="h-3.5 w-3.5 mr-2 text-red-500" /> Reject
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(req.id)} className="text-red-600">
                                <XCircle className="h-3.5 w-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                  disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    variant={page === i + 1 ? "default" : "outline"}
                    size="sm"
                    className="h-7 w-7 p-0 text-[10px]"
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                  disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* ── Approved Class Teachers ────────────────────── */}
        {!loading && stats.approved > 0 && (
          <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                Active Class Teachers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {requests
                  .filter(r => r.status === "approved")
                  .map(r => (
                    <div key={r.id} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xs font-black text-emerald-700">
                          {(r.users?.name ?? "?")[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 truncate">{r.users?.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{r.departments?.name}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 font-bold">
                            S{r.semester}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-bold">
                            {r.section}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ════ REVIEW DIALOG ════ */}
      <Dialog open={reviewOpen} onOpenChange={o => { if (!o) { setReviewOpen(false); setSelected(null) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              Review Class Teacher Request
            </DialogTitle>
            <DialogDescription>
              Review class teacher request from <strong>{selected?.users?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 py-2">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-500 mb-0.5 font-semibold">Faculty</p>
                  <p className="text-xs font-bold text-gray-900">{selected.users?.name ?? "—"}</p>
                  <p className="text-[10px] text-gray-400">{selected.users?.email ?? "—"}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-500 mb-0.5 font-semibold">Department</p>
                  <p className="text-xs font-bold text-gray-900">{selected.departments?.name ?? "—"}</p>
                </div>
              </div>

              {/* Division */}
              <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                <p className="text-[10px] text-purple-600 mb-1 font-semibold">Division Requested</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-lg bg-purple-100 text-purple-800 font-bold">
                    Semester {selected.semester}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold">
                    Section {selected.section}
                  </span>
                </div>
              </div>

              {/* Faculty message */}
              {selected.message && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MessageSquare className="h-3 w-3 text-blue-500" />
                    <span className="text-[10px] font-bold text-blue-600">Faculty Message</span>
                  </div>
                  <p className="text-xs text-blue-800">{selected.message}</p>
                </div>
              )}

              {/* Admin note */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Admin Note (optional)</Label>
                <Textarea
                  placeholder="Add a note for the faculty..."
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  rows={2}
                  className="resize-none text-sm"
                  maxLength={500}
                />
              </div>

              {/* Current status */}
              {selected.status !== "pending" && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-500 font-semibold">Current Status</p>
                  <p className="text-xs font-bold mt-0.5 capitalize" style={{ color: statusStyle[selected.status]?.color }}>
                    {selected.status}
                  </p>
                  {selected.admin_note && (
                    <p className="text-[10px] text-gray-500 mt-1">Note: {selected.admin_note}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setReviewOpen(false); setSelected(null) }}>
              Cancel
            </Button>
            {selected && selected.status !== "rejected" && (
              <Button
                variant="destructive"
                onClick={() => handleAction(selected.id, "rejected")}
                disabled={saving}
                className="gap-2"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Reject
              </Button>
            )}
            {selected && selected.status !== "approved" && (
              <Button
                onClick={() => handleAction(selected.id, "approved")}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Approve
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}
