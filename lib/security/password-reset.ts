import "server-only"

import crypto from "crypto"
import { supabaseAdmin } from "@/lib/supabase/admin"

export const RESET_TOKEN_TTL_MS = 15 * 60 * 1000
export const RESET_TOKEN_TTL_MINUTES = 15

interface PasswordResetTokenRow {
  id: string
  user_id: string
  expires_at: string
  used_at: string | null
}

interface PasswordResetUser {
  id: string
  email: string
  name: string | null
}

export interface PasswordResetLookup {
  status: "valid" | "expired" | "missing"
  record?: PasswordResetTokenRow & { user: PasswordResetUser }
}

export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex")
}

export function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function isResetTokenFormat(token: string) {
  return /^[a-f0-9]{64}$/i.test(token)
}

export async function createPasswordResetToken(
  userId: string,
  requestedFromIp: string | null
) {
  const token = generateResetToken()
  const tokenHash = hashResetToken(token)
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString()

  await supabaseAdmin
    .from("password_reset_tokens")
    .delete()
    .eq("user_id", userId)
    .is("used_at", null)

  const { data, error } = await supabaseAdmin
    .from("password_reset_tokens")
    .insert([{ user_id: userId, token_hash: tokenHash, expires_at: expiresAt, requested_from_ip: requestedFromIp }])
    .select("id")
    .single()

  if (error || !data) {
    throw error ?? new Error("Failed to create password reset token")
  }

  return { token, tokenId: data.id as string, expiresAt }
}

export async function deletePasswordResetToken(tokenId: string) {
  await supabaseAdmin
    .from("password_reset_tokens")
    .delete()
    .eq("id", tokenId)
}

export async function getPasswordResetLookup(token: string): Promise<PasswordResetLookup> {
  if (!isResetTokenFormat(token)) {
    return { status: "missing" }
  }

  const tokenHash = hashResetToken(token)
  const { data: tokenRow, error: tokenError } = await supabaseAdmin
    .from("password_reset_tokens")
    .select("id, user_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle<PasswordResetTokenRow>()

  if (tokenError) throw tokenError
  if (!tokenRow || tokenRow.used_at) {
    return { status: "missing" }
  }

  if (new Date(tokenRow.expires_at).getTime() <= Date.now()) {
    return { status: "expired" }
  }

  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, email, name")
    .eq("id", tokenRow.user_id)
    .maybeSingle<PasswordResetUser>()

  if (userError) throw userError
  if (!user) {
    return { status: "missing" }
  }

  return {
    status: "valid",
    record: {
      ...tokenRow,
      user,
    },
  }
}

export async function invalidatePasswordResetTokens(userId: string) {
  const usedAt = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from("password_reset_tokens")
    .update({ used_at: usedAt })
    .eq("user_id", userId)
    .is("used_at", null)

  if (error) throw error
}

export async function findAuthUserByEmail(email: string) {
  let page = 1

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error

    const user = data.users.find((entry) => entry.email?.toLowerCase() === email.toLowerCase())
    if (user) return user

    if (data.users.length < 200) break
    page++
  }

  return null
}