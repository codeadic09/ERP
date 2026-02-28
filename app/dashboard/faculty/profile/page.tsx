"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useRef } from "react"
import {
  UserCircle, Mail, Phone, Building2,
  Calendar, Shield, Edit3, Save, X,
  Camera, CheckCircle2, AlertTriangle,
  Loader2, Lock, Eye, EyeOff, Key,
  GraduationCap, BookOpen, ClipboardCheck,
  TrendingUp, Award, Users
} from "lucide-react"
import { DashboardLayout }  from "@/components/layout/dashboard-layout"
import { Button }           from "@/components/ui/button"
import { Input }            from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Label }   from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  getUsers, getDepartments,
  getAttendance, getNotices, updateUser,
} from "@/lib/db"
import type { User, Department, Attendance, Notice } from "@/lib/types"

// ─── Helpers ─────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d    = Math.floor(diff / 86400000)
  if (d < 1)  return "Today"
  if (d === 1) return "Yesterday"
  if (d < 30)  return `${d} days ago`
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

// Avatar gradient palette (cycles by index)
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#1D4ED8,#3B82F6)",
  "linear-gradient(135deg,#7C3AED,#A78BFA)",
  "linear-gradient(135deg,#059669,#34D399)",
  "linear-gradient(135deg,#D97706,#FCD34D)",
  "linear-gradient(135deg,#DC2626,#F87171)",
]

// ════════════════════════════════════════════════════════════════
export default function FacultyProfilePage() {
  const authUser = useAuth("faculty")
  if (!authUser) return null

  // ── Data ─────────────────────────────────────────────────────
  const [me,         setMe]         = useState<User | null>(null)
  const [dept,       setDept]       = useState<Department | null>(null)
  const [myStudents, setMyStudents] = useState<User[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [notices,    setNotices]    = useState<Notice[]>([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [success,    setSuccess]    = useState<string | null>(null)

  // ── Edit mode ─────────────────────────────────────────────────
  const [editing, setEditing] = useState(false)
  const [form,    setForm]    = useState({
    name:  "",
    phone: "",
    bio:   "",
  })

  // ── Password dialog ───────────────────────────────────────────
  const [pwOpen,   setPwOpen]   = useState(false)
  const [pwForm,   setPwForm]   = useState({ current: "", next: "", confirm: "" })
  const [showPw,   setShowPw]   = useState({ current: false, next: false, confirm: false })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError,  setPwError]  = useState<string | null>(null)

  // ── Avatar upload (local preview only) ───────────────────────
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Load ─────────────────────────────────────────────────────
  async function load() {
    setLoading(true); setError(null)
    try {
      const [users, depts, att, nots] = await Promise.all([
        getUsers(), getDepartments(), getAttendance(), getNotices(),
      ])
      const faculty = authUser.user
      setMe(faculty)
      if (faculty) {
        setForm({ name: faculty.name, phone: faculty.phone ?? "", bio: (faculty as any).bio ?? "" })
        setDept(depts.find(d => d.id === faculty.dept_id) ?? null)
        setMyStudents(users.filter(u => u.role === "student" && u.dept_id === faculty.dept_id))
        setAttendance(att)
        setNotices(nots.filter(n => n.created_by === faculty.id))
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (authUser.user) load() }, [authUser.user])

  // ── Avatar preview ────────────────────────────────────────────
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  // ── Save profile ──────────────────────────────────────────────
  async function handleSave() {
    if (!me || !form.name.trim()) return
    setSaving(true)
    try {
      const updated = await updateUser(me.id, {
        name:  form.name.trim(),
        phone: form.phone.trim() || null,
      } as any)
      setMe(updated)
      setEditing(false)
      setSuccess("Profile updated successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Change password (simulated) ───────────────────────────────
  async function handlePasswordChange() {
    setPwError(null)
    if (!pwForm.current) { setPwError("Enter your current password"); return }
    if (pwForm.next.length < 8) { setPwError("New password must be at least 8 characters"); return }
    if (pwForm.next !== pwForm.confirm) { setPwError("Passwords do not match"); return }
    setPwSaving(true)
    await new Promise(r => setTimeout(r, 1200))  // simulate API
    setPwSaving(false)
    setPwOpen(false)
    setPwForm({ current: "", next: "", confirm: "" })
    setSuccess("Password changed successfully!")
    setTimeout(() => setSuccess(null), 3000)
  }

  // ── Computed stats ────────────────────────────────────────────
  const attByMe = attendance.filter(a =>
    myStudents.map(s => s.id).includes(a.student_id)
  )
  const totalSessions = [...new Set(attByMe.map(a => a.date))].length
  const avgAttRate = myStudents.length && attByMe.length
    ? Math.round(
        (attByMe.filter(a => a.status === "present").length / attByMe.length) * 100
      )
    : 0

  const avatarGrad = AVATAR_GRADIENTS[
    (me?.name.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length
  ]
  const initials = me?.name.split(" ").map(n => n[0]).slice(0, 2).join("") ?? "?"

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="faculty"
      userName={me?.name ?? "Faculty"}
      pageTitle="My Profile"
      pageSubtitle="View and manage your account details"
      loading={loading}
    >
      <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full min-w-0 max-w-5xl">

        {/* ── Toasts ─────────────────────────────────────── */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ══ LEFT — Avatar + quick info ═══════════════════ */}
          <div className="space-y-5">

            {/* Avatar card */}
            <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">

                {/* Avatar */}
                <div className="relative group">
                  <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-lg"
                    style={{ background: avatarPreview ? "none" : avatarGrad }}
                  >
                    {avatarPreview
                      ? <img src={avatarPreview} alt="avatar" className="w-24 h-24 rounded-3xl object-cover" />
                      : initials
                    }
                  </div>
                  {/* Upload overlay */}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 rounded-3xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Camera className="h-5 w-5 text-white" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  {/* Online dot */}
                  <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow" />
                </div>

                {loading
                  ? <>
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </>
                  : <>
                      <div>
                        <h2 className="text-lg font-black text-gray-900">{me?.name}</h2>
                        <p className="text-sm text-purple-600 font-semibold">{dept?.name ?? "—"}</p>
                      </div>

                      {/* Role badge */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                        <BookOpen className="h-3 w-3" /> Faculty Member
                      </span>

                      {/* Edit / Save buttons */}
                      <div className="w-full flex flex-col gap-2">
                        {!editing
                          ? (
                            <Button
                              size="sm"
                              onClick={() => setEditing(true)}
                              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                            </Button>
                          )
                          : (
                            <div className="flex gap-2 w-full">
                              <Button size="sm" variant="outline" className="flex-1 gap-1"
                                onClick={() => { setEditing(false); setForm({ name: me?.name ?? "", phone: me?.phone ?? "", bio: "" }) }}>
                                <X className="h-3.5 w-3.5" /> Cancel
                              </Button>
                              <Button size="sm" className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={handleSave} disabled={saving}>
                                {saving
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Save className="h-3.5 w-3.5" />
                                }
                                Save
                              </Button>
                            </div>
                          )
                        }
                        <Button size="sm" variant="outline" className="w-full gap-2 text-amber-700 border-amber-200 hover:bg-amber-50"
                          onClick={() => { setPwForm({ current: "", next: "", confirm: "" }); setPwError(null); setPwOpen(true) }}>
                          <Lock className="h-3.5 w-3.5" /> Change Password
                        </Button>
                      </div>
                    </>
                }
              </CardContent>
            </Card>

            {/* Quick stats */}
            <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {[
                  { label: "My Students",    value: loading ? "—" : myStudents.length,  icon: Users,          color: "text-blue-600",    bg: "bg-blue-50"    },
                  { label: "Sessions Taken", value: loading ? "—" : totalSessions,      icon: ClipboardCheck, color: "text-indigo-600",  bg: "bg-indigo-50"  },
                  { label: "Avg Att. Rate",  value: loading ? "—" : `${avgAttRate}%`,   icon: TrendingUp,     color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Notices Posted", value: loading ? "—" : notices.length,     icon: Award,          color: "text-amber-600",   bg: "bg-amber-50"   },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                        <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{s.label}</span>
                    </div>
                    {loading
                      ? <Skeleton className="h-4 w-8" />
                      : <span className={`text-sm font-black ${s.color}`}>{s.value}</span>
                    }
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* ══ RIGHT — Details form + history ═══════════════ */}
          <div className="lg:col-span-2 space-y-6">

            {/* Profile details card */}
            <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {loading
                  ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-1.5">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-9 w-full" />
                        </div>
                      ))}
                    </div>
                  )
                  : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      {/* Full Name */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</Label>
                        {editing
                          ? <Input value={form.name}
                              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                              placeholder="Your full name" />
                          : <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                              <UserCircle className="h-4 w-4 text-gray-400 shrink-0" />
                              <span className="text-sm font-semibold text-gray-800">{me?.name}</span>
                            </div>
                        }
                      </div>

                      {/* Email (readonly) */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</Label>
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-600 truncate">{me?.email}</span>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</Label>
                        {editing
                          ? <Input value={form.phone}
                              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                              placeholder="+91 98765 43210" />
                          : <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                              <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-600">{me?.phone ?? "—"}</span>
                            </div>
                        }
                      </div>

                      {/* Department (readonly) */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</Label>
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-600">{dept?.name ?? "—"}</span>
                        </div>
                      </div>

                      {/* Role (readonly) */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</Label>
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50 border border-purple-100">
                          <Shield className="h-4 w-4 text-purple-400 shrink-0" />
                          <span className="text-sm font-bold text-purple-700 capitalize">{me?.role}</span>
                        </div>
                      </div>

                      {/* Joined date (readonly) */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</Label>
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-600">
                            {me?.enrolled_at
                              ? new Date(me.enrolled_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                              : "—"
                            }
                          </span>
                        </div>
                      </div>

                      {/* Bio — full width */}
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bio</Label>
                        {editing
                          ? (
                            <Textarea
                              value={form.bio}
                              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                              placeholder="A short bio about yourself..."
                              rows={3}
                              className="resize-none text-sm"
                              maxLength={300}
                            />
                          )
                          : (
                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 min-h-[60px]">
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {(me as any)?.bio || <span className="text-gray-400 italic">No bio added yet.</span>}
                              </p>
                            </div>
                          )
                        }
                      </div>

                    </div>
                  )
                }
              </CardContent>
            </Card>

            {/* Recent notices card */}
            <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  Recent Notices Published
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading
                  ? (
                    <div className="p-4 space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="h-8 w-8 shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3.5 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                  : notices.length === 0
                    ? (
                      <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
                        <Award className="h-8 w-8 text-gray-200" />
                        <p className="text-xs">No notices published yet</p>
                      </div>
                    )
                    : (
                      <div className="divide-y divide-gray-50">
                        {notices.slice(0, 5).map(n => {
                          const prio = ((n as any).priority ?? "medium") as string
                          const dotColor = {
                            low: "#94A3B8", medium: "#3B82F6",
                            high: "#F59E0B", urgent: "#EF4444"
                          }[prio] ?? "#3B82F6"

                          return (
                            <div key={n.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                                <div className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{n.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {n.target} · {timeAgo(n.created_at)}
                                </p>
                              </div>
                              {n.pinned && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                                  Pinned
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                }
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* ════ CHANGE PASSWORD DIALOG ════ */}
      <Dialog open={pwOpen} onOpenChange={open => { if (!open) setPwOpen(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Key className="h-4 w-4 text-amber-600" />
              </div>
              Change Password
            </DialogTitle>
            <DialogDescription>
              Choose a strong password with at least 8 characters.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">

            {pwError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {pwError}
              </div>
            )}

            {(["current","next","confirm"] as const).map(field => {
              const labels = { current: "Current Password", next: "New Password", confirm: "Confirm New Password" }
              return (
                <div key={field} className="space-y-1.5">
                  <Label className="text-sm font-semibold">{labels[field]}</Label>
                  <div className="relative">
                    <Input
                      type={showPw[field] ? "text" : "password"}
                      placeholder="••••••••"
                      value={pwForm[field]}
                      onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw[field]
                        ? <EyeOff className="h-4 w-4" />
                        : <Eye    className="h-4 w-4" />
                      }
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Strength indicator */}
            {pwForm.next && (
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500 font-medium">Password strength</p>
                <div className="flex gap-1">
                  {[8, 12, 16].map((threshold, i) => (
                    <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width:      pwForm.next.length >= threshold ? "100%" : "0%",
                          background: i === 0 ? "#EF4444" : i === 1 ? "#F59E0B" : "#16A34A",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {pwForm.next.length < 8  ? "Too short"
                   : pwForm.next.length < 12 ? "Weak"
                   : pwForm.next.length < 16 ? "Good"
                   : "Strong 💪"}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPwOpen(false)}>Cancel</Button>
            <Button
              onClick={handlePasswordChange}
              disabled={pwSaving}
              className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
            >
              {pwSaving
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                : <><Key className="h-3.5 w-3.5" /> Update Password</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}
