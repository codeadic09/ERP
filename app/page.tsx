// app/page.tsx
"use client"

import Link from "next/link"
import { useEffect, useRef, useState, useCallback } from "react"
import {
  GraduationCap, ArrowRight, BarChart3, Shield,
  Users, BookOpen, ClipboardCheck, Award,
  Calendar, Bell, Wallet, Sparkles,
  CheckCircle, Globe, Zap, Lock,
  ChevronRight, Star, TrendingUp
} from "lucide-react"

/* ── Rolling number hook ── */
function useCountUp(end: number, duration = 1400, trigger = true) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)
  useEffect(() => {
    if (!trigger) { setValue(0); return }
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)          // ease-out cubic
      setValue(Math.round(ease * end * 10) / 10)     // keep 1 decimal precision
      if (t < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [end, duration, trigger])
  return value
}

/* ── CountUp component (triggers when scrolled into view) ── */
function CountUp({ value, className, style }: { value: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect() } }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Parse: "2,800+" → num=2800, prefix="", suffix="+", hasComma=true
  const match = value.match(/^([^\d]*?)([\d,.]+)([^\d]*)$/)
  const prefix = match?.[1] ?? ""
  const numStr = match?.[2] ?? "0"
  const suffix = match?.[3] ?? ""
  const hasComma = numStr.includes(",")
  const num = parseFloat(numStr.replace(/,/g, ""))
  const decimals = numStr.includes(".") ? (numStr.split(".")[1]?.length ?? 0) : 0

  const current = useCountUp(num, 1400, visible)

  const formatted = decimals > 0
    ? current.toFixed(decimals)
    : hasComma
      ? Math.round(current).toLocaleString("en-US")
      : String(Math.round(current))

  return <span ref={ref} className={className} style={style}>{prefix}{formatted}{suffix}</span>
}

const features = [
  { icon:BarChart3,     color:"#3B82F6", title:"Smart Analytics",       sub:"Real-time dashboards with live academic metrics and trends"          },
  { icon:ClipboardCheck,color:"#D946EF", title:"Attendance Tracking",   sub:"Automated attendance with instant faculty notifications"              },
  { icon:Award,         color:"#84CC16", title:"Result Management",     sub:"One-click result publishing across all semesters and exams"           },
  { icon:Calendar,      color:"#FBBF24", title:"Smart Timetable",       sub:"AI-generated conflict-free scheduling for all departments"            },
  { icon:Bell,          color:"#F43F5E", title:"Instant Notices",       sub:"Push notifications for exams, events, and announcements"              },
  { icon:Wallet,        color:"#3B82F6", title:"Fee Management",        sub:"Online payments, receipts, and overdue tracking in one place"         },
  { icon:Shield,        color:"#D946EF", title:"Role-Based Access",     sub:"Separate secure portals for admin, faculty, and students"             },
  { icon:Sparkles,      color:"#84CC16", title:"AI Insights",           sub:"Predictive analytics to identify at-risk students early"              },
]

const stats = [
  { value:"2,800+", label:"Students Enrolled",   icon:Users,      color:"#3B82F6" },
  { value:"180+",   label:"Faculty Members",      icon:BookOpen,   color:"#D946EF" },
  { value:"6",      label:"Departments",          icon:Globe,      color:"#84CC16" },
  { value:"99.9%",  label:"Uptime Guaranteed",    icon:Zap,        color:"#FBBF24" },
]

const roles = [
  {
    role:"Admin",
    icon:Shield,
    color:"#1D4ED8",
    bg:"linear-gradient(135deg,#1D4ED8,#3B82F6)",
    shadow:"rgba(59,130,246,0.35)",
    desc:"Full control over the university ecosystem — manage users, departments, fees, and system-wide settings.",
    perks:["Manage all users & roles","Approve registrations","System analytics","Fee & exam control"],
    href:"/login",
  },
  {
    role:"Faculty",
    icon:BookOpen,
    color:"#A21CAF",
    bg:"linear-gradient(135deg,#D946EF,#E879F9)",
    shadow:"rgba(217,70,239,0.35)",
    desc:"Streamline your teaching workflow — mark attendance, publish marks, and engage with your students.",
    perks:["Mark & export attendance","Upload results & grades","Manage assignments","View student analytics"],
    href:"/login",
  },
  {
    role:"Student",
    icon:GraduationCap,
    color:"#3F6212",
    bg:"linear-gradient(135deg,#84CC16,#A3E635)",
    shadow:"rgba(132,204,22,0.35)",
    desc:"Track your academic journey — check attendance, results, timetable, and stay updated on campus news.",
    perks:["View attendance & results","Download hall tickets","Check timetable","Pay fees online"],
    href:"/login",
  },
]

const steps = [
  { n:"01", title:"Sign Up",        sub:"Create your account and choose your role",          color:"#3B82F6" },
  { n:"02", title:"Get Approved",   sub:"Admin verifies and activates your account",         color:"#D946EF" },
  { n:"03", title:"Access Portal",  sub:"Log in to your personalized role-based dashboard",  color:"#84CC16" },
  { n:"04", title:"Start Learning", sub:"Manage academics, fees, and results seamlessly",    color:"#FBBF24" },
]

export default function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const els = pageRef.current?.querySelectorAll(".reveal, .reveal-left, .reveal-scale")
    if (!els) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target) } }),
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div ref={pageRef} style={{ minHeight:"100vh", fontFamily:"var(--font-sans,system-ui,sans-serif)" }}>

      {/* ══════════════════════════════
          NAVBAR
      ══════════════════════════════ */}
      <nav style={{
        position:"sticky", top:0, zIndex:50,
        background:"rgba(255,255,255,0.75)",
        backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
        borderBottom:"1px solid rgba(255,255,255,0.62)",
        boxShadow:"0 2px 16px rgba(59,130,246,0.08)",
      }}>
        <div style={{
          maxWidth:1200, margin:"0 auto",
          padding:"0 32px", height:64,
          display:"flex", alignItems:"center", justifyContent:"space-between",
        }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:36, height:36, borderRadius:11,
              background:"linear-gradient(135deg,#1D4ED8,#3B82F6)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 4px 12px rgba(59,130,246,0.38)",
            }}>
              <GraduationCap size={18} color="white" />
            </div>
            <div>
              <p style={{ fontSize:15, fontWeight:900, lineHeight:1, background:"linear-gradient(135deg,#1D4ED8,#3B82F6,#D946EF)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                UniCore ERP
              </p>
              <p style={{ fontSize:9, color:"#94A3B8", fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>
                University Management
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <div style={{ display:"flex", alignItems:"center", gap:32 }}>
            {["Features","How It Works","Portals","Contact"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g,"-")}`} className="nav-link">{l}</a>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Link href="/login"  className="nav-btn-login">Sign In</Link>
            <Link href="/login" className="nav-btn-signup">
              Get Started <ChevronRight size={14} strokeWidth={2.5} style={{ marginLeft:2 }} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════
          HERO
      ══════════════════════════════ */}
      <section style={{
        minHeight:"92vh", display:"flex", alignItems:"center",
        padding:"80px 32px", position:"relative", overflow:"hidden",
      }}>
        {/* BG orbs */}
        <div style={{ position:"absolute", top:"-5%",   left:"-8%",  width:500, height:500, background:"radial-gradient(circle,rgba(59,130,246,0.18) 0%,transparent 65%)", borderRadius:"50%", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"-8%",right:"-8%", width:500, height:500, background:"radial-gradient(circle,rgba(217,70,239,0.14) 0%,transparent 65%)", borderRadius:"50%", pointerEvents:"none" }} />
        <div style={{ position:"absolute", top:"40%",   right:"15%", width:280, height:280, background:"radial-gradient(circle,rgba(132,204,22,0.14) 0%,transparent 65%)", borderRadius:"50%", pointerEvents:"none" }} />

        <div style={{ maxWidth:1200, margin:"0 auto", width:"100%", display:"flex", alignItems:"center", gap:64, position:"relative", zIndex:1 }}>

          {/* Left */}
          <div style={{ flex:1 }}>
            {/* Badge */}
            <div className="hero-anim-badge" style={{
              display:"inline-flex", alignItems:"center", gap:8,
              padding:"6px 14px", borderRadius:99, marginBottom:28,
              background:"rgba(59,130,246,0.10)",
              border:"1px solid rgba(59,130,246,0.22)",
            }}>
              <Sparkles size={12} color="#3B82F6" strokeWidth={2.5} />
              <span style={{ fontSize:12, fontWeight:700, color:"#1D4ED8" }}>
                Next-Gen University ERP System
              </span>
            </div>

            <h1 className="hero-anim-title" style={{
              fontSize:56, fontWeight:900, lineHeight:1.12,
              color:"#1E293B", marginBottom:20,
              letterSpacing:"-0.02em",
            }}>
              Manage your{" "}
              <span style={{ background:"linear-gradient(135deg,#1D4ED8,#3B82F6,#D946EF)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                entire campus
              </span>
              <br />from one place
            </h1>

            <p className="hero-anim-desc" style={{ fontSize:17, color:"#64748B", lineHeight:1.75, marginBottom:36, maxWidth:520 }}>
              UniCore ERP unifies attendance, results, timetables, fees, and communications into one sleek, role-based platform — built for modern universities.
            </p>

            {/* CTAs */}
            <div className="hero-anim-cta" style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap", marginBottom:40 }}>
              <Link href="/login" className="hero-btn-primary">
                Get Started Free <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <Link href="/login" className="hero-btn-secondary">
                Sign In <ChevronRight size={15} strokeWidth={2.5} />
              </Link>
            </div>

            {/* Trust badges */}
            <div className="hero-anim-trust" style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              {[
                { icon:Lock,    text:"SOC 2 Compliant"    },
                { icon:Zap,     text:"99.9% Uptime"       },
                { icon:Star,    text:"4.9/5 Rating"       },
              ].map((b,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <b.icon size={13} color="#3B82F6" strokeWidth={2.5} />
                  <span style={{ fontSize:12, fontWeight:600, color:"#64748B" }}>{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Hero glass card mockup + ERP Doodles */}
          <div style={{ flex:1, display:"flex", justifyContent:"center", position:"relative" }}>
            {/* ERP Doodles — floating academic icons */}
            <svg className="doodle doodle-1" style={{ top:-18, left:10, width:44, height:44 }} viewBox="0 0 48 48" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8v32c6-4 12-4 18 0V8c-6 4-12 4-18 0z" /><path d="M24 8v32c6-4 12-4 18 0V8c-6 4-12 4-18 0z" />
            </svg>
            <svg className="doodle doodle-2" style={{ top:40, right:-14, width:38, height:38 }} viewBox="0 0 48 48" fill="none" stroke="#D946EF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M34 6l8 8-24 24H10v-8L34 6z" /><path d="M28 12l8 8" />
            </svg>
            <svg className="doodle doodle-3" style={{ top:-22, right:60, width:46, height:46 }} viewBox="0 0 48 48" fill="none" stroke="#84CC16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M24 4L2 18l22 14 22-14L24 4z" /><path d="M36 24v12c-4 4-8 6-12 6s-8-2-12-6V24" /><path d="M46 18v14" />
            </svg>
            <svg className="doodle doodle-4" style={{ bottom:60, left:-18, width:40, height:40 }} viewBox="0 0 48 48" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="4" width="32" height="40" rx="4" /><rect x="14" y="10" width="20" height="10" rx="2" /><circle cx="18" cy="28" r="1.5" fill="#FBBF24" /><circle cx="24" cy="28" r="1.5" fill="#FBBF24" /><circle cx="30" cy="28" r="1.5" fill="#FBBF24" /><circle cx="18" cy="36" r="1.5" fill="#FBBF24" /><circle cx="24" cy="36" r="1.5" fill="#FBBF24" /><circle cx="30" cy="36" r="1.5" fill="#FBBF24" />
            </svg>
            <svg className="doodle doodle-5" style={{ bottom:-14, right:40, width:42, height:42 }} viewBox="0 0 48 48" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 42V6" /><path d="M6 42h36" /><path d="M14 32v10" /><path d="M22 24v18" /><path d="M30 28v14" /><path d="M38 18v24" />
            </svg>
            <svg className="doodle doodle-6" style={{ bottom:20, right:-20, width:36, height:36 }} viewBox="0 0 48 48" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="24" cy="24" r="8" /><path d="M24 2v8M24 38v8M4.9 13l6.9 4M36.2 31l6.9 4M4.9 35l6.9-4M36.2 17l6.9-4" />
            </svg>

            <div className="hero-anim-card hero-float" style={{
              width:"100%", maxWidth:460,
              background:"rgba(255,255,255,0.78)",
              backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
              border:"1px solid rgba(255,255,255,0.70)",
              borderRadius:28,
              boxShadow:"0 24px 64px rgba(59,130,246,0.18), 0 4px 20px rgba(0,0,0,0.06)",
              overflow:"hidden", position:"relative", zIndex:1,
            }}>
              {/* Top bar */}
              <div style={{ height:3, background:"linear-gradient(to right,#1D4ED8,#3B82F6,#D946EF,#84CC16,#FBBF24)" }} />
              <div style={{ padding:"24px 28px" }}>
                {/* Mini header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                  <div>
                    <p style={{ fontSize:15, fontWeight:900, color:"#1E293B" }}>Dashboard</p>
                    <p style={{ fontSize:11, color:"#64748B" }}>Semester 4 — CSE</p>
                  </div>
                  <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#84CC16,#A3E635)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(132,204,22,0.38)" }}>
                    <GraduationCap size={16} color="white" />
                  </div>
                </div>

                {/* KPI cards */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                  {[
                    { label:"Attendance", value:"87%",  color:"#3B82F6", trend:"+2%" },
                    { label:"CGPA",       value:"8.4",  color:"#D946EF", trend:"+0.2" },
                    { label:"Subjects",   value:"6",    color:"#84CC16", trend:"Active" },
                    { label:"Rank",       value:"#12",  color:"#FBBF24", trend:"Top 15%" },
                  ].map((k,i) => (
                    <div key={i} style={{
                      padding:"14px 16px", borderRadius:16,
                      background:"rgba(255,255,255,0.72)",
                      border:"1px solid rgba(255,255,255,0.65)",
                      backdropFilter:"blur(8px)",
                    }}>
                      <p style={{ fontSize:10, color:"#64748B", fontWeight:600, marginBottom:4 }}>{k.label}</p>
                      <p style={{ fontSize:22, fontWeight:900, color:"#1E293B", lineHeight:1 }}>
                        <CountUp value={k.value} />
                      </p>
                      <p style={{ fontSize:10, color:k.color, fontWeight:700, marginTop:4 }}>{k.trend}</p>
                    </div>
                  ))}
                </div>

                {/* Chart placeholder */}
                <div style={{
                  padding:"16px", borderRadius:16,
                  background:"rgba(255,255,255,0.65)",
                  border:"1px solid rgba(255,255,255,0.65)",
                  marginBottom:14,
                }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"#1E293B", marginBottom:10 }}>Attendance Trend</p>
                  <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:52 }}>
                    {[65,72,80,75,87,84,90,87].map((h,i) => (
                      <div key={i} className="hero-bar" style={{
                        flex:1, borderRadius:"4px 4px 0 0",
                        background: i === 7
                          ? "linear-gradient(to top,#1D4ED8,#3B82F6)"
                          : `rgba(59,130,246,${0.15 + i * 0.08})`,
                        height: `${h}%`,
                        animationDelay: `${0.8 + i * 0.07}s`,
                      }} />
                    ))}
                  </div>
                </div>

                {/* Upcoming */}
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {[
                    { label:"DSA Lecture",      time:"Today 10:00 AM",  color:"#3B82F6" },
                    { label:"Assignment Due",    time:"Today 11:59 PM",  color:"#F43F5E" },
                    { label:"End-Sem Results",   time:"March 5, 2026",   color:"#84CC16" },
                  ].map((item,i) => (
                    <div key={i} style={{
                      display:"flex", alignItems:"center", gap:10,
                      padding:"8px 12px", borderRadius:10,
                      background:"rgba(255,255,255,0.65)",
                      border:"1px solid rgba(255,255,255,0.60)",
                    }}>
                      <div style={{ width:7, height:7, borderRadius:"50%", background:item.color, flexShrink:0, boxShadow:`0 0 6px ${item.color}80` }} />
                      <p style={{ fontSize:11, color:"#1E293B", fontWeight:600, flex:1 }}>{item.label}</p>
                      <p style={{ fontSize:10, color:"#94A3B8", fontWeight:500 }}>{item.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          STATS
      ══════════════════════════════ */}
      <section style={{ padding:"56px 32px", background:"rgba(255,255,255,0.45)", backdropFilter:"blur(12px)", borderTop:"1px solid rgba(255,255,255,0.55)", borderBottom:"1px solid rgba(255,255,255,0.55)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:24 }}>
          {stats.map((s,i) => (
            <div key={i} className={`stat-card reveal stagger-${i + 1}`}>
              <div style={{ width:44, height:44, borderRadius:13, background:`${s.color}14`, border:`1px solid ${s.color}28`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
                <s.icon size={20} color={s.color} strokeWidth={2} />
              </div>
              <p style={{ fontSize:30, fontWeight:900, color:"#1E293B", lineHeight:1 }}>
                <CountUp value={s.value} />
              </p>
              <p style={{ fontSize:12, color:"#64748B", marginTop:6, fontWeight:500 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          FEATURES
      ══════════════════════════════ */}
      <section id="features" style={{ padding:"96px 32px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="reveal" style={{ textAlign:"center", marginBottom:56 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 14px", borderRadius:99, background:"rgba(59,130,246,0.10)", border:"1px solid rgba(59,130,246,0.22)", marginBottom:16 }}>
              <Sparkles size={12} color="#3B82F6" strokeWidth={2.5} />
              <span style={{ fontSize:12, fontWeight:700, color:"#1D4ED8" }}>Everything you need</span>
            </div>
            <h2 style={{ fontSize:38, fontWeight:900, color:"#1E293B", marginBottom:14, letterSpacing:"-0.02em" }}>
              Powerful features,{" "}
              <span style={{ background:"linear-gradient(135deg,#1D4ED8,#D946EF)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                built for education
              </span>
            </h2>
            <p style={{ fontSize:15, color:"#64748B", maxWidth:520, margin:"0 auto", lineHeight:1.7 }}>
              From attendance to analytics, UniCore covers every academic need with a beautiful, intuitive interface.
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:20 }}>
            {features.map((f,i) => (
              <div key={i} className={`glass-feature-card reveal stagger-${i + 1}`}>
                <div style={{
                  width:44, height:44, borderRadius:13,
                  background:`${f.color}14`, border:`1px solid ${f.color}28`,
                  display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14,
                }}>
                  <f.icon size={20} color={f.color} strokeWidth={2} />
                </div>
                <h3 style={{ fontSize:14, fontWeight:800, color:"#1E293B", marginBottom:6 }}>{f.title}</h3>
                <p  style={{ fontSize:12, color:"#64748B", lineHeight:1.65 }}>{f.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          HOW IT WORKS
      ══════════════════════════════ */}
      <section id="how-it-works" style={{ padding:"80px 32px", background:"rgba(255,255,255,0.40)", backdropFilter:"blur(12px)", borderTop:"1px solid rgba(255,255,255,0.55)", borderBottom:"1px solid rgba(255,255,255,0.55)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="reveal" style={{ textAlign:"center", marginBottom:52 }}>
            <h2 style={{ fontSize:36, fontWeight:900, color:"#1E293B", marginBottom:12, letterSpacing:"-0.02em" }}>
              Up and running in{" "}
              <span style={{ background:"linear-gradient(135deg,#3B82F6,#84CC16)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                minutes
              </span>
            </h2>
            <p style={{ fontSize:15, color:"#64748B" }}>Four simple steps to get started</p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:24 }}>
            {steps.map((s,i) => (
              <div key={i} style={{ position:"relative" }}>
                {/* Connector */}
                {i < steps.length - 1 && (
                  <div style={{
                    position:"absolute", top:28, left:"calc(50% + 28px)", right:"-50%",
                    height:2, background:"linear-gradient(to right,rgba(148,163,184,0.30),rgba(148,163,184,0.10))", zIndex:0,
                  }} />
                )}
                <div className={`glass-feature-card reveal stagger-${i + 1}`} style={{ textAlign:"center", position:"relative", zIndex:1 }}>
                  <div style={{
                    width:52, height:52, borderRadius:16,
                    background:`${s.color}14`, border:`1.5px solid ${s.color}28`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    margin:"0 auto 14px",
                  }}>
                    <span style={{ fontSize:18, fontWeight:900, color:s.color }}>{s.n}</span>
                  </div>
                  <h3 style={{ fontSize:14, fontWeight:800, color:"#1E293B", marginBottom:6 }}>{s.title}</h3>
                  <p  style={{ fontSize:12, color:"#64748B", lineHeight:1.65 }}>{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          ROLE CARDS
      ══════════════════════════════ */}
      <section id="portals" style={{ padding:"96px 32px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="reveal" style={{ textAlign:"center", marginBottom:52 }}>
            <h2 style={{ fontSize:36, fontWeight:900, color:"#1E293B", marginBottom:12, letterSpacing:"-0.02em" }}>
              One platform,{" "}
              <span style={{ background:"linear-gradient(135deg,#1D4ED8,#D946EF,#84CC16)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                three portals
              </span>
            </h2>
            <p style={{ fontSize:15, color:"#64748B", maxWidth:480, margin:"0 auto" }}>
              Tailored experiences for every role in your university
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
            {roles.map((r,i) => (
              <div key={i} className={`role-card reveal stagger-${i + 1}`}>
                {/* Header */}
                <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
                  <div style={{ width:50, height:50, borderRadius:15, background:r.bg, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 20px ${r.shadow}` }}>
                    <r.icon size={22} color="white" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 style={{ fontSize:17, fontWeight:900, color:"#1E293B" }}>{r.role} Portal</h3>
                    <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, background:`${r.color}14`, color:r.color, border:`1px solid ${r.color}28` }}>
                      Role-based access
                    </span>
                  </div>
                </div>

                <p style={{ fontSize:13, color:"#64748B", lineHeight:1.7, marginBottom:20 }}>{r.desc}</p>

                {/* Perks */}
                <div style={{ flex:1, marginBottom:24 }}>
                  {r.perks.map((p,j) => (
                    <div key={j} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      <CheckCircle size={13} color={r.color} strokeWidth={2.5} style={{ flexShrink:0 }} />
                      <span style={{ fontSize:12, color:"#334155", fontWeight:500 }}>{p}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link href={r.href} style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  padding:"12px", borderRadius:16,
                  background:r.bg, color:"white",
                  fontSize:13, fontWeight:700, textDecoration:"none",
                  boxShadow:`0 8px 20px ${r.shadow}`,
                  transition:"all 0.2s",
                }}>
                  Enter {r.role} Portal <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          CTA BANNER
      ══════════════════════════════ */}
      <section style={{ padding:"80px 32px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="reveal-scale" style={{
            borderRadius:32, padding:"60px 52px",
            background:"linear-gradient(135deg,#1D4ED8 0%,#3B82F6 45%,#D946EF 100%)",
            position:"relative", overflow:"hidden", textAlign:"center",
          }}>
            {/* BG deco */}
            <div style={{ position:"absolute", top:-80, right:-80,   width:280, height:280, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }} />
            <div style={{ position:"absolute", bottom:-60, left:-60,  width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />

            <div style={{ position:"relative", zIndex:1 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 14px", borderRadius:99, background:"rgba(255,255,255,0.18)", border:"1px solid rgba(255,255,255,0.30)", marginBottom:20 }}>
                <TrendingUp size={12} color="white" strokeWidth={2.5} />
                <span style={{ fontSize:12, fontWeight:700, color:"white" }}>Join 2,800+ students today</span>
              </div>
              <h2 style={{ fontSize:38, fontWeight:900, color:"white", marginBottom:14, letterSpacing:"-0.02em" }}>
                Ready to transform your<br />university experience?
              </h2>
              <p style={{ fontSize:15, color:"rgba(255,255,255,0.80)", maxWidth:480, margin:"0 auto 32px", lineHeight:1.7 }}>
                Join thousands of students, faculty, and admins already using UniCore ERP to manage their academic world.
              </p>
              <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
                <Link href="/login" className="cta-btn-white">
                  Get Started Free <ArrowRight size={15} strokeWidth={2.5} style={{ marginLeft:6 }} />
                </Link>
                <Link href="/login" className="cta-btn-ghost">
                  Sign In <ChevronRight size={15} strokeWidth={2.5} style={{ marginLeft:4 }} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          FOOTER
      ══════════════════════════════ */}
      <footer style={{
        borderTop:"1px solid rgba(255,255,255,0.55)",
        background:"rgba(255,255,255,0.60)",
        backdropFilter:"blur(16px)",
        padding:"48px 32px 28px",
      }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:40, marginBottom:40 }}>
            {/* Brand */}
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#1D4ED8,#3B82F6)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(59,130,246,0.38)" }}>
                  <GraduationCap size={16} color="white" />
                </div>
                <span style={{ fontSize:14, fontWeight:900, background:"linear-gradient(135deg,#1D4ED8,#3B82F6,#D946EF)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>UniCore ERP</span>
              </div>
              <p style={{ fontSize:12, color:"#64748B", lineHeight:1.7, maxWidth:260 }}>
                Modernizing university management with a powerful, role-based ERP platform. Built for students, faculty, and admins.
              </p>
            </div>

            {/* Links */}
            {[
              { title:"Product",   links:["Features","How It Works","Portals","Pricing"]       },
              { title:"Portals",   links:["Admin Login","Faculty Login","Student Login","Signup"] },
              { title:"Support",   links:["Documentation","Contact Us","FAQ","Status Page"]       },
            ].map((col,i) => (
              <div key={i}>
                <p style={{ fontSize:11, fontWeight:800, color:"#1E293B", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:14 }}>
                  {col.title}
                </p>
                {col.links.map(l => (
                  <div key={l} style={{ marginBottom:8 }}>
                    <a href="#" className="footer-link">{l}</a>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop:"1px solid rgba(255,255,255,0.55)",
            paddingTop:20,
            display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12,
          }}>
            <p style={{ fontSize:12, color:"#94A3B8" }}>
              © 2026 Code· Built with ❤️ for modern universities
            </p>
            <div style={{ display:"flex", gap:20 }}>
              {["Privacy","Terms","Cookies"].map(l => (
                <a key={l} href="#" className="footer-link">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
