// components/layout/dashboard-layout.tsx
"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { LoadingOverlay } from "@/components/ui/loading-overlay"

interface DashboardLayoutProps {
  children: React.ReactNode
  role: "admin" | "faculty" | "student"
  userName?: string
  pageTitle?: string
  pageSubtitle?: string
  loading?: boolean
}

export function DashboardLayout({
  children, role, userName, pageTitle, pageSubtitle, loading
}: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        role={role}
        userName={userName}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, width: "100%" }}>
        <Header
          role={role}
          userName={userName}
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </main>
      </div>
      <LoadingOverlay visible={loading} />
    </div>
  )
}

