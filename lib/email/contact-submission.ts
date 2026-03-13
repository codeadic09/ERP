import "server-only"

import nodemailer from "nodemailer"

interface ContactSubmissionEmailArgs {
  to: string
  formType: "contact" | "help"
  name: string
  email: string
  subject: string
  message: string
  universityName?: string | null
  phone?: string | null
  city?: string | null
  studentCount?: string | null
  planInterest?: string | null
  submittedAt: string
}

function getMailerConfig() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM

  if (!host || !user || !pass || !from) {
    return null
  }

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
    from,
  }
}

export function isContactSubmissionEmailConfigured() {
  return getMailerConfig() !== null
}

export function getContactSubmissionInbox() {
  return process.env.CONTACT_SUBMISSIONS_TO || process.env.SMTP_FROM || null
}

export async function sendContactSubmissionEmail(args: ContactSubmissionEmailArgs) {
  const config = getMailerConfig()

  if (!config) {
    throw new Error("SMTP configuration is missing")
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  })

  const formLabel = args.formType === "contact" ? "Custom Setup / Demo Request" : "Help / Support Message"
  const emailSubject = `[ERP] ${formLabel}: ${args.subject}`

  const textLines = [
    `Form: ${formLabel}`,
    `Submitted At: ${args.submittedAt}`,
    `Name: ${args.name}`,
    `Email: ${args.email}`,
    `Phone: ${args.phone || "-"}`,
    `University: ${args.universityName || "-"}`,
    `City: ${args.city || "-"}`,
    `Student Count: ${args.studentCount || "-"}`,
    `Plan Interest: ${args.planInterest || "-"}`,
    "",
    `Subject: ${args.subject}`,
    "",
    "Message:",
    args.message,
  ]

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px">
        <h2 style="margin:0 0 12px;font-size:22px">${formLabel}</h2>
        <p style="margin:0 0 20px;color:#475569">New form submission received.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#64748b">Submitted At</td><td style="padding:6px 0;font-weight:600">${args.submittedAt}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Name</td><td style="padding:6px 0;font-weight:600">${args.name}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0;font-weight:600">${args.email}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Phone</td><td style="padding:6px 0;font-weight:600">${args.phone || "-"}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">University</td><td style="padding:6px 0;font-weight:600">${args.universityName || "-"}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">City</td><td style="padding:6px 0;font-weight:600">${args.city || "-"}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Student Count</td><td style="padding:6px 0;font-weight:600">${args.studentCount || "-"}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Plan Interest</td><td style="padding:6px 0;font-weight:600">${args.planInterest || "-"}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Subject</td><td style="padding:6px 0;font-weight:600">${args.subject}</td></tr>
        </table>
        <div style="margin-top:16px;padding:12px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc">
          <p style="margin:0 0 8px;color:#64748b;font-size:13px">Message</p>
          <p style="margin:0;line-height:1.6;white-space:pre-wrap">${args.message}</p>
        </div>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: config.from,
    to: args.to,
    replyTo: args.email,
    subject: emailSubject,
    text: textLines.join("\n"),
    html,
  })
}
