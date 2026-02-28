"use client"

import { useAuth }        from "@/lib/hooks/useAuth"
import { useState, useEffect, useMemo } from "react"
import {
  BookOpen, CheckCircle2, Clock, XCircle,
  AlertTriangle, Loader2, RefreshCw, GraduationCap,
} from "lucide-react"
import { DashboardLayout }  from "@/components/layout/dashboard-layout"
import { Button }           from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  getSubjectsByDept, getRegistrationsByStudent,
  addRegistration, deleteRegistration, updateUserSemester,
  getFacultySubjects,
} from "@/lib/db"
import type { Subject, Registration, FacultySubject } from "@/lib/types"

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

const statusStyle = {
  pending:  { label: "Pending",  bg: "bg-amber-50",   text: "text-amber-600",  icon: Clock        },
  approved: { label: "Approved", bg: "bg-emerald-50", text: "text-emerald-700",icon: CheckCircle2 },
  rejected: { label: "Rejected", bg: "bg-red-50",     text: "text-red-600",    icon: XCircle      },
}

export default function StudentRegistrationPage() {
  const me = useAuth("student")
  if (!me) return null

  const [subjects,      setSubjects]      = useState<Subject[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [fsLinks,       setFsLinks]       = useState<FacultySubject[]>([])
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState<string | null>(null)
  const [error,         setError]         = useState<string | null>(null)
  const [semester,      setSemester]      = useState<string>(
    me.user?.semester ? String(me.user.semester) : ""
  )

  // Sync semester when auth user loads
  useEffect(() => {
    if (me.user?.semester) setSemester(String(me.user.semester))
  }, [me.user])

  async function load(sem?: string) {
    if (!me.user?.dept_id) return
    setLoading(true)
    setError(null)
    try {
      const [subs, regs, fs] = await Promise.all([
        getSubjectsByDept(me.user.dept_id),
        getRegistrationsByStudent(me.user.id),
        getFacultySubjects(),
      ])
      setSubjects(subs)
      setRegistrations(regs)
      setFsLinks(fs)
    } catch (e: any) {
      setError(e.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (me.user) load() }, [me.user])

  async function handleSemesterChange(val: string) {
    setSemester(val)
    try {
      await updateUserSemester(me.user!.id, parseInt(val))
    } catch (e: any) {
      setError(e.message)
    }
  }

  // Subjects filtered by selected semester
  const semesterSubjects = useMemo(() => {
    if (!semester) return []
    return subjects.filter(s => s.semester === parseInt(semester))
  }, [subjects, semester])

  // Map subject_id → registration
  const regMap = useMemo(() => {
    const map: Record<string, Registration> = {}
    registrations.forEach(r => {
      const subjectId = typeof r.subjects === "object" && r.subjects
        ? (r.subjects as any).id
        : r.subject_id
      map[subjectId] = r
    })
    return map
  }, [registrations])

  async function handleRegister(subjectId: string) {
    setSaving(subjectId)
    try {
      await addRegistration(me.user!.id, subjectId)
      // Reload full list to get joined data
      const regs = await getRegistrationsByStudent(me.user!.id)
      setRegistrations(regs)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(null)
    }
  }

  async function handleCancel(registrationId: string, subjectId: string) {
    setSaving(subjectId)
    try {
      await deleteRegistration(registrationId)
      setRegistrations(prev => prev.filter(r => r.id !== registrationId))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(null)
    }
  }

  const approvedCount = registrations.filter(r => r.status === "approved").length
  const pendingCount  = registrations.filter(r => r.status === "pending").length

  return (
    <DashboardLayout
      role="student"
      userName={me.user?.name ?? "Student"}
      pageTitle="Subject Registration"
      pageSubtitle="Register for subjects in your current semester"
      loading={loading}
    >
      <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full min-w-0">

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Registered",   value: registrations.length, color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100",    icon: BookOpen      },
            { label: "Approved",     value: approvedCount,        color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: CheckCircle2  },
            { label: "Pending",      value: pendingCount,         color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100",   icon: Clock         },
          ].map(s => (
            <Card key={s.label} className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center shrink-0`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Semester selector */}
        <Card className="backdrop-blur-xl bg-white/70 border-white/50 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4 flex-wrap">
            <GraduationCap className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-gray-800">Select Your Semester</p>
              <p className="text-xs text-gray-500">Only subjects for your semester will be shown</p>
            </div>
            <div className="ml-auto w-48">
              <Select value={semester} onValueChange={handleSemesterChange}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8].map(n => (
                    <SelectItem key={n} value={String(n)}>Semester {n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => load()} className="h-8 w-8 p-0">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </CardContent>
        </Card>

        {/* Subjects grid */}
        {!semester ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <GraduationCap className="h-10 w-10 mx-auto mb-3 text-gray-200" />
            Select your semester above to see available subjects
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
          </div>
        ) : semesterSubjects.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-200" />
            No subjects found for Semester {semester}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {semesterSubjects.map(subject => {
              const reg      = regMap[subject.id]
              const isReg    = !!reg
              const status   = reg?.status
              const isSaving = saving === subject.id
              const ss       = status ? statusStyle[status] : null

              return (
                <Card
                  key={subject.id}
                  className={`backdrop-blur-xl border shadow-sm transition-all ${
                    isReg ? "bg-blue-50/60 border-blue-100" : "bg-white/70 border-white/50"
                  }`}
                >
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 leading-tight">{subject.name}</p>
                          <p className="text-xs font-mono text-gray-400">{subject.code}</p>
                        </div>
                      </div>

                      {/* Status badge */}
                      {ss && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${ss.bg} ${ss.text}`}>
                          <ss.icon className="h-3 w-3" />
                          {ss.label}
                        </span>
                      )}
                    </div>

                    {/* Faculty (from junction table) */}
                    <p className="text-xs text-gray-500 mb-4">
                      {(() => {
                        const assigned = fsLinks
                          .filter(fs => fs.subject_id === subject.id && fs.users)
                          .map(fs => fs.users!)
                        if (assigned.length === 0) return "👤 Faculty not assigned"
                        return `👤 ${assigned.map(f => f.name).join(", ")}`
                      })()}
                    </p>

                    {/* Action button */}
                    {!isReg ? (
                      <Button
                        size="sm"
                        onClick={() => handleRegister(subject.id)}
                        disabled={isSaving}
                        className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5"
                      >
                        {isSaving
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Registering...</>
                          : "Register"
                        }
                      </Button>
                    ) : status === "pending" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(reg.id, subject.id)}
                        disabled={isSaving}
                        className="w-full h-8 text-red-600 border-red-200 hover:bg-red-50 text-xs font-semibold gap-1.5"
                      >
                        {isSaving
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Cancelling...</>
                          : "Cancel Registration"
                        }
                      </Button>
                    ) : (
                      <div className={`w-full h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${ss?.bg} ${ss?.text}`}>
                        {status === "approved" ? "✅ Enrolled" : "❌ Rejected — contact admin"}
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
