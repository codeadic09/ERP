"use client"

import { useState } from "react"
import {
  Bell, Moon, Sun, Globe, Shield,
  Smartphone, Monitor, Eye, EyeOff,
  CheckCircle2, AlertTriangle, Palette,
  Lock, Mail, MessageSquare, Laptop,
  ToggleLeft, ToggleRight, ChevronRight,
  Save, Loader2, Volume2, VolumeX,
  Wifi, WifiOff
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button }  from "@/components/ui/button"
import { Label }   from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"

// ─── Types ────────────────────────────────────────────────────────
type Role = "admin" | "faculty" | "student"

interface SettingsPageProps {
  role:     Role
  userName: string
}

// ─── Toggle ───────────────────────────────────────────────────────
function Toggle({
  enabled, onChange, label, sub, icon: Icon, iconColor = "#64748B"
}: {
  enabled: boolean
  onChange: (v: boolean) => void
  label: string
  sub?: string
  icon: any
  iconColor?: string
}) {
  return (
    <div
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-3 p-3.5 rounded-xl border bg-gray-50 border-gray-100 hover:bg-gray-100 cursor-pointer select-none transition-all"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${iconColor}14`, border: `1px solid ${iconColor}28` }}>
        <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
      {/* Pill toggle */}
      <div className={`w-10 h-5 rounded-full transition-colors shrink-0 ${enabled ? "bg-blue-500" : "bg-gray-200"}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm m-0.5 transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`} />
      </div>
    </div>
  )
}

// ─── Section wrapper ─────────────────────────────────────────────
function Section({ title, icon: Icon, iconColor = "#3B82F6", children }: {
  title: string; icon: any; iconColor?: string; children: React.ReactNode
}) {
  return (
    <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${iconColor}14`, border: `1px solid ${iconColor}28` }}>
            <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2.5">
        {children}
      </CardContent>
    </Card>
  )
}

// ────────────────────────────────────────────────────────────────
export function SettingsPage({ role, userName }: SettingsPageProps) {

  // ── Notification settings ────────────────────────────────────
  const [notifs, setNotifs] = useState({
    email:       true,
    push:        true,
    sms:         false,
    notices:     true,
    assignments: role !== "admin",
    fees:        role === "student",
    results:     role === "student",
    attendance:  role !== "admin",
    sound:       true,
  })

  // ── Appearance settings ───────────────────────────────────────
  const [theme,    setTheme]    = useState<"light" | "dark" | "system">("light")
  const [language, setLanguage] = useState("en")
  const [timezone, setTimezone] = useState("Asia/Kolkata")
  const [density,  setDensity]  = useState<"comfortable" | "compact" | "spacious">("comfortable")

  // ── Privacy settings ──────────────────────────────────────────
  const [privacy, setPrivacy] = useState({
    showEmail:  false,
    showPhone:  false,
    showOnline: true,
    analytics:  true,
  })

  // ── Security settings ─────────────────────────────────────────
  const [security, setSecurity] = useState({
    twoFactor:     false,
    loginAlerts:   true,
    sessionTimeout: "30",
  })

  // ── Save ─────────────────────────────────────────────────────
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSave() {
    setSaving(true); setError(null)
    await new Promise(r => setTimeout(r, 1000))
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const roleColor = {
    admin:   "#2563EB",
    faculty: "#9333EA",
    student: "#16A34A",
  }[role]

  // ──────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full min-w-0 max-w-3xl">

      {/* ── Toasts ─────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Settings saved successfully!
        </div>
      )}

      {/* ════ NOTIFICATIONS ════ */}
      <Section title="Notifications" icon={Bell} iconColor="#F59E0B">
        <Toggle
          enabled={notifs.email} onChange={v => setNotifs(p => ({ ...p, email: v }))}
          label="Email Notifications" sub="Receive updates via email"
          icon={Mail} iconColor="#3B82F6"
        />
        <Toggle
          enabled={notifs.push} onChange={v => setNotifs(p => ({ ...p, push: v }))}
          label="Push Notifications" sub="Browser & mobile alerts"
          icon={Smartphone} iconColor="#8B5CF6"
        />
        <Toggle
          enabled={notifs.sms} onChange={v => setNotifs(p => ({ ...p, sms: v }))}
          label="SMS Alerts" sub="Text message notifications"
          icon={MessageSquare} iconColor="#10B981"
        />
        <Toggle
          enabled={notifs.sound} onChange={v => setNotifs(p => ({ ...p, sound: v }))}
          label="Notification Sounds" sub="Play sound on new notifications"
          icon={notifs.sound ? Volume2 : VolumeX} iconColor="#F59E0B"
        />

        {/* Role-specific toggles */}
        <div className="pt-1 pb-0.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">
            Notify me about
          </p>
          <div className="space-y-2">
            <Toggle
              enabled={notifs.notices} onChange={v => setNotifs(p => ({ ...p, notices: v }))}
              label="New Notices" sub="When new announcements are posted"
              icon={Bell} iconColor="#F59E0B"
            />
            {role !== "admin" && (
              <Toggle
                enabled={notifs.attendance} onChange={v => setNotifs(p => ({ ...p, attendance: v }))}
                label="Attendance Updates" sub="When attendance is marked"
                icon={CheckCircle2} iconColor="#16A34A"
              />
            )}
            {role === "student" && (
              <>
                <Toggle
                  enabled={notifs.assignments} onChange={v => setNotifs(p => ({ ...p, assignments: v }))}
                  label="Assignment Deadlines" sub="Reminders before due dates"
                  icon={ChevronRight} iconColor="#3B82F6"
                />
                <Toggle
                  enabled={notifs.results} onChange={v => setNotifs(p => ({ ...p, results: v }))}
                  label="Result Published" sub="When new results are available"
                  icon={CheckCircle2} iconColor="#6366F1"
                />
                <Toggle
                  enabled={notifs.fees} onChange={v => setNotifs(p => ({ ...p, fees: v }))}
                  label="Fee Reminders" sub="Due date and payment alerts"
                  icon={ChevronRight} iconColor="#DC2626"
                />
              </>
            )}
          </div>
        </div>
      </Section>

      {/* ════ APPEARANCE ════ */}
      <Section title="Appearance" icon={Palette} iconColor="#8B5CF6">

        {/* Theme */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Theme</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "light",  label: "Light",  icon: Sun     },
              { value: "dark",   label: "Dark",   icon: Moon    },
              { value: "system", label: "System", icon: Monitor },
            ].map(t => (
              <button key={t.value}
                onClick={() => setTheme(t.value as any)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  theme === t.value
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <t.icon className={`h-4 w-4 ${theme === t.value ? "text-blue-600" : "text-gray-400"}`} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Display density */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Display Density</Label>
          <Select value={density} onValueChange={v => setDensity(v as any)}>
            <SelectTrigger className="bg-gray-50 border-gray-100"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">Comfortable</SelectItem>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="spacious">Spacious</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <Globe className="h-3 w-3" /> Language
          </Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="bg-gray-50 border-gray-100"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
              <SelectItem value="mr">मराठी (Marathi)</SelectItem>
              <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
              <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
              <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Timezone */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="bg-gray-50 border-gray-100"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Asia/Kolkata">India Standard Time (IST, UTC+5:30)</SelectItem>
              <SelectItem value="Asia/Dubai">Gulf Standard Time (GST, UTC+4)</SelectItem>
              <SelectItem value="Europe/London">Greenwich Mean Time (GMT, UTC+0)</SelectItem>
              <SelectItem value="America/New_York">Eastern Time (ET, UTC-5)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>

      {/* ════ PRIVACY ════ */}
      <Section title="Privacy" icon={Eye} iconColor="#10B981">
        <Toggle
          enabled={privacy.showEmail} onChange={v => setPrivacy(p => ({ ...p, showEmail: v }))}
          label="Show Email to Others" sub="Visible on your public profile"
          icon={Mail} iconColor="#3B82F6"
        />
        <Toggle
          enabled={privacy.showPhone} onChange={v => setPrivacy(p => ({ ...p, showPhone: v }))}
          label="Show Phone Number" sub="Visible on your public profile"
          icon={Smartphone} iconColor="#8B5CF6"
        />
        <Toggle
          enabled={privacy.showOnline} onChange={v => setPrivacy(p => ({ ...p, showOnline: v }))}
          label="Show Online Status" sub="Let others see when you're active"
          icon={Wifi} iconColor="#10B981"
        />
        <Toggle
          enabled={privacy.analytics} onChange={v => setPrivacy(p => ({ ...p, analytics: v }))}
          label="Usage Analytics" sub="Help improve the platform"
          icon={Monitor} iconColor="#F59E0B"
        />
      </Section>

      {/* ════ SECURITY ════ */}
      <Section title="Security" icon={Shield} iconColor="#DC2626">
        <Toggle
          enabled={security.twoFactor} onChange={v => setSecurity(p => ({ ...p, twoFactor: v }))}
          label="Two-Factor Authentication" sub="Extra layer of login security"
          icon={Lock} iconColor="#DC2626"
        />
        <Toggle
          enabled={security.loginAlerts} onChange={v => setSecurity(p => ({ ...p, loginAlerts: v }))}
          label="Login Alerts" sub="Email on new device sign-in"
          icon={Laptop} iconColor="#F59E0B"
        />

        {/* Session timeout */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Auto Logout After
          </Label>
          <Select value={security.sessionTimeout}
            onValueChange={v => setSecurity(p => ({ ...p, sessionTimeout: v }))}>
            <SelectTrigger className="bg-gray-50 border-gray-100"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
              <SelectItem value="0">Never</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Danger zone */}
        <div className="mt-2 p-4 rounded-xl bg-red-50 border border-red-100 space-y-3">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Danger Zone</p>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-red-800">Delete Account</p>
              <p className="text-xs text-red-500">Permanently remove all your data</p>
            </div>
            <Button variant="outline" size="sm"
              className="shrink-0 text-red-600 border-red-200 hover:bg-red-50 text-xs">
              Delete
            </Button>
          </div>
        </div>
      </Section>

      {/* ── Save button ────────────────────────────────────── */}
      <div className="flex justify-end pb-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 px-8"
          style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)` }}
        >
          {saving
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            : <><Save    className="h-4 w-4" /> Save Settings</>
          }
        </Button>
      </div>

    </div>
  )
}
