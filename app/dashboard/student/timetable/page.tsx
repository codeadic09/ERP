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
    "13:00":null, // Break
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
      <div style={{ padding:"28px 32px", display:"flex", flexDirection:"column", gap:24 }}>

        {/* ── Header controls ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{
            padding:"6px 18px", borderRadius:14,
            background:"rgba(59,130,246,0.10)", border:"1px solid rgba(59,130,246,0.22)",
            display:"flex", alignItems:"center", gap:8,
          }}>
            <Sparkles size={13} color="#3B82F6" strokeWidth={2.5} />
            <span style={{ fontSize:12, fontWeight:700, color:"#1D4ED8" }}>
              Sem 4 · Feb – Jun 2026 · Section A
            </span>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {(["week","day"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding:"7px 18px", borderRadius:12, border:"none",
                fontSize:12, fontWeight:700, cursor:"pointer", transition:"all 0.2s",
                background: view===v ? "linear-gradient(135deg,#1D4ED8,#3B82F6)" : "rgba(241,245,249,0.80)",
                color: view===v ? "white" : "#64748B",
                boxShadow: view===v ? "0 4px 10px rgba(59,130,246,0.30)" : "none",
              }}>{v.charAt(0).toUpperCase()+v.slice(1)} View</button>
            ))}
          </div>
        </div>

        {/* ── Today's classes strip ── */}
        <div>
          <h3 style={{ fontSize:14, fontWeight:800, color:"#1E293B", marginBottom:12 }}>
            Today's Classes <span style={{ fontWeight:500, color:"#64748B", fontSize:12 }}>— Monday, Feb 27</span>
          </h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {todayClasses.map((c,i) => (
              <div key={i} style={{
                padding:"16px 18px", borderRadius:18,
                background:"rgba(255,255,255,0.72)",
                border:"1px solid rgba(255,255,255,0.65)",
                borderTop:`3px solid ${c.color}`,
                backdropFilter:"blur(12px)",
                transition:"all 0.2s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,0.92)"; (e.currentTarget as HTMLDivElement).style.transform="translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow=`0 8px 24px ${c.color}20` }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,0.72)"; (e.currentTarget as HTMLDivElement).style.transform="translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow="none" }}
              >
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${c.color}14`, border:`1px solid ${c.color}28`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <BookOpen size={16} color={c.color} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:typeColors[c.type].bg, color:typeColors[c.type].text }}>
                    {c.type}
                  </span>
                </div>
                <p style={{ fontSize:13, fontWeight:800, color:"#1E293B", marginBottom:6, lineHeight:1.3 }}>{c.subject}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <Clock size={10} color="#94A3B8" strokeWidth={2.5} />
                    <span style={{ fontSize:11, color:"#64748B" }}>{c.time}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <MapPin size={10} color="#94A3B8" strokeWidth={2.5} />
                    <span style={{ fontSize:11, color:"#64748B" }}>{c.room}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <User size={10} color="#94A3B8" strokeWidth={2.5} />
                    <span style={{ fontSize:11, color:"#64748B" }}>{c.faculty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Weekly timetable grid ── */}
        <div className="glass-card" style={{ borderRadius:24, overflow:"hidden" }}>
          <div style={{ padding:"20px 28px 16px", borderBottom:"1px solid rgba(255,255,255,0.55)" }}>
            <h3 style={{ fontSize:15, fontWeight:800, color:"#1E293B", marginBottom:3 }}>Weekly Schedule</h3>
            <p style={{ fontSize:12, color:"#64748B" }}>Semester 4 — Full week overview</p>
          </div>

          <div style={{ overflowX:"auto", padding:"0 0 8px" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:900 }}>
              <thead>
                <tr style={{ background:"rgba(241,245,249,0.60)" }}>
                  <th style={{ padding:"12px 16px", width:80, textAlign:"center", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.06em" }}>Time</th>
                  {days.map(d => (
                    <th key={d} style={{
                      padding:"12px 16px", textAlign:"center", fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase",
                      color: d===today ? "#1D4ED8" : "#64748B",
                      background: d===today ? "rgba(59,130,246,0.06)" : "transparent",
                    }}>
                      {d.slice(0,3)}
                      {d===today && <div style={{ width:5, height:5, borderRadius:"50%", background:"#3B82F6", margin:"4px auto 0", boxShadow:"0 0 6px rgba(59,130,246,0.60)" }} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, si) => (
                  <tr key={slot} style={{ borderTop:"1px solid rgba(255,255,255,0.40)" }}>
                    {/* Time label */}
                    <td style={{ padding:"6px 16px", textAlign:"center", fontSize:11, color:"#94A3B8", fontWeight:600, whiteSpace:"nowrap", verticalAlign:"middle" }}>
                      {slot}
                      {slot==="13:00" && <div style={{ fontSize:9, color:"#FBBF24", fontWeight:700, marginTop:1 }}>Break</div>}
                    </td>

                    {days.map(day => {
                      const entry = timetable[day]?.[slot]
                      const isToday = day === today
                      const isBreak = slot === "13:00"

                      if (isBreak) return (
                        <td key={day} style={{
                          padding:"8px 8px",
                          background: isToday ? "rgba(59,130,246,0.03)" : "transparent",
                          textAlign:"center",
                        }}>
                          <div style={{ fontSize:10, color:"#FBBF24", fontWeight:700, padding:"6px", borderRadius:8, background:"rgba(251,191,36,0.08)" }}>
                            Lunch Break
                          </div>
                        </td>
                      )

                      if (!entry) return (
                        <td key={day} style={{
                          padding:"8px 8px",
                          background: isToday ? "rgba(59,130,246,0.02)" : "transparent",
                        }} />
                      )

                      return (
                        <td key={day} style={{
                          padding:"4px 6px",
                          background: isToday ? "rgba(59,130,246,0.03)" : "transparent",
                          verticalAlign:"top",
                        }}>
                          <div style={{
                            padding:"10px 12px",
                            borderRadius:12,
                            background:`${entry.color}10`,
                            border:`1px solid ${entry.color}25`,
                            borderLeft:`3px solid ${entry.color}`,
                            cursor:"pointer",
                            transition:"all 0.2s",
                          }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLDivElement).style.background=`${entry.color}18`
                              ;(e.currentTarget as HTMLDivElement).style.transform="scale(1.02)"
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLDivElement).style.background=`${entry.color}10`
                              ;(e.currentTarget as HTMLDivElement).style.transform="scale(1)"
                            }}
                          >
                            <p style={{ fontSize:11, fontWeight:800, color:"#1E293B", marginBottom:2, lineHeight:1.3 }}>{entry.subject}</p>
                            <p style={{ fontSize:9,  color:"#64748B", marginBottom:3 }}>{entry.room}</p>
                            <span style={{
                              fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:99,
                              background: typeColors[entry.type].bg,
                              color: typeColors[entry.type].text,
                            }}>{entry.type}</span>
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
          <div style={{ padding:"14px 28px", borderTop:"1px solid rgba(255,255,255,0.50)", display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#64748B" }}>Type:</span>
            {Object.entries(typeColors).map(([type,style]) => (
              <div key={type} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:10, height:10, borderRadius:3, background:style.bg, border:`1px solid ${style.text}30` }} />
                <span style={{ fontSize:11, color:"#64748B", fontWeight:600, textTransform:"capitalize" }}>{type}</span>
              </div>
            ))}
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:"#3B82F6", boxShadow:"0 0 6px rgba(59,130,246,0.60)" }} />
              <span style={{ fontSize:11, color:"#1D4ED8", fontWeight:700 }}>Today — Monday</span>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
