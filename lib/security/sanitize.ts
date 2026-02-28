/**
 * Input sanitization utilities.
 * Prevents XSS, SQL injection, and other injection attacks
 * at the application layer (defense-in-depth).
 */

/** Strip HTML tags from a string */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "")
}

/** Escape HTML entities to prevent XSS */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#96;",
  }
  return input.replace(/[&<>"'/`]/g, (char) => map[char] || char)
}

/** Remove null bytes (often used in injection attacks) */
export function removeNullBytes(input: string): string {
  return input.replace(/\0/g, "")
}

/** Sanitize a generic string input */
export function sanitizeString(input: string): string {
  let clean = removeNullBytes(input)
  clean = clean.trim()
  // Limit length to prevent oversized payloads
  if (clean.length > 10_000) {
    clean = clean.slice(0, 10_000)
  }
  return clean
}

/** Sanitize an email address */
export function sanitizeEmail(input: string): string {
  let clean = sanitizeString(input).toLowerCase()
  // Remove any characters that aren't valid in emails
  clean = clean.replace(/[^a-z0-9._%+\-@]/g, "")
  return clean
}

/** Sanitize a phone number */
export function sanitizePhone(input: string): string {
  // Keep only digits, +, -, spaces, and parentheses
  return sanitizeString(input).replace(/[^0-9+\-\s()]/g, "")
}

/** Validate and sanitize a UUID */
export function isValidUUID(input: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input)
}

/**
 * Deep-sanitize a plain object: recursively sanitizes all string values.
 * Does NOT handle circular references.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeString(value)
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeString(item)
          : item !== null && typeof item === "object"
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      )
    } else {
      result[key] = value
    }
  }
  return result as T
}
