// app/pending-approval/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  GraduationCap, Clock, CheckCircle, Mail,
  ArrowRight, Shield, RefreshCw, Bell,
  Sparkles, BookOpen, Users
} from "lucide-react"

const steps = [
  { label: "Account Created",      sub: "Your details have been submitted",     done: true,  icon: CheckCircle },
  { label: "Under Review",         sub: "Admin is verifying your credentials",  done: false, icon: Clock       },
  { label: "Approval Granted",     sub: "You'll receive an email confirmation", done: false, icon: Shield      },
  { label: "Access Dashboard",     sub: "Start your UniCore journey",           done: false, icon: Sparkles    },
]

export default function PendingApprovalPage() {
  const [pulse, setPulse] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2000)
    return () => clearInterval(t)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise(r => setTimeout(r, 1500))
    setRefreshing(false)
  }

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, boxSizing: "border-box",
      position: "relative", overflow: "hidden",
      background:
        "radial-gradient(ellipse at 15% 20%, rgba(59,130,246,0.20) 0%, transparent 45%)," +
        "radial-gradient(ellipse at 85% 15%, rgba(217,70,239,0.16) 0%, transparent 40%)," +
        "radial-gradient(ellipse at 70% 80%, rgba(132,204,22,0.14) 0%, transparent 40%)," +
        "linear-gradient(160deg,#EEF2FF 0%,#F0F4FF 50%,#EDE9FE 100%)",
    }}>

      {/* ── Blobs ── */}
      <div style={{ position:"fixed", top:"-10%", left:"-5%",    width:380, height:380, background:"radial-gradient(circle,rgba(59,130,246,0.18) 0%,transparent 70%)",  borderRadius:"50%", pointerEvents:"none" }} />
      <div style={{ position:"fixed", bottom:"-10%", right:"-5%",width:380, height:380, background:"radial-gradient(circle,rgba(217,70,239,0.14) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none" }} />
      <div style={{ position:"fixed", top:"35%", right:"8%",     width:200, height:200, background:"radial-gradient(circle,rgba(132,204,22,0.14) 0%,transparent 70%)",  borderRadius:"50%", pointerEvents:"none" }} />

      {/* ── Main card ── */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "100%", maxWidth: 560,
        borderRadius: 28,
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
        border: "1px solid rgba(255,255,255,0.65)",
        boxShadow: "0 32px 80px rgba(59,130,246,0.18), 0 4px 24px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}>

        {/* Top gradient bar */}
        <div style={{ height:3, background:"linear-gradient(to right,#1D4ED8,#3B82F6,#D946EF,#84CC16,#FBBF24)" }} />

        <div style={{ padding: "44px 48px" }}>

          {/* ── Hero Icon ── */}
          <div style={{ textAlign:"center", marginBottom:32 }}>
            {/* Outer ring */}
            <div style={{
              width: 100, height: 100,
              borderRadius: "50%",
              background: "rgba(59,130,246,0.08)",
              border: "2px solid rgba(59,130,246,0.20)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              position: "relative",
              animation: "pulse-ring 2s ease-in-out infinite",
            }}>
              {/* Inner icon */}
              <div style={{
                width: 68, height: 68, borderRadius: "50%",
                background: "linear-gradient(135deg,#1D4ED8,#3B82F6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 28px rgba(59,130,246,0.42)",
              }}>
                <Clock size={30} color="white" strokeWidth={2.5} />
              </div>

              {/* Animated dots */}
              {[0,1,2].map(i => (
                <div key={i} style={{
                  position: "absolute",
                  width: 8, height: 8, borderRadius: "50%",
                  background: i === 0 ? "#3B82F6" : i === 1 ? "#D946EF" : "#84CC16",
                  top: "50%", left: "50%",
                  transform: `rotate(${i * 120}deg) translateX(52px) translateY(-50%)`,
                  animation: `orbit 3s linear infinite`,
                  animationDelay: `${i * 1}s`,
                  boxShadow: `0 0 8px ${i === 0 ? "rgba(59,130,246,0.60)" : i === 1 ? "rgba(217,70,239,0.60)" : "rgba(132,204,22,0.60)"}`,
                }} />
              ))}
            </div>

            <h1 style={{
              fontSize: 24, fontWeight: 900, color: "#1E293B",
              marginBottom: 8, lineHeight: 1.2,
            }}>
              Account Under Review
            </h1>
            <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
              Your registration is being reviewed by the admin team. You'll receive an email at{" "}
              <span style={{ fontWeight: 700, color: "#1D4ED8" }}>aryan@unicore.edu</span>{" "}
              once approved — usually within <strong>24 hours</strong>.
            </p>
          </div>

          {/* ── Status pill ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, marginBottom: 32,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 18px", borderRadius: 99,
              background: "rgba(251,191,36,0.12)",
              border: "1px solid rgba(251,191,36,0.30)",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#FBBF24",
                boxShadow: "0 0 8px rgba(251,191,36,0.70)",
                animation: pulse ? "glow-amber 1s ease-in-out" : "none",
              }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#D97706" }}>
                Pending Approval
              </span>
            </div>
          </div>

          {/* ── Progress Steps ── */}
          <div style={{
            background: "rgba(255,255,255,0.72)",
            border: "1px solid rgba(255,255,255,0.65)",
            borderRadius: 20,
            padding: "24px 28px",
            marginBottom: 28,
            backdropFilter: "blur(12px)",
          }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                {/* Line + Icon */}
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: s.done
                      ? "linear-gradient(135deg,#1D4ED8,#3B82F6)"
                      : i === 1
                        ? "rgba(251,191,36,0.15)"
                        : "rgba(148,163,184,0.15)",
                    border: s.done
                      ? "none"
                      : i === 1
                        ? "1.5px solid rgba(251,191,36,0.40)"
                        : "1.5px solid rgba(148,163,184,0.30)",
                    boxShadow: s.done ? "0 4px 12px rgba(59,130,246,0.35)" : "none",
                    transition: "all 0.3s",
                  }}>
                    <s.icon
                      size={16} strokeWidth={2.5}
                      color={s.done ? "white" : i === 1 ? "#D97706" : "#94A3B8"}
                    />
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{
                      width: 2, flex: 1, minHeight: 20, margin: "4px 0",
                      background: s.done
                        ? "linear-gradient(to bottom,#3B82F6,rgba(59,130,246,0.30))"
                        : "rgba(148,163,184,0.20)",
                      borderRadius: 2,
                    }} />
                  )}
                </div>

                {/* Text */}
                <div style={{ paddingBottom: i < steps.length - 1 ? 16 : 0, paddingTop: 6 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 700,
                    color: s.done ? "#1E293B" : i === 1 ? "#D97706" : "#94A3B8",
                  }}>{s.label}</p>
                  <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Info cards ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:28 }}>
            {[
              { icon:Mail,     color:"#3B82F6", title:"Check Email",     sub:"Confirmation will be sent once approved"        },
              { icon:Bell,     color:"#D946EF", title:"Stay Updated",    sub:"You'll be notified instantly on approval"       },
              { icon:Shield,   color:"#84CC16", title:"Secure Process",  sub:"Admin verifies all credentials carefully"       },
              { icon:BookOpen, color:"#FBBF24", title:"Prepare Access",  sub:"Review your department info while you wait"     },
            ].map((c, i) => (
              <div key={i} style={{
                padding: "14px 16px", borderRadius: 16,
                background: "rgba(255,255,255,0.72)",
                border: "1px solid rgba(255,255,255,0.65)",
                backdropFilter: "blur(8px)",
                display: "flex", alignItems: "flex-start", gap: 10,
                transition: "all 0.2s",
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.92)"
                  ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${c.color}18`
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.72)"
                  ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = "none"
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: `${c.color}14`,
                  border: `1px solid ${c.color}28`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <c.icon size={14} color={c.color} strokeWidth={2.5} />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#1E293B" }}>{c.title}</p>
                  <p style={{ fontSize: 11, color: "#64748B", marginTop: 2, lineHeight:1.5 }}>{c.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Actions ── */}
          <div style={{ display:"flex", gap:10 }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                flex:1, padding:"12px", borderRadius:16, border:"none",
                background: refreshing ? "rgba(59,130,246,0.50)" : "linear-gradient(135deg,#1D4ED8,#3B82F6)",
                color:"white", fontSize:13, fontWeight:700,
                cursor: refreshing ? "not-allowed" : "pointer",
                boxShadow: refreshing ? "none" : "0 8px 24px rgba(59,130,246,0.35)",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                transition:"all 0.2s",
              }}
            >
              <RefreshCw size={14} strokeWidth={2.5}
                style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }}
              />
              {refreshing ? "Checking…" : "Check Status"}
            </button>

            <Link href="/login" style={{
              flex:1, padding:"12px", borderRadius:16,
              background:"rgba(59,130,246,0.08)",
              border:"1px solid rgba(59,130,246,0.22)",
              color:"#1D4ED8", fontSize:13, fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              textDecoration:"none", transition:"all 0.2s",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(59,130,246,0.14)"
                ;(e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)"
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(59,130,246,0.08)"
                ;(e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"
              }}
            >
              Back to Login <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>

          {/* Footer note */}
          <p style={{ textAlign:"center", fontSize:11, color:"#94A3B8", marginTop:20, lineHeight:1.6 }}>
            Need help?{" "}
            <a href="mailto:support@unicore.edu" style={{ color:"#3B82F6", fontWeight:600, textDecoration:"none" }}>
              support@unicore.edu
            </a>
            {" "}· Average approval: <strong style={{ color:"#64748B" }}>within 24 hours</strong>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring {
          0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.20); }
          50%      { box-shadow: 0 0 0 14px rgba(59,130,246,0); }
        }
        @keyframes orbit {
          from { transform: rotate(var(--start)) translateX(52px) translateY(-50%); }
          to   { transform: rotate(calc(var(--start) + 360deg)) translateX(52px) translateY(-50%); }
        }
      `}</style>
    </div>
  )
}
