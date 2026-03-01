// components/layout/header.tsx
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Bell, Search, Sun, Moon, Settings,
  ChevronDown, GraduationCap, Shield,
  BookOpen, User, LogOut, HelpCircle,
  Sparkles, X, Menu, AlertCircle, Megaphone
} from "lucide-react"
import { getNoticesByTarget } from "@/lib/db"
import type { Notice } from "@/lib/types"

interface HeaderProps {
  role: "admin" | "faculty" | "student"
  userName?: string
  avatarUrl?: string | null
  pageTitle?: string
  pageSubtitle?: string
  onMenuClick?: () => void
  onLogout?: () => void
}

const roleConfig = {
  admin:   { label: "Super Admin",          color: "#1D4ED8", bg: "linear-gradient(135deg,#1D4ED8,#3B82F6)", shadow: "rgba(59,130,246,0.40)", icon: Shield       },
  faculty: { label: "Assistant Professor",  color: "#A21CAF", bg: "linear-gradient(135deg,#D946EF,#E879F9)", shadow: "rgba(217,70,239,0.40)", icon: BookOpen     },
  student: { label: "CSE · Sem 4",          color: "#3F6212", bg: "linear-gradient(135deg,#84CC16,#A3E635)", shadow: "rgba(132,204,22,0.40)",  icon: GraduationCap},
}

// ── Helpers ──────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1)  return "Just now"
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (d < 7)  return `${d}d ago`
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

function noticeColor(n: Notice) {
  if (n.urgent)                            return "#EF4444"
  if (n.target === "Students")             return "#3B82F6"
  if (n.target === "Faculty")              return "#A855F7"
  return "#64748B"
}

const READ_KEY = "unicore_read_notices"
function getReadIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]")) }
  catch { return new Set() }
}
function saveReadIds(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]))
}

const MOBILE_BP = 768

export function Header({
  role = "student",
  userName = "Aryan Sharma",
  avatarUrl,
  pageTitle = "Dashboard",
  pageSubtitle,
  onMenuClick,
  onLogout,
}: HeaderProps) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  const [mounted, setMounted]         = useState(false)
  const [iconKey, setIconKey]         = useState(0)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [showNotifs, setShowNotifs]   = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [search, setSearch]           = useState("")
  const [searchFocus, setSearchFocus] = useState(false)
  const [isMobile, setIsMobile]       = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Ultra-smooth theme toggle handler
  const handleThemeToggle = useCallback(() => {
    const newTheme = dark ? "light" : "dark"
    setIconKey(k => k + 1) // re-trigger icon enter animation

    // Glow pulse on button
    btnRef.current?.classList.remove("theme-btn-pulse")
    void btnRef.current?.offsetWidth // force reflow
    btnRef.current?.classList.add("theme-btn-pulse")

    // View Transitions API (Chrome 111+, Edge 111+)
    if (typeof document !== "undefined" && (document as any).startViewTransition) {
      (document as any).startViewTransition(() => {
        setTheme(newTheme)
      })
    } else {
      // Fallback: CSS transition class
      document.documentElement.classList.add("theme-transitioning")
      setTheme(newTheme)
      setTimeout(() => {
        document.documentElement.classList.remove("theme-transitioning")
      }, 750)
    }
  }, [dark, setTheme])

  // ── Real notices from DB ──────────────────────────────
  const [notices, setNotices]   = useState<Notice[]>([])
  const [readIds, setReadIds]   = useState<Set<string>>(new Set())

  const targetForRole = role === "student" ? "Students" : role === "faculty" ? "Faculty" : "All"

  const fetchNotices = useCallback(async () => {
    try {
      const data = await getNoticesByTarget(targetForRole as any)
      setNotices(data.slice(0, 20)) // latest 20
    } catch { /* silent */ }
  }, [targetForRole])

  useEffect(() => {
    setReadIds(getReadIds())
    fetchNotices()
    // Refresh every 60s
    const iv = setInterval(fetchNotices, 60_000)
    return () => clearInterval(iv)
  }, [fetchNotices])

  const unread = notices.filter(n => !readIds.has(n.id)).length

  function markAllRead() {
    const next = new Set(readIds)
    notices.forEach(n => next.add(n.id))
    setReadIds(next)
    saveReadIds(next)
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BP)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const rc = roleConfig[role]

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick() { setShowNotifs(false); setShowProfile(false) }
    if (showNotifs || showProfile) {
      const timer = setTimeout(() => document.addEventListener("click", handleClick), 0)
      return () => { clearTimeout(timer); document.removeEventListener("click", handleClick) }
    }
  }, [showNotifs, showProfile])

  return (
    <header style={{
      height: isMobile ? 56 : 64,
      background: "var(--hdr-bg)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderBottom: "1px solid var(--hdr-border)",
      boxShadow: "var(--hdr-shadow)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: isMobile ? "0 12px" : "0 28px",
      position: "sticky",
      top: 0,
      zIndex: 45,
      gap: isMobile ? 8 : 16,
    }}>

      {/* ── LEFT: Menu + Title ── */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, minWidth: 0, flex: isMobile ? 1 : "unset" }}>
        {/* Hamburger on mobile */}
        {isMobile && (
          <button
            onClick={onMenuClick}
            style={{
              width: 36, height: 36, borderRadius: 10, border: "none",
              background: "rgba(59,130,246,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, color: "#3B82F6",
            }}
          >
            <Menu size={18} strokeWidth={2.5} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <h2 style={{
            fontSize: isMobile ? 15 : 17, fontWeight: 900, color: "var(--shell-text-dark)",
            lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {pageTitle}
          </h2>
          {pageSubtitle && !isMobile && (
            <p style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
              {pageSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── CENTER: Search (desktop only) ── */}
      {!isMobile && (
        <div style={{ flex: 1, maxWidth: 400, position: "relative" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 16px",
            background: searchFocus ? "var(--hdr-search-focus-bg)" : "var(--hdr-search-bg)",
            border: searchFocus ? "1px solid #3B82F6" : "1px solid var(--hdr-search-border)",
            borderRadius: 14,
            boxShadow: searchFocus ? "var(--hdr-search-ring)" : "none",
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
                fontSize: 13, color: "var(--shell-text-dark)", outline: "none",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--shell-text-muted)", display: "flex" }}>
                <X size={13} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {search.length > 1 && searchFocus && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
              background: "var(--hdr-dropdown-bg)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              border: "1px solid var(--hdr-dropdown-border)",
              borderRadius: 16, padding: 8,
              boxShadow: "var(--hdr-dropdown-shadow)", zIndex: 100,
            }}>
              {["Aryan Sharma — EN2024101", "DSA Results — Sem 4", "Attendance Report — Feb 2026"].map((item, i) => (
                <div key={i} style={{
                  padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                  fontSize: 13, color: "var(--shell-text-dark)", fontWeight: 500,
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
      )}

      {/* ── Mobile search overlay ── */}
      {isMobile && showMobileSearch && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          height: 56, zIndex: 60,
          background: "var(--hdr-mobile-search-bg)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          display: "flex", alignItems: "center", gap: 8,
          padding: "0 12px",
          boxShadow: "var(--hdr-scroll-shadow)",
        }}>
          <Search size={16} color="#3B82F6" strokeWidth={2.5} style={{ flexShrink: 0 }} />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 15, color: "var(--shell-text-dark)", outline: "none",
            }}
          />
          <button
            onClick={() => { setSearch(""); setShowMobileSearch(false) }}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "none",
              background: "var(--hdr-mobile-close-bg)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--shell-text-secondary)",
            }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* ── RIGHT: Actions ── */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 4 : 8, flexShrink: 0 }}>

        {/* Search button (mobile only) */}
        {isMobile && (
          <button
            onClick={() => setShowMobileSearch(true)}
            style={{
              width: 34, height: 34, borderRadius: 10, border: "none",
              background: "rgba(59,130,246,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#3B82F6",
            }}
          >
            <Search size={15} strokeWidth={2.5} />
          </button>
        )}

        {/* Dark mode toggle (hide on very small screens) */}
        {!isMobile && mounted && (
          <button
            ref={btnRef}
            onClick={handleThemeToggle}
            style={{
              width: 36, height: 36, borderRadius: 11, border: "none",
              background: dark ? "rgba(255,255,255,0.06)" : "var(--hdr-btn-bg)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
              color: dark ? "#A78BFA" : "#F59E0B",
              position: "relative", overflow: "hidden",
            }}
            title="Toggle theme"
          >
            <span key={iconKey} className="theme-icon-enter" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              {dark ? <Moon size={15} strokeWidth={2.5} /> : <Sun size={15} strokeWidth={2.5} />}
            </span>
          </button>
        )}

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowNotifs(p => !p); setShowProfile(false) }}
            style={{
              width: isMobile ? 34 : 36, height: isMobile ? 34 : 36, borderRadius: 11, border: "none",
              background: showNotifs ? "var(--hdr-btn-active-bg)" : "var(--hdr-btn-bg)",
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

          {showNotifs && (
            <div onClick={e => e.stopPropagation()} style={{
              position: "absolute", top: "calc(100% + 10px)",
              right: isMobile ? -60 : 0,
              width: isMobile ? "calc(100vw - 24px)" : 340,
              maxWidth: 360,
              background: "var(--hdr-dropdown-bg)",
              backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
              border: "1px solid var(--hdr-dropdown-border)",
              borderRadius: 20, overflow: "hidden",
              boxShadow: "var(--hdr-dropdown-shadow)", zIndex: 100,
            }}>
              <div style={{
                padding: "16px 18px 12px",
                borderBottom: "1px solid var(--hdr-dropdown-divider)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "var(--shell-text-dark)" }}>Notifications</p>
                  <p style={{ fontSize: 11, color: "var(--shell-text-secondary)", marginTop: 2 }}>{unread} unread</p>
                </div>
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      fontSize: 11, fontWeight: 700, color: "#3B82F6",
                      background: "rgba(59,130,246,0.10)", border: "none",
                      borderRadius: 8, padding: "4px 10px", cursor: "pointer",
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {notices.length === 0 ? (
                  <div style={{ padding: "32px 18px", textAlign: "center" }}>
                    <Bell size={24} color="#CBD5E1" style={{ margin: "0 auto 8px" }} />
                    <p style={{ fontSize: 13, color: "var(--shell-text-muted)", fontWeight: 600 }}>No notifications yet</p>
                  </div>
                ) : notices.map((n, i) => {
                  const isUnread = !readIds.has(n.id)
                  const color = noticeColor(n)
                  return (
                    <div key={n.id} style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "12px 18px",
                      borderBottom: i < notices.length - 1 ? "1px solid var(--hdr-dropdown-divider)" : "none",
                      background: isUnread ? "var(--hdr-notif-unread-bg)" : "transparent",
                      cursor: "pointer", transition: "background 0.15s",
                    }} onClick={() => {
                      const next = new Set(readIds); next.add(n.id); setReadIds(next); saveReadIds(next)
                      router.push(`/dashboard/${role}/notices`)
                      setShowNotifs(false)
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: `${color}14`, border: `1px solid ${color}28`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {n.urgent ? <AlertCircle size={14} color={color} strokeWidth={2} />
                                  : <Megaphone   size={14} color={color} strokeWidth={2} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <p style={{ fontSize: 13, fontWeight: isUnread ? 700 : 500, color: "var(--shell-text-dark)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</p>
                          {isUnread && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6", flexShrink: 0 }} />}
                        </div>
                        <p style={{ fontSize: 11, color: "var(--shell-text-secondary)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {n.body ? (n.body.length > 60 ? n.body.slice(0, 60) + "…" : n.body) : n.target}
                        </p>
                      </div>
                      <span style={{ fontSize: 10, color: "var(--shell-text-muted)", fontWeight: 600, flexShrink: 0, paddingTop: 2 }}>
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div style={{
                padding: "10px 18px",
                borderTop: "1px solid var(--hdr-dropdown-divider)",
                textAlign: "center",
              }}>
                <button
                  onClick={() => { router.push(`/dashboard/${role}/notices`); setShowNotifs(false) }}
                  style={{
                    fontSize: 12, fontWeight: 600, color: "#3B82F6",
                    background: "none", border: "none", cursor: "pointer",
                  }}
                >
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings (desktop only) */}
        {!isMobile && (
          <button
            onClick={() => router.push(`/dashboard/${role}/settings`)}
            style={{
              width: 36, height: 36, borderRadius: 11, border: "none",
              background: "var(--hdr-btn-bg)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.2s", color: "#3B82F6",
            }}>
            <Settings size={15} strokeWidth={2.5} />
          </button>
        )}

        {/* Divider (desktop only) */}
        {!isMobile && (
          <div style={{ width: 1, height: 24, background: "var(--hdr-divider)", margin: "0 4px" }} />
        )}

        {/* Profile pill */}
        <div style={{ position: "relative" }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowProfile(p => !p); setShowNotifs(false) }}
            style={{
              display: "flex", alignItems: "center", gap: isMobile ? 0 : 9,
              padding: isMobile ? "4px" : "6px 12px 6px 6px",
              background: showProfile ? "var(--hdr-pill-active-bg)" : "var(--hdr-pill-bg)",
              border: showProfile ? "1px solid var(--hdr-pill-active-border)" : "1px solid var(--hdr-pill-border)",
              borderRadius: 12, cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: showProfile ? "0 4px 12px rgba(59,130,246,0.12)" : "none",
            }}
          >
            <div style={{
              width: isMobile ? 32 : 30, height: isMobile ? 32 : 30, borderRadius: 9,
              background: avatarUrl ? "transparent" : rc.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 11, fontWeight: 800,
              boxShadow: avatarUrl ? "0 2px 8px rgba(0,0,0,0.10)" : `0 3px 10px ${rc.shadow}`,
              overflow: "hidden",
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                userName.split(" ").map(n => n[0]).join("").slice(0, 2)
              )}
            </div>
            {!isMobile && (
              <>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--shell-text-dark)", lineHeight: 1 }}>{userName.split(" ")[0]}</p>
                  <p style={{ fontSize: 10, color: "var(--shell-text-secondary)", marginTop: 1 }}>{rc.label}</p>
                </div>
                <ChevronDown
                  size={12} color="#94A3B8" strokeWidth={2.5}
                  style={{ transition: "transform 0.2s", transform: showProfile ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </>
            )}
          </button>

          {showProfile && (
            <div onClick={e => e.stopPropagation()} style={{
              position: "absolute", top: "calc(100% + 10px)",
              right: 0,
              width: isMobile ? 220 : 240,
              background: "var(--hdr-dropdown-bg)",
              backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
              border: "1px solid var(--hdr-dropdown-border)",
              borderRadius: 18, overflow: "hidden",
              boxShadow: "var(--hdr-dropdown-shadow)", zIndex: 100,
            }}>
              <div style={{
                padding: "16px 16px 12px",
                background: "var(--hdr-profile-gradient)",
                borderBottom: "1px solid var(--hdr-dropdown-divider)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: avatarUrl ? "transparent" : rc.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: 14, fontWeight: 800,
                    boxShadow: avatarUrl ? "0 2px 8px rgba(0,0,0,0.10)" : `0 4px 12px ${rc.shadow}`,
                    overflow: "hidden",
                  }}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      userName.split(" ").map(n => n[0]).join("").slice(0, 2)
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "var(--shell-text-dark)" }}>{userName}</p>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      padding: "2px 8px", borderRadius: 99,
                      background: `${rc.color}18`, color: rc.color,
                      border: `1px solid ${rc.color}30`,
                    }}>{rc.label}</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: "8px" }}>
                {[
                  { label: "My Profile", icon: User,       color: "#3B82F6", href: `/dashboard/${role}/profile`  },
                  { label: "Settings",   icon: Settings,   color: "#D946EF", href: `/dashboard/${role}/settings` },
                  { label: "Help",       icon: HelpCircle, color: "#84CC16", href: `/help`                      },
                ].map((item, i) => (
                  <button key={i}
                    onClick={() => { setShowProfile(false); router.push(item.href) }}
                    style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 10, border: "none",
                    background: "transparent", cursor: "pointer",
                    fontSize: 13, fontWeight: 500, color: "var(--shell-text-body)",
                    transition: "all 0.15s", textAlign: "left",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${item.color}0d`; e.currentTarget.style.color = item.color }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--shell-text-body)" }}
                  >
                    <item.icon size={15} strokeWidth={2} />
                    {item.label}
                  </button>
                ))}

                <div style={{ height: 1, background: "var(--hdr-dropdown-divider)", margin: "6px 0" }} />

                <button
                  onClick={() => { setShowProfile(false); onLogout?.() }}
                  style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 10, border: "none",
                  background: "transparent", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, color: "#F43F5E",
                  transition: "all 0.15s", textAlign: "left",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(244,63,94,0.08)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
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

