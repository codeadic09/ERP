"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
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
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

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
  { icon: BarChart3, color: "#3B82F6", title: "Smart Analytics", sub: "Real-time dashboards with live academic metrics and trends" },
  { icon: ClipboardCheck, color: "#D946EF", title: "Attendance Tracking", sub: "Automated attendance with instant faculty notifications" },
  { icon: Award, color: "#84CC16", title: "Result Management", sub: "One-click result publishing across all semesters and exams" },
  { icon: Calendar, color: "#FBBF24", title: "Smart Timetable", sub: "AI-generated conflict-free scheduling for all departments" },
  { icon: Bell, color: "#F43F5E", title: "Instant Notices", sub: "Push notifications for exams, events, and announcements" },
  { icon: Wallet, color: "#3B82F6", title: "Fee Management", sub: "Online payments, receipts, and overdue tracking in one place" },
  { icon: Shield, color: "#D946EF", title: "Role-Based Access", sub: "Separate secure portals for admin, faculty, and students" },
  { icon: Sparkles, color: "#84CC16", title: "AI Insights", sub: "Predictive analytics to identify at-risk students early" },
]

const stats = [
  { value: "0", label: "Students Enrolled", icon: Users, color: "#3B82F6" },
  { value: "0", label: "Faculty Members", icon: BookOpen, color: "#D946EF" },
  { value: "0", label: "Departments", icon: Globe, color: "#84CC16" },
  { value: "99.9%", label: "Uptime Guaranteed", icon: Zap, color: "#FBBF24" },
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
  { n: "01", title: "Sign Up", sub: "Create your account and choose your role", color: "#3B82F6" },
  { n: "02", title: "Get Approved", sub: "Admin verifies and activates your account", color: "#D946EF" },
  { n: "03", title: "Access Portal", sub: "Log in to your personalized role-based dashboard", color: "#84CC16" },
  { n: "04", title: "Start Learning", sub: "Manage academics, fees, and results seamlessly", color: "#FBBF24" },
]

const SP = {
  section: { mobile: 72, tablet: 100, desktop: 136 },
  gutter: { mobile: 20, desktop: 40 },
  heading: { mobile: 40, desktop: 64 },
  inner: { mobile: 16, desktop: 24 },
} as const

/* ══════════════════════════════════════════
   COMPONENTS (Memoized for performance)
   ══════════════════════════════════════════ */

const Section = React.memo(({ title, subtitle, children, gray = false, id, isMobile, headMb }: {
  title: string
  subtitle: string
  children: React.ReactNode
  gray?: boolean
  id?: string
  isMobile: boolean
  headMb: number
}) => {
  return (
    <section id={id} style={{
      padding: `${gray ? 60 : 100}px 24px`,
      background: gray ? "#F8FAFC" : "#FFFFFF",
      position: "relative",
      willChange: "transform, opacity",
    }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: headMb }}>
          <h2 style={{
            fontSize: isMobile ? "clamp(26px, 6vw, 34px)" : 40,
            fontWeight: 900,
            color: "#0F172A",
            marginBottom: 16,
            letterSpacing: "-0.025em",
            lineHeight: 1.15
          }}>
            {title}
          </h2>
          <p style={{ fontSize: isMobile ? 14 : 16, color: "#64748B", maxWidth: 500, margin: "0 auto", lineHeight: 1.75 }}>
            {subtitle}
          </p>
        </div>
        {children}
      </div>
    </section>
  )
})

const StatItem = React.memo(({ value, label, color, icon: Icon, isMobile, index, hPad }: {
  value: string
  label: string
  color: string
  icon: any
  isMobile: boolean
  index: number
  hPad: number
}) => (
  <div className={`stat-card reveal stagger-${index + 1}`}>
    <div style={{
      width: 48, height: 48, borderRadius: 14,
      background: `${color}0C`, border: `1px solid ${color}1A`,
      display: "flex", alignItems: "center", justifyContent: "center",
      margin: "0 auto 16px",
      boxShadow: `0 2px 8px ${color}15, 0 4px 16px ${color}0A, inset 0 1px 0 rgba(255,255,255,0.5)`
    }}>
      <Icon size={20} color={color} strokeWidth={2} />
    </div>
    <p style={{ fontSize: isMobile ? 26 : 32, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
      <CountUp value={value} />
    </p>
    <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 8, fontWeight: 500, letterSpacing: "0.01em" }}>{label}</p>
  </div>
))

const FeatureCard = React.memo(({ icon: Icon, title, sub, color, isMobile, index }: {
  icon: any, title: string, sub: string, color: string, isMobile: boolean, index: number
}) => (
  <div className={`glass-feature-card reveal stagger-${index + 1}`}>
    <div className="icon-depth" style={{
      width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: 14,
      background: `${color}0C`, border: `1px solid ${color}1A`,
      display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18,
      boxShadow: `0 2px 8px ${color}12, 0 4px 16px ${color}08, inset 0 1px 0 rgba(255,255,255,0.5)`,
    }}>
      <Icon size={isMobile ? 18 : 20} color={color} strokeWidth={2} />
    </div>
    <h3 style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>{title}</h3>
    <p style={{ fontSize: isMobile ? 11 : 13, color: "#64748B", lineHeight: 1.7 }}>{sub}</p>
  </div>
))

export default function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()
  const isUnder1024 = useMobile(1024)
  const isTablet = isUnder1024 && !isMobile
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)
  const lastScrollY = useRef(0)
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const [menuAnimData, setMenuAnimData] = useState<object | null>(null)
  const isFirstRender = useRef(true)

  /* Force light mode on landing page */
  useEffect(() => {
    const html = document.documentElement
    const wasDark = html.classList.contains("dark")
    html.classList.remove("dark")
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
      .catch(() => { })
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
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY
          const shouldScroll = y > window.innerHeight - 80
          setNavScrolled(prev => prev === shouldScroll ? prev : shouldScroll)
          lastScrollY.current = y
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* GSAP ScrollTrigger reveals */
  useEffect(() => {
    const page = pageRef.current
    if (!page) return

    // Ensure triggers are correctly placed after DOM mount
    const timeout = setTimeout(() => ScrollTrigger.refresh(), 500)

    const ctx = gsap.context(() => {
      page.querySelectorAll(".reveal").forEach((el) => {
        gsap.fromTo(el,
          { y: 25, opacity: 0 },
          {
            y: 0, opacity: 1,
            duration: 0.4,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 94%",
              once: true,
            }
          }
        )
      })
      page.querySelectorAll(".stat-card, .glass-feature-card, .role-card").forEach((card, i) => {
        gsap.fromTo(card,
          { y: 20, opacity: 0 },
          {
            y: 0, opacity: 1,
            duration: 0.35,
            delay: (i % 4) * 0.04,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 94%",
              once: true,
            }
          }
        )
      })
    }, page)
    return () => {
      clearTimeout(timeout)
      ctx.revert()
    }
  }, [])

  const secPad = isMobile ? SP.section.mobile : isTablet ? SP.section.tablet : SP.section.desktop
  const hPad = isMobile ? SP.gutter.mobile : SP.gutter.desktop
  const headMb = isMobile ? SP.heading.mobile : SP.heading.desktop

  return (
    <div ref={pageRef} className="landing-page" style={{ minHeight: "100vh", fontFamily: "var(--font-sans,system-ui,sans-serif)", overflowX: "hidden" }}>

      {/* NAVBAR */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: navScrolled ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: navScrolled ? "1px solid #e2e8f0" : "1px solid rgba(255,255,255,0.08)",
        boxShadow: navScrolled ? "0 1px 3px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.02)" : "none",
        willChange: "background, backdrop-filter, border-bottom, box-shadow",
        transition: "background 0.3s ease-out, border-bottom 0.3s ease-out, box-shadow 0.3s ease-out, backdrop-filter 0.3s ease-out",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: `0 ${hPad}px`, height: isMobile ? 60 : 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GraduationCap size={18} color="white" />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 900, lineHeight: 1, color: navScrolled ? "#0F172A" : "#FFFFFF", transition: "color 0.3s ease-in-out" }}>InfiCampus</p>
              <p style={{ fontSize: 10, color: navScrolled ? "#94A3B8" : "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 1, transition: "color 0.3s ease-in-out" }}>University Management</p>
            </div>
          </div>

          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
              {["Features", "How It Works", "Portals"].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="nav-link" style={{ color: navScrolled ? "#475569" : "rgba(255,255,255,0.8)", transition: "color 0.3s ease-in-out" }}>{l}</a>
              ))}
              <Link href="/contact" className="nav-link" style={{ color: navScrolled ? "#475569" : "rgba(255,255,255,0.8)", transition: "color 0.3s ease-in-out" }}>Contact</Link>
            </div>
          )}

          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/login" className="nav-btn-login">Sign In</Link>
              <Link href="/login" className="nav-btn-signup">Get Started <ChevronRight size={14} style={{ marginLeft: 2 }} /></Link>
            </div>
          )}

          {isMobile && (
            <button onClick={() => setMobileNavOpen(v => !v)} style={{ width: 36, height: 36, borderRadius: 10, background: navScrolled ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.12)", border: navScrolled ? "1px solid rgba(59,130,246,0.15)" : "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {menuAnimData ? (
                <Lottie lottieRef={lottieRef} animationData={menuAnimData} loop={false} autoplay={false} style={{ width: 22, height: 22, filter: navScrolled ? "none" : "invert(1)" }} />
              ) : (
                <span style={{ width: 16, height: 16 }} />
              )}
            </button>
          )}
        </div>
      </nav>

      {/* MOBILE NAV POPUP */}
      {isMobile && mobileNavOpen && (
        <>
          <div onClick={() => setMobileNavOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "fixed", top: 68, right: 16, zIndex: 45, width: 240, background: "#ffffff", borderRadius: 18, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(15,23,42,0.06)", padding: "8px", animation: "nav-popup-in 0.2s ease outward" }}>
            {["Features", "How It Works", "Portals"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} onClick={() => setMobileNavOpen(false)} style={{ display: "block", padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "#1E293B", textDecoration: "none" }}>{l}</a>
            ))}
            <Link href="/contact" onClick={() => setMobileNavOpen(false)} style={{ display: "block", padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "#1E293B", textDecoration: "none" }}>Contact</Link>
          </div>
        </>
      )}

      {/* HERO SECTION */}
      <HeroSection isMobile={isMobile} isTablet={isTablet} />

      {/* STATS SECTION */}
      <div className="depth-divider" />
      <section style={{ padding: `${isMobile ? 56 : 80}px ${hPad}px`, background: "#f8fafc", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: isMobile ? 16 : 32 }}>
          {stats.map((s, i) => (
            <StatItem key={i} {...s} isMobile={isMobile} index={i} hPad={hPad} />
          ))}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <div className="depth-divider" />
      <Section id="features" title="Powerful features, built for education" subtitle="From attendance to analytics, InfiCampus covers every academic need with a beautiful, intuitive interface." isMobile={isMobile} headMb={headMb}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : isTablet ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: isMobile ? 14 : 20 }}>
          {features.map((f, i) => <FeatureCard key={i} {...f} isMobile={isMobile} index={i} />)}
        </div>
      </Section>

      {/* HOW IT WORKS SECTION */}
      <div className="depth-divider" />
      <Section id="how-it-works" title="Up and running in minutes" subtitle="Four simple steps to get started" isMobile={isMobile} headMb={headMb} gray>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: isMobile ? 16 : 28 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ position: "relative" }}>
              {!isMobile && i < steps.length - 1 && (
                <div style={{ position: "absolute", top: 32, left: "calc(50% + 32px)", right: "-50%", height: 1.5, background: "linear-gradient(to right,rgba(148,163,184,0.2),rgba(148,163,184,0.05))" }} />
              )}
              <div className={`glass-feature-card reveal stagger-${i + 1}`} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                <div style={{ width: isMobile ? 48 : 56, height: isMobile ? 48 : 56, borderRadius: 16, background: `${s.color}0C`, border: `1.5px solid ${s.color}1A`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                  <span style={{ fontSize: isMobile ? 17 : 19, fontWeight: 900, color: s.color }}>{s.n}</span>
                </div>
                <h3 style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: isMobile ? 11 : 13, color: "#64748B", lineHeight: 1.7 }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* PORTALS SECTION */}
      <div className="depth-divider" />
      <Section id="portals" title="One platform, three portals" subtitle="Tailored experiences for every role in your university" isMobile={isMobile} headMb={headMb}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(3,1fr)", gap: isMobile ? 20 : 28 }}>
          {roles.map((r, i) => (
            <div key={i} className={`role-card reveal stagger-${i + 1}`}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div style={{ width: isMobile ? 48 : 52, height: isMobile ? 48 : 52, borderRadius: 16, background: r.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <r.icon size={isMobile ? 20 : 22} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: isMobile ? 17 : 18, fontWeight: 900 }}>{r.role} Portal</h3>
                  <span style={{ fontSize: 11, fontWeight: 700, background: `${r.color}15`, color: r.color, padding: "2px 10px", borderRadius: 99 }}>Role-based</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.75, marginBottom: 24 }}>{r.desc}</p>
              <div style={{ flex: 1, marginBottom: 28 }}>
                {r.perks.map((p, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <CheckCircle size={13} color={r.color} />
                    <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{p}</span>
                  </div>
                ))}
              </div>
              <Link href={r.href} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", borderRadius: 16, background: r.color, color: "white", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
                Enter {r.role} Portal <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA BANNER */}
      <div className="depth-divider" />
      <section style={{ padding: `${isMobile ? 48 : 80}px ${hPad}px ${isMobile ? 64 : 104}px`, background: "#ffffff", position: "relative", zIndex: 4 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div className="reveal" style={{ borderRadius: isMobile ? 24 : 36, padding: isMobile ? "44px 24px" : "72px 64px", background: "#2563EB", textAlign: "center", position: "relative" }}>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 99, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.25)", marginBottom: 28 }}>
                <TrendingUp size={12} color="white" strokeWidth={2.5} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>Start today — zero setup fee</span>
              </div>
              <h2 style={{
                fontSize: isMobile ? "clamp(24px, 6vw, 32px)" : 40,
                fontWeight: 900, color: "white", marginBottom: 18, letterSpacing: "-0.025em", lineHeight: 1.15,
              }}>
                Built for your campus
              </h2>
              <p style={{ fontSize: isMobile ? 14 : 16, color: "rgba(255,255,255,0.75)", maxWidth: 460, margin: "0 auto 40px", lineHeight: 1.75 }}>
                Designed for students, faculty, and admins at Indian universities — get your institution started today.
              </p>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
                <Link href="/login" className="cta-btn-white">
                  Get Started Free <ArrowRight size={15} strokeWidth={2.5} style={{ marginLeft: 6 }} />
                </Link>
                <Link href="/contact" className="cta-btn-ghost">
                  Deploy for Your University <ChevronRight size={15} strokeWidth={2.5} style={{ marginLeft: 4 }} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc", padding: isMobile ? "44px 20px" : "64px 40px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <GraduationCap size={16} color="white" />
                </div>
                <span style={{ fontSize: 15, fontWeight: 900 }}>InfiCampus</span>
              </div>
              <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.8 }}>Modernizing university management with a powerful, role-based platform.</p>
            </div>
            {["Product", "Portals", "Support"].map((cat, i) => (
              <div key={i}>
                <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginBottom: 18 }}>{cat}</p>
                <div style={{ fontSize: 13, color: "#64748B" }}>
                  <p style={{ marginBottom: 10 }}>Link 1</p>
                  <p style={{ marginBottom: 10 }}>Link 2</p>
                  <p>Link 3</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 24, textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "#94A3B8" }}>© 2026 InfiCampus. Built with ❤️ for universities.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
