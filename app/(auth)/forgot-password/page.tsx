"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, LifeBuoy, Loader2, Mail, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email.trim()) {
      setError("Enter your registered email address.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Unable to submit password reset request.")

      setSuccess(json.message ?? "If that email is registered, a password reset link has been sent.")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top left, rgba(37,99,235,0.16), transparent 32%), linear-gradient(135deg, #ecfeff 0%, #eff6ff 48%, #f8fafc 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.05fr) minmax(340px, 0.95fr)",
          background: "rgba(255,255,255,0.86)",
          border: "1px solid rgba(255,255,255,0.8)",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(15,23,42,0.12)",
        }}
      >
        <div
          style={{
            padding: "clamp(28px, 5vw, 44px)",
            background: "linear-gradient(160deg, #0f766e 0%, #1d4ed8 100%)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 999, background: "rgba(255,255,255,0.14)", fontSize: 13, fontWeight: 700 }}>
              <ShieldCheck size={16} /> Secure Account Recovery
            </div>
            <h1 style={{ margin: "24px 0 12px", fontSize: "clamp(30px, 5vw, 42px)", lineHeight: 1.1, fontWeight: 900, letterSpacing: "-0.03em" }}>
              Reset access without exposing account details.
            </h1>
            <p style={{ margin: 0, maxWidth: 420, fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.86)" }}>
              Enter the email registered with InfiCampus. If the account is eligible, we will send a one-time reset link that expires in 15 minutes.
            </p>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {[
              "Cryptographically secure reset links",
              "15-minute expiry and one-time use",
              "Rate-limited requests to reduce abuse",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.12)", fontSize: 14, fontWeight: 600 }}>
                <LifeBuoy size={16} /> {item}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "clamp(28px, 5vw, 44px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Link
            href="/login"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24, fontSize: 13, fontWeight: 700, color: "#475569", textDecoration: "none" }}
          >
            <ArrowLeft size={15} /> Back to Login
          </Link>

          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0f766e" }}>Forgot Password</p>
            <h2 style={{ margin: "10px 0 8px", fontSize: 30, lineHeight: 1.15, color: "#0f172a", fontWeight: 900 }}>Request a reset link</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "#64748b" }}>
              For security, the same confirmation is shown whether or not the email exists.
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: 18, padding: "12px 14px", borderRadius: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", fontSize: 13, fontWeight: 600, color: "#b91c1c" }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ marginBottom: 18, padding: "12px 14px", borderRadius: 14, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.22)", fontSize: 13, fontWeight: 600, color: "#047857" }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <Label htmlFor="email" style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>Registered Email</Label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.ac.in"
                  autoComplete="email"
                  disabled={loading}
                  style={{ height: 50, paddingLeft: 42, borderRadius: 14, background: "rgba(248,250,252,0.96)", border: "1px solid rgba(203,213,225,0.9)" }}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              style={{ height: 50, borderRadius: 14, border: "none", fontSize: 15, fontWeight: 800, background: loading ? "rgba(15,118,110,0.55)" : "linear-gradient(135deg,#0f766e,#2563eb)", color: "white" }}
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Sending reset link...</> : "Send Reset Link"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}