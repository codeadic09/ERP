// app/dashboard/student/timetable/page.tsx
"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import {
  Calendar, Clock, BookOpen, MapPin,
  User, ChevronLeft, ChevronRight, Sparkles
} from "lucide-react"

const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

const timeSlots = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"]

type ClassEntry = {
  subject: string; code: string; faculty: string
  room: string; type: "lecture"|"lab"|"tutorial"
  color: string; span?: number
}

const timetable: Record<string, Record<string, ClassEntry | null>> = {
  "Monday":    {
    "09:00":{ subject:"Data Structures",     code:"CSE301", faculty:"Dr. Meera Joshi",  room:"CS-101", type:"lecture",  color:"#3B82F6" },
    "10:00":null,
    "11:00":{ subject:"Operating Systems",   code:"CSE302", faculty:"Prof. Anil Rao",   room:"CS-203", type:"lecture",  color:"#D946EF" },
    "12:00":null,
    "13:00":null,
    "14:00":{ subject:"DBMS Lab",            code:"CSE303", faculty:"Dr. Priya Sharma", room:"Lab-02", type:"lab",      color:"#84CC16", span:2 },
    "15:00":null,
    "16:00":{ subject:"AI Tutorial",         code:"CSE306", faculty:"Prof. A. Singh",   room:"CS-105", type:"tutorial", color:"#60A5FA" },
    "17:00":null,
  },
  "Tuesday":   {
    "09:00":{ subject:"Computer Networks",   code:"CSE304", faculty:"Prof. R. Kumar",   room:"CS-201", type:"lecture",  color:"#FBBF24" },
    "10:00":null,
    "11:00":{ subject:"Data Structures",     code:"CSE301", faculty:"Dr. Meera Joshi",  room:"CS-101", type:"lecture",  color:"#3B82F6" },
    "12:00":null,
    "13:00":null,
    "14:00":{ subject:"Software Engg.",      code:"CSE305", faculty:"Dr. S. Verma",     room:"CS-202", type:"lecture",  color:"#F43F5E" },
    "15:00":null,
    "16:00":null,
    "17:00":null,
  },
  "Wednesday": {
    "09:00":null,
    "10:00":{ subject:"AI Lecture",          code:"CSE306", faculty:"Prof. A. Singh",   room:"CS-101", type:"lecture",  color:"#60A5FA" },
    "11:00":null,
    "12:00":{ subject:"DBMS Lecture",        code:"CSE303", faculty:"Dr. Priya Sharma", room:"CS-102", type:"lecture",  color:"#84CC16" },
    "13:00":null,
    "14:00":{ subject:"OS Lab",              code:"CSE302", faculty:"Prof. Anil Rao",   room:"Lab-01", type:"lab",      color:"#D946EF", span:2 },
    "15:00":null,
    "16:00":null,
    "17:00":null,
  },
  "Thursday":  {
    "09:00":{ subject:"Software Engg.",      code:"CSE305", faculty:"Dr. S. Verma",     room:"CS-202", type:"lecture",  color:"#F43F5E" },
    "10:00":null,
    "11:00":{ subject:"Computer Networks",   code:"CSE304", faculty:"Prof. R. Kumar",   room:"CS-201", type:"lecture",  color:"#FBBF24" },
    "12:00":null,
    "13:00":null,
    "14:00":{ subject:"DSA Lab",             code:"CSE301", faculty:"Dr. Meera Joshi",  room:"Lab-03", type:"lab",      color:"#3B82F6", span:2 },
    "15:00":null,
    "16:00":{ subject:"CN Tutorial",         code:"CSE304", faculty:"Prof. R. Kumar",   room:"CS-104", type:"tutorial", color:"#FBBF24" },
    "17:00":null,
  },
  "Friday":    {
    "09:00":{ subject:"DBMS Lecture",        code:"CSE303", faculty:"Dr. Priya Sharma", room:"CS-102", type:"lecture",  color:"#84CC16" },
    "10:00":null,
    "11:00":{ subject:"Data Structures",     code:"CSE301", faculty:"Dr. Meera Joshi",  room:"CS-101", type:"lecture",  color:"#3B82F6" },
    "12:00":null,
    "13:00":null,
    "14:00":{ subject:"AI Lab",              code:"CSE306", faculty:"Prof. A. Singh",   room:"Lab-02", type:"lab",      color:"#60A5FA", span:2 },
    "15:00":null,
    "16:00":null,
    "17:00":null,
  },
  "Saturday":  {
    "09:00":{ subject:"OS Tutorial",         code:"CSE302", faculty:"Prof. Anil Rao",   room:"CS-103", type:"tutorial", color:"#D946EF" },
    "10:00":null,
    "11:00":{ subject:"SE Lab",              code:"CSE305", faculty:"Dr. S. Verma",     room:"Lab-01", type:"lab",      color:"#F43F5E", span:2 },
    "12:00":null,
    "13:00":null,
    "14:00":null,
    "15:00":null,
    "16:00":null,
    "17:00":null,
  },
}

const todayClasses = [
  { subject:"Data Structures", time:"09:00–10:00", room:"CS-101", faculty:"Dr. Meera Joshi",  type:"lecture",  color:"#3B82F6" },
  { subject:"Operating Systems",time:"11:00–12:00",room:"CS-203", faculty:"Prof. Anil Rao",   type:"lecture",  color:"#D946EF" },
  { subject:"DBMS Lab",         time:"14:00–16:00",room:"Lab-02", faculty:"Dr. Priya Sharma", type:"lab",      color:"#84CC16" },
  { subject:"AI Tutorial",      time:"16:00–17:00",room:"CS-105", faculty:"Prof. A. Singh",   type:"tutorial", color:"#60A5FA" },
]

const typeColors: Record<string, { bg:string; text:string }> = {
  lecture:  { bg:"rgba(59,130,246,0.10)",  text:"#1D4ED8" },
  lab:      { bg:"rgba(132,204,22,0.12)",  text:"#3F6212" },
  tutorial: { bg:"rgba(251,191,36,0.12)",  text:"#D97706" },
}

export default function StudentTimetablePage() {
  const me = useAuth("student")
  if (!me) return null
  const [view, setView] = useState<"week"|"day">("week")
  const [today] = useState("Monday")

  return (
    <DashboardLayout role="student" userName="Aryan Sharma" pageTitle="My Timetable" pageSubtitle="Semester 4 · CSE Section A">
      <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-5 sm:gap-6 w-full min-w-0">

        {/* ── Header controls ── */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="px-4 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
            <Sparkles size={13} color="#3B82F6" strokeWidth={2.5} />
            <span className="text-xs font-bold text-blue-800">
              Sem 4 · Feb – Jun 2026 · Section A
            </span>
          </div>
          <div className="flex gap-2">
            {(["week","day"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 ${
                  view === v
                    ? "text-white shadow-md"
                    : "bg-gray-100/80 text-gray-500"
                }`}
                style={view === v ? {
                  background: "linear-gradient(135deg,#1D4ED8,#3B82F6)",
                  boxShadow: "0 4px 10px rgba(59,130,246,0.30)",
                } : {}}
              >
                {v.charAt(0).toUpperCase()+v.slice(1)} View
              </button>
            ))}
          </div>
        </div>

        {/* ── Today's classes strip ── */}
        <div>
          <h3 className="text-sm font-extrabold text-gray-800 mb-3">
            Today&apos;s Classes <span className="font-medium text-gray-500 text-xs">— Monday, Feb 27</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {todayClasses.map((c,i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white/72 border border-white/65 backdrop-blur-xl transition-all duration-200 hover:bg-white/92 hover:-translate-y-0.5"
                style={{ borderTop:`3px solid ${c.color}` }}
              >
                <div className="flex justify-between items-start mb-2.5">
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                    style={{ background:`${c.color}14`, border:`1px solid ${c.color}28` }}
                  >
                    <BookOpen size={16} color={c.color} strokeWidth={2} />
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background:typeColors[c.type].bg, color:typeColors[c.type].text }}
                  >
                    {c.type}
                  </span>
                </div>
                <p className="text-[13px] font-extrabold text-gray-800 mb-1.5 leading-tight">{c.subject}</p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Clock size={10} color="#94A3B8" strokeWidth={2.5} />
                    <span className="text-[11px] text-gray-500">{c.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={10} color="#94A3B8" strokeWidth={2.5} />
                    <span className="text-[11px] text-gray-500">{c.room}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={10} color="#94A3B8" strokeWidth={2.5} />
                    <span className="text-[11px] text-gray-500">{c.faculty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Weekly timetable grid ── */}
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="px-4 sm:px-7 pt-5 pb-4 border-b border-white/55">
            <h3 className="text-[15px] font-extrabold text-gray-800 mb-0.5">Weekly Schedule</h3>
            <p className="text-xs text-gray-500">Semester 4 — Full week overview</p>
          </div>

          <div className="overflow-x-auto pb-2">
            <table className="w-full border-collapse" style={{ minWidth: 900 }}>
              <thead>
                <tr className="bg-gray-100/60">
                  <th className="px-3 sm:px-4 py-3 w-20 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">Time</th>
                  {days.map(d => (
                    <th
                      key={d}
                      className={`px-3 sm:px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider ${
                        d===today ? "text-blue-800 bg-blue-500/5" : "text-gray-500"
                      }`}
                    >
                      {d.slice(0,3)}
                      {d===today && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mx-auto mt-1" style={{ boxShadow:"0 0 6px rgba(59,130,246,0.60)" }} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) => (
                  <tr key={slot} className="border-t border-white/40">
                    {/* Time label */}
                    <td className="px-3 sm:px-4 py-1.5 text-center text-[11px] text-gray-400 font-semibold whitespace-nowrap align-middle">
                      {slot}
                      {slot==="13:00" && <div className="text-[9px] text-amber-500 font-bold mt-0.5">Break</div>}
                    </td>

                    {days.map(day => {
                      const entry = timetable[day]?.[slot]
                      const isToday = day === today
                      const isBreak = slot === "13:00"

                      if (isBreak) return (
                        <td key={day} className={`p-2 text-center ${isToday ? "bg-blue-500/3" : ""}`}>
                          <div className="text-[10px] text-amber-500 font-bold p-1.5 rounded-lg bg-amber-500/8">
                            Lunch Break
                          </div>
                        </td>
                      )

                      if (!entry) return (
                        <td key={day} className={`p-2 ${isToday ? "bg-blue-500/2" : ""}`} />
                      )

                      return (
                        <td key={day} className={`p-1 sm:p-1.5 align-top ${isToday ? "bg-blue-500/3" : ""}`}>
                          <div
                            className="px-2.5 sm:px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                            style={{
                              background:`${entry.color}10`,
                              border:`1px solid ${entry.color}25`,
                              borderLeft:`3px solid ${entry.color}`,
                            }}
                          >
                            <p className="text-[11px] font-extrabold text-gray-800 mb-0.5 leading-tight">{entry.subject}</p>
                            <p className="text-[9px] text-gray-500 mb-1">{entry.room}</p>
                            <span
                              className="text-[9px] font-bold px-1.5 py-px rounded-full"
                              style={{ background: typeColors[entry.type].bg, color: typeColors[entry.type].text }}
                            >
                              {entry.type}
                            </span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="px-4 sm:px-7 py-3.5 border-t border-white/50 flex flex-wrap gap-4 items-center">
            <span className="text-[11px] font-bold text-gray-500">Type:</span>
            {Object.entries(typeColors).map(([type,style]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background:style.bg, border:`1px solid ${style.text}30` }} />
                <span className="text-[11px] text-gray-500 font-semibold capitalize">{type}</span>
              </div>
            ))}
            <div className="sm:ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" style={{ boxShadow:"0 0 6px rgba(59,130,246,0.60)" }} />
              <span className="text-[11px] text-blue-800 font-bold">Today — Monday</span>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
