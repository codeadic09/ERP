"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Users, Building2, Wallet, Bell,
  TrendingUp, TrendingDown, GraduationCap,
  BookOpen, CreditCard, AlertCircle,
  ArrowUpRight, CheckCircle2, Clock,
  XCircle, Activity, CalendarDays,
  ChevronRight, Loader2
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { LiquidGlassBackground } from "@/components/liquid-glass-bg"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  getAdminStats,
  getFees,
  getNotices,
  getUsers,
  getDepartments,
} from "@/lib/db"
import type { Fee, Notice, User, Department } from "@/lib/types"



// ─── Status style map ────────────────────────────────────────────
const statusStyle = {
  paid:    { label: "Paid",    bg: "rgba(22,163,74,0.08)",  color: "#16A34A", icon: CheckCircle2 },
  pending: { label: "Pending", bg: "rgba(217,119,6,0.08)",  color: "#D97706", icon: Clock        },
  overdue: { label: "Overdue", bg: "rgba(220,38,38,0.08)",  color: "#DC2626", icon: XCircle      },
}

const targetBadge = {
  All:      "bg-gray-100 text-gray-600",
  Students: "bg-blue-50 text-blue-700",
  Faculty:  "bg-purple-50 text-purple-700",
}

const DEPT_COLORS = [
  "#3B82F6","#8B5CF6","#EC4899",
  "#F59E0B","#10B981","#F97316",
]

// ─── Skeleton ────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
  )
}

// ════════════════════════════════════════════════════════════════
export default function AdminOverviewPage() {
  const me = useAuth("admin")
  if (!me) return null
  const [time, setTime] = useState(new Date())

  // data
  const [stats,   setStats]   = useState<Awaited<ReturnType<typeof getAdminStats>> | null>(null)
  const [fees,    setFees]    = useState<Fee[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [users,   setUsers]   = useState<User[]>([])
  const [depts,   setDepts]   = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  // live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // fetch everything in parallel
  useEffect(() => {
    async function load() {
      try {
        const [s, f, n, u, d] = await Promise.all([
          getAdminStats(),
          getFees(),
          getNotices(),
          getUsers(),
          getDepartments(),
        ])
        setStats(s)
        setFees(f.slice(0, 5))
        setNotices(n.slice(0, 4))
        setUsers(u)
        setDepts(d)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Stat cards config ─────────────────────────────────────────
  const statCards = stats ? [
    {
      label:  "Total Students",
      value:  stats.totalStudents.toLocaleString(),
      change: "+12 this month",
      up:     true,
      icon:   GraduationCap,
      color:  "text-blue-600",
      bg:     "bg-blue-50",
      border: "border-blue-100",
      href:   "/dashboard/admin/users",
    },
    {
      label:  "Total Faculty",
      value:  stats.totalFaculty.toLocaleString(),
      change: "+2 this month",
      up:     true,
      icon:   BookOpen,
      color:  "text-purple-600",
      bg:     "bg-purple-50",
      border: "border-purple-100",
      href:   "/dashboard/admin/users",
    },
    {
      label:  "Departments",
      value:  stats.totalDepartments.toLocaleString(),
      change: "No change",
      up:     true,
      icon:   Building2,
      color:  "text-amber-600",
      bg:     "bg-amber-50",
      border: "border-amber-100",
      href:   "/dashboard/admin/departments",
    },
    {
      label:  "Fee Collected",
      value:  `₹${(stats.totalFeeCollected / 1000).toFixed(1)}K`,
      change: "+8% this month",
      up:     true,
      icon:   Wallet,
      color:  "text-emerald-600",
      bg:     "bg-emerald-50",
      border: "border-emerald-100",
      href:   "/dashboard/admin/fees",
    },
    {
      label:  "Pending Fees",
      value:  `₹${(stats.totalFeePending / 1000).toFixed(1)}K`,
      change: "Needs attention",
      up:     false,
      icon:   CreditCard,
      color:  "text-red-600",
      bg:     "bg-red-50",
      border: "border-red-100",
      href:   "/dashboard/admin/fees",
    },
    {
      label:  "Active Notices",
      value:  notices.length.toLocaleString(),
      change: "+3 this week",
      up:     true,
      icon:   Bell,
      color:  "text-indigo-600",
      bg:     "bg-indigo-50",
      border: "border-indigo-100",
      href:   "/dashboard/admin/notices",
    },
  ] : []

  // ── Department enrollment data ────────────────────────────────
  const deptCounts = depts.map((d, i) => ({
    name:     d.name,
    color:    d.color ?? DEPT_COLORS[i % DEPT_COLORS.length],
    students: users.filter(u => u.dept_id === d.id && u.role === "student").length,
  }))
  const maxStudents = Math.max(...deptCounts.map(d => d.students), 1)

  // ── Recent activity from users + fees combined ────────────────
  const recentActivity = [
    ...users.slice(0, 3).map(u => ({
      id:      u.id,
      message: `${u.role === "student" ? "Student" : "Faculty"} ${u.name} added to the system`,
      time:    new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      icon:    u.role === "student" ? GraduationCap : BookOpen,
      color:   u.role === "student" ? "#2563EB" : "#9333EA",
    })),
    ...fees.slice(0, 3).map(f => ({
      id:      f.id,
      message: `Fee ${f.status} — ₹${Number(f.amount).toLocaleString()} from ${(f as any).users?.name ?? "student"}`,
      time:    new Date(f.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      icon:    CreditCard,
      color:   f.status === "paid" ? "#16A34A" : f.status === "overdue" ? "#DC2626" : "#D97706",
    })),
  ].slice(0, 6)

  return (
    <DashboardLayout
      role="admin"
      userName="Admin"
      pageTitle="Overview"
      pageSubtitle="Welcome back! Here's what's happening today."
      loading={loading}
    >
      <LiquidGlassBackground />
      <div className="relative z-10 space-y-6 p-4 sm:p-6 md:p-8 w-full min-w-0">

        {/* ── Welcome banner ──────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 p-6 text-white liquid-glass-banner">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 right-20 w-32 h-32 rounded-full bg-indigo-400/30 blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {time.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Good {time.getHours() < 12 ? "Morning" : time.getHours() < 17 ? "Afternoon" : "Evening"}, Admin 👋
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                UniCore ERP — everything is running smoothly today.
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-4xl font-black tabular-nums tracking-tight">
                {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="text-blue-200 text-xs mt-1 uppercase tracking-widest font-semibold">
                {time.toLocaleTimeString("en-IN", { second: "2-digit" })} sec
              </p>
            </div>
          </div>
        </div>

        {/* ── Stat cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))
            : statCards.map(s => (
                <Link key={s.label} href={s.href} className="no-underline">
                  <Card className="liquid-glass hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className={`w-9 h-9 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-3`}>
                        <s.icon className={`h-4 w-4 ${s.color}`} />
                      </div>
                      <p className="text-xs text-gray-500 font-medium leading-tight mb-1">{s.label}</p>
                      <p className={`text-xl font-black ${s.color} leading-tight`}>{s.value}</p>
                      <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${s.up ? "text-emerald-600" : "text-red-500"}`}>
                        {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {s.change}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
          }
        </div>

        {/* ── Main grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left col — 2/3 */}
          <div className="xl:col-span-2 space-y-6">

            {/* Recent Fee Transactions */}
            <Card className="liquid-glass">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  Recent Fee Transactions
                </CardTitle>
                <Link href="/dashboard/admin/fees">
                  <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1">
                    View All <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {loading
                  ? <div className="px-6 py-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                  : fees.length === 0
                    ? <p className="text-center text-sm text-gray-400 py-8">No fee records yet</p>
                    : <div className="divide-y divide-gray-100">
                        {fees.map((fee) => {
                          const ss  = statusStyle[fee.status]
                          const usr = (fee as any).users
                          return (
                            <div key={fee.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors">
                              {/* Avatar */}
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-xs font-black text-blue-700 shrink-0">
                                {usr?.name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("") ?? "?"}
                              </div>
                              {/* Name + dept */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{usr?.name ?? "Unknown"}</p>
                                <p className="text-xs text-gray-400 truncate">{usr?.departments?.name ?? "—"}</p>
                              </div>
                              {/* Amount */}
                              <p className="text-sm font-black text-gray-800 shrink-0">
                                ₹{Number(fee.amount).toLocaleString()}
                              </p>
                              {/* Status badge */}
                              <div
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
                                style={{ background: ss.bg, color: ss.color }}
                              >
                                <ss.icon className="h-3 w-3" />
                                {ss.label}
                              </div>
                              {/* Date */}
                              <p className="text-xs text-gray-400 shrink-0 hidden sm:block">
                                {fee.paid_date
                                  ? new Date(fee.paid_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                  : fee.due_date
                                    ? `Due ${new Date(fee.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                                    : "—"
                                }
                              </p>
                            </div>
                          )
                        })}
                      </div>
                }
              </CardContent>
            </Card>

            {/* Department Enrollment */}
            <Card className="liquid-glass">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <Building2 className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  Department Enrollment
                </CardTitle>
                <Link href="/dashboard/admin/departments">
                  <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1">
                    Manage <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="px-6 pb-5 space-y-4">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6" />)
                  : deptCounts.map((d) => (
                      <div key={d.name} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-gray-700">{d.name}</p>
                          <p className="text-xs font-bold" style={{ color: d.color }}>
                            {d.students} students
                          </p>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width:      `${Math.round((d.students / maxStudents) * 100)}%`,
                              background: d.color,
                            }}
                          />
                        </div>
                      </div>
                    ))
                }
              </CardContent>
            </Card>
          </div>

          {/* Right col — 1/3 */}
          <div className="space-y-6">

            {/* Quick Actions */}
            <Card className="liquid-glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Activity className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {[
                  { label: "Add New Student",    icon: GraduationCap, href: "/dashboard/admin/users",   color: "#2563EB", bg: "rgba(37,99,235,0.08)"   },
                  { label: "Add Faculty Member", icon: BookOpen,      href: "/dashboard/admin/users",   color: "#9333EA", bg: "rgba(147,51,234,0.08)"  },
                  { label: "Post a Notice",      icon: Bell,          href: "/dashboard/admin/notices", color: "#D97706", bg: "rgba(217,119,6,0.08)"   },
                  { label: "Manage Fees",        icon: Wallet,        href: "/dashboard/admin/fees",    color: "#16A34A", bg: "rgba(22,163,74,0.08)"   },
                  { label: "View Reports",       icon: Activity,      href: "/dashboard/admin/reports", color: "#64748B", bg: "rgba(100,116,139,0.08)" },
                ].map((a, i) => (
                  <Link key={i} href={a.href}>
                    <div
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 hover:scale-[1.01] group"
                      style={{ background: a.bg }}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${a.color}18` }}>
                        <a.icon className="h-3.5 w-3.5" style={{ color: a.color }} />
                      </div>
                      <span className="text-sm font-semibold flex-1" style={{ color: a.color }}>{a.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: a.color }} />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Recent Notices */}
            <Card className="liquid-glass">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <Bell className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  Recent Notices
                </CardTitle>
                <Link href="/dashboard/admin/notices">
                  <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1">
                    All <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)
                  : notices.length === 0
                    ? <p className="text-center text-sm text-gray-400 py-4">No notices yet</p>
                    : notices.map(n => (
                        <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/60 border border-gray-100 hover:bg-gray-100/60 transition-colors">
                          {n.urgent
                            ? <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                            : <Bell        className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 leading-tight truncate">{n.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${targetBadge[n.target]}`}>
                                {n.target}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                }
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="liquid-glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                    <Activity className="h-3.5 w-3.5 text-gray-500" />
                  </div>
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {loading
                  ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                  : <div className="space-y-1">
                      {recentActivity.map((a, i) => (
                        <div key={a.id} className="flex items-start gap-3 py-2.5 relative">
                          {i < recentActivity.length - 1 && (
                            <div className="absolute left-[11px] top-8 bottom-0 w-px bg-gray-100" />
                          )}
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 relative z-10"
                            style={{ background: `${a.color}15`, border: `1px solid ${a.color}25` }}
                          >
                            <a.icon className="h-3 w-3" style={{ color: a.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 leading-snug">{a.message}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </CardContent>
            </Card>

          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
