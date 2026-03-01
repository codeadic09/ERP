"use client"

import React, { useState, useEffect } from "react"
import { useRouter }                   from "next/navigation"
import {
  Eye, EyeOff, ShieldCheck,
  Lock, User, AlertCircle, Loader2, ArrowLeft,
} from "lucide-react"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import Link         from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getUserByEmail }              from "@/lib/db"
import { saveSession, getSession, dashboardPath } from "@/lib/auth"

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form,         setForm]         = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  // ── Redirect if already logged in ──────────────────────
  useEffect(() => {
    const session = getSession()
    if (session) router.replace(dashboardPath(session.role))
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.email.trim() || !form.password.trim()) {
      setError("Please enter your email and password.")
      return
    }

    setLoading(true)

    try {
      // ── 0. Clear current browser session ───────────────────
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
          setError("Email not verified. Contact system administrator.")
        } else {
          setError(authError.message)
        }
        return
      }

      // ── 2. Fetch profile ──────────────────────────────────
      const profile = await getUserByEmail(form.email.trim().toLowerCase())

      if (!profile) {
        setError("Account not found in the system.")
        await supabase.auth.signOut({ scope: "local" })
        return
      }

      // ── 3. Role validation — admin only ───────────────────
      if (profile.role !== "admin") {
        setError("Access denied. This portal is for administrators only.")
        await supabase.auth.signOut({ scope: "local" })
        return
      }

      // ── 4. Check active status ────────────────────────────
      if (profile.status === "inactive") {
        setError("Your account is inactive. Contact the system owner.")
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
    <div
      style={{
        minHeight:      "100vh",
        background:     "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "16px",
      }}
    >
      {/* Subtle blobs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%",  width: 500, height: 500, borderRadius: "50%", background: "rgba(234,179,8,0.06)",  filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: 400, height: 400, borderRadius: "50%", background: "rgba(239,68,68,0.05)", filter: "blur(80px)" }} />
      </div>

      {/* Card */}
      <div
        style={{
          position:       "relative",
          zIndex:         1,
          width:          "100%",
          maxWidth:       420,
          background:     "rgba(30,41,59,0.85)",
          backdropFilter: "blur(24px)",
          borderRadius:   24,
          border:         "1px solid rgba(100,116,139,0.25)",
          boxShadow:      "0 24px 64px rgba(0,0,0,0.40), 0 4px 16px rgba(0,0,0,0.20)",
          overflow:       "hidden",
        }}
      >
        {/* Gradient bar */}
        <div style={{ height: 4, background: "linear-gradient(90deg,#EAB308,#F59E0B,#F97316)" }} />

        <div style={{ padding: "clamp(24px, 6vw, 40px) clamp(20px, 5vw, 40px) clamp(28px, 6vw, 44px)" }}>

          {/* Back to Login */}
          <Link
            href="/login"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 600, color: "#94A3B8",
              textDecoration: "none", marginBottom: 20,
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#EAB308")}
            onMouseLeave={e => (e.currentTarget.style.color = "#94A3B8")}
          >
            <ArrowLeft size={15} strokeWidth={2.5} />
            Back to Login
          </Link>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              margin: "0 auto 16px",
              background: "linear-gradient(135deg,#EAB308,#F59E0B)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 24px rgba(234,179,8,0.30)",
            }}>
              <ShieldCheck size={28} color="white" strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#F8FAFC", margin: 0, letterSpacing: "-0.02em" }}>
              Admin Portal
            </h1>
            <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 6, fontWeight: 500 }}>
              Restricted access — administrators only
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 16px", borderRadius: 12, marginBottom: 20,
              background: "rgba(244,63,94,0.12)",
              border: "1px solid rgba(244,63,94,0.25)",
            }}>
              <AlertCircle size={16} color="#F43F5E" strokeWidth={2} />
              <span style={{ fontSize: 13, color: "#F43F5E", fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Label htmlFor="email" style={{ fontSize: 13, fontWeight: 700, color: "#CBD5E1" }}>
                Admin Email
              </Label>
              <div style={{ position: "relative" }}>
                <User size={16} color="#64748B" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@college.ac.in"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  autoComplete="off"
                  disabled={loading}
                  style={{
                    paddingLeft: 42, height: 48, borderRadius: 12,
                    background: "rgba(15,23,42,0.60)",
                    border: "1px solid rgba(100,116,139,0.30)",
                    fontSize: 14, color: "#F8FAFC",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Label htmlFor="password" style={{ fontSize: 13, fontWeight: 700, color: "#CBD5E1" }}>
                Password
              </Label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="#64748B" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="off"
                  disabled={loading}
                  style={{
                    paddingLeft: 42, paddingRight: 48, height: 48, borderRadius: 12,
                    background: "rgba(15,23,42,0.60)",
                    border: "1px solid rgba(100,116,139,0.30)",
                    fontSize: 14, color: "#F8FAFC",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  tabIndex={-1}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: "#64748B" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              style={{
                height: 50, borderRadius: 14, marginTop: 6,
                background: loading ? "rgba(234,179,8,0.50)" : "linear-gradient(135deg,#EAB308,#F59E0B)",
                border: "none", color: "#0F172A", fontSize: 15, fontWeight: 800,
                boxShadow: "0 4px 14px rgba(234,179,8,0.30)",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                : "Sign In as Admin"
              }
            </Button>

          </form>

          {/* Footer */}
          <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>
            This portal is restricted to authorized administrators only.
          </p>

        </div>
      </div>
    </div>
  )
}
