"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SettingsPage }    from "@/components/shared/settings-page"

export default function StudentSettingsPage() {
  const me = useAuth("student")
  if (!me) return null
  return (
    <DashboardLayout role="student" userName="Student" avatarUrl={me.user?.avatar_url}
      pageTitle="Settings" pageSubtitle="Manage your preferences and account settings">
      <SettingsPage role="student" userName="Student" />
    </DashboardLayout>
  )
}
