// app/(auth)/signup/page.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  GraduationCap, Mail, Lock, Eye, EyeOff,
  User, Phone, BookOpen, Shield,
  ArrowRight, CheckCircle, ChevronLeft
} from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep]     = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm]     = useState({
    name: "", email: "", phone: "", role: "student",
    password: "", confirm: "", dept: "", rollNo: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const roles = [
    { value:"student", label:"Student",  icon:GraduationCap, color:"#84CC16", bg:"linear-gradient(135deg,#84CC16,#A3E635)", shadow:"rgba(132,204,22,0.35)"  },
    { value:"faculty", label:"Faculty",  icon:BookOpen,      color:"#D946EF", bg:"linear-gradient(135deg,#D946EF,#E879F9)", shadow:"rgba(217,70,239,0.35)"  },
    { value:"admin",   label:"Admin",    icon:Shield,        color:"#1D4ED8", bg:"linear-gradient(135deg,#1D4ED8,#3B82F6)", shadow:"rgba(59,130,246,0.35)"  },
  ]

  const depts = ["Computer Science","Information Technology","Electronics","Mechanical","Civil Engineering","MBA","BBA"]

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim())  e.name  = "Full name is required"
    if (!form.email.trim()) e.email = "Email is required"
    if (!form.phone.trim()) e.phone = "Phone number is required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e: Record<string, string> = {}
    if (!form.dept)                         e.dept    = "Department is required"
    if (!form.password)                     e.password= "Password is required"
    if (form.password.length < 8)           e.password= "Minimum 8 characters"
    if (form.password !== form.confirm)     e.confirm = "Passwords do not match"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => { if (validateStep1()) setStep(2) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1400))
    setLoading(false)
    router.push("/pending-approval")
  }

  const selectedRole = roles.find(r => r.value === form.role)!

  /* ── Field component ── */
  const Field = ({
    label, icon: Icon, type = "text", placeholder, field, error,
    suffix
  }: {
    label: string; icon: any; type?: string; placeholder: string;
    field: keyof typeof form; error?: string; suffix?: React.ReactNode
  }) => (
    <div>
      <label style={{ fontSize:12, fontWeight:700, color:"#334155", display:"block", marginBottom:6 }}>
        {label}
      </label>
      <div style={{
        display:"flex", alignItems:"center", gap:10,
        padding:"11px 14px",
        background:"rgba(255,255,255,0.85)",
        border: error ? "1px solid #F43F5E" : "1px solid rgba(255,255,255,0.65)",
        borderRadius:14, transition:"all 0.2s",
        boxShadow: error ? "0 0 0 3px rgba(244,63,94,0.10)" : "none",
      }}
        onFocus={e => {
          if (!error) {
            const t = e.currentTarget as HTMLDivElement
            t.style.borderColor = "#3B82F6"
            t.style.boxShadow   = "0 0 0 4px rgba(59,130,246,0.12)"
            t.style.background  = "#fff"
          }
        }}
        onBlur={e => {
          if (!error) {
            const t = e.currentTarget as HTMLDivElement
            t.style.borderColor = "rgba(255,255,255,0.65)"
            t.style.boxShadow   = "none"
            t.style.background  = "rgba(255,255,255,0.85)"
          }
        }}
      >
        <Icon size={15} color="#94A3B8" strokeWidth={2.5} style={{ flexShrink:0 }} />
        <input
          type={type} placeholder={placeholder}
          value={form[field]}
          onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
          style={{ flex:1, border:"none", background:"transparent", fontSize:13, color:"#1E293B", outline:"none" }}
        />
        {suffix}
      </div>
      {error && <p style={{ fontSize:11, color:"#F43F5E", marginTop:4, fontWeight:600 }}>{error}</p>}
    </div>
  )

  return (
    <div style={{
      minHeight:"100vh", width:"100%",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:24, boxSizing:"border-box",
      position:"relative", overflow:"hidden",
      background:
        "radial-gradient(ellipse at 15% 20%,rgba(59,130,246,0.20) 0%,transparent 45%)," +
        "radial-gradient(ellipse at 85% 15%,rgba(217,70,239,0.16) 0%,transparent 40%)," +
        "radial-gradient(ellipse at 70% 80%,rgba(132,204,22,0.14) 0%,transparent 40%)," +
        "linear-gradient(160deg,#EEF2FF 0%,#F0F4FF 50%,#EDE9FE 100%)",
    }}>

      {/* ── Blobs ── */}
      <div style={{ position:"fixed", top:"-10%", left:"-5%",   width:400, height:400, background:"radial-gradient(circle,rgba(59,130,246,0.16) 0%,transparent 70%)",  borderRadius:"50%", pointerEvents:"none" }} />
      <div style={{ position:"fixed", bottom:"-10%", right:"-5%",width:400, height:400, background:"radial-gradient(circle,rgba(217,70,239,0.12) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none" }} />

      {/* ── CARD ── */}
      <div style={{
        position:"relative", zIndex:10,
        width:"100%", maxWidth:480,
        borderRadius:28, overflow:"hidden",
        background:"rgba(255,255,255,0.88)",
        backdropFilter:"blur(32px)", WebkitBackdropFilter:"blur(32px)",
        border:"1px solid rgba(255,255,255,0.65)",
        boxShadow:"0 32px 80px rgba(59,130,246,0.18), 0 4px 24px rgba(0,0,0,0.06)",
      }}>

        {/* Top gradient bar */}
        <div style={{ height:3, background:"linear-gradient(to right,#1D4ED8,#3B82F6,#D946EF,#84CC16,#FBBF24)" }} />

        <div style={{ padding:"clamp(24px, 6vw, 40px) clamp(18px, 5vw, 44px)" }}>

          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:32 }}>
            <div style={{ width:36, height:36, borderRadius:11, background:"linear-gradient(135deg,#1D4ED8,#3B82F6)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(59,130,246,0.38)" }}>
              <GraduationCap size={17} color="white" />
            </div>
            <span style={{ fontWeight:900, fontSize:15, background:"linear-gradient(135deg,#1D4ED8,#3B82F6,#D946EF)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              UniCore ERP
            </span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom:24 }}>
            <h2 style={{ fontSize:22, fontWeight:900, color:"#1E293B", marginBottom:4 }}>
              Create your account
            </h2>
            <p style={{ fontSize:13, color:"#64748B" }}>
              Already have one?{" "}
              <Link href="/login" style={{ color:"#3B82F6", fontWeight:700, textDecoration:"none" }}>
                Sign in →
              </Link>
            </p>
          </div>

          {/* ── Progress steps ── */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:28 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display:"flex", alignItems:"center", gap:8, flex: s < 2 ? 1 : "auto" }}>
                <div style={{
                  width:28, height:28, borderRadius:"50%",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:12, fontWeight:800, flexShrink:0,
                  background: step > s
                    ? "linear-gradient(135deg,#1D4ED8,#3B82F6)"
                    : step === s
                      ? "linear-gradient(135deg,#1D4ED8,#3B82F6)"
                      : "rgba(148,163,184,0.18)",
                  color: step >= s ? "white" : "#94A3B8",
                  boxShadow: step >= s ? "0 4px 10px rgba(59,130,246,0.35)" : "none",
                  transition:"all 0.3s",
                }}>
                  {step > s ? <CheckCircle size={14} strokeWidth={2.5} /> : s}
                </div>
                {s < 2 && (
                  <div style={{
                    flex:1, height:2, borderRadius:2,
                    background: step > s
                      ? "linear-gradient(to right,#1D4ED8,#3B82F6)"
                      : "rgba(148,163,184,0.20)",
                    transition:"background 0.3s",
                  }} />
                )}
              </div>
            ))}
            <div style={{ marginLeft:8 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"#1D4ED8" }}>
                Step {step} of 2
              </p>
              <p style={{ fontSize:10, color:"#64748B" }}>
                {step === 1 ? "Basic Info" : "Account Setup"}
              </p>
            </div>
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Role selector */}
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>
                  Register as
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {roles.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, role: r.value }))}
                      style={{
                        padding:"10px 6px", borderRadius:14, border:"none",
                        cursor:"pointer", transition:"all 0.2s",
                        display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                        background: form.role === r.value ? `${r.color}14` : "rgba(241,245,249,0.80)",
                        border: form.role === r.value ? `1.5px solid ${r.color}40` : "1.5px solid transparent",
                        boxShadow: form.role === r.value ? `0 4px 14px ${r.shadow}` : "none",
                      }}
                    >
                      <div style={{
                        width:30, height:30, borderRadius:9,
                        background: form.role === r.value ? r.bg : "rgba(148,163,184,0.20)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        boxShadow: form.role === r.value ? `0 4px 10px ${r.shadow}` : "none",
                        transition:"all 0.2s",
                      }}>
                        <r.icon size={14} color={form.role === r.value ? "white" : "#64748B"} strokeWidth={2.5} />
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, color: form.role === r.value ? r.color : "#64748B" }}>
                        {r.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Full Name"     icon={User}  placeholder="e.g. Aryan Sharma"         field="name"  error={errors.name}  />
              <Field label="Email Address" icon={Mail}  placeholder="you@unicore.edu"            field="email" error={errors.email} />
              <Field label="Phone Number"  icon={Phone} placeholder="+91 98765 43210"            field="phone" error={errors.phone} />

              <button
                type="button"
                onClick={handleNext}
                style={{
                  padding:"13px", borderRadius:16, border:"none",
                  background:"linear-gradient(135deg,#1D4ED8,#3B82F6)",
                  color:"white", fontSize:14, fontWeight:700, cursor:"pointer",
                  boxShadow:"0 8px 24px rgba(59,130,246,0.38)",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  transition:"all 0.2s", marginTop:4,
                }}
              >
                Continue <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Department */}
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"#334155", display:"block", marginBottom:6 }}>
                  Department
                </label>
                <select
                  value={form.dept}
                  onChange={e => setForm(p => ({ ...p, dept: e.target.value }))}
                  style={{
                    width:"100%", padding:"11px 14px",
                    background:"rgba(255,255,255,0.85)",
                    border: errors.dept ? "1px solid #F43F5E" : "1px solid rgba(255,255,255,0.65)",
                    borderRadius:14, fontSize:13, color: form.dept ? "#1E293B" : "#94A3B8",
                    outline:"none", cursor:"pointer", transition:"all 0.2s",
                  }}
                  onFocus={e => { e.target.style.borderColor="#3B82F6"; e.target.style.boxShadow="0 0 0 4px rgba(59,130,246,0.12)" }}
                  onBlur={e  => { e.target.style.borderColor="rgba(255,255,255,0.65)"; e.target.style.boxShadow="none" }}
                >
                  <option value="">Select your department</option>
                  {depts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.dept && <p style={{ fontSize:11, color:"#F43F5E", marginTop:4, fontWeight:600 }}>{errors.dept}</p>}
              </div>

              {form.role === "student" && (
                <Field label="Roll / Enrollment No." icon={BookOpen} placeholder="e.g. EN2024101" field="rollNo" />
              )}

              <Field
                label="Password" icon={Lock} type={showPass ? "text" : "password"}
                placeholder="Min. 8 characters" field="password" error={errors.password}
                suffix={
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    style={{ background:"none", border:"none", cursor:"pointer", color:"#94A3B8", display:"flex", padding:0 }}>
                    {showPass ? <EyeOff size={15} strokeWidth={2.5} /> : <Eye size={15} strokeWidth={2.5} />}
                  </button>
                }
              />

              <Field
                label="Confirm Password" icon={Lock} type="password"
                placeholder="Re-enter password" field="confirm" error={errors.confirm}
              />

              {/* Password strength */}
              {form.password && (
                <div style={{ marginTop:-8 }}>
                  <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{
                        flex:1, height:3, borderRadius:99,
                        background: form.password.length >= i * 2
                          ? i <= 1 ? "#F43F5E" : i <= 2 ? "#FBBF24" : i <= 3 ? "#3B82F6" : "#84CC16"
                          : "rgba(148,163,184,0.20)",
                        transition:"background 0.2s",
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize:10, color:"#64748B" }}>
                    {form.password.length < 4 ? "Weak" : form.password.length < 6 ? "Fair" : form.password.length < 8 ? "Good" : "Strong"} password
                  </p>
                </div>
              )}

              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    padding:"13px 18px", borderRadius:16,
                    background:"rgba(59,130,246,0.08)",
                    border:"1px solid rgba(59,130,246,0.22)",
                    color:"#1D4ED8", fontSize:14, fontWeight:700,
                    cursor:"pointer", display:"flex", alignItems:"center", gap:6,
                    transition:"all 0.2s",
                  }}
                >
                  <ChevronLeft size={15} strokeWidth={2.5} /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex:1, padding:"13px", borderRadius:16, border:"none",
                    background: loading
                      ? "rgba(59,130,246,0.50)"
                      : "linear-gradient(135deg,#1D4ED8,#3B82F6)",
                    color:"white", fontSize:14, fontWeight:700,
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading ? "none" : "0 8px 24px rgba(59,130,246,0.38)",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    transition:"all 0.2s",
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{ width:16, height:16, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.35)", borderTopColor:"white", animation:"spin 0.8s linear infinite" }} />
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create Account <ArrowRight size={16} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Back to home */}
          <div style={{ textAlign:"center", marginTop:20 }}>
            <Link href="/" style={{ fontSize:12, color:"#64748B", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:4, fontWeight:500 }}>
              ← Back to home
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
    </div>
  )
}
