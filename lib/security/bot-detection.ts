/**
 * Bot-detection heuristics for middleware.
 * Blocks known bad bots, crawlers, and suspicious automated traffic.
 */

/** Known malicious / unwanted bot user-agent patterns (case-insensitive) */
const BAD_BOT_PATTERNS: RegExp[] = [
  /curl/i,
  /wget/i,
  /python-requests/i,
  /python-urllib/i,
  /httpie/i,
  /go-http-client/i,
  /java\//i,
  /libwww-perl/i,
  /mechanize/i,
  /scrapy/i,
  /httpclient/i,
  /aiohttp/i,
  /axios\/\d/i,          // server-side axios (not browser)
  /node-fetch/i,
  /undici/i,
  /postmanruntime/i,
  /insomnia/i,
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /masscan/i,
  /zgrab/i,
  /gobuster/i,
  /dirbuster/i,
  /semrush/i,
  /ahrefsbot/i,
  /mj12bot/i,
  /dotbot/i,
  /blexbot/i,
  /bytespider/i,
  /petalbot/i,
  /yandexbot/i,
  /baiduspider/i,
  /sogou/i,
]

/** Paths that attackers commonly probe for */
const HONEYPOT_PATHS = [
  "/wp-admin",
  "/wp-login",
  "/wp-content",
  "/xmlrpc.php",
  "/administrator",
  "/phpmyadmin",
  "/phpMyAdmin",
  "/.env",
  "/.git",
  "/.git/config",
  "/config.php",
  "/wp-includes",
  "/eval-stdin.php",
  "/vendor/phpunit",
  "/.aws",
  "/.docker",
  "/actuator",
  "/solr",
  "/console",
  "/manager",
  "/shell",
  "/cgi-bin",
  "/debug",
  "/server-status",
  "/backup",
  "/.svn",
  "/.htaccess",
  "/.htpasswd",
  "/web.config",
]

/** SQL injection patterns in URL */
const SQL_INJECTION_PATTERNS: RegExp[] = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  /(union|select|insert|update|delete|drop|alter|create|exec)\s/i,
]

/** XSS patterns in URL */
const XSS_PATTERNS: RegExp[] = [
  /<script[^>]*>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /(<|%3C).*?(>|%3E)/i,
]

/** Path traversal patterns */
const PATH_TRAVERSAL_PATTERNS: RegExp[] = [
  /\.\.\//,
  /\.\.\\/, 
  /%2e%2e/i,
  /%252e%252e/i,
]

export interface BotDetectionResult {
  isBot: boolean
  reason: string
}

export function detectBot(
  userAgent: string | null,
  pathname: string,
  url: string
): BotDetectionResult {
  // 1. Missing or empty User-Agent
  if (!userAgent || userAgent.trim().length === 0) {
    return { isBot: true, reason: "missing-user-agent" }
  }

  // 2. Extremely short user-agent (likely automated)
  if (userAgent.length < 10) {
    return { isBot: true, reason: "suspicious-short-ua" }
  }

  // 3. Known bad bot user-agents
  for (const pattern of BAD_BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      return { isBot: true, reason: `bad-bot-ua:${pattern.source}` }
    }
  }

  // 4. Honeypot path probing
  const lowerPath = pathname.toLowerCase()
  for (const hp of HONEYPOT_PATHS) {
    if (lowerPath.startsWith(hp.toLowerCase())) {
      return { isBot: true, reason: `honeypot:${hp}` }
    }
  }

  // 5. SQL injection in URL
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(url)) {
      return { isBot: true, reason: "sql-injection-attempt" }
    }
  }

  // 6. XSS attempts in URL
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(url)) {
      return { isBot: true, reason: "xss-attempt" }
    }
  }

  // 7. Path traversal attempts
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(pathname) || pattern.test(url)) {
      return { isBot: true, reason: "path-traversal-attempt" }
    }
  }

  return { isBot: false, reason: "" }
}
