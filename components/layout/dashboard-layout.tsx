// components/layout/dashboard-layout.tsx
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
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role={role} userName={userName} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header
          role={role}
          userName={userName}
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
        />
        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </div>
      <LoadingOverlay visible={loading} />
    </div>
  )
}
