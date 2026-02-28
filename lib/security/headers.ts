/**
 * Security headers for all responses.
 * Follows OWASP recommendations + modern best practices.
 */

export interface SecurityHeadersConfig {
  /** Whether to enable strict CSP (disable for dev if needed) */
  isDev?: boolean
}

export function getSecurityHeaders(config?: SecurityHeadersConfig): Record<string, string> {
  const isDev = config?.isDev ?? process.env.NODE_ENV === "development"

  return {
    // ── Strict Transport Security ──────────────────────────
    // Force HTTPS for 2 years, include subdomains, allow preload list
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",

    // ── Content Security Policy ────────────────────────────
    "Content-Security-Policy": [
      "default-src 'self'",
      // Scripts: self + inline for Next.js hydration
      `script-src 'self' ${isDev ? "'unsafe-eval' 'unsafe-inline'" : "'unsafe-inline'"}`,
      // Styles: self + inline for Tailwind/styled-components
      "style-src 'self' 'unsafe-inline'",
      // Images: self + data URIs + Supabase storage
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
      // Fonts: self + Google Fonts CDN
      "font-src 'self' data: https://fonts.gstatic.com",
      // Connect: self + Supabase APIs + Vercel Analytics
      `connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://vitals.vercel-insights.com https://va.vercel-scripts.com${isDev ? " http://localhost:*" : ""}`,
      // Frame: deny all embedding
      "frame-src 'none'",
      "frame-ancestors 'none'",
      // Object: deny Flash/Java/etc
      "object-src 'none'",
      // Base URI: prevent base-tag hijacking
      "base-uri 'self'",
      // Form action: only submit to self + Supabase auth redirects
      "form-action 'self' https://*.supabase.co",
      // Upgrade insecure requests — only in production (breaks localhost)
      ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ].filter(Boolean).join("; "),

    // ── Prevent MIME-type sniffing ─────────────────────────
    "X-Content-Type-Options": "nosniff",

    // ── Clickjacking protection ────────────────────────────
    "X-Frame-Options": "DENY",

    // ── XSS Filter (legacy browsers) ──────────────────────
    "X-XSS-Protection": "1; mode=block",

    // ── Referrer policy ────────────────────────────────────
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // ── Permissions policy (disable unused browser APIs) ───
    "Permissions-Policy": [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ].join(", "),

    // ── Prevent search engines from indexing admin areas ───
    "X-Robots-Tag": "noindex, nofollow",

    // ── Cross-Origin policies ──────────────────────────────
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    "Cross-Origin-Resource-Policy": "cross-origin",
    // NOTE: COEP require-corp is intentionally omitted — it blocks
    // Supabase and other third-party API calls that don't send CORP headers.
  }
}
