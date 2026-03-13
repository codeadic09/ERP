import "server-only"

import nodemailer from "nodemailer"

interface PasswordResetEmailArgs {
  to: string
  name?: string | null
  resetUrl: string
  expiresInMinutes: number
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

export function isPasswordResetEmailConfigured() {
  return getMailerConfig() !== null
}

export async function sendPasswordResetEmail(args: PasswordResetEmailArgs) {
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

  const greetingName = args.name?.trim() || "there"
  const subject = "Reset your InfiCampus password"
  const text = [
    `Hello ${greetingName},`,
    "",
    "We received a request to reset your InfiCampus password.",
    `Use the link below within ${args.expiresInMinutes} minutes:`,
    args.resetUrl,
    "",
    "If you did not request this, you can safely ignore this email.",
  ].join("\n")

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;background:#f8fafc;padding:32px;color:#0f172a">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:32px">
        <p style="margin:0 0 12px;font-size:14px;color:#475569">InfiCampus Account Security</p>
        <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2">Reset your password</h1>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.7">Hello ${greetingName},</p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.7">We received a request to reset your InfiCampus password. This link stays active for ${args.expiresInMinutes} minutes.</p>
        <p style="margin:0 0 24px">
          <a href="${args.resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#0f766e,#2563eb);color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px">Reset Password</a>
        </p>
        <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#475569">If the button does not open, paste this URL into your browser:</p>
        <p style="margin:0 0 20px;font-size:13px;line-height:1.7;word-break:break-all;color:#0f172a">${args.resetUrl}</p>
        <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b">If you did not request this reset, you can ignore this email. Your password will stay unchanged.</p>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: config.from,
    to: args.to,
    subject,
    text,
    html,
  })
}