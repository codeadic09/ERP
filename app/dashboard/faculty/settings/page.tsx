"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SettingsPage }    from "@/components/shared/settings-page"

export default function FacultySettingsPage() {
  const me = useAuth("faculty")
  if (!me) return null
  return (
    <DashboardLayout role="faculty" userName="Faculty" avatarUrl={me.user?.avatar_url}
      pageTitle="Settings" pageSubtitle="Manage your preferences and account settings">
      <SettingsPage role="faculty" userName="Faculty" />
    </DashboardLayout>
  )
}
