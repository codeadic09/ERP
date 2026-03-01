// app/page.tsx
"use client"

import Link from "next/link"
import { useEffect, useRef, useState, useCallback } from "react"
import {
  GraduationCap, ArrowRight, BarChart3, Shield,
  Users, BookOpen, ClipboardCheck, Award,
  Calendar, Bell, Wallet, Sparkles,
  CheckCircle, Globe, Zap, Lock,
  ChevronRight, Star, TrendingUp,
} from "lucide-react"
import Lottie from "lottie-react"
import type { LottieRefCurrentProps } from "lottie-react"
import { HeroSection } from "@/components/hero/HeroSection"

/* ── Mobile detection hook ── */
function useMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [breakpoint])
  return mobile
}

/* ── Rolling number hook ── */
function useCountUp(end: number, duration = 1400, trigger = true) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)
  useEffect(() => {
    if (!trigger) { setValue(0); return }
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(ease * end * 10) / 10)
      if (t < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [end, duration, trigger])
  return value
}

/* ── CountUp component ── */
export function CountUp({ value, className, style }: { value: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect() } }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

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

/* ══════════════════════════════════════════
   DATA
   ══════════════════════════════════════════ */

const features = [
  { icon: BarChart3,      color: "#3B82F6", title: "Smart Analytics",       sub: "Real-time dashboards with live academic metrics and trends" },
  { icon: ClipboardCheck, color: "#D946EF", title: "Attendance Tracking",   sub: "Automated attendance with instant faculty notifications" },
  { icon: Award,          color: "#84CC16", title: "Result Management",     sub: "One-click result publishing across all semesters and exams" },
  { icon: Calendar,       color: "#FBBF24", title: "Smart Timetable",       sub: "AI-generated conflict-free scheduling for all departments" },
  { icon: Bell,           color: "#F43F5E", title: "Instant Notices",       sub: "Push notifications for exams, events, and announcements" },
  { icon: Wallet,         color: "#3B82F6", title: "Fee Management",        sub: "Online payments, receipts, and overdue tracking in one place" },
  { icon: Shield,         color: "#D946EF", title: "Role-Based Access",     sub: "Separate secure portals for admin, faculty, and students" },
  { icon: Sparkles,       color: "#84CC16", title: "AI Insights",           sub: "Predictive analytics to identify at-risk students early" },
]

const stats = [
  { value: "2,800+", label: "Students Enrolled", icon: Users,    color: "#3B82F6" },
  { value: "180+",   label: "Faculty Members",   icon: BookOpen, color: "#D946EF" },
  { value: "6",      label: "Departments",       icon: Globe,    color: "#84CC16" },
  { value: "99.9%",  label: "Uptime Guaranteed",  icon: Zap,      color: "#FBBF24" },
]

const roles = [
  {
    role: "Admin",
    icon: Shield,
    color: "#1D4ED8",
    bg: "linear-gradient(135deg,#1D4ED8,#3B82F6)",
    shadow: "rgba(59,130,246,0.35)",
    desc: "Full control over the university ecosystem — manage users, departments, fees, and system-wide settings.",
    perks: ["Manage all users & roles", "Approve registrations", "System analytics", "Fee & exam control"],
    href: "/login",
  },
  {
    role: "Faculty",
    icon: BookOpen,
    color: "#A21CAF",
    bg: "linear-gradient(135deg,#D946EF,#E879F9)",
    shadow: "rgba(217,70,239,0.35)",
    desc: "Streamline your teaching workflow — mark attendance, publish marks, and engage with your students.",
    perks: ["Mark & export attendance", "Upload results & grades", "Manage assignments", "View student analytics"],
    href: "/login",
  },
  {
    role: "Student",
    icon: GraduationCap,
    color: "#3F6212",
    bg: "linear-gradient(135deg,#84CC16,#A3E635)",
    shadow: "rgba(132,204,22,0.35)",
    desc: "Track your academic journey — check attendance, results, timetable, and stay updated on campus news.",
    perks: ["View attendance & results", "Download hall tickets", "Check timetable", "Pay fees online"],
    href: "/login",
  },
]

const steps = [
  { n: "01", title: "Sign Up",        sub: "Create your account and choose your role",         color: "#3B82F6" },
  { n: "02", title: "Get Approved",   sub: "Admin verifies and activates your account",        color: "#D946EF" },
  { n: "03", title: "Access Portal",  sub: "Log in to your personalized role-based dashboard", color: "#84CC16" },
  { n: "04", title: "Start Learning", sub: "Manage academics, fees, and results seamlessly",   color: "#FBBF24" },
]

/* ══════════════════════════════════════════
   SPACING SYSTEM (8px grid)
   ══════════════════════════════════════════ */
const SP = {
  section: { mobile: 72, tablet: 100, desktop: 136 },
  gutter:  { mobile: 20, desktop: 40 },
  heading: { mobile: 40, desktop: 64 },
  inner:   { mobile: 16, desktop: 24 },
} as const

export default function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()
  const isUnder1024 = useMobile(1024)
  const isTablet = isUnder1024 && !isMobile
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [navHidden, setNavHidden] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)
  const lastScrollY = useRef(0)
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const [menuAnimData, setMenuAnimData] = useState<object | null>(null)
  const isFirstRender = useRef(true)

  /* Force light mode on landing page — strip dark class from <html> */
  useEffect(() => {
    const html = document.documentElement
    const wasDark = html.classList.contains("dark")
    html.classList.remove("dark")
    // Also prevent next-themes MutationObserver from re-adding it
    const observer = new MutationObserver(() => {
      if (html.classList.contains("dark")) {
        html.classList.remove("dark")
      }
    })
    observer.observe(html, { attributes: true, attributeFilter: ["class"] })
    return () => {
      observer.disconnect()
      if (wasDark) html.classList.add("dark")
    }
  }, [])

  /* Load Lottie animation data on mount */
  useEffect(() => {
    fetch("/lottie/menu-toggle.json")
      .then(r => r.json())
      .then(setMenuAnimData)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (mobileNavOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [mobileNavOpen])

  /* Drive Lottie segments when menu toggles */
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    const anim = lottieRef.current
    if (!anim) return
    if (mobileNavOpen) {
      anim.playSegments([0, 84], true)
    } else {
      anim.playSegments([84, 168], true)
    }
  }, [mobileNavOpen])

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setNavScrolled(y > 20)
      if (y > lastScrollY.current && y > 80) setNavHidden(true)
      else setNavHidden(false)
      lastScrollY.current = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const els = pageRef.current?.querySelectorAll(".reveal, .reveal-left, .reveal-scale")
    if (!els) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target) } }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  /* Dynamic spacing helpers */
  const secPad = isMobile ? SP.section.mobile : isTablet ? SP.section.tablet : SP.section.desktop
  const hPad   = isMobile ? SP.gutter.mobile  : SP.gutter.desktop
  const headMb = isMobile ? SP.heading.mobile  : SP.heading.desktop

  return (
    <div ref={pageRef} className="landing-page" style={{ minHeight: "100vh", fontFamily: "var(--font-sans,system-ui,sans-serif)", overflowX: "hidden" }}>

      {/* ══════════════════════════════
          NAVBAR — Airy, balanced height
      ══════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: navScrolled ? "rgba(255,255,255,0.72)" : "transparent",
        backdropFilter: navScrolled ? "blur(16px) saturate(1.8)" : "none",
        WebkitBackdropFilter: navScrolled ? "blur(16px) saturate(1.8)" : "none",
        borderBottom: navScrolled ? "1px solid rgba(255,255,255,0.55)" : "1px solid transparent",
        boxShadow: navScrolled
          ? "0 1px 3px rgba(15,23,42,0.04), 0 4px 20px rgba(15,23,42,0.06), 0 12px 48px rgba(59,130,246,0.06)"
          : "none",
        transform: navHidden ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1), background 0.3s ease, backdrop-filter 0.3s ease, border-bottom 0.3s ease, box-shadow 0.3s ease",
      }}>
        <div style={{
          maxWidth: 1120, margin: "0 auto",
          padding: isMobile ? "0 20px" : "0 40px",
          height: isMobile ? 60 : 72,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: "linear-gradient(135deg,#1D4ED8,#3B82F6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 6px rgba(29,78,216,0.25), 0 8px 20px rgba(59,130,246,0.30), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}>
              <GraduationCap size={18} color="white" />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 900, lineHeight: 1, background: "linear-gradient(135deg,#1D4ED8,#3B82F6,#D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                UniCore ERP
              </p>
              <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 1 }}>
                University Management
              </p>
            </div>
          </div>

          {/* Nav links — desktop */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
              {["Features", "How It Works", "Portals", "Contact"].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="nav-link">{l}</a>
              ))}
            </div>
          )}

          {/* CTA — desktop */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/login" className="nav-btn-login">Sign In</Link>
              <Link href="/login" className="nav-btn-signup">
                Get Started <ChevronRight size={14} strokeWidth={2.5} style={{ marginLeft: 2 }} />
              </Link>
            </div>
          )}

          {/* Hamburger — mobile (Lottie animation) */}
          {isMobile && (
            <button onClick={() => setMobileNavOpen(v => !v)} aria-label={mobileNavOpen ? "Close menu" : "Open menu"} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: 10,
              background: navScrolled ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.12)",
              border: navScrolled ? "1px solid rgba(59,130,246,0.15)" : "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer", WebkitTapHighlightColor: "transparent",
              padding: 0, overflow: "visible",
              transition: "background 0.3s ease, border 0.3s ease",
            }}>
              {menuAnimData ? (
                <Lottie
                  lottieRef={lottieRef}
                  animationData={menuAnimData}
                  loop={false}
                  autoplay={false}
                  style={{
                    width: 22, height: 22,
                    filter: navScrolled ? "none" : "invert(1)",
                    transition: "filter 0.3s ease",
                  }}
                />
              ) : (
                <span style={{ width: 16, height: 16, display: "block" }} />
              )}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile nav popup */}
      {isMobile && mobileNavOpen && (
        <>
          {/* Backdrop — z-index below nav so hamburger stays crisp */}
          <div
            onClick={() => setMobileNavOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 40,
              background: "rgba(0,0,0,0.25)",
              backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            }}
          />
          {/* Popup card — between backdrop and nav */}
          <div style={{
            position: "fixed", top: 68, right: 16, zIndex: 45,
            width: 240,
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(24px) saturate(1.6)", WebkitBackdropFilter: "blur(24px) saturate(1.6)",
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.7)",
            borderTop: "1px solid rgba(255,255,255,0.9)",
            boxShadow: "0 4px 12px rgba(15,23,42,0.06), 0 16px 48px rgba(15,23,42,0.14), 0 32px 72px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
            padding: "8px",
            animation: "nav-popup-in 0.2s cubic-bezier(0.16,1,0.3,1) both",
            transformOrigin: "top right",
          }}>
            {["Features", "How It Works", "Portals", "Contact"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} onClick={() => setMobileNavOpen(false)}
                style={{
                  display: "block",
                  padding: "12px 16px", borderRadius: 12,
                  fontSize: 14, fontWeight: 600, color: "#1E293B", textDecoration: "none",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,130,246,0.06)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {l}
              </a>
            ))}

            <div style={{ height: 1, background: "rgba(226,232,240,0.5)", margin: "6px 12px" }} />

            <Link href="/login" onClick={() => setMobileNavOpen(false)} style={{
              display: "block", textAlign: "center",
              padding: "10px 16px", borderRadius: 12, margin: "4px 0",
              color: "#1D4ED8", fontSize: 14, fontWeight: 700, textDecoration: "none",
              transition: "background 0.15s ease",
            }}>
              Sign In
            </Link>
            <Link href="/login" onClick={() => setMobileNavOpen(false)} style={{
              display: "block", textAlign: "center",
              padding: "10px 16px", borderRadius: 12,
              background: "linear-gradient(135deg,#1D4ED8,#3B82F6)", color: "white",
              fontSize: 14, fontWeight: 700, textDecoration: "none",
              boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
            }}>
              Get Started
            </Link>
          </div>
        </>
      )}

      {/* ══════════════════════════════
          HERO — WebGL Dark Hero Section
      ══════════════════════════════ */}
      <HeroSection isMobile={isMobile} isTablet={isTablet} />

      {/* ══════════════════════════════
          STATS — Depth Plane 1 (recessed)
      ══════════════════════════════ */}
      <div className="depth-divider" />
      <section style={{
        padding: `${isMobile ? 56 : 80}px ${hPad}px`,
        background: "rgba(248,250,252,0.80)",
        backdropFilter: "blur(12px) saturate(1.3)",
        WebkitBackdropFilter: "blur(12px) saturate(1.3)",
        borderTop: "1px solid rgba(255,255,255,0.5)",
        borderBottom: "1px solid rgba(255,255,255,0.3)",
        position: "relative",
        zIndex: 1,
        boxShadow: "inset 0 2px 12px rgba(59,130,246,0.04), inset 0 -1px 8px rgba(59,130,246,0.02)",
      }}>
        {/* Ambient glow orb */}
        <div style={{ position: "absolute", top: "-60px", left: "20%", width: 200, height: 200, borderRadius: "50%", background: "rgba(59,130,246,0.06)", filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: "-40px", right: "15%", width: 160, height: 160, borderRadius: "50%", background: "rgba(217,70,239,0.05)", filter: "blur(50px)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{
          maxWidth: 1120, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
          gap: isMobile ? 16 : 32,
        }}>
          {stats.map((s, i) => (
            <div key={i} className={`stat-card reveal stagger-${i + 1}`}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${s.color}0C`, border: `1px solid ${s.color}1A`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: `0 2px 8px ${s.color}15, 0 4px 16px ${s.color}0A, inset 0 1px 0 rgba(255,255,255,0.5)` }}>
                <s.icon size={20} color={s.color} strokeWidth={2} />
              </div>
              <p style={{ fontSize: isMobile ? 26 : 32, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
                <CountUp value={s.value} />
              </p>
              <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 8, fontWeight: 500, letterSpacing: "0.01em" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          FEATURES — Depth Plane 2 (elevated)
      ══════════════════════════════ */}
      <div className="depth-divider" />
      <section id="features" style={{
        padding: `${secPad}px ${hPad}px`,
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(12px) saturate(1.3)",
        WebkitBackdropFilter: "blur(12px) saturate(1.3)",
        position: "relative",
        zIndex: 2,
        boxShadow: "0 -1px 0 rgba(255,255,255,0.6), 0 1px 0 rgba(255,255,255,0.6)",
      }}>
        {/* Ambient glow orbs */}
        <div style={{ position: "absolute", top: "10%", right: "5%", width: 280, height: 280, borderRadius: "50%", background: "rgba(59,130,246,0.05)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: "15%", left: "8%", width: 220, height: 220, borderRadius: "50%", background: "rgba(217,70,239,0.04)", filter: "blur(70px)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>

          {/* Section header — extra bottom margin for breathing room */}
          <div className="reveal" style={{ textAlign: "center", marginBottom: headMb, position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 99, background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.16)", marginBottom: 20, boxShadow: "0 2px 8px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.5)" }}>
              <Sparkles size={12} color="#3B82F6" strokeWidth={2.5} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8" }}>Everything you need</span>
            </div>
            <h2 style={{ fontSize: isMobile ? "clamp(26px, 6vw, 34px)" : 40, fontWeight: 900, color: "#0F172A", marginBottom: 16, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
              Powerful features,{" "}
              <span style={{ background: "linear-gradient(135deg,#1D4ED8,#D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                built for education
              </span>
            </h2>
            <p style={{ fontSize: isMobile ? 14 : 16, color: "#64748B", maxWidth: 500, margin: "0 auto", lineHeight: 1.75 }}>
              From attendance to analytics, UniCore covers every academic need with a beautiful, intuitive interface.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2,1fr)" : isTablet ? "repeat(2,1fr)" : "repeat(4,1fr)",
            gap: isMobile ? 14 : 20,
          }}>
            {features.map((f, i) => (
              <div key={i} className={`glass-feature-card reveal stagger-${i + 1}`}>
                <div className="icon-depth" style={{
                  width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: 14,
                  background: `${f.color}0C`, border: `1px solid ${f.color}1A`,
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18,
                  boxShadow: `0 2px 8px ${f.color}12, 0 4px 16px ${f.color}08, inset 0 1px 0 rgba(255,255,255,0.5)`,
                }}>
                  <f.icon size={isMobile ? 18 : 20} color={f.color} strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: isMobile ? 11 : 13, color: "#64748B", lineHeight: 1.7 }}>{f.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          HOW IT WORKS — Depth Plane 1 (recessed)
      ══════════════════════════════ */}
      <div className="depth-divider" />
      <section id="how-it-works" style={{
        padding: `${secPad}px ${hPad}px`,
        background: "rgba(248,250,252,0.80)",
        backdropFilter: "blur(12px) saturate(1.3)",
        WebkitBackdropFilter: "blur(12px) saturate(1.3)",
        borderTop: "1px solid rgba(255,255,255,0.5)",
        borderBottom: "1px solid rgba(255,255,255,0.3)",
        position: "relative",
        zIndex: 1,
        boxShadow: "inset 0 2px 12px rgba(59,130,246,0.04), inset 0 -1px 8px rgba(59,130,246,0.02)",
      }}>
        {/* Ambient glow */}
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 320, height: 320, borderRadius: "50%", background: "rgba(132,204,22,0.04)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: headMb }}>
            <h2 style={{ fontSize: isMobile ? "clamp(26px, 6vw, 34px)" : 40, fontWeight: 900, color: "#0F172A", marginBottom: 16, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
              Up and running in{" "}
              <span style={{ background: "linear-gradient(135deg,#3B82F6,#84CC16)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                minutes
              </span>
            </h2>
            <p style={{ fontSize: isMobile ? 14 : 16, color: "#64748B", lineHeight: 1.75 }}>Four simple steps to get started</p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
            gap: isMobile ? 16 : 28,
          }}>
            {steps.map((s, i) => (
              <div key={i} style={{ position: "relative" }}>
                {/* Connector — desktop only */}
                {!isMobile && i < steps.length - 1 && (
                  <div style={{
                    position: "absolute", top: 32, left: "calc(50% + 32px)", right: "-50%",
                    height: 1.5, background: "linear-gradient(to right,rgba(148,163,184,0.25),rgba(148,163,184,0.05))", zIndex: 0,
                  }} />
                )}
                <div className={`glass-feature-card reveal stagger-${i + 1}`} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                  <div style={{
                    width: isMobile ? 48 : 56, height: isMobile ? 48 : 56, borderRadius: 16,
                    background: `${s.color}0C`, border: `1.5px solid ${s.color}1A`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 18px",
                    boxShadow: `0 2px 8px ${s.color}15, 0 6px 20px ${s.color}0A, inset 0 1px 0 rgba(255,255,255,0.5)`,
                  }}>
                    <span style={{ fontSize: isMobile ? 17 : 19, fontWeight: 900, color: s.color }}>{s.n}</span>
                  </div>
                  <h3 style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: isMobile ? 11 : 13, color: "#64748B", lineHeight: 1.7 }}>{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          ROLE CARDS — Depth Plane 3 (foreground focus)
      ══════════════════════════════ */}
      <div className="depth-divider" />
      <section id="portals" style={{
        padding: `${secPad}px ${hPad}px`,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(14px) saturate(1.4)",
        WebkitBackdropFilter: "blur(14px) saturate(1.4)",
        position: "relative",
        zIndex: 3,
        boxShadow: "0 -2px 20px rgba(59,130,246,0.04), 0 2px 20px rgba(59,130,246,0.04)",
      }}>
        {/* Ambient glow orbs */}
        <div style={{ position: "absolute", top: "5%", left: "10%", width: 240, height: 240, borderRadius: "50%", background: "rgba(29,78,216,0.04)", filter: "blur(70px)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: "10%", right: "8%", width: 200, height: 200, borderRadius: "50%", background: "rgba(217,70,239,0.04)", filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 300, height: 300, borderRadius: "50%", background: "rgba(132,204,22,0.03)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: headMb }}>
            <h2 style={{ fontSize: isMobile ? "clamp(26px, 6vw, 34px)" : 40, fontWeight: 900, color: "#0F172A", marginBottom: 16, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
              One platform,{" "}
              <span style={{ background: "linear-gradient(135deg,#1D4ED8,#D946EF,#84CC16)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                three portals
              </span>
            </h2>
            <p style={{ fontSize: isMobile ? 14 : 16, color: "#64748B", maxWidth: 460, margin: "0 auto", lineHeight: 1.75 }}>
              Tailored experiences for every role in your university
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(3,1fr)",
            gap: isMobile ? 20 : 28,
          }}>
            {roles.map((r, i) => (
              <div key={i} className={`role-card reveal stagger-${i + 1}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                  <div style={{ width: isMobile ? 48 : 52, height: isMobile ? 48 : 52, borderRadius: 16, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${r.shadow}, 0 12px 28px ${r.shadow}60, inset 0 1px 0 rgba(255,255,255,0.2)`, flexShrink: 0 }}>
                    <r.icon size={isMobile ? 20 : 22} color="white" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: isMobile ? 17 : 18, fontWeight: 900, color: "#0F172A" }}>{r.role} Portal</h3>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 99, background: `${r.color}0C`, color: r.color, border: `1px solid ${r.color}1A`, display: "inline-block", marginTop: 4 }}>
                      Role-based access
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.75, marginBottom: 24 }}>{r.desc}</p>

                <div style={{ flex: 1, marginBottom: 28 }}>
                  {r.perks.map((p, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <CheckCircle size={13} color={r.color} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{p}</span>
                    </div>
                  ))}
                </div>

                <Link href={r.href} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "13px", borderRadius: 16,
                  background: r.bg, color: "white",
                  fontSize: 13, fontWeight: 700, textDecoration: "none",
                  boxShadow: `0 2px 6px ${r.shadow}60, 0 8px 24px ${r.shadow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                  transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
                }}>
                  Enter {r.role} Portal <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          CTA BANNER — Depth Plane 4 (peak elevation)
      ══════════════════════════════ */}
      <div className="depth-divider" />
      <section style={{
        padding: `${isMobile ? 48 : 80}px ${hPad}px ${isMobile ? 64 : 104}px`,
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(12px) saturate(1.3)",
        WebkitBackdropFilter: "blur(12px) saturate(1.3)",
        position: "relative",
        zIndex: 4,
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div className="reveal-scale" style={{
            borderRadius: isMobile ? 24 : 36,
            padding: isMobile ? "44px 24px" : isTablet ? "56px 40px" : "72px 64px",
            background: "linear-gradient(135deg,#1D4ED8 0%,#3B82F6 45%,#D946EF 100%)",
            position: "relative", overflow: "hidden", textAlign: "center",
            boxShadow: "0 4px 12px rgba(29,78,216,0.15), 0 16px 48px rgba(59,130,246,0.25), 0 32px 80px rgba(29,78,216,0.20), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}>
            <div style={{ position: "absolute", top: -100, right: -100, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.08)", filter: "blur(2px)" }} />
            <div style={{ position: "absolute", bottom: -80, left: -80, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.06)", filter: "blur(2px)" }} />
            <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: 400, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)", filter: "blur(40px)" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 99, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.25)", marginBottom: 28 }}>
                <TrendingUp size={12} color="white" strokeWidth={2.5} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>Join 2,800+ students today</span>
              </div>
              <h2 style={{
                fontSize: isMobile ? "clamp(24px, 6vw, 32px)" : 40,
                fontWeight: 900, color: "white", marginBottom: 18, letterSpacing: "-0.025em", lineHeight: 1.15,
              }}>
                Ready to transform your<br />university experience?
              </h2>
              <p style={{ fontSize: isMobile ? 14 : 16, color: "rgba(255,255,255,0.75)", maxWidth: 460, margin: "0 auto 40px", lineHeight: 1.75 }}>
                Join thousands of students, faculty, and admins already using UniCore ERP to manage their academic world.
              </p>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
                <Link href="/login" className="cta-btn-white">
                  Get Started Free <ArrowRight size={15} strokeWidth={2.5} style={{ marginLeft: 6 }} />
                </Link>
                <Link href="/login" className="cta-btn-ghost">
                  Sign In <ChevronRight size={15} strokeWidth={2.5} style={{ marginLeft: 4 }} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          FOOTER — Depth Plane 0 (grounded)
      ══════════════════════════════ */}
      <div className="depth-divider" />
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.4)",
        background: "rgba(248,250,252,0.85)",
        backdropFilter: "blur(12px) saturate(1.3)",
        WebkitBackdropFilter: "blur(12px) saturate(1.3)",
        padding: isMobile ? "44px 20px 28px" : "64px 40px 36px",
        position: "relative",
        zIndex: 1,
        boxShadow: "inset 0 2px 16px rgba(59,130,246,0.03)",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "2fr 1fr 1fr 1fr",
            gap: isMobile ? 32 : 48,
            marginBottom: isMobile ? 36 : 48,
          }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg,#1D4ED8,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(29,78,216,0.25), 0 8px 20px rgba(59,130,246,0.30), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
                  <GraduationCap size={16} color="white" />
                </div>
                <span style={{ fontSize: 15, fontWeight: 900, background: "linear-gradient(135deg,#1D4ED8,#3B82F6,#D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>UniCore ERP</span>
              </div>
              <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.8, maxWidth: 280 }}>
                Modernizing university management with a powerful, role-based ERP platform. Built for students, faculty, and admins.
              </p>
            </div>

            {/* Links */}
            {[
              { title: "Product",  links: ["Features", "How It Works", "Portals", "Pricing"] },
              { title: "Portals",  links: ["Admin Login", "Faculty Login", "Student Login", "Signup"] },
              { title: "Support",  links: ["Documentation", "Contact Us", "FAQ", "Status Page"] },
            ].map((col, i) => (
              <div key={i}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>
                  {col.title}
                </p>
                {col.links.map(l => (
                  <div key={l} style={{ marginBottom: 10 }}>
                    <a href="#" className="footer-link">{l}</a>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: "1px solid rgba(226,232,240,0.4)",
            paddingTop: 24,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 16,
            textAlign: isMobile ? "center" : undefined,
          }}>
            <p style={{ fontSize: 12, color: "#94A3B8" }}>
              © 2026 Code· Built with ❤️ for modern universities
            </p>
            <div style={{ display: "flex", gap: 24 }}>
              {["Privacy", "Terms", "Cookies"].map(l => (
                <a key={l} href="#" className="footer-link">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
