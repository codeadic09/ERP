// components/layout/header.tsx
"use client"

import { useState } from "react"
import {
  Bell, Search, Sun, Moon, Settings,
  ChevronDown, GraduationCap, Shield,
  BookOpen, User, LogOut, HelpCircle,
  Sparkles, X
} from "lucide-react"

interface HeaderProps {
  role: "admin" | "faculty" | "student"
  userName?: string
  pageTitle?: string
  pageSubtitle?: string
}

const roleConfig = {
  admin:   { label: "Super Admin",          color: "#1D4ED8", bg: "linear-gradient(135deg,#1D4ED8,#3B82F6)", shadow: "rgba(59,130,246,0.40)", icon: Shield       },
  faculty: { label: "Assistant Professor",  color: "#A21CAF", bg: "linear-gradient(135deg,#D946EF,#E879F9)", shadow: "rgba(217,70,239,0.40)", icon: BookOpen     },
  student: { label: "CSE · Sem 4",          color: "#3F6212", bg: "linear-gradient(135deg,#84CC16,#A3E635)", shadow: "rgba(132,204,22,0.40)",  icon: GraduationCap},
}

const notifications = [
  { title: "New result published",     sub: "Semester 4 — CSE",          time: "5m ago",  color: "#3B82F6", dot: true  },
  { title: "Attendance marked",        sub: "DSA — Feb 27",               time: "1h ago",  color: "#84CC16", dot: true  },
  { title: "Fee payment reminder",     sub: "Due: March 15",              time: "2h ago",  color: "#FBBF24", dot: true  },
  { title: "Assignment deadline today",sub: "Software Engg — Unit 4",     time: "3h ago",  color: "#D946EF", dot: false },
  { title: "Exam schedule released",   sub: "End-sem May 2026",           time: "1d ago",  color: "#F43F5E", dot: false },
]

export function Header({
  role = "student",
  userName = "Aryan Sharma",
  pageTitle = "Dashboard",
  pageSubtitle,
}: HeaderProps) {
  const [dark, setDark]               = useState(false)
  const [showNotifs, setShowNotifs]   = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [search, setSearch]           = useState("")
  const [searchFocus, setSearchFocus] = useState(false)

  const rc = roleConfig[role]
  const unread = notifications.filter(n => n.dot).length

  return (
    <header style={{
      height: 64,
      background: "rgba(255,255,255,0.72)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderBottom: "1px solid rgba(255,255,255,0.62)",
      boxShadow: "0 2px 16px rgba(59,130,246,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      position: "sticky",
      top: 0,
      zIndex: 50,
      gap: 16,
    }}>

      {/* ── LEFT: Page Title ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div>
          <h2 style={{
            fontSize: 17, fontWeight: 900, color: "#1E293B",
            lineHeight: 1, whiteSpace: "nowrap",
          }}>
            {pageTitle}
          </h2>
          {pageSubtitle && (
            <p style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
              {pageSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── CENTER: Search ── */}
      <div style={{
        flex: 1, maxWidth: 400,
        position: "relative",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 16px",
          background: searchFocus ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.72)",
          border: searchFocus
            ? "1px solid #3B82F6"
            : "1px solid rgba(255,255,255,0.62)",
          borderRadius: 14,
          boxShadow: searchFocus ? "0 0 0 4px rgba(59,130,246,0.12)" : "none",
          transition: "all 0.2s",
        }}>
          <Search size={15} color={searchFocus ? "#3B82F6" : "#94A3B8"} strokeWidth={2.5} style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            placeholder="Search students, subjects, results…"
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 13, color: "#1E293B", outline: "none",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex" }}>
              <X size={13} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Search dropdown */}
        {search.length > 1 && searchFocus && (
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.65)",
            borderRadius: 16, padding: 8,
            boxShadow: "0 8px 32px rgba(59,130,246,0.16)",
            zIndex: 100,
          }}>
            {["Aryan Sharma — EN2024101", "DSA Results — Sem 4", "Attendance Report — Feb 2026"].map((item, i) => (
              <div key={i} style={{
                padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                fontSize: 13, color: "#1E293B", fontWeight: 500,
                display: "flex", alignItems: "center", gap: 10,
                transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,130,246,0.07)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <Sparkles size={13} color="#3B82F6" strokeWidth={2} />
                {item}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT: Actions ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

        {/* Dark mode toggle */}
        <button
          onClick={() => setDark(p => !p)}
          style={{
            width: 36, height: 36, borderRadius: 11, border: "none",
            background: dark ? "rgba(30,27,75,0.12)" : "rgba(59,130,246,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.2s",
            color: dark ? "#A78BFA" : "#3B82F6",
          }}
          title="Toggle theme"
        >
          {dark ? <Moon size={15} strokeWidth={2.5} /> : <Sun size={15} strokeWidth={2.5} />}
        </button>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => { setShowNotifs(p => !p); setShowProfile(false) }}
            style={{
              width: 36, height: 36, borderRadius: 11, border: "none",
              background: showNotifs ? "rgba(59,130,246,0.14)" : "rgba(59,130,246,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.2s", position: "relative",
            }}
          >
            <Bell size={15} color="#3B82F6" strokeWidth={2.5} />
            {unread > 0 && (
              <span style={{
                position: "absolute", top: 5, right: 5,
                width: 8, height: 8, borderRadius: "50%",
                background: "#F43F5E",
                border: "1.5px solid rgba(255,255,255,0.90)",
              }} />
            )}
          </button>

          {/* Notif dropdown */}
          {showNotifs && (
            <div style={{
              position: "absolute", top: "calc(100% + 10px)", right: 0,
              width: 340,
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.65)",
              borderRadius: 20, overflow: "hidden",
              boxShadow: "0 16px 48px rgba(59,130,246,0.18)",
              zIndex: 100,
            }}>
              {/* Header */}
              <div style={{
                padding: "16px 18px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.55)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#1E293B" }}>Notifications</p>
                  <p style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{unread} unread</p>
                </div>
                <button style={{
                  fontSize: 11, fontWeight: 700, color: "#3B82F6",
                  background: "rgba(59,130,246,0.10)", border: "none",
                  borderRadius: 8, padding: "4px 10px", cursor: "pointer",
                }}>
                  Mark all read
                </button>
              </div>

              {/* List */}
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {notifications.map((n, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 18px",
                    borderBottom: i < notifications.length - 1
                      ? "1px solid rgba(255,255,255,0.50)"
                      : "none",
                    background: n.dot ? "rgba(59,130,246,0.03)" : "transparent",
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,130,246,0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.background = n.dot ? "rgba(59,130,246,0.03)" : "transparent")}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: `${n.color}14`,
                      border: `1px solid ${n.color}28`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Bell size={14} color={n.color} strokeWidth={2} />
                    </div>
                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", lineHeight: 1.2 }}>
                          {n.title}
                        </p>
                        {n.dot && (
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6", flexShrink: 0 }} />
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>{n.sub}</p>
                    </div>
                    <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, flexShrink: 0, paddingTop: 2 }}>
                      {n.time}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{
                padding: "10px 18px",
                borderTop: "1px solid rgba(255,255,255,0.55)",
                textAlign: "center",
              }}>
                <button style={{
                  fontSize: 12, fontWeight: 600, color: "#3B82F6",
                  background: "none", border: "none", cursor: "pointer",
                }}>
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button style={{
          width: 36, height: 36, borderRadius: 11, border: "none",
          background: "rgba(59,130,246,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.2s", color: "#3B82F6",
        }}>
          <Settings size={15} strokeWidth={2.5} />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.60)", margin: "0 4px" }} />

        {/* Profile pill */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => { setShowProfile(p => !p); setShowNotifs(false) }}
            style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "6px 12px 6px 6px",
              background: showProfile ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.72)",
              border: showProfile
                ? "1px solid rgba(59,130,246,0.28)"
                : "1px solid rgba(255,255,255,0.62)",
              borderRadius: 12, cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: showProfile ? "0 4px 12px rgba(59,130,246,0.12)" : "none",
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: rc.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 11, fontWeight: 800,
              boxShadow: `0 3px 10px ${rc.shadow}`,
            }}>
              {userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#1E293B", lineHeight: 1 }}>
                {userName.split(" ")[0]}
              </p>
              <p style={{ fontSize: 10, color: "#64748B", marginTop: 1 }}>
                {rc.label}
              </p>
            </div>
            <ChevronDown
              size={12} color="#94A3B8" strokeWidth={2.5}
              style={{ transition: "transform 0.2s", transform: showProfile ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>

          {/* Profile dropdown */}
          {showProfile && (
            <div style={{
              position: "absolute", top: "calc(100% + 10px)", right: 0,
              width: 240,
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.65)",
              borderRadius: 18, overflow: "hidden",
              boxShadow: "0 16px 48px rgba(59,130,246,0.18)",
              zIndex: 100,
            }}>
              {/* Top */}
              <div style={{
                padding: "16px 16px 12px",
                background: "linear-gradient(135deg,rgba(29,78,216,0.06),rgba(59,130,246,0.04))",
                borderBottom: "1px solid rgba(255,255,255,0.55)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: rc.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: 14, fontWeight: 800,
                    boxShadow: `0 4px 12px ${rc.shadow}`,
                  }}>
                    {userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#1E293B" }}>{userName}</p>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      padding: "2px 8px", borderRadius: 99,
                      background: `${rc.color}18`,
                      color: rc.color,
                      border: `1px solid ${rc.color}30`,
                    }}>{rc.label}</span>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: "8px" }}>
                {[
                  { label: "My Profile",  icon: User,        color: "#3B82F6"  },
                  { label: "Settings",    icon: Settings,    color: "#D946EF"  },
                  { label: "Help",        icon: HelpCircle,  color: "#84CC16"  },
                ].map((item, i) => (
                  <button key={i} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 10, border: "none",
                    background: "transparent", cursor: "pointer",
                    fontSize: 13, fontWeight: 500, color: "#334155",
                    transition: "all 0.15s", textAlign: "left",
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = `${item.color}0d`
                      ;(e.currentTarget as HTMLButtonElement).style.color = item.color
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent"
                      ;(e.currentTarget as HTMLButtonElement).style.color = "#334155"
                    }}
                  >
                    <item.icon size={15} strokeWidth={2} />
                    {item.label}
                  </button>
                ))}

                <div style={{ height: 1, background: "rgba(255,255,255,0.55)", margin: "6px 0" }} />

                <button style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 10, border: "none",
                  background: "transparent", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, color: "#F43F5E",
                  transition: "all 0.15s", textAlign: "left",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(244,63,94,0.08)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                >
                  <LogOut size={15} strokeWidth={2} />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
