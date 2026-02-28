"use client"

import { useEffect, useState } from "react"
import { useRouter }           from "next/navigation"
import type { User }           from "@/lib/types"
import { createClient }        from "@/lib/supabase/client"
import { getUserByEmail }      from "@/lib/db"
import { saveSession, clearSession, dashboardPath } from "@/lib/auth"

interface UseAuthReturn {
  user: User | null
  loading: boolean
}

export function useAuth(requiredRole?: "admin" | "faculty" | "student"): UseAuthReturn {
  const router                = useRouter()
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const supabase = createClient()

      // ✅ Always ask Supabase who is ACTUALLY logged in — never trust sessionStorage alone
      const { data: { user: authUser }, error } = await supabase.auth.getUser()

      if (error || !authUser) {
        // No valid Supabase session — clear stale storage and send to login
        clearSession()
        router.replace("/login")
        setLoading(false)
        return
      }

      // ✅ Fetch the real profile from DB using the verified Supabase email
      const profile = await getUserByEmail(authUser.email!)

      if (!profile) {
        clearSession()
        await supabase.auth.signOut()
        router.replace("/login")
        setLoading(false)
        return
      }

      // ✅ Role mismatch — redirect to correct dashboard
      if (requiredRole && profile.role !== requiredRole) {
        router.replace(dashboardPath(profile.role))
        setLoading(false)
        return
      }

      // ✅ Save fresh profile to sessionStorage and set user
      saveSession(profile)
      setUser(profile)
      setLoading(false)
    }

    init()
  }, [])

  return { user, loading }
}
