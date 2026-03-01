"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, Users, Building2, Wallet, Bell,
  Settings, GraduationCap, BookOpen,
  ClipboardCheck, FileText, Award, Megaphone,
  LogOut, Shield, Menu, ChevronLeft, X,
  CreditCard, UserCircle, HelpCircle, MonitorSmartphone
} from "lucide-react"
import { logout, logoutAllDevices } from "@/lib/auth"

type Role       = "admin" | "faculty" | "student"
type NavItem    = { label: string; href: string; icon: any }
type NavSection = { section: string; items: NavItem[] }

const navConfig: Record<Role, NavSection[]> = {
  admin: [
    { section: "Main", items: [{ label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard }] },
    { section: "Management", items: [
      { label: "Users",          href: "/dashboard/admin/users",          icon: Users          },
      { label: "Departments",    href: "/dashboard/admin/departments",    icon: Building2      },
      { label: "Subjects",       href: "/dashboard/admin/subjects",       icon: BookOpen       },
      { label: "Registrations",  href: "/dashboard/admin/registrations",  icon: ClipboardCheck },
      { label: "Fee Control",    href: "/dashboard/admin/fees",           icon: Wallet         },
    ]},
    { section: "Communication", items: [
      { label: "Notices", href: "/dashboard/admin/notices", icon: Megaphone },
    ]},
    { section: "Account", items: [
      { label: "Profile",  href: "/dashboard/admin/profile",  icon: UserCircle },
      { label: "Settings", href: "/dashboard/admin/settings", icon: Settings   },
    ]},
  ],
  faculty: [
    { section: "Main", items: [{ label: "Overview", href: "/dashboard/faculty", icon: LayoutDashboard }] },
    { section: "Academics", items: [
      { label: "Attendance",  href: "/dashboard/faculty/attendance",  icon: ClipboardCheck },
      { label: "Assignments", href: "/dashboard/faculty/assignments", icon: FileText       },
      { label: "Results",     href: "/dashboard/faculty/results",     icon: Award          },
      { label: "My Students", href: "/dashboard/faculty/students",    icon: GraduationCap  },
    ]},
    { section: "Communication", items: [{ label: "Notices", href: "/dashboard/faculty/notices", icon: Megaphone }] },
    { section: "Account", items: [
      { label: "Profile",  href: "/dashboard/faculty/profile",  icon: UserCircle },
      { label: "Settings", href: "/dashboard/faculty/settings", icon: Settings   },
    ]},
  ],
  student: [
    { section: "Main", items: [{ label: "Overview", href: "/dashboard/student", icon: LayoutDashboard }] },
    { section: "Academics", items: [
      { label: "Attendance",    href: "/dashboard/student/attendance",    icon: ClipboardCheck },
      { label: "Registration",  href: "/dashboard/student/registration", icon: ClipboardCheck },
      { label: "Assignments",   href: "/dashboard/student/assignments",  icon: FileText       },
      { label: "Results",       href: "/dashboard/student/results",      icon: Award          },
    ]},
    { section: "Finance",       items: [{ label: "Fee Payment", href: "/dashboard/student/fees",   icon: CreditCard }] },
    { section: "Communication", items: [{ label: "Notices",     href: "/dashboard/student/notices", icon: Bell       }] },
    { section: "Account", items: [
      { label: "Profile",  href: "/dashboard/student/profile",  icon: UserCircle },
      { label: "Settings", href: "/dashboard/student/settings", icon: Settings   },
    ]},
  ],
}

const roleConfig = {
  admin:   { label: "Administrator", color: "#2563EB", bg: "rgba(37,99,235,0.08)",  border: "rgba(37,99,235,0.18)",  icon: Shield        },
  faculty: { label: "Faculty",       color: "#9333EA", bg: "rgba(147,51,234,0.08)", border: "rgba(147,51,234,0.18)", icon: BookOpen      },
  student: { label: "Student",       color: "#16A34A", bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.18)",  icon: GraduationCap },
}

export interface SidebarProps {
  role:      Role
  userName?: string
  avatarUrl?: string | null
  mobileOpen?: boolean
  onMobileClose?: () => void
  onLogout?: () => void
  onLogoutAll?: () => void
}

const EW   = 240
const CW   = 68
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)"
const DUR  = "0.3s"
const MOBILE_BP = 768

export function Sidebar({ role, userName = "User", avatarUrl, mobileOpen = false, onMobileClose, onLogout, onLogoutAll }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted,   setMounted]   = useState(false)
  const [isMobile,  setIsMobile]  = useState(false)

  useEffect(() => {
    setMounted(true)
    const check = () => setIsMobile(window.innerWidth < MOBILE_BP)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile && mobileOpen && onMobileClose) onMobileClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobile && mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isMobile, mobileOpen])

  const nav = navConfig[role]
  const rc  = roleConfig[role]
  const c   = mounted && collapsed && !isMobile

  const T     = mounted ? `all ${DUR} ${EASE}` : "none"
  const TFADE = mounted ? `opacity 0.22s ${EASE}, max-width ${DUR} ${EASE}` : "none"

  async function handleLogout() {
    if (isMobile && onMobileClose) onMobileClose()
    if (onLogout) onLogout()           // show overlay in parent
    await new Promise(r => setTimeout(r, 1200))  // let animation play
    await logout()                     // local scope — only this device
    router.replace("/login")
  }

  async function handleLogoutAll() {
    if (isMobile && onMobileClose) onMobileClose()
    if (onLogoutAll) onLogoutAll()     // show overlay in parent
    await new Promise(r => setTimeout(r, 1200))
    await logoutAllDevices()           // global scope — every device
    router.replace("/login")
  }

  function handleNavClick() {
    if (isMobile && onMobileClose) onMobileClose()
  }

  const sidebarContent = (
    <>
      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        .sb-menu-btn { animation: slideDown 0.28s ${EASE} forwards; }
        .sb-nav::-webkit-scrollbar { display: none; }
        .sb-nav { scrollbar-width: none; -ms-overflow-style: none; }
        @keyframes sb-slide-in { from{transform:translateX(-100%)} to{transform:translateX(0)} }
        @keyframes sb-fade-in  { from{opacity:0} to{opacity:1} }
      `}</style>

      <aside style={{
        width:               isMobile ? 280 : (c ? CW : EW),
        minWidth:            isMobile ? 280 : (c ? CW : EW),
        height:              "100%",
        background:          "var(--shell-bg)",
        backdropFilter:      "blur(24px)",
        WebkitBackdropFilter:"blur(24px)",
        borderRight:         "1px solid var(--shell-border)",
        boxShadow:           "var(--shell-shadow)",
        display:             "flex",
        flexDirection:       "column",
        transition:          isMobile ? "none" : T,
        flexShrink:          0,
        position:            "relative",
        zIndex:              isMobile ? 51 : 40,
        overflowX:           "hidden",
        overflowY:           "hidden",
        animation:           isMobile ? `sb-slide-in 0.25s ${EASE}` : "none",
      }}>

        {/* ── HEADER ── */}
        <div style={{
          height: 64, display: "flex", alignItems: "center",
          padding: "0 14px", borderBottom: "1px solid var(--shell-border-light)",
          flexShrink: 0, gap: 10, overflow: "hidden",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11,
            background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(59,130,246,0.28)", flexShrink: 0,
          }}>
            <GraduationCap size={19} color="white" strokeWidth={2.5} />
          </div>

          <div style={{
            overflow: "hidden", maxWidth: c ? 0 : 120, opacity: c ? 0 : 1,
            transition: TFADE, whiteSpace: "nowrap", flex: 1, minWidth: 0,
          }}>
            <p style={{ fontSize: 14, fontWeight: 900, color: "var(--shell-text)", margin: 0, lineHeight: 1.2 }}>UniCore</p>
            <p style={{ fontSize: 10, color: "var(--shell-text-muted)", margin: 0, fontWeight: 500 }}>ERP Portal</p>
          </div>

          {isMobile ? (
            <button onClick={onMobileClose} title="Close menu" style={{
              width: 32, height: 32, borderRadius: 10,
              border: "1px solid var(--shell-btn-border)",
              background: "var(--shell-btn-bg)", color: "var(--shell-text-secondary)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, padding: 0, marginLeft: "auto",
            }}>
              <X size={16} strokeWidth={2.5} />
            </button>
          ) : (
            <button
              onClick={() => setCollapsed(true)} title="Collapse"
              style={{
                width: 28, height: 28, borderRadius: 8,
                border: "1px solid var(--shell-btn-border)",
                background: "var(--shell-btn-bg)", color: "var(--shell-text-secondary)",
                cursor: c ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, opacity: c ? 0 : 1, maxWidth: c ? 0 : 28,
                overflow: "hidden", pointerEvents: c ? "none" : "auto", padding: 0,
                transition: `opacity 0.22s ${EASE}, max-width ${DUR} ${EASE}`,
              }}
              onMouseEnter={e => {
                if (!c) { const b = e.currentTarget; b.style.background="var(--shell-hover-btn-bg)"; b.style.borderColor="var(--shell-hover-btn-border)"; b.style.color="#2563EB" }
              }}
              onMouseLeave={e => {
                const b = e.currentTarget; b.style.background="var(--shell-btn-bg)"; b.style.borderColor="var(--shell-btn-border)"; b.style.color="var(--shell-text-secondary)"
              }}
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* ── EXPAND BTN (collapsed, desktop only) ── */}
        {!isMobile && (
          <div style={{
            overflow: "hidden", maxHeight: c ? 60 : 0, opacity: c ? 1 : 0,
            transition: mounted ? `max-height ${DUR} ${EASE}, opacity 0.22s ${EASE}` : "none",
            display: "flex", justifyContent: "center", flexShrink: 0,
          }}>
            <button
              key={String(collapsed)} className="sb-menu-btn"
              onClick={() => setCollapsed(false)} title="Expand"
              style={{
                width: 34, height: 34, margin: "10px 0 6px", borderRadius: 10,
                border: "1px solid var(--shell-btn-border)",
                background: "var(--shell-btn-bg)", color: "var(--shell-text-secondary)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background 0.15s, border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.background="var(--shell-hover-btn-bg)"; b.style.borderColor="var(--shell-hover-btn-border)"; b.style.color="#2563EB" }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.background="var(--shell-btn-bg)"; b.style.borderColor="var(--shell-btn-border)"; b.style.color="var(--shell-text-secondary)" }}
            >
              <Menu size={15} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* ── ROLE BADGE ── */}
        <div style={{
          padding: c ? "8px 0" : "10px 12px",
          borderBottom: "1px solid var(--shell-border-subtle)",
          display: "flex", justifyContent: c ? "center" : "flex-start",
          flexShrink: 0, transition: T, overflow: "hidden",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: c ? "8px" : "9px 11px", borderRadius: 13,
            background: rc.bg, border: `1px solid ${rc.border}`,
            transition: T, minWidth: 0, maxWidth: "100%",
          }}>
            <div style={{
              width: c ? 32 : 30, height: c ? 32 : 30,
              borderRadius: c ? 10 : 8,
              background: avatarUrl ? "transparent" : `${rc.color}18`,
              border: avatarUrl ? "none" : `1px solid ${rc.color}28`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: T, overflow: "hidden",
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <rc.icon size={c ? 15 : 14} color={rc.color} strokeWidth={2} />
              )}
            </div>
            <div style={{
              overflow: "hidden", maxWidth: c ? 0 : 150, opacity: c ? 0 : 1,
              transition: TFADE, whiteSpace: "nowrap", minWidth: 0,
            }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: "var(--shell-text-dark)", margin: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</p>
              <p style={{ fontSize: 10, color: rc.color, margin: 0, fontWeight: 700 }}>{rc.label}</p>
            </div>
          </div>
        </div>

        {/* ── NAV ── */}
        <nav className="sb-nav" style={{
          flex: 1, padding: "10px 8px", overflowY: "auto",
          overflowX: "hidden", display: "flex", flexDirection: "column", gap: 2,
        }}>
          {nav.map((section, si) => (
            <div key={si} style={{ marginBottom: 6 }}>
              <div style={{
                overflow: "hidden", maxHeight: c ? 0 : 28, opacity: c ? 0 : 1,
                marginBottom: c ? 0 : 1,
                transition: mounted ? `max-height ${DUR} ${EASE}, opacity 0.2s ${EASE}, margin ${DUR} ${EASE}` : "none",
              }}>
                <p style={{
                  fontSize: 9, fontWeight: 800, color: "var(--shell-text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  padding: "4px 10px 3px", whiteSpace: "nowrap", margin: 0,
                }}>
                  {section.section}
                </p>
              </div>

              {si > 0 && (
                <div style={{
                  height: 1, background: "var(--shell-border-divider)",
                  margin: c ? "2px 10px 6px" : "0 10px",
                  maxHeight: c ? 1 : 0, opacity: c ? 1 : 0, overflow: "hidden",
                  transition: mounted ? `max-height ${DUR} ${EASE}, opacity 0.2s ${EASE}, margin ${DUR} ${EASE}` : "none",
                }} />
              )}

              {section.items.map((item, ii) => {
                const isActive = pathname === item.href || (item.href !== `/dashboard/${role}` && pathname.startsWith(item.href))
                return (
                  <Link key={ii} href={item.href} onClick={handleNavClick}
                    title={c ? item.label : undefined}
                    style={{
                      display: "flex", alignItems: "center",
                      justifyContent: c ? "center" : "flex-start",
                      gap: 10, padding: c ? "9px 0" : (isMobile ? "11px 11px" : "8px 11px"),
                      borderRadius: 12, textDecoration: "none", transition: T,
                      background: isActive ? "linear-gradient(135deg,rgba(37,99,235,0.12),rgba(59,130,246,0.06))" : "transparent",
                      border: isActive ? "1px solid rgba(37,99,235,0.18)" : "1px solid transparent",
                      boxShadow: isActive ? "0 2px 8px rgba(37,99,235,0.08)" : "none",
                      position: "relative", marginBottom: 2,
                    }}
                    onMouseEnter={e => { if (!isActive) { const el = e.currentTarget; el.style.background="var(--shell-hover-bg)"; el.style.border="1px solid var(--shell-hover-border)" } }}
                    onMouseLeave={e => { if (!isActive) { const el = e.currentTarget; el.style.background="transparent"; el.style.border="1px solid transparent" } }}
                  >
                    <div style={{
                      position: "absolute", left: 0, top: "18%", bottom: "18%",
                      width: 3, borderRadius: "0 3px 3px 0",
                      background: "linear-gradient(to bottom, #1D4ED8, #3B82F6)",
                      opacity: isActive && !c ? 1 : 0, transition: `opacity 0.2s ${EASE}`,
                    }} />
                    <div style={{
                      width: c ? 36 : 30, height: c ? 36 : 30,
                      borderRadius: c ? 11 : 8, flexShrink: 0,
                      background: isActive ? "linear-gradient(135deg,rgba(37,99,235,0.18),rgba(59,130,246,0.10))" : c ? "var(--shell-icon-bg)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: T, border: isActive && c ? "1px solid rgba(37,99,235,0.20)" : "1px solid transparent",
                    }}>
                      <item.icon size={c ? 17 : 15} color={isActive ? "#2563EB" : "var(--shell-text-secondary)"} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span style={{
                      fontSize: isMobile ? 14 : 13, fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#1D4ED8" : "var(--shell-text-body)",
                      whiteSpace: "nowrap", overflow: "hidden",
                      maxWidth: c ? 0 : 160, opacity: c ? 0 : 1, transition: TFADE,
                    }}>
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* ── BOTTOM ── */}
        <div style={{
          padding: "10px 8px", borderTop: "1px solid var(--shell-border-light)",
          display: "flex", flexDirection: "column", gap: 3, flexShrink: 0,
          paddingBottom: isMobile ? "calc(10px + env(safe-area-inset-bottom, 0px))" : 10,
        }}>
          <Link href="/help" onClick={handleNavClick} title={c ? "Help & Support" : undefined}
            style={{
              display: "flex", alignItems: "center",
              justifyContent: c ? "center" : "flex-start",
              gap: 10, padding: c ? "9px 0" : (isMobile ? "11px 11px" : "8px 11px"),
              borderRadius: 12, textDecoration: "none",
              border: "1px solid transparent", transition: T,
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.background="var(--shell-help-hover-bg)"; el.style.border="1px solid var(--shell-help-hover-border)" }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.background="transparent"; el.style.border="1px solid transparent" }}
          >
            <div style={{
              width: c ? 36 : 30, height: c ? 36 : 30, borderRadius: c ? 11 : 8,
              flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: c ? "var(--shell-icon-bg)" : "transparent", transition: T,
            }}>
              <HelpCircle size={c ? 17 : 15} color="var(--shell-text-secondary)" strokeWidth={2} />
            </div>
            <span style={{
              fontSize: isMobile ? 14 : 13, fontWeight: 500, color: "var(--shell-text-secondary)",
              whiteSpace: "nowrap", overflow: "hidden",
              maxWidth: c ? 0 : 160, opacity: c ? 0 : 1, transition: TFADE,
            }}>
              Help & Support
            </span>
          </Link>

          <button onClick={handleLogout} title={c ? "Logout" : undefined}
            style={{
              display: "flex", alignItems: "center",
              justifyContent: c ? "center" : "flex-start",
              gap: 10, padding: c ? "9px 0" : (isMobile ? "11px 11px" : "8px 11px"),
              borderRadius: 12, border: "1px solid transparent",
              background: "transparent", cursor: "pointer", width: "100%", transition: T,
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.background="rgba(244,63,94,0.07)"; b.style.border="1px solid rgba(244,63,94,0.18)" }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.background="transparent"; b.style.border="1px solid transparent" }}
          >
            <div style={{
              width: c ? 36 : 30, height: c ? 36 : 30, borderRadius: c ? 11 : 8,
              flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: c ? "rgba(244,63,94,0.07)" : "transparent", transition: T,
            }}>
              <LogOut size={c ? 17 : 15} color="#F43F5E" strokeWidth={2} />
            </div>
            <span style={{
              fontSize: isMobile ? 14 : 13, fontWeight: 500, color: "#F43F5E",
              whiteSpace: "nowrap", overflow: "hidden",
              maxWidth: c ? 0 : 160, opacity: c ? 0 : 1, transition: TFADE,
            }}>
              Logout
            </span>
          </button>

          <button onClick={handleLogoutAll} title={c ? "Logout All Devices" : undefined}
            style={{
              display: "flex", alignItems: "center",
              justifyContent: c ? "center" : "flex-start",
              gap: 10, padding: c ? "9px 0" : (isMobile ? "11px 11px" : "8px 11px"),
              borderRadius: 12, border: "1px solid transparent",
              background: "transparent", cursor: "pointer", width: "100%", transition: T,
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.background="rgba(220,38,38,0.07)"; b.style.border="1px solid rgba(220,38,38,0.18)" }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.background="transparent"; b.style.border="1px solid transparent" }}
          >
            <div style={{
              width: c ? 36 : 30, height: c ? 36 : 30, borderRadius: c ? 11 : 8,
              flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: c ? "rgba(220,38,38,0.07)" : "transparent", transition: T,
            }}>
              <MonitorSmartphone size={c ? 17 : 15} color="#DC2626" strokeWidth={2} />
            </div>
            <span style={{
              fontSize: isMobile ? 14 : 13, fontWeight: 500, color: "#DC2626",
              whiteSpace: "nowrap", overflow: "hidden",
              maxWidth: c ? 0 : 160, opacity: c ? 0 : 1, transition: TFADE,
            }}>
              Logout All Devices
            </span>
          </button>
        </div>
      </aside>
    </>
  )

  // Mobile: overlay drawer
  if (isMobile) {
    if (!mobileOpen) return null
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", animation: `sb-fade-in 0.2s ${EASE}` }}>
        <div onClick={onMobileClose} style={{
          position: "absolute", inset: 0,
          background: "var(--shell-overlay-bg)",
          backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        }} />
        <div style={{ position: "relative", zIndex: 1, height: "100%" }}>
          {sidebarContent}
        </div>
      </div>
    )
  }

  // Desktop: inline
  return sidebarContent
}

