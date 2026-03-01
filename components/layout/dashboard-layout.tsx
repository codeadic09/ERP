// components/layout/dashboard-layout.tsx
"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import { LogoutOverlay } from "./logout-overlay"

interface DashboardLayoutProps {
  children: React.ReactNode
  role: "admin" | "faculty" | "student"
  userName?: string
  avatarUrl?: string | null
  pageTitle?: string
  pageSubtitle?: string
  loading?: boolean
}

export function DashboardLayout({
  children, role, userName, avatarUrl, pageTitle, pageSubtitle, loading
}: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        role={role}
        userName={userName}
        avatarUrl={avatarUrl}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        onLogout={() => setLoggingOut(true)}
        onLogoutAll={() => setLoggingOut(true)}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, width: "100%", overflow: "hidden" }}>
        <Header
          role={role}
          userName={userName}
          avatarUrl={avatarUrl}
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          onMenuClick={() => setMobileMenuOpen(true)}
          onLogout={() => setLoggingOut(true)}
        />
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </main>
      </div>
      <LoadingOverlay visible={loading} />
      <LogoutOverlay visible={loggingOut} />
    </div>
  )
}

