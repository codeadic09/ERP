"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SettingsPage }    from "@/components/shared/settings-page"

export default function AdminSettingsPage() {
  const me = useAuth("admin")
  if (!me) return null
  return (
    <DashboardLayout role="admin" userName="Dr. Admin" avatarUrl={me.user?.avatar_url}
      pageTitle="Settings" pageSubtitle="Manage your preferences and account settings">
      <SettingsPage role="admin" userName="Dr. Admin" />
    </DashboardLayout>
  )
}
