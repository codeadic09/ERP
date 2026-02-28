/**
 * Server-side admin auth guard for API routes.
 * Verifies the caller is an authenticated admin user.
 */

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export interface AuthResult {
  authorized: boolean
  userId?: string
  role?: string
  error?: string
}

/**
 * Verify the current request is from an authenticated admin.
 * Uses the Supabase session cookie — never trusts client-side claims.
 */
export async function requireAdmin(req: NextRequest): Promise<AuthResult> {
  try {
    // 1. Create server-side Supabase client with session cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: () => {}, // read-only in API routes
        },
      }
    )

    // 2. Get the authenticated user (server-verified, not client-claimed)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { authorized: false, error: "Not authenticated" }
    }

    // 3. Fetch user's role from the database (never trust JWT claims alone)
    const { data: profile, error: dbError } = await supabaseAdmin
      .from("users")
      .select("id, role, status")
      .eq("email", user.email)
      .single()

    if (dbError || !profile) {
      return { authorized: false, error: "User profile not found" }
    }

    // 4. Check the user is an active admin
    if (profile.role !== "admin") {
      return { authorized: false, userId: profile.id, role: profile.role, error: "Admin access required" }
    }

    if (profile.status !== "active") {
      return { authorized: false, userId: profile.id, role: profile.role, error: "Account is inactive" }
    }

    return { authorized: true, userId: profile.id, role: profile.role }
  } catch (err) {
    return { authorized: false, error: "Auth verification failed" }
  }
}

/**
 * Verify the current request is from any authenticated user.
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { authorized: false, error: "Not authenticated" }
    }

    const { data: profile, error: dbError } = await supabaseAdmin
      .from("users")
      .select("id, role, status")
      .eq("email", user.email)
      .single()

    if (dbError || !profile) {
      return { authorized: false, error: "User profile not found" }
    }

    if (profile.status !== "active") {
      return { authorized: false, userId: profile.id, role: profile.role, error: "Account is inactive" }
    }

    return { authorized: true, userId: profile.id, role: profile.role }
  } catch (err) {
    return { authorized: false, error: "Auth verification failed" }
  }
}

/** Helper to return a 401/403 JSON response */
export function unauthorizedResponse(message: string, status: number = 403) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Content-Type": "application/json" } }
  )
}
