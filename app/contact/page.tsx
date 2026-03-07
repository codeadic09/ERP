"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  GraduationCap, Building2, Mail, Phone, User,
  Globe, Users, MapPin, ArrowLeft, ArrowRight,
  Send, Loader2, CheckCircle2, AlertTriangle,
  Sparkles, Shield, BarChart3, Zap, Clock, Star,
  BookOpen, ClipboardCheck, Award, Headphones,
  ChevronRight, BadgeCheck, MessageSquare,
} from "lucide-react"

/* ── Mobile hook ────────────────────────────── */
function useMobile(bp = 768) {
  const [m, setM] = useState(false)
  useEffect(() => {
    const c = () => setM(window.innerWidth < bp)
    c(); window.addEventListener("resize", c)
    return () => window.removeEventListener("resize", c)
  }, [bp])
  return m
}
function useTablet(bp = 1024) {
  const [t, setT] = useState(false)
  useEffect(() => {
    const c = () => setT(window.innerWidth < bp)
    c(); window.addEventListener("resize", c)
    return () => window.removeEventListener("resize", c)
  }, [bp])
  return t
}

/* ── Plans ───────────────────────────────────── */
const PLANS = [
  {
    name: "Starter",
    badge: "Small Colleges",
    price: "₹49,999",
    period: "/year",
    color: "#3B82F6",
    shadow: "rgba(59,130,246,0.25)",
    features: [
      "Up to 500 students",
      "3 admin accounts",
      "Attendance & Results",
      "Fee management",
      "Email support",
      "Basic analytics",
    ],
    highlight: false,
  },
  {
    name: "Professional",
    badge: "Most Popular",
    price: "₹1,49,999",
    period: "/year",
    color: "#8B5CF6",
    shadow: "rgba(139,92,246,0.30)",
    features: [
      "Up to 5,000 students",
      "Unlimited admin & faculty",
      "All Starter features",
      "Timetable & scheduling",
      "Bulk import / export",
      "Priority support + SLA",
      "Custom branding",
      "API access",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    badge: "Large Universities",
    price: "Custom",
    period: "",
    color: "#D946EF",
    shadow: "rgba(217,70,239,0.25)",
    features: [
      "Unlimited students",
      "Multi-campus support",
      "All Professional features",
      "Dedicated account manager",
      "On-premise deployment option",
      "SSO / LDAP integration",
      "24/7 phone support",
      "Custom modules on request",
    ],
    highlight: false,
  },
]

/* ── Why InfiCampus ──────────────────────────── */
const WHY = [
  { icon: Shield,         color: "#3B82F6", title: "Secure & Compliant",     desc: "End-to-end encryption, role-based access, GDPR-ready." },
  { icon: Zap,            color: "#F59E0B", title: "Lightning Fast Setup",   desc: "Go live in under 2 weeks with our guided onboarding." },
  { icon: BarChart3,      color: "#8B5CF6", title: "Actionable Analytics",   desc: "Real-time dashboards for attendance, results & fees." },
  { icon: Users,          color: "#16A34A", title: "Role-Based Portals",     desc: "Separate dashboards for students, faculty & admins." },
  { icon: Globe,          color: "#0EA5E9", title: "Cloud-Native",           desc: "99.9% uptime SLA, auto-scaling, zero maintenance." },
  { icon: Headphones,     color: "#D946EF", title: "Dedicated Support",      desc: "Priority tickets, Slack channel & onboarding specialist." },
]

/* ── Trusted by (placeholder) ────────────────── */
const LOGOS = [
  "IIT Delhi", "BITS Pilani", "VIT University", "SRM University", "Manipal", "Amity",
]

/* ════════════════════════════════════════════════ */
export default function ContactPage() {
  const isMobile = useMobile()
  const isTablet = useTablet()
  const hPad = isMobile ? 20 : isTablet ? 32 : 40

  /* form state */
  const [form, setForm] = useState({
    universityName: "",
    contactPerson: "",
    designation: "",
    email: "",
    phone: "",
    city: "",
    studentCount: "",
    plan: "",
    message: "",
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.universityName.trim() || !form.contactPerson.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Please fill in all required fields."); return
    }
    if (!form.email.includes("@")) {
      setError("Enter a valid email address."); return
    }
    setSending(true)
    // Simulated API call — replace with real endpoint
    await new Promise(r => setTimeout(r, 2000))
    setSending(false)
    setSent(true)
  }

  /* ── force light mode on this page ── */
  useEffect(() => {
    const html = document.documentElement
    const prev = html.classList.contains("dark")
    html.classList.remove("dark")
    const obs = new MutationObserver(() => { html.classList.remove("dark") })
    obs.observe(html, { attributes: true, attributeFilter: ["class"] })
    return () => { obs.disconnect(); if (prev) html.classList.add("dark") }
  }, [])

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#EFF6FF 0%,#F5F3FF 40%,#ECFDF5 100%)",
      fontFamily: "var(--font-sans), system-ui, -apple-system, sans-serif",
    }}>

      {/* ═══════════════════════════════
          NAVBAR
      ═══════════════════════════════ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(16px) saturate(1.4)",
        WebkitBackdropFilter: "blur(16px) saturate(1.4)",
        borderBottom: "1px solid rgba(255,255,255,0.6)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(59,130,246,0.04)",
        padding: `0 ${hPad}px`,
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#1D4ED8,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(59,130,246,0.30)" }}>
              <GraduationCap size={16} color="white" />
            </div>
            <span style={{ fontSize: 15, fontWeight: 900, background: "linear-gradient(135deg,#1D4ED8,#3B82F6,#D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>InfiCampus</span>
          </Link>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/" style={{
              fontSize: 13, fontWeight: 600, color: "#64748B", textDecoration: "none",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <ArrowLeft size={14} /> Home
            </Link>
            <Link href="/login" style={{
              fontSize: 13, fontWeight: 700, color: "white", textDecoration: "none",
              padding: "8px 18px", borderRadius: 12,
              background: "linear-gradient(135deg,#1D4ED8,#3B82F6)",
              boxShadow: "0 2px 8px rgba(59,130,246,0.25)",
            }}>
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════
          HERO
      ═══════════════════════════════ */}
      <section style={{
        padding: `${isMobile ? 48 : 80}px ${hPad}px ${isMobile ? 40 : 64}px`,
        textAlign: "center",
        position: "relative",
      }}>
        {/* ambient glow */}
        <div style={{ position: "absolute", top: "10%", left: "15%", width: 300, height: 300, borderRadius: "50%", background: "rgba(59,130,246,0.12)", filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "10%", width: 250, height: 250, borderRadius: "50%", background: "rgba(139,92,246,0.10)", filter: "blur(70px)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 18px", borderRadius: 99, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.18)", marginBottom: 24 }}>
            <Building2 size={13} color="#3B82F6" strokeWidth={2.5} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6" }}>For Universities & Colleges</span>
          </div>

          <h1 style={{
            fontSize: isMobile ? "clamp(28px, 7vw, 38px)" : 52,
            fontWeight: 900, color: "#0F172A",
            lineHeight: 1.1, letterSpacing: "-0.03em",
            marginBottom: 20,
          }}>
            Bring <span style={{ background: "linear-gradient(135deg,#1D4ED8,#3B82F6,#D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>InfiCampus</span>{" "}
            to your institution
          </h1>

          <p style={{ fontSize: isMobile ? 14 : 17, color: "#64748B", lineHeight: 1.75, maxWidth: 540, margin: "0 auto 36px" }}>
            A complete university management platform — attendance, results, fees,
            timetables & more — tailored to your institution&apos;s needs.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#contact-form" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 14, fontSize: 14, fontWeight: 700,
              color: "white", textDecoration: "none",
              background: "linear-gradient(135deg,#1D4ED8,#3B82F6)",
              boxShadow: "0 4px 16px rgba(59,130,246,0.30), inset 0 1px 0 rgba(255,255,255,0.12)",
              transition: "all 0.3s",
            }}>
              Request a Demo <ArrowRight size={15} />
            </a>
            <a href="#pricing" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "12px 28px", borderRadius: 14, fontSize: 14, fontWeight: 700,
              color: "#1D4ED8", textDecoration: "none",
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.22)",
              transition: "all 0.3s",
            }}>
              View Plans <ChevronRight size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          TRUSTED BY
      ═══════════════════════════════ */}
      <section style={{
        padding: `0 ${hPad}px 48px`,
        textAlign: "center",
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
          Trusted by leading institutions
        </p>
        <div style={{
          display: "flex", flexWrap: "wrap", justifyContent: "center", gap: isMobile ? 16 : 28,
        }}>
          {LOGOS.map(name => (
            <div key={name} style={{
              padding: "10px 22px", borderRadius: 12,
              background: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.6)",
              backdropFilter: "blur(8px)",
              fontSize: 13, fontWeight: 700, color: "#94A3B8",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              {name}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════
          WHY INFICAMPUS
      ═══════════════════════════════ */}
      <section style={{
        padding: `${isMobile ? 48 : 72}px ${hPad}px`,
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(10px)",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 52 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 99, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.18)", marginBottom: 16 }}>
              <Sparkles size={12} color="#8B5CF6" strokeWidth={2.5} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#8B5CF6" }}>Why Universities Choose Us</span>
            </div>
            <h2 style={{ fontSize: isMobile ? 24 : 36, fontWeight: 900, color: "#0F172A", lineHeight: 1.15, letterSpacing: "-0.025em" }}>
              Everything your campus needs
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr",
            gap: 20,
          }}>
            {WHY.map((w, i) => (
              <div key={i} className="glass-feature-card" style={{
                padding: isMobile ? 24 : 28,
                borderRadius: 20,
                background: "rgba(255,255,255,0.72)",
                border: "1px solid rgba(255,255,255,0.6)",
                backdropFilter: "blur(16px) saturate(1.3)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 8px 32px rgba(59,130,246,0.06)",
                transition: "all 0.3s",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 13,
                  background: `${w.color}14`,
                  border: `1px solid ${w.color}22`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16,
                  boxShadow: `0 2px 8px ${w.color}15`,
                }}>
                  <w.icon size={20} color={w.color} strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>{w.title}</h3>
                <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          PRICING — id="pricing"
      ═══════════════════════════════ */}
      <section id="pricing" style={{
        padding: `${isMobile ? 48 : 80}px ${hPad}px`,
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 99, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.18)", marginBottom: 16 }}>
              <Award size={12} color="#3B82F6" strokeWidth={2.5} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6" }}>Simple Pricing</span>
            </div>
            <h2 style={{ fontSize: isMobile ? 24 : 36, fontWeight: 900, color: "#0F172A", lineHeight: 1.15, letterSpacing: "-0.025em" }}>
              Plans that scale with you
            </h2>
            <p style={{ fontSize: isMobile ? 13 : 15, color: "#64748B", marginTop: 12, maxWidth: 480, margin: "12px auto 0" }}>
              Start small, grow big. Every plan includes core modules — upgrade anytime.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr",
            gap: 20, alignItems: "start",
          }}>
            {PLANS.map((p, i) => (
              <div key={i} style={{
                borderRadius: 24,
                background: p.highlight
                  ? "linear-gradient(160deg,#1D4ED8 0%,#3B82F6 40%,#8B5CF6 100%)"
                  : "rgba(255,255,255,0.80)",
                border: p.highlight ? "none" : "1px solid rgba(255,255,255,0.6)",
                backdropFilter: p.highlight ? undefined : "blur(14px) saturate(1.3)",
                boxShadow: p.highlight
                  ? `0 8px 32px ${p.shadow}, 0 24px 64px rgba(29,78,216,0.20), inset 0 1px 0 rgba(255,255,255,0.10)`
                  : `0 2px 8px rgba(0,0,0,0.04), 0 8px 28px ${p.shadow}`,
                padding: isMobile ? "28px 24px" : "36px 32px",
                position: "relative", overflow: "hidden",
                transform: p.highlight && !isMobile ? "scale(1.04)" : undefined,
                zIndex: p.highlight ? 2 : 1,
              }}>
                {/* badge */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 14px", borderRadius: 99, marginBottom: 20,
                  background: p.highlight ? "rgba(255,255,255,0.16)" : `${p.color}10`,
                  border: p.highlight ? "1px solid rgba(255,255,255,0.25)" : `1px solid ${p.color}22`,
                }}>
                  {p.highlight && <Star size={11} color="white" fill="white" />}
                  <span style={{ fontSize: 11, fontWeight: 700, color: p.highlight ? "white" : p.color }}>{p.badge}</span>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 900, color: p.highlight ? "white" : "#0F172A", marginBottom: 4 }}>{p.name}</h3>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 34, fontWeight: 900, color: p.highlight ? "white" : "#0F172A" }}>{p.price}</span>
                  {p.period && <span style={{ fontSize: 14, fontWeight: 600, color: p.highlight ? "rgba(255,255,255,0.65)" : "#94A3B8" }}>{p.period}</span>}
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {p.features.map((f, fi) => (
                    <li key={fi} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: p.highlight ? "rgba(255,255,255,0.85)" : "#475569" }}>
                      <BadgeCheck size={15} color={p.highlight ? "rgba(255,255,255,0.7)" : p.color} strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>

                <a href="#contact-form" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", padding: "12px 0", borderRadius: 14, fontSize: 14, fontWeight: 700,
                  textDecoration: "none", transition: "all 0.3s",
                  background: p.highlight ? "white" : `${p.color}`,
                  color: p.highlight ? "#1D4ED8" : "white",
                  boxShadow: p.highlight
                    ? "0 4px 16px rgba(0,0,0,0.10)"
                    : `0 4px 16px ${p.shadow}`,
                }}>
                  {p.price === "Custom" ? "Contact Sales" : "Get Started"} <ArrowRight size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          CONTACT FORM — id="contact-form"
      ═══════════════════════════════ */}
      <section id="contact-form" style={{
        padding: `${isMobile ? 48 : 80}px ${hPad}px`,
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(10px)",
        position: "relative",
      }}>
        <div style={{ position: "absolute", top: "20%", right: "5%", width: 280, height: 280, borderRadius: "50%", background: "rgba(59,130,246,0.08)", filter: "blur(70px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 32 : 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 99, background: "rgba(16,163,74,0.08)", border: "1px solid rgba(16,163,74,0.18)", marginBottom: 16 }}>
              <MessageSquare size={12} color="#16A34A" strokeWidth={2.5} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#16A34A" }}>Get in Touch</span>
            </div>
            <h2 style={{ fontSize: isMobile ? 24 : 36, fontWeight: 900, color: "#0F172A", lineHeight: 1.15, letterSpacing: "-0.025em" }}>
              Request a custom setup
            </h2>
            <p style={{ fontSize: isMobile ? 13 : 15, color: "#64748B", marginTop: 12, maxWidth: 500, margin: "12px auto 0", lineHeight: 1.7 }}>
              Tell us about your university and we&apos;ll prepare a tailored demo & pricing
              — usually within 24 hours.
            </p>
          </div>

          {/* ── Success state ── */}
          {sent ? (
            <div style={{
              borderRadius: 24, padding: isMobile ? "48px 24px" : "64px 48px",
              background: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(255,255,255,0.6)",
              backdropFilter: "blur(20px) saturate(1.3)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.04), 0 16px 48px rgba(59,130,246,0.08)",
              textAlign: "center",
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%", margin: "0 auto 24px",
                background: "rgba(22,163,74,0.10)", border: "2px solid rgba(22,163,74,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <CheckCircle2 size={34} color="#16A34A" />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", marginBottom: 10 }}>
                Request Submitted!
              </h3>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, maxWidth: 420, margin: "0 auto 28px" }}>
                Thank you for your interest in InfiCampus. Our team will review your
                details and reach out within <strong>24 hours</strong> with a personalized demo & quote.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => { setSent(false); setForm({ universityName:"",contactPerson:"",designation:"",email:"",phone:"",city:"",studentCount:"",plan:"",message:"" }) }} style={{
                  padding: "10px 24px", borderRadius: 12, fontSize: 13, fontWeight: 700,
                  background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.22)",
                  color: "#1D4ED8", cursor: "pointer",
                }}>
                  Submit Another
                </button>
                <Link href="/" style={{
                  padding: "10px 24px", borderRadius: 12, fontSize: 13, fontWeight: 700,
                  background: "linear-gradient(135deg,#1D4ED8,#3B82F6)", color: "white",
                  textDecoration: "none", boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                  Back to Home <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (

          /* ── Form card ── */
          <form onSubmit={handleSubmit} style={{
            borderRadius: 24,
            background: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(255,255,255,0.6)",
            backdropFilter: "blur(20px) saturate(1.3)",
            WebkitBackdropFilter: "blur(20px) saturate(1.3)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04), 0 16px 48px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
            padding: isMobile ? "28px 20px" : "40px 44px",
          }}>
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 16px", borderRadius: 12, marginBottom: 20,
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)",
                fontSize: 13, fontWeight: 600, color: "#DC2626",
              }}>
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            {/* Row 1 */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <FieldBox icon={Building2} label="University / College Name *" placeholder="e.g. Rajiv Gandhi Technical University" value={form.universityName} onChange={v => set("universityName", v)} />
              <FieldBox icon={User} label="Contact Person *" placeholder="e.g. Dr. Priya Sharma" value={form.contactPerson} onChange={v => set("contactPerson", v)} />
            </div>

            {/* Row 2 */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <FieldBox icon={ClipboardCheck} label="Designation" placeholder="e.g. Registrar / Dean IT" value={form.designation} onChange={v => set("designation", v)} />
              <FieldBox icon={Mail} label="Official Email *" placeholder="admin@university.edu" value={form.email} onChange={v => set("email", v)} type="email" />
            </div>

            {/* Row 3 */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <FieldBox icon={Phone} label="Phone Number *" placeholder="+91 98765 43210" value={form.phone} onChange={v => set("phone", v)} type="tel" />
              <FieldBox icon={MapPin} label="City / State" placeholder="e.g. Bhopal, MP" value={form.city} onChange={v => set("city", v)} />
            </div>

            {/* Row 4 */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Student count select */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                  <Users size={13} color="#94A3B8" /> Estimated Students
                </label>
                <select
                  value={form.studentCount}
                  onChange={e => set("studentCount", e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 12,
                    background: "rgba(248,250,252,0.8)", border: "1px solid rgba(226,232,240,0.6)",
                    fontSize: 13, fontWeight: 600, color: "#0F172A",
                    outline: "none", cursor: "pointer",
                    appearance: "none", WebkitAppearance: "none",
                  }}
                >
                  <option value="">Select range</option>
                  <option value="<500">Less than 500</option>
                  <option value="500-2000">500 – 2,000</option>
                  <option value="2000-5000">2,000 – 5,000</option>
                  <option value="5000-10000">5,000 – 10,000</option>
                  <option value="10000+">10,000+</option>
                </select>
              </div>

              {/* Plan interest */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                  <Award size={13} color="#94A3B8" /> Interested Plan
                </label>
                <select
                  value={form.plan}
                  onChange={e => set("plan", e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 12,
                    background: "rgba(248,250,252,0.8)", border: "1px solid rgba(226,232,240,0.6)",
                    fontSize: 13, fontWeight: 600, color: "#0F172A",
                    outline: "none", cursor: "pointer",
                    appearance: "none", WebkitAppearance: "none",
                  }}
                >
                  <option value="">Select plan</option>
                  <option value="starter">Starter — ₹49,999/yr</option>
                  <option value="professional">Professional — ₹1,49,999/yr</option>
                  <option value="enterprise">Enterprise — Custom</option>
                  <option value="unsure">Not sure yet</option>
                </select>
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                <BookOpen size={13} color="#94A3B8" /> Additional Requirements
              </label>
              <textarea
                value={form.message}
                onChange={e => set("message", e.target.value)}
                placeholder="Tell us about specific modules you need, integrations, timeline, or anything else…"
                maxLength={1000}
                rows={4}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12,
                  background: "rgba(248,250,252,0.8)", border: "1px solid rgba(226,232,240,0.6)",
                  fontSize: 13, fontWeight: 500, color: "#0F172A", lineHeight: 1.7,
                  resize: "none", outline: "none", fontFamily: "inherit",
                }}
              />
              <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "right", marginTop: 4 }}>{form.message.length}/1000</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={sending}
              style={{
                width: "100%", padding: "14px", borderRadius: 16, border: "none",
                background: sending ? "rgba(59,130,246,0.5)" : "linear-gradient(135deg,#1D4ED8,#3B82F6)",
                color: "white", fontSize: 15, fontWeight: 800,
                cursor: sending ? "not-allowed" : "pointer",
                boxShadow: sending ? "none" : "0 4px 16px rgba(59,130,246,0.30), 0 12px 40px rgba(29,78,216,0.18), inset 0 1px 0 rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                transition: "all 0.3s",
              }}
            >
              {sending
                ? <><Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Submitting…</>
                : <><Send size={16} /> Request Demo & Pricing</>
              }
            </button>

            <p style={{ textAlign: "center", fontSize: 11, color: "#94A3B8", marginTop: 14, lineHeight: 1.6 }}>
              We&apos;ll never share your details. Expected response: <strong style={{ color:"#64748B" }}>within 24 hours</strong>.
            </p>
          </form>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════
          FOOTER
      ═══════════════════════════════ */}
      <footer style={{
        borderTop: "1px solid rgba(226,232,240,0.4)",
        background: "rgba(248,250,252,0.85)",
        backdropFilter: "blur(12px)",
        padding: isMobile ? "28px 20px" : "36px 40px",
        textAlign: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#1D4ED8,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={13} color="white" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 900, background: "linear-gradient(135deg,#1D4ED8,#3B82F6,#D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>InfiCampus</span>
        </div>
        <p style={{ fontSize: 12, color: "#94A3B8" }}>
          © 2026 InfiCampus · Built for modern universities · <Link href="/help" style={{ color: "#3B82F6", textDecoration: "none", fontWeight: 600 }}>Help</Link> · <Link href="/" style={{ color: "#3B82F6", textDecoration: "none", fontWeight: 600 }}>Home</Link>
        </p>
      </footer>
    </div>
  )
}


/* ── Reusable input field ─────────────────────── */
function FieldBox({ icon: Icon, label, placeholder, value, onChange, type = "text" }: {
  icon: typeof Mail
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
        <Icon size={13} color="#94A3B8" /> {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 12,
          background: "rgba(248,250,252,0.8)", border: "1px solid rgba(226,232,240,0.6)",
          fontSize: 13, fontWeight: 600, color: "#0F172A",
          outline: "none", fontFamily: "inherit",
        }}
      />
    </div>
  )
}
