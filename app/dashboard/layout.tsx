"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { clearSession } from "@/lib/auth"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    // ── Back-button block ─────────────────────────────────
    window.history.pushState(null, "", window.location.href)
    window.onpopstate = () => {
      window.history.pushState(null, "", window.location.href)
    }

    // ── Session guard — always verify with Supabase, never trust sessionStorage ─
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        clearSession()           // wipe stale sessionStorage
        router.replace("/login")
      }
    }

    checkAuth()

    return () => { window.onpopstate = null }
  }, [])

  return <>{children}</>
}
