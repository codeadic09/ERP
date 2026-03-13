import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limiter"
import { sanitizeEmail, sanitizeObject, sanitizePhone } from "@/lib/security/sanitize"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  getContactSubmissionInbox,
  isContactSubmissionEmailConfigured,
  sendContactSubmissionEmail,
} from "@/lib/email/contact-submission"

const SubmissionSchema = z.object({
  formType: z.enum(["contact", "help"]),
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(320),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(5).max(5000),
  designation: z.string().trim().max(120).optional().default(""),
  university_name: z.string().trim().max(250).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  city: z.string().trim().max(120).optional().default(""),
  student_count: z.string().trim().max(60).optional().default(""),
  plan_interest: z.string().trim().max(80).optional().default(""),
  website: z.string().trim().max(200).optional().default(""),
})

const SUCCESS_MESSAGE = "✅ Thanks! We'll get back to you within 24 hours."
const ERROR_MESSAGE = "❌ Something went wrong. Please email us directly."

function getClientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown"
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json()
    const parsed = SubmissionSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json({ error: ERROR_MESSAGE }, { status: 400 })
    }

    if (parsed.data.website) {
      return NextResponse.json({ message: SUCCESS_MESSAGE })
    }

    const data = sanitizeObject(parsed.data)
    const clientIp = getClientIp(req)
    const rateLimit = checkRateLimit(`contact:${clientIp}`, RATE_LIMITS.contactSubmission)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "❌ Too many submissions. Please wait a few minutes and try again." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSec) },
        }
      )
    }

    const normalizedEmail = sanitizeEmail(data.email)
    const normalizedPhone = sanitizePhone(data.phone)

    if (data.formType === "contact") {
      if (!data.university_name || !data.designation || !normalizedPhone || !data.city || !data.student_count || !data.plan_interest) {
        return NextResponse.json({ error: ERROR_MESSAGE }, { status: 400 })
      }
    }

    const submittedAtIso = new Date().toISOString()

    const { error: insertError } = await supabaseAdmin
      .from("contact_submissions")
      .insert([
        {
          name: data.name,
          email: normalizedEmail,
          subject: data.subject,
          message: data.message,
          university_name: data.university_name || null,
          phone: normalizedPhone || null,
          city: data.city || null,
          student_count: data.student_count || null,
          plan_interest: data.plan_interest || null,
          submitted_at: submittedAtIso,
        },
      ])

    if (insertError) {
      throw insertError
    }

    const inbox = getContactSubmissionInbox()

    if (inbox && isContactSubmissionEmailConfigured()) {
      try {
        await sendContactSubmissionEmail({
          to: inbox,
          formType: data.formType,
          name: data.name,
          email: normalizedEmail,
          subject: data.subject,
          message: data.message,
          universityName: data.university_name || null,
          phone: normalizedPhone || null,
          city: data.city || null,
          studentCount: data.student_count || null,
          planInterest: data.plan_interest || null,
          submittedAt: submittedAtIso,
        })
      } catch (emailError: any) {
        console.error("[API] Contact submission email failed:", emailError?.message)
      }
    }

    return NextResponse.json({ message: SUCCESS_MESSAGE })
  } catch (error: any) {
    console.error("[API] Contact submission error:", error?.message)
    return NextResponse.json({ error: ERROR_MESSAGE }, { status: 500 })
  }
}
