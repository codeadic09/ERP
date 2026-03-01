import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

const BUCKET = "avatars"
const MAX_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file   = form.get("file")   as File | null
    const userId = form.get("userId") as string | null

    if (!file || !userId)
      return NextResponse.json({ error: "Missing file or userId" }, { status: 400 })

    if (!ALLOWED.includes(file.type))
      return NextResponse.json({ error: "Only JPEG, PNG, WebP and GIF allowed" }, { status: 400 })

    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: "File must be under 2 MB" }, { status: 400 })

    // Ensure bucket exists (idempotent — ignores "already exists" error)
    await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE,
      allowedMimeTypes: ALLOWED,
    }).catch(() => {})

    const ext  = file.name.split(".").pop() ?? "jpg"
    const path = `${userId}/avatar.${ext}`

    // Remove old file if exists (ignore errors)
    await supabaseAdmin.storage.from(BUCKET).remove([path]).catch(() => {})

    // Upload new avatar
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(path)

    // Save avatar_url to users table
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .update({ avatar_url: publicUrl })
      .eq("id", userId)

    if (dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })

    return NextResponse.json({ url: publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Upload failed" }, { status: 500 })
  }
}
