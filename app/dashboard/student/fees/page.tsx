"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo } from "react"
import {
  CreditCard, CheckCircle2, Clock, AlertCircle,
  Wallet, TrendingUp, Receipt, Download,
  AlertTriangle, RefreshCw, Shield,
  Landmark, Smartphone, ArrowRight,
  Loader2, IndianRupee, CalendarDays,
  BadgeCheck, Lock
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { getUsers, getFees, getPaymentHistory } from "@/lib/db"
import type { User, Fee, Payment } from "@/lib/types"

// ─── Helpers ─────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

function fmt(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 0 })
}

function timeAgo(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

// Payment methods
const PAY_METHODS = [
  { id: "upi",      label: "UPI",           icon: Smartphone, sub: "Pay via any UPI app"          },
  { id: "netbank",  label: "Net Banking",   icon: Landmark,   sub: "All major banks supported"    },
  { id: "card",     label: "Debit / Credit Card", icon: CreditCard, sub: "Visa, Mastercard, RuPay" },
]

// Status config
const statusConf = {
  paid:    { label: "Paid",    color: "#16A34A", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2, textColor: "text-emerald-700" },
  pending: { label: "Pending", color: "#D97706", bg: "bg-amber-50",   border: "border-amber-200",   icon: Clock,        textColor: "text-amber-700"   },
  overdue: { label: "Overdue", color: "#DC2626", bg: "bg-red-50",     border: "border-red-200",     icon: AlertCircle,  textColor: "text-red-700"     },
}

// ════════════════════════════════════════════════════════════════
export default function StudentFeesPage() {
  const authUser = useAuth("student")
  if (!authUser) return null

  // ── Data ─────────────────────────────────────────────────────
  const [me,       setMe]       = useState<User | null>(null)
  const [fee,      setFee]      = useState<Fee | null>(null)
  const [history,  setHistory]  = useState<Payment[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState<string | null>(null)

  // ── Pay dialog ────────────────────────────────────────────────
  const [payOpen,    setPayOpen]    = useState(false)
  const [payStep,    setPayStep]    = useState<1 | 2 | 3>(1)   // 1=method 2=details 3=success
  const [payMethod,  setPayMethod]  = useState<string>("upi")
  const [payAmount,  setPayAmount]  = useState("")
  const [payRef,     setPayRef]     = useState("")
  const [paying,     setPaying]     = useState(false)
  const [payError,   setPayError]   = useState<string | null>(null)

  // UPI / card fields
  const [upiId,    setUpiId]    = useState("")
  const [cardNo,   setCardNo]   = useState("")
  const [cardExp,  setCardExp]  = useState("")
  const [cardCvv,  setCardCvv]  = useState("")
  const [bankCode, setBankCode] = useState("sbi")

  // ── Load ─────────────────────────────────────────────────────
  async function load() {
    setLoading(true); setError(null)
    try {
      const student = authUser.user
      setMe(student)
      if (student) {
        const [fees, hist] = await Promise.all([
          getFees(), getPaymentHistory(student.id),
        ])
        setFee(fees.find(f => f.student_id === student.id) ?? null)
        setHistory(hist)
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (authUser.user) load() }, [authUser.user])

  // ── Derived ───────────────────────────────────────────────────
  const paid   = (fee as any)?.paid   ?? 0
  const due    = (fee as any)?.due    ?? fee?.amount ?? 0
  const total  = fee?.amount ?? 0
  const paidPct = total ? Math.round((paid / total) * 100) : 0

  const sc = statusConf[(fee?.status as keyof typeof statusConf) ?? "pending"]

  // ── Installment schedule ──────────────────────────────────────
  const installments = useMemo(() => {
    if (!total) return []
    const inst = Math.ceil(total / 3)
    return [
      { label: "1st Installment", amount: inst,                due: "Feb 15, 2026", paid: paid >= inst      },
      { label: "2nd Installment", amount: inst,                due: "Apr 15, 2026", paid: paid >= inst * 2  },
      { label: "3rd Installment", amount: total - inst * 2,    due: "Jun 15, 2026", paid: paid >= total     },
    ]
  }, [total, paid])

  // ── Monthly payment chart ─────────────────────────────────────
  const chartData = useMemo(() => {
    const months = ["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"]
    return months.map(m => ({
      month: m,
      paid:  history
        .filter(p => new Date(p.date).toLocaleDateString("en-IN", { month: "short" }) === m)
        .reduce((s, p) => s + p.amount, 0),
    }))
  }, [history])

  // ── Simulate payment ──────────────────────────────────────────
  async function handlePay() {
    setPayError(null)
    const amt = Number(payAmount)
    if (!amt || amt <= 0)        { setPayError("Enter a valid amount"); return }
    if (amt > due)               { setPayError(`Amount cannot exceed due amount ₹${fmt(due)}`); return }
    if (payMethod === "upi" && !upiId.includes("@")) { setPayError("Enter a valid UPI ID (e.g. name@upi)"); return }
    if (payMethod === "card") {
      if (cardNo.replace(/\s/g,"").length < 16) { setPayError("Enter a valid 16-digit card number"); return }
      if (!cardExp.match(/^\d{2}\/\d{2}$/))     { setPayError("Enter expiry as MM/YY"); return }
      if (cardCvv.length < 3)                   { setPayError("Enter a valid CVV"); return }
    }

    setPaying(true)
    await new Promise(r => setTimeout(r, 1800))  // simulate gateway

    // Generate ref
    setPayRef(`TXN${Date.now().toString().slice(-8).toUpperCase()}`)
    setPaying(false)
    setPayStep(3)
  }

  function closePayDialog() {
    setPayOpen(false)
    setPayStep(1)
    setPayAmount("")
    setUpiId(""); setCardNo(""); setCardExp(""); setCardCvv("")
    setBankCode("sbi")
    setPayError(null)
    if (payStep === 3) {
      setSuccess("Payment recorded! Your receipt has been generated.")
      setTimeout(() => setSuccess(null), 4000)
      load()
    }
  }

  // ── Format card number ────────────────────────────────────────
  function fmtCard(v: string) {
    return v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim()
  }

  // ════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      role="student"
      userName={me?.name ?? "Student"}
      pageTitle="Fee Payment"
      pageSubtitle="View your fee details and make payments"
      loading={loading}
    >
      <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full min-w-0 max-w-5xl">

        {/* ── Toasts ─────────────────────────────────────────── */}
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

        {/* ── Overdue warning ───────────────────────────────── */}
        {!loading && fee?.status === "overdue" && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Your fee payment is <strong>overdue</strong>. A late fee penalty may apply. Please pay immediately.
          </div>
        )}

        {/* ── Top row ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Fee summary card */}
          <Card className="lg:col-span-2 backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
            <CardContent className="p-6">
              {loading
                ? <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-24 w-full" /></div>
                : fee
                  ? (
                    <>
                      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">Academic Year 2025–26</p>
                          <h2 className="text-2xl font-black text-gray-900">
                            ₹{fmt(total)}
                          </h2>
                          <p className="text-sm text-gray-500 mt-0.5">Total fee for the year</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${sc.bg} ${sc.border} ${sc.textColor}`}>
                            <sc.icon className="h-3.5 w-3.5" />
                            {sc.label}
                          </span>
                          {due > 0 && (
                            <Button
                              onClick={() => { setPayAmount(String(due)); setPayOpen(true) }}
                              className="h-9 bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm font-bold"
                            >
                              <CreditCard className="h-4 w-4" /> Pay Now
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Amount breakdown row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                        {[
                          { label: "Total",  value: total,  color: "text-gray-800", bg: "bg-gray-50",    border: "border-gray-100" },
                          { label: "Paid",   value: paid,   color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" },
                          { label: "Due",    value: due,    color: due > 0 ? "text-red-700" : "text-gray-400", bg: due > 0 ? "bg-red-50" : "bg-gray-50", border: due > 0 ? "border-red-100" : "border-gray-100" },
                        ].map(r => (
                          <div key={r.label} className={`p-3 rounded-xl border ${r.bg} ${r.border}`}>
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">{r.label}</p>
                            <p className={`text-sm font-black ${r.color}`}>₹{fmt(r.value)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 font-medium">Payment progress</span>
                          <span className="font-black text-emerald-600">{paidPct}% paid</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${paidPct}%`, background: "linear-gradient(90deg,#16A34A,#4ADE80)" }}
                          />
                        </div>
                        {due > 0 && (
                          <p className="text-xs text-gray-400">
                            ₹{fmt(due)} remaining
                            {fee.due_date ? ` · Due by ${new Date(fee.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : ""}
                          </p>
                        )}
                      </div>
                    </>
                  )
                  : (
                    <div className="py-12 flex flex-col items-center gap-2 text-gray-400">
                      <CreditCard className="h-10 w-10 text-gray-200" />
                      <p className="text-sm">No fee record found</p>
                    </div>
                  )
              }
            </CardContent>
          </Card>

          {/* Quick stats column */}
          <div className="space-y-4">
            {[
              { label: "Due Date",       value: fee?.due_date ? new Date(fee.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—", icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
              { label: "Payments Made",  value: loading ? "—" : history.length,  icon: Receipt,      color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
              { label: "Last Payment",   value: loading || !history.length ? "—" : timeAgo(history.sort((a,b) => new Date(b.date).getTime()-new Date(a.date).getTime())[0].date), icon: BadgeCheck, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
            ].map(s => (
              <Card key={s.label} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center shrink-0`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                    {loading
                      ? <Skeleton className="h-4 w-20 mt-1" />
                      : <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
                    }
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Installment schedule + chart ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Installment schedule */}
          <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Wallet className="h-4 w-4 text-indigo-600" />
                Installment Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
                : installments.map((inst, i) => (
                    <div key={i}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                        inst.paid
                          ? "bg-emerald-50 border-emerald-100"
                          : "bg-gray-50 border-gray-100"
                      }`}
                    >
                      {/* Step number */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        inst.paid
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {inst.paid ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${inst.paid ? "text-emerald-700" : "text-gray-700"}`}>
                          {inst.label}
                        </p>
                        <p className="text-xs text-gray-400">Due: {inst.due}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-black ${inst.paid ? "text-emerald-600" : "text-gray-700"}`}>
                          ₹{fmt(inst.amount)}
                        </p>
                        <p className={`text-[10px] font-bold ${inst.paid ? "text-emerald-500" : "text-gray-400"}`}>
                          {inst.paid ? "✓ Paid" : "Pending"}
                        </p>
                      </div>
                    </div>
                  ))
              }
            </CardContent>
          </Card>

          {/* Payment history chart */}
          <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Monthly Payment History
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {loading
                ? <Skeleton className="h-[180px] w-full" />
                : (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gFee" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#16A34A" stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                        tickFormatter={v => v ? `₹${v/1000}k` : "0"} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0" }}
                        formatter={(v: number) => [`₹${fmt(v)}`, "Paid"]}
                      />
                      <Area type="monotone" dataKey="paid" stroke="#16A34A" strokeWidth={2} fill="url(#gFee)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )
              }
            </CardContent>
          </Card>
        </div>

        {/* ── Transaction history ───────────────────────────── */}
        <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gray-500" />
                Transaction History
              </CardTitle>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={load}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading
              ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              )
              : history.length === 0
                ? (
                  <div className="py-14 flex flex-col items-center gap-2 text-gray-400">
                    <Receipt className="h-9 w-9 text-gray-200" />
                    <p className="text-xs">No transactions yet</p>
                  </div>
                )
                : (
                  <div className="divide-y divide-gray-50">
                    {history
                      .slice()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((p, i) => (
                        <div key={p.id ?? i}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">
                              {p.method ?? "Online Payment"}
                            </p>
                            <p className="text-xs text-gray-400">{timeAgo(p.date)} · Ref: {p.ref_no ?? "—"}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-emerald-600">+₹{fmt(p.amount)}</p>
                            <button className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5 ml-auto">
                              <Download className="h-2.5 w-2.5" /> Receipt
                            </button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )
            }
          </CardContent>
        </Card>

      </div>

      {/* ════ PAY DIALOG ════ */}
      <Dialog open={payOpen} onOpenChange={open => { if (!open) closePayDialog() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              {payStep === 3 ? "Payment Successful!" : "Make a Payment"}
            </DialogTitle>
            {payStep !== 3 && (
              <DialogDescription>
                Outstanding due: <strong>₹{fmt(due)}</strong>
              </DialogDescription>
            )}
          </DialogHeader>

          {/* ── Step 1: Method + Amount ── */}
          {payStep === 1 && (
            <div className="space-y-4 py-2">
              {payError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{payError}
                </div>
              )}

              {/* Amount input */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Payment Amount <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    type="number"
                    placeholder={`Max ₹${fmt(due)}`}
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    className="pl-9"
                    min={1}
                    max={due}
                  />
                </div>
                {/* Quick amount chips */}
                <div className="flex gap-2 flex-wrap mt-1">
                  {[due, Math.round(due / 2), Math.round(due / 3)]
                    .filter(v => v > 0)
                    .map((v, i) => (
                      <button key={i}
                        onClick={() => setPayAmount(String(v))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                          payAmount === String(v)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        ₹{fmt(v)}{i === 0 ? " (Full)" : i === 1 ? " (Half)" : " (1/3)"}
                      </button>
                    ))
                  }
                </div>
              </div>

              {/* Payment method */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Payment Method</Label>
                <div className="space-y-2">
                  {PAY_METHODS.map(m => (
                    <div key={m.id}
                      onClick={() => setPayMethod(m.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        payMethod === m.id
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        payMethod === m.id ? "bg-blue-100" : "bg-gray-100"
                      }`}>
                        <m.icon className={`h-4 w-4 ${payMethod === m.id ? "text-blue-600" : "text-gray-500"}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${payMethod === m.id ? "text-blue-700" : "text-gray-700"}`}>{m.label}</p>
                        <p className="text-xs text-gray-400">{m.sub}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        payMethod === m.id ? "border-blue-500" : "border-gray-300"
                      }`}>
                        {payMethod === m.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closePayDialog}>Cancel</Button>
                <Button onClick={() => { setPayError(null); setPayStep(2) }}
                  disabled={!payAmount || Number(payAmount) <= 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ── Step 2: Payment Details ── */}
          {payStep === 2 && (
            <div className="space-y-4 py-2">
              {payError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{payError}
                </div>
              )}

              {/* Summary chip */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-black text-blue-700">₹{fmt(Number(payAmount))}</span>
                </div>
                <span className="text-xs text-blue-600 font-semibold capitalize">{payMethod}</span>
              </div>

              {/* UPI fields */}
              {payMethod === "upi" && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">UPI ID <span className="text-red-500">*</span></Label>
                  <Input placeholder="yourname@upi" value={upiId}
                    onChange={e => setUpiId(e.target.value)} />
                  <p className="text-xs text-gray-400">Enter your registered UPI ID</p>
                </div>
              )}

              {/* Card fields */}
              {payMethod === "card" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Card Number <span className="text-red-500">*</span></Label>
                    <Input placeholder="0000 0000 0000 0000"
                      value={cardNo}
                      onChange={e => setCardNo(fmtCard(e.target.value))}
                      maxLength={19} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">Expiry <span className="text-red-500">*</span></Label>
                      <Input placeholder="MM/YY" value={cardExp}
                        onChange={e => {
                          let v = e.target.value.replace(/\D/g,"").slice(0,4)
                          if (v.length > 2) v = v.slice(0,2) + "/" + v.slice(2)
                          setCardExp(v)
                        }} maxLength={5} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">CVV <span className="text-red-500">*</span></Label>
                      <Input placeholder="•••" type="password" value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g,"").slice(0,3))}
                        maxLength={3} />
                    </div>
                  </div>
                </div>
              )}

              {/* Net banking */}
              {payMethod === "netbank" && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Select Bank</Label>
                  <Select value={bankCode} onValueChange={setBankCode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[
                        { value:"sbi",   label:"State Bank of India" },
                        { value:"hdfc",  label:"HDFC Bank"            },
                        { value:"icici", label:"ICICI Bank"           },
                        { value:"axis",  label:"Axis Bank"            },
                        { value:"kotak", label:"Kotak Mahindra Bank"  },
                        { value:"pnb",   label:"Punjab National Bank" },
                      ].map(b => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Security note */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-500">
                <Lock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                Your payment details are secured with 256-bit SSL encryption.
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => { setPayStep(1); setPayError(null) }}>Back</Button>
                <Button onClick={handlePay} disabled={paying}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  {paying
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</>
                    : <><Shield className="h-3.5 w-3.5" /> Confirm Payment</>
                  }
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {payStep === 3 && (
            <div className="py-4 space-y-5">
              {/* Success animation */}
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-gray-900">Payment Successful!</p>
                  <p className="text-sm text-gray-500 mt-1">Your payment has been processed</p>
                </div>
              </div>

              {/* Receipt */}
              <div className="space-y-2 p-4 rounded-xl bg-gray-50 border border-gray-100">
                {[
                  { label: "Amount Paid",     value: `₹${fmt(Number(payAmount))}` },
                  { label: "Payment Method",  value: PAY_METHODS.find(m => m.id === payMethod)?.label ?? payMethod },
                  { label: "Transaction Ref", value: payRef },
                  { label: "Date & Time",     value: new Date().toLocaleString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-medium">{r.label}</span>
                    <span className="font-black text-gray-800">{r.value}</span>
                  </div>
                ))}
              </div>

              <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={closePayDialog}>
                <Download className="h-4 w-4" /> Download Receipt & Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}
