import type { User } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

const SESSION_KEY = "erp_session"

export function saveSession(user: User) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function getSession(): User | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch { return null }
}

export function clearSession() {
  if (typeof window === "undefined") return
  sessionStorage.clear()
  localStorage.clear()
}

export function dashboardPath(role: string) {
  if (role === "admin")   return "/dashboard/admin"
  if (role === "faculty") return "/dashboard/faculty"
  return "/dashboard/student"
}

export async function logout() {
  const supabase = createClient()         // ✅ fresh instance, not singleton
  await supabase.auth.signOut({ scope: "global" })  // ✅ "global" clears all sessions, not just local tab
  clearSession()
}