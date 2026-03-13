"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Lock, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ResetPasswordClientProps {
  token: string
}

type VerificationState = "loading" | "valid" | "expired" | "invalid"

export default function ResetPasswordClient({ token }: ResetPasswordClientProps) {
  const [state, setState] = useState<VerificationState>("loading")
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function verifyToken() {
      setError(null)

      try {
        const res = await fetch(`/api/password-reset/${encodeURIComponent(token)}`)
        const json = await res.json()

        if (!active) return

        if (!res.ok) {
          setState(json.reason === "expired" ? "expired" : "invalid")
          setError(json.message ?? "This password reset link is no longer valid.")
          return
        }

        setState("valid")
        setMaskedEmail(json.email ?? null)
      } catch {
        if (!active) return
        setState("invalid")
        setError("Unable to verify this password reset link.")
      }
    }

    verifyToken()
    return () => { active = false }
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 8) {
      setError("New password must be at least 8 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      })

      const json = await res.json()
      if (!res.ok) {
        setState(res.status === 410 ? "expired" : state)
        throw new Error(json.error ?? "Unable to reset your password.")
      }

      setSuccess(json.message ?? "Password reset successful.")
      setState("invalid")
      setPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isFormVisible = state === "valid" && !success

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 20% 20%, rgba(14,165,233,0.18), transparent 28%), linear-gradient(160deg, #f8fafc 0%, #eff6ff 50%, #ecfeff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "rgba(255,255,255,0.9)",
          borderRadius: 28,
          border: "1px solid rgba(255,255,255,0.85)",
          boxShadow: "0 20px 56px rgba(15,23,42,0.12)",
          padding: "clamp(28px, 5vw, 40px)",
        }}
      >
        <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24, fontSize: 13, fontWeight: 700, color: "#475569", textDecoration: "none" }}>
          <ArrowLeft size={15} /> Back to Login
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
          <div style={{ width: 52, height: 52, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#0f766e,#2563eb)", color: "white", boxShadow: "0 10px 24px rgba(37,99,235,0.24)" }}>
            {success ? <CheckCircle2 size={24} /> : state === "expired" || state === "invalid" ? <ShieldAlert size={24} /> : <KeyRound size={24} />}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0f766e" }}>Password Reset</p>
            <h1 style={{ margin: "6px 0 0", fontSize: 28, lineHeight: 1.15, fontWeight: 900, color: "#0f172a" }}>
              {success ? "Password updated" : state === "loading" ? "Verifying reset link" : "Set a new password"}
            </h1>
          </div>
        </div>

        {state === "loading" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 16, background: "rgba(37,99,235,0.08)", color: "#1d4ed8", fontWeight: 700 }}>
            <Loader2 size={18} className="animate-spin" /> Validating your secure reset link...
          </div>
        )}

        {error && state !== "loading" && (
          <div style={{ marginBottom: 18, padding: "12px 14px", borderRadius: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", fontSize: 13, fontWeight: 700, color: "#b91c1c" }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: "14px 16px", borderRadius: 16, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#047857", fontSize: 14, fontWeight: 700, lineHeight: 1.7 }}>
            {success}
          </div>
        )}

        {isFormVisible && (
          <>
            <p style={{ margin: "0 0 18px", fontSize: 14, lineHeight: 1.7, color: "#64748b" }}>
              Resetting password for <span style={{ color: "#0f172a", fontWeight: 800 }}>{maskedEmail}</span>. This link expires shortly and can only be used once.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
              <div style={{ display: "grid", gap: 8 }}>
                <Label htmlFor="password" style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>New Password</Label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={submitting}
                    placeholder="At least 8 characters"
                    style={{ height: 50, paddingLeft: 42, borderRadius: 14, background: "rgba(248,250,252,0.96)", border: "1px solid rgba(203,213,225,0.9)" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <Label htmlFor="confirmPassword" style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>Confirm New Password</Label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} color="#64748b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={submitting}
                    placeholder="Re-enter your new password"
                    style={{ height: 50, paddingLeft: 42, borderRadius: 14, background: "rgba(248,250,252,0.96)", border: "1px solid rgba(203,213,225,0.9)" }}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                style={{ height: 50, borderRadius: 14, border: "none", fontSize: 15, fontWeight: 800, background: submitting ? "rgba(37,99,235,0.5)" : "linear-gradient(135deg,#0f766e,#2563eb)", color: "white" }}
              >
                {submitting ? <><Loader2 size={18} className="animate-spin" /> Updating password...</> : "Update Password"}
              </Button>
            </form>
          </>
        )}

        {(state === "expired" || state === "invalid" || success) && (
          <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
            <Link href="/forgot-password" style={{ textDecoration: "none" }}>
              <Button style={{ width: "100%", height: 48, borderRadius: 14, fontWeight: 800, background: "#0f172a", color: "white" }}>
                Request Another Reset Link
              </Button>
            </Link>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <Button variant="outline" style={{ width: "100%", height: 48, borderRadius: 14, fontWeight: 800 }}>
                Return to Login
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}