"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Calendar, Clock, RefreshCw, AlertTriangle,
  BookOpen, Users, Building2, GraduationCap, Layers, Info,
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getTimetableSlots, getDepartments } from "@/lib/db"
import type { TimetableSlot, Department } from "@/lib/types"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const SUBJECT_COLORS = [
  { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700",    dot: "bg-blue-500"    },
  { bg: "bg-purple-50",  border: "border-purple-200",  text: "text-purple-700",  dot: "bg-purple-500"  },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-500"   },
  { bg: "bg-pink-50",    border: "border-pink-200",    text: "text-pink-700",    dot: "bg-pink-500"    },
  { bg: "bg-cyan-50",    border: "border-cyan-200",    text: "text-cyan-700",    dot: "bg-cyan-500"    },
  { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700",     dot: "bg-red-500"     },
  { bg: "bg-indigo-50",  border: "border-indigo-200",  text: "text-indigo-700",  dot: "bg-indigo-500"  },
]

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

function fmtTime(t: string) { return t.slice(0, 5) }

// ════════════════════════════════════════════════════════════════
export default function StudentTimetablePage() {
  const authUser = useAuth("student")
  if (!authUser) return null

  const [allSlots, setAllSlots] = useState<TimetableSlot[]>([])
  const [depts, setDepts] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const me = authUser.user

  // Student's auto-detected section & semester from their profile
  const mySection  = me?.section  ?? null
  const mySemester = me?.semester ?? null

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [allDepts] = await Promise.all([getDepartments()])
      setDepts(allDepts)
      if (me?.dept_id) {
        const s = await getTimetableSlots(me.dept_id)
        setAllSlots(s)
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [me])

  useEffect(() => { if (me) load() }, [me, load])

  const myDept = useMemo(
    () => depts.find(d => d.id === me?.dept_id) ?? null,
    [depts, me]
  )

  // Auto-filter slots by student's section & semester
  const slots = useMemo(() => {
    let filtered = allSlots
    if (mySection)  filtered = filtered.filter(s => (s.section ?? "A") === mySection)
    if (mySemester) filtered = filtered.filter(s => (s.semester ?? 1) === mySemester)
    return filtered
  }, [allSlots, mySection, mySemester])

  // Available sections & semesters (for badge display if no profile match)
  const availableSections = useMemo(() =>
    [...new Set(allSlots.map(s => s.section ?? "A"))].sort(), [allSlots]
  )
  const availableSemesters = useMemo(() =>
    [...new Set(allSlots.map(s => s.semester ?? 1))].sort((a, b) => a - b), [allSlots]
  )

  // If profile doesn't have section/semester, let student pick
  const [manualSection, setManualSection] = useState<string | null>(null)
  const [manualSemester, setManualSemester] = useState<number | null>(null)

  // Final displayed slots: prefer profile, fallback to manual selection
  const displaySlots = useMemo(() => {
    if (mySection && mySemester) return slots // auto-filtered
    let filtered = allSlots
    const sec = mySection ?? manualSection
    const sem = mySemester ?? manualSemester
    if (sec) filtered = filtered.filter(s => (s.section ?? "A") === sec)
    if (sem) filtered = filtered.filter(s => (s.semester ?? 1) === sem)
    return filtered
  }, [allSlots, slots, mySection, mySemester, manualSection, manualSemester])

  const activeSec = mySection ?? manualSection
  const activeSem = mySemester ?? manualSemester

  const subjectIds = useMemo(() => [...new Set(displaySlots.map(s => s.subject_id))], [displaySlots])
  const subjectColorMap = useMemo(() => {
    const map: Record<string, typeof SUBJECT_COLORS[0]> = {}
    subjectIds.forEach((id, i) => { map[id] = SUBJECT_COLORS[i % SUBJECT_COLORS.length] })
    return map
  }, [subjectIds])

  const needsManualFilter = !mySection || !mySemester

  return (
    <DashboardLayout
      role="student"
      userName={me?.name ?? "Student"}
      avatarUrl={me?.avatar_url}
      pageTitle="Timetable"
      pageSubtitle={`${myDept?.name ?? "Department"} weekly schedule`}
      loading={loading}
    >
      <div className="p-4 sm:p-6 md:p-8 space-y-5 w-full min-w-0">
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />{error}
            <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}

        {/* ── Auto-detected info or Manual filter ────────── */}
        {!loading && (
          <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm overflow-hidden">
            <div className="h-1 bg-blue-400" />
            <CardContent className="p-4">
              {mySection && mySemester ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Semester {mySemester} · Section {mySection}
                    </p>
                    <p className="text-xs text-gray-500">
                      Showing your division&apos;s timetable automatically based on your profile.
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-100">
                      {displaySlots.length} classes/week
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">
                      Your profile doesn&apos;t have a section/semester set yet. Select below to view your division&apos;s timetable. Contact admin to update your profile for auto-detection.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {/* Semester picker */}
                    {!mySemester && availableSemesters.length > 0 && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs font-bold text-gray-600">Sem:</span>
                        {availableSemesters.map(sem => (
                          <button
                            key={sem}
                            onClick={() => setManualSemester(sem)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              manualSemester === sem
                                ? "bg-purple-600 text-white shadow-sm"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >{sem}</button>
                        ))}
                      </div>
                    )}
                    {/* Section picker */}
                    {!mySection && availableSections.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs font-bold text-gray-600">Division:</span>
                        {availableSections.map(sec => (
                          <button
                            key={sec}
                            onClick={() => setManualSection(sec)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              manualSection === sec
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >Sec {sec}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Toolbar ────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={load}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {activeSec && activeSem && (
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 font-bold">Sem {activeSem}</span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-bold">Sec {activeSec}</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-emerald-400" /> Upcoming
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Now
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-gray-300" /> Past
            </div>
          </div>
        </div>

        {/* ── Weekly Grid ────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : !activeSec && !activeSem && needsManualFilter ? (
          <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
            <CardContent className="py-16 flex flex-col items-center gap-3 text-gray-400">
              <Layers className="h-10 w-10 text-gray-200" />
              <p className="text-sm font-medium">Select your semester & division above</p>
              <p className="text-xs text-gray-300">Pick your semester and section to see your timetable.</p>
            </CardContent>
          </Card>
        ) : displaySlots.length === 0 ? (
          <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
            <CardContent className="py-16 flex flex-col items-center gap-3 text-gray-400">
              <Calendar className="h-10 w-10 text-gray-200" />
              <p className="text-sm font-medium">No timetable available yet</p>
              <p className="text-xs text-gray-300">The timetable coordinator hasn&apos;t published schedules for your division yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAYS.map((day, dayIdx) => {
              const daySlots = displaySlots
                .filter(s => s.day_of_week === dayIdx)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
              const isToday = (new Date().getDay() + 6) % 7 === dayIdx

              return (
                <Card key={day} className={`backdrop-blur-xl bg-white/70 border-white/50 shadow-sm transition-all ${isToday ? "ring-2 ring-blue-200" : ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${isToday ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                          {day.slice(0, 2)}
                        </div>
                        {day}
                        {isToday && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">TODAY</span>}
                      </CardTitle>
                      <span className="text-[10px] text-gray-400 font-medium">{daySlots.length} class{daySlots.length !== 1 ? "es" : ""}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {daySlots.length === 0 ? (
                      <div className="py-6 text-center text-gray-300">
                        <Calendar className="h-6 w-6 mx-auto mb-1 text-gray-200" />
                        <p className="text-[10px]">No classes</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {daySlots.map(slot => {
                          const sc = subjectColorMap[slot.subject_id] ?? SUBJECT_COLORS[0]
                          const now = new Date()
                          const [sh, sm] = slot.start_time.split(":").map(Number)
                          const [eh, em] = slot.end_time.split(":").map(Number)
                          const startMin = sh * 60 + sm
                          const endMin = eh * 60 + em
                          const nowMin = now.getHours() * 60 + now.getMinutes()
                          const isActive = isToday && nowMin >= startMin && nowMin < endMin
                          const isPast = isToday && nowMin >= endMin

                          return (
                            <div key={slot.id} className={`p-2.5 rounded-xl border transition-all ${sc.bg} ${sc.border} ${isActive ? "ring-1 ring-blue-300" : isPast ? "opacity-50" : ""}`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-blue-500 animate-pulse" : sc.dot}`} />
                                <span className="text-[10px] font-bold text-gray-500">{fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}</span>
                                {isActive && <span className="text-[8px] font-bold text-blue-600 bg-blue-100 px-1 py-0.5 rounded-full">NOW</span>}
                              </div>
                              <p className={`text-xs font-bold ${sc.text} truncate`}>{slot.subjects?.name ?? "—"}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-gray-400 truncate">{slot.users?.name ?? "—"}</span>
                                {slot.room && <span className="text-[10px] text-gray-400">· {slot.room}</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
