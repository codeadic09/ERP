import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UniCore ERP",
  description: "University Management System",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>

        {/* ── Floating 3D Background Shapes ── */}
        <div className="bg-shapes" aria-hidden="true">
          {/* Electric Blue */}
          <div className="shape-blue-1" />
          <div className="shape-blue-2" />
          <div className="shape-blue-3" />
          {/* Soft Magenta */}
          <div className="shape-magenta-1" />
          <div className="shape-magenta-2" />
          <div className="shape-magenta-3" />
          {/* Lime Green */}
          <div className="shape-lime-1" />
          <div className="shape-lime-2" />
          <div className="shape-lime-3" />
        </div>

        {/* ── Page Content ── */}
        <div style={{ position:"relative", zIndex:1 }}>
          {children}
        </div>

        </ThemeProvider>
      </body>
    </html>
  )
}
