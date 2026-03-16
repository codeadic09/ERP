"use client"

import React, { useState, useEffect } from "react"
import { useRouter }                   from "next/navigation"
import {
  Eye, EyeOff, GraduationCap, BookOpen,
  Lock, User, AlertCircle, Loader2, ArrowLeft,
} from "lucide-react"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import Link         from "next/link"
import { createClient } from "@/lib/supabase/client" 
import { getUserByEmail }              from "@/lib/db"
import { saveSession, getSession, dashboardPath } from "@/lib/auth"

type LoginRole = "student" | "faculty"

const roleTabs: { key: LoginRole; label: string; icon: any; color: string; gradient: string; shadow: string }[] = [
  { key: "student", label: "Student",  icon: GraduationCap, color: "#1D4ED8", gradient: "linear-gradient(135deg,#1D4ED8,#3B82F6)", shadow: "rgba(59,130,246,0.35)" },
  { key: "faculty", label: "Faculty",  icon: BookOpen,      color: "#A21CAF", gradient: "linear-gradient(135deg,#D946EF,#E879F9)", shadow: "rgba(217,70,239,0.35)" },
]

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient() 

  const [activeRole,   setActiveRole]   = useState<LoginRole>("student")
  const [form,         setForm]         = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const currentTab = roleTabs.find(t => t.key === activeRole)!

  // ── Redirect if already logged in ──────────────────────
  useEffect(() => {
    const session = getSession()
    if (session) router.replace(dashboardPath(session.role))
  }, [])

  // Clear error when switching tabs
  useEffect(() => { setError(null) }, [activeRole])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.email.trim() || !form.password.trim()) {
      setError("Please enter your email and password.")
      return
    }

    setLoading(true)

    try {
      // ── 0. Clear current browser session before signing in ─
      await supabase.auth.signOut({ scope: "local" })
      sessionStorage.clear()
      localStorage.clear()

      // ── 1. Supabase Auth ──────────────────────────────────
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email:    form.email.trim().toLowerCase(),
          password: form.password,
        })

      if (authError) {
        if (authError.message.toLowerCase().includes("invalid")) {
          setError("Incorrect email or password. Please try again.")
        } else if (authError.message.toLowerCase().includes("not confirmed")) {
          setError("Email not verified. Contact your administrator.")
        } else {
          setError(authError.message)
        }
        return
      }

      // ── 2. Fetch profile from users table ─────────────────
      const profile = await getUserByEmail(form.email.trim().toLowerCase())

      if (!profile) {
        setError("Account not found in the system. Contact admin.")
        await supabase.auth.signOut({ scope: "local" })
        return
      }

      // ── 3. Role validation ────────────────────────────────
      if (profile.role === "admin") {
        setError("Admin accounts must use the admin login portal.")
        await supabase.auth.signOut({ scope: "local" })
        return
      }

      if (profile.role !== activeRole) {
        const expected = activeRole === "student" ? "Student" : "Faculty"
        setError(`This account is not a ${expected} account. Please switch to the correct tab.`)
        await supabase.auth.signOut({ scope: "local" })
        return
      }

      // ── 4. Check active status ────────────────────────────
      if (profile.status === "inactive") {
        setError("Your account is inactive. Contact your administrator.")
        await supabase.auth.signOut({ scope: "local" })
        return
      }

      // ── 5. Save session + redirect ────────────────────────
      saveSession(profile)
      router.push(dashboardPath(profile.role))

    } catch (err: any) {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Responsive breakpoint styles + entrance animations ── */}
      <style>{`
        .login-wrapper { display: flex; flex-direction: row; }
        .login-video   { display: flex; flex: 1; min-width: 0; }
        .login-form    { width: 480px; min-width: 380px; flex-shrink: 0; }
        @media (max-width: 900px) {
          .login-wrapper { flex-direction: column; }
          .login-video   { display: none; }
          .login-form    { width: 100%; min-width: 0; }
        }

        /* ── Page entrance ── */
        @keyframes login-page-appear {
          from { opacity: 0; transform: translateY(30px); filter: blur(12px); }
          to   { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        .login-animate-appear {
          animation: login-page-appear 1000ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* ── Hover effects for buttons ── */
        .portal-tab-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      <div
        style={{
          minHeight:  "100vh",
          background: "linear-gradient(135deg, #EFF6FF 0%, #EDE9FE 50%, #FCE7F3 100%)",
          display:    "flex",
          alignItems: "center",
          justifyContent: "center",
          padding:    16,
          overflow:   "hidden",
        }}
      >
        <div
          className="login-animate-appear"
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
            willChange: "transform, opacity, filter",
          }}
        >
          {/* Blobs */}
          <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
            <div style={{ position: "absolute", top: "-10%",  right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "rgba(59,130,246,0.08)",  filter: "blur(60px)" }} />
            <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: 400, height: 400, borderRadius: "50%", background: "rgba(139,92,246,0.10)", filter: "blur(60px)" }} />
            <div style={{ position: "absolute", top: "40%",   left: "30%",  width: 300, height: 300, borderRadius: "50%", background: "rgba(236,72,153,0.06)",  filter: "blur(50px)" }} />
          </div>

          {/* ── Main card shell ── */}
          <div
            style={{
            position:       "relative",
            zIndex:         1,
            width:          "100%",
            maxWidth:       960,
            background:     "rgba(255,255,255,0.85)",
            backdropFilter: "blur(24px)",
            borderRadius:   24,
            border:         "1px solid rgba(255,255,255,0.70)",
            boxShadow:      "0 24px 64px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.06)",
            overflow:       "hidden",
          }}
        >
          {/* Gradient bar */}
          <div style={{ height: 4, background: currentTab.gradient, transition: "background 0.3s" }} />

          <div className="login-wrapper">

            {/* ══════════════ LEFT — Video / Doodle ══════════════ */}
            <div
              className="login-video"
              style={{
                position:       "relative",
                background:     "linear-gradient(135deg, #F0F4FF 0%, #EDE9FE 100%)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                overflow:       "hidden",
                minHeight:      480,
              }}
            >
              <video
                src="/videos/login-doodle.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            {/* ══════════════ RIGHT — Login Form ══════════════ */}
            <div className="login-form" style={{ padding: "clamp(24px, 4vw, 40px) clamp(20px, 4vw, 36px)" }}>

              {/* Back to Home */}
              <Link
                href="/"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 13, fontWeight: 600, color: "#64748B",
                  textDecoration: "none", marginBottom: 20,
                  transition: "color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#1D4ED8")}
                onMouseLeave={e => (e.currentTarget.style.color = "#64748B")}
              >
                <ArrowLeft size={15} strokeWidth={2.5} />
                Back to Home
              </Link>

              {/* Logo */}
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  margin: "0 auto 14px",
                  background: currentTab.gradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 8px 24px ${currentTab.shadow}`,
                  transition: "all 0.3s",
                }}>
                  <currentTab.icon size={26} color="white" strokeWidth={2.5} />
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
                  InfiCampus
                </h1>
                <p style={{ fontSize: 13, color: "#64748B", marginTop: 4, fontWeight: 500 }}>
                  Sign in as {activeRole === "student" ? "Student" : "Faculty"}
                </p>
              </div>

              {/* ── Role Tabs ── */}
              <div style={{
                display: "flex",
                gap: 8,
                marginBottom: 24,
                padding: 4,
                background: "rgba(241,245,249,0.80)",
                borderRadius: 14,
                border: "1px solid rgba(226,232,240,0.60)",
              }}>
                {roleTabs.map(tab => {
                  const active = activeRole === tab.key
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveRole(tab.key)}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "10px 0",
                        borderRadius: 10,
                        border: "none",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                        background: active ? "white" : "transparent",
                        color: active ? tab.color : "#94A3B8",
                        boxShadow: active ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                      }}
                    >
                      <tab.icon size={15} strokeWidth={2.5} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 16px", borderRadius: 12, marginBottom: 20,
                  background: "rgba(244,63,94,0.08)",
                  border: "1px solid rgba(244,63,94,0.20)",
                }}>
                  <AlertCircle size={16} color="#F43F5E" strokeWidth={2} />
                  <span style={{ fontSize: 13, color: "#F43F5E", fontWeight: 500 }}>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                {/* Email */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Label htmlFor="email" style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                    {activeRole === "student" ? "Student Email" : "Faculty Email"}
                  </Label>
                  <div style={{ position: "relative" }}>
                    <User size={16} color="#94A3B8" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    <Input
                      id="email"
                      type="email"
                      placeholder={activeRole === "student" ? "student@college.ac.in" : "faculty@college.ac.in"}
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      required
                      autoComplete="off"
                      disabled={loading}
                      style={{ paddingLeft: 42, height: 48, borderRadius: 12, background: "rgba(248,250,252,0.80)", border: "1px solid rgba(226,232,240,0.80)", fontSize: 14 }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Label htmlFor="password" style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                    Password
                  </Label>
                  <div style={{ position: "relative" }}>
                    <Lock size={16} color="#94A3B8" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      required
                      autoComplete="off"
                      disabled={loading}
                      style={{ paddingLeft: 42, paddingRight: 48, height: 48, borderRadius: 12, background: "rgba(248,250,252,0.80)", border: "1px solid rgba(226,232,240,0.80)", fontSize: 14 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      tabIndex={-1}
                      style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: "#94A3B8" }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Link
                      href="/forgot-password"
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: currentTab.color,
                        textDecoration: "none",
                      }}
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  style={{
                    height: 50, borderRadius: 14, marginTop: 6,
                    background: loading ? `${currentTab.color}99` : currentTab.gradient,
                    border: "none", color: "white", fontSize: 15, fontWeight: 800,
                    boxShadow: `0 4px 14px ${currentTab.shadow}`,
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "all 0.3s",
                  }}
                >
                  {loading
                    ? <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                    : `Sign In as ${activeRole === "student" ? "Student" : "Faculty"}`
                  }
                </Button>

              </form>

              {/* Footer */}
              <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>
                Don't have credentials?{" "}
                <span style={{ color: "#1D4ED8", fontWeight: 700 }}>
                  Contact your administrator.
                </span>
              </p>

            </div>{/* end .login-form */}
          </div>{/* end .login-wrapper */}
        </div>{/* end card */}
      </div>{/* end .login-animate-appear */}
    </div>
  </>
  )
}
