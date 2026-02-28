"use client"

import { useState } from "react"
import Link from "next/link"
import {
  HelpCircle, Search, ChevronDown, ChevronUp,
  BookOpen, MessageSquare, Mail, Phone,
  ExternalLink, CheckCircle2, AlertTriangle,
  GraduationCap, Shield, BookOpenCheck,
  Loader2, Send, ArrowLeft, Lightbulb,
  LifeBuoy, FileQuestion
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label }    from "@/components/ui/label"

// ─── FAQ data ────────────────────────────────────────────────────
const FAQS = [
  {
    category: "Account",
    icon: Shield,
    color: "#2563EB",
    items: [
      { q: "How do I reset my password?",
        a: "Go to your Profile page → click 'Change Password'. Enter your current password and your new password (min. 8 characters)." },
      { q: "How do I update my profile photo?",
        a: "Go to Profile → hover over your avatar → click the camera icon to upload a new photo." },
      { q: "Can I change my registered email?",
        a: "Email changes require admin approval. Please contact your institution's admin or use the support form below." },
    ]
  },
  {
    category: "Students",
    icon: GraduationCap,
    color: "#16A34A",
    items: [
      { q: "How is my attendance percentage calculated?",
        a: "Attendance % = (Present sessions / Total sessions) × 100. A minimum of 75% is required per semester." },
      { q: "Where can I view my results?",
        a: "Navigate to Dashboard → Results. You can filter by subject or exam type and view your CGPA and grade breakdown." },
      { q: "How do I pay my fees?",
        a: "Go to Fee Payment → click 'Pay Now'. Choose UPI, Net Banking, or Card and follow the steps." },
      { q: "Why can't I see some assignment details?",
        a: "Assignments are scoped to your department. If something is missing, contact your faculty." },
    ]
  },
  {
    category: "Faculty",
    icon: BookOpenCheck,
    color: "#9333EA",
    items: [
      { q: "How do I mark attendance?",
        a: "Go to Attendance → select the date and class → mark each student as Present, Absent, or Late → click Save." },
      { q: "How do I post a notice?",
        a: "Go to Notices → click 'New Notice'. Fill in the title, content, audience, and priority, then click Publish." },
      { q: "How can I see my assigned students?",
        a: "Go to My Students. All students in your department are listed with their attendance and performance data." },
    ]
  },
  {
    category: "Technical",
    icon: HelpCircle,
    color: "#D97706",
    items: [
      { q: "The page is not loading correctly. What should I do?",
        a: "Try a hard refresh (Ctrl+Shift+R / Cmd+Shift+R). If the issue persists, clear browser cache or try a different browser." },
      { q: "I'm getting a 'session expired' error.",
        a: "Your session has timed out. Please log in again. You can extend the session timeout in Settings → Security." },
      { q: "Data is not updating after I make changes.",
        a: "Click the Refresh button on the page. If it still doesn't update, log out and log back in." },
    ]
  },
]

// ─── Contact channels ─────────────────────────────────────────────
const CHANNELS = [
  { icon: Mail,         label: "Email Support",   sub: "support@unicore.edu",      color: "#3B82F6",  bg: "rgba(59,130,246,0.08)"  },
  { icon: Phone,        label: "Phone Helpdesk",  sub: "+91 98765 00000",          color: "#16A34A",  bg: "rgba(22,163,74,0.08)"   },
  { icon: MessageSquare,label: "Live Chat",        sub: "Mon–Fri, 9am–6pm IST",    color: "#8B5CF6",  bg: "rgba(139,92,246,0.08)"  },
]

// ════════════════════════════════════════════════════════════════
export default function HelpPage() {

  const [search,   setSearch]   = useState("")
  const [openFAQs, setOpenFAQs] = useState<Set<string>>(new Set())
  const [form,     setForm]     = useState({ name: "", email: "", subject: "", message: "" })
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [formErr,  setFormErr]  = useState<string | null>(null)

  // ── Toggle FAQ ────────────────────────────────────────────────
  function toggleFAQ(key: string) {
    setOpenFAQs(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // ── Search filter ─────────────────────────────────────────────
  const filteredFAQs = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !search ||
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0)

  // ── Submit form ───────────────────────────────────────────────
  async function handleSubmit() {
    setFormErr(null)
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setFormErr("Please fill in all required fields."); return
    }
    if (!form.email.includes("@")) {
      setFormErr("Enter a valid email address."); return
    }
    setSending(true)
    await new Promise(r => setTimeout(r, 1500))
    setSending(false)
    setSent(true)
    setForm({ name: "", email: "", subject: "", message: "" })
  }

  // ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen"
      style={{ background: "linear-gradient(135deg,#EFF6FF 0%,#F5F3FF 50%,#ECFDF5 100%)" }}>

      {/* ── Nav bar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/60 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-gray-900">UniCore ERP</p>
            <p className="text-[10px] text-gray-400 font-medium">Help & Support</p>
          </div>
        </div>
        <Link href="/login">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-3 w-3" /> Back to App
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* ── Hero ─────────────────────────────────────────── */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-200">
            <LifeBuoy className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">How can we help?</h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Search the FAQ, browse guides, or reach out to our support team.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search help articles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-11 h-11 text-sm bg-white/90 shadow-sm border-white/60 rounded-xl"
            />
          </div>
        </div>

        {/* ── Quick links ───────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: FileQuestion, label: "FAQs",          sub: `${FAQS.reduce((a,c) => a+c.items.length,0)} articles`, color: "#3B82F6" },
            { icon: BookOpen,     label: "User Guides",   sub: "Step-by-step",   color: "#8B5CF6" },
            { icon: Lightbulb,    label: "Tips & Tricks", sub: "Pro tips",        color: "#F59E0B" },
            { icon: MessageSquare,label: "Contact Us",    sub: "Get in touch",    color: "#16A34A" },
          ].map(q => (
            <Card key={q.label} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ background: `${q.color}14`, border: `1px solid ${q.color}28` }}>
                  <q.icon className="h-5 w-5" style={{ color: q.color }} />
                </div>
                <p className="text-sm font-bold text-gray-800">{q.label}</p>
                <p className="text-xs text-gray-400">{q.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── FAQ accordion ────────────────────────────────── */}
        <div className="space-y-5">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            Frequently Asked Questions
          </h2>

          {filteredFAQs.length === 0
            ? (
              <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
                <CardContent className="py-16 flex flex-col items-center gap-3 text-gray-400">
                  <Search className="h-10 w-10 text-gray-200" />
                  <p className="text-sm font-semibold">No results for "{search}"</p>
                  <Button variant="outline" size="sm" onClick={() => setSearch("")}>Clear search</Button>
                </CardContent>
              </Card>
            )
            : filteredFAQs.map(cat => (
                <Card key={cat.category} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm overflow-hidden">
                  {/* Category header */}
                  <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-50">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: `${cat.color}14`, border: `1px solid ${cat.color}28` }}>
                      <cat.icon className="h-3.5 w-3.5" style={{ color: cat.color }} />
                    </div>
                    <span className="text-sm font-black text-gray-800">{cat.category}</span>
                    <span className="ml-auto text-xs text-gray-400 font-medium">{cat.items.length} articles</span>
                  </div>

                  {/* FAQ items */}
                  <div className="divide-y divide-gray-50">
                    {cat.items.map((item, i) => {
                      const key    = `${cat.category}-${i}`
                      const isOpen = openFAQs.has(key)
                      return (
                        <div key={key}>
                          <button
                            onClick={() => toggleFAQ(key)}
                            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/60 transition-colors gap-3"
                          >
                            <span className={`text-sm font-semibold leading-snug ${isOpen ? "text-blue-700" : "text-gray-800"}`}>
                              {item.q}
                            </span>
                            {isOpen
                              ? <ChevronUp   className="h-4 w-4 text-blue-500 shrink-0" />
                              : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                            }
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-4">
                              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100">
                                <p className="text-sm text-blue-800 leading-relaxed">{item.a}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              ))
          }
        </div>

        {/* ── Contact channels ─────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            Contact Support
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CHANNELS.map(ch => (
              <Card key={ch.label} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ background: ch.bg, border: `1px solid ${ch.color}28` }}>
                    <ch.icon className="h-5 w-5" style={{ color: ch.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{ch.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{ch.sub}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Support form ──────────────────────────────────── */}
        <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-600" />
              Send us a Message
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {sent
              ? (
                <div className="py-12 flex flex-col items-center gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                  </div>
                  <p className="text-base font-black text-gray-900">Message Sent!</p>
                  <p className="text-sm text-gray-500 max-w-xs">
                    We've received your message and will get back to you within 24 hours.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setSent(false)} className="mt-2">
                    Send another message
                  </Button>
                </div>
              )
              : (
                <div className="space-y-4">
                  {formErr && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{formErr}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">Name <span className="text-red-500">*</span></Label>
                      <Input placeholder="Your full name" value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">Email <span className="text-red-500">*</span></Label>
                      <Input placeholder="your@email.com" type="email" value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Subject</Label>
                    <Input placeholder="Brief description of your issue"
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Message <span className="text-red-500">*</span></Label>
                    <Textarea
                      placeholder="Describe your issue in detail..."
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      rows={5}
                      className="resize-none text-sm"
                      maxLength={1000}
                    />
                    <p className="text-xs text-gray-400 text-right">{form.message.length}/1000</p>
                  </div>

                  <Button onClick={handleSubmit} disabled={sending}
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white h-11">
                    {sending
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                      : <><Send    className="h-4 w-4" /> Send Message</>
                    }
                  </Button>
                </div>
              )
            }
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-6">
          UniCore ERP · v2.0 · © 2026 · All rights reserved
        </p>

      </div>
    </div>
  )
}
