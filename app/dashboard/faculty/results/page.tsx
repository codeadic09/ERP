// app/dashboard/faculty/results/page.tsx
"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import {
  Award, Upload, CheckCircle, BookOpen,
  ChevronDown, Search, Save, Download,
  AlertCircle, TrendingUp, BarChart3,
  Sparkles, Eye, Lock, Unlock
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts"

type Student = {
  id: number
  name: string
  roll: string
  internal: number | ""
  external: number | ""
  grade?: string
  color: string
}

const subjects = [
  { label:"Data Structures — CSE301",   value:"CSE301", color:"#3B82F6", max:{ internal:40, external:60 } },
  { label:"Operating Systems — CSE302",  value:"CSE302", color:"#D946EF", max:{ internal:40, external:60 } },
  { label:"DBMS Lab — CSE303",          value:"CSE303", color:"#84CC16", max:{ internal:40, external:60 } },
]

const initialStudents: Student[] = [
  { id:1,  name:"Aryan Sharma",  roll:"EN2024101", internal:38, external:50, color:"#3B82F6" },
  { id:2,  name:"Priya Mehta",   roll:"EN2024102", internal:32, external:44, color:"#D946EF" },
  { id:3,  name:"Rohit Jain",    roll:"EN2024103", internal:40, external:52, color:"#84CC16" },
  { id:4,  name:"Sneha Gupta",   roll:"EN2024104", internal:22, external:30, color:"#FBBF24" },
  { id:5,  name:"Karan Patel",   roll:"EN2024105", internal:35, external:48, color:"#F43F5E" },
  { id:6,  name:"Anjali Singh",  roll:"EN2024106", internal:30, external:42, color:"#60A5FA" },
  { id:7,  name:"Dev Sharma",    roll:"EN2024107", internal:"", external:"", color:"#A78BFA" },
  { id:8,  name:"Meena Rao",     roll:"EN2024108", internal:28, external:38, color:"#34D399" },
  { id:9,  name:"Akash Verma",   roll:"EN2024109", internal:36, external:50, color:"#3B82F6" },
  { id:10, name:"Riya Patel",    roll:"EN2024110", internal:39, external:54, color:"#D946EF" },
]

function getGrade(total: number): { grade:string; color:string; bg:string } {
  if (total>=90) return { grade:"O",  color:"#3F6212", bg:"rgba(132,204,22,0.14)" }
  if (total>=80) return { grade:"A+", color:"#1D4ED8", bg:"rgba(59,130,246,0.12)" }
  if (total>=70) return { grade:"A",  color:"#1D4ED8", bg:"rgba(59,130,246,0.10)" }
  if (total>=60) return { grade:"B+", color:"#D97706", bg:"rgba(251,191,36,0.12)" }
  if (total>=50) return { grade:"B",  color:"#D97706", bg:"rgba(251,191,36,0.10)" }
  if (total>=40) return { grade:"C",  color:"#9F1239", bg:"rgba(244,63,94,0.10)"  }
  return              { grade:"F",  color:"#9F1239", bg:"rgba(244,63,94,0.14)"  }
}

const gradeDistData = [
  { grade:"O",  count:1, color:"#84CC16" },
  { grade:"A+", count:3, color:"#3B82F6" },
  { grade:"A",  count:3, color:"#60A5FA" },
  { grade:"B+", count:2, color:"#FBBF24" },
  { grade:"B",  count:1, color:"#F43F5E" },
]

export default function FacultyResultsPage() {
  const me = useAuth("faculty")
  if (!me) return null
  const [selectedSubject, setSelectedSubject] = useState(subjects[0])
  const [students, setStudents]               = useState<Student[]>(initialStudents)
  const [search, setSearch]                   = useState("")
  const [saving, setSaving]                   = useState(false)
  const [published, setPublished]             = useState(false)
  const [showDD, setShowDD]                   = useState(false)
  const [editMode, setEditMode]               = useState(true)

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.roll.toLowerCase().includes(search.toLowerCase())
  )

  const updateMark = (id: number, field: "internal"|"external", value: string) => {
    const max = selectedSubject.max[field]
    const num = Math.min(Number(value), max)
    setStudents(prev => prev.map(s => s.id===id ? { ...s, [field]: value===""?"":num } : s))
    setPublished(false)
  }

  const handlePublish = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1800))
    setSaving(false)
    setPublished(true)
    setEditMode(false)
  }

  const filledCount = students.filter(s => s.internal !== "" && s.external !== "").length
  const avgTotal    = (() => {
    const filled = students.filter(s => s.internal !== "" && s.external !== "")
    if (!filled.length) return 0
    return Math.round(filled.reduce((a,s) => a + Number(s.internal) + Number(s.external), 0) / filled.length)
  })()

  return (
    <DashboardLayout role="faculty" userName="Dr. Meera Joshi" pageTitle="Upload Results" pageSubtitle="Internal & External Marks">
      <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-5 w-full min-w-0">

        {/* ── Subject selector ── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative w-full sm:w-auto sm:min-w-[320px]">
            <button
              onClick={() => setShowDD(p => !p)}
              className="w-full px-4 py-3 rounded-2xl bg-white/80 border border-white/65 backdrop-blur-xl cursor-pointer flex items-center gap-2.5 justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-[9px] flex items-center justify-center"
                  style={{ background:`${selectedSubject.color}14`, border:`1px solid ${selectedSubject.color}28` }}
                >
                  <Award size={14} color={selectedSubject.color} strokeWidth={2} />
                </div>
                <p className="text-[13px] font-extrabold text-gray-800">{selectedSubject.label}</p>
              </div>
              <ChevronDown
                size={14} color="#64748B" strokeWidth={2.5}
                className={`transition-transform duration-200 ${showDD ? "rotate-180" : ""}`}
              />
            </button>
            {showDD && (
              <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-white/96 backdrop-blur-2xl border border-white/70 rounded-2xl shadow-xl overflow-hidden">
                {subjects.map(s => (
                  <div
                    key={s.value}
                    onClick={() => { setSelectedSubject(s); setShowDD(false); setPublished(false); setEditMode(true) }}
                    className="px-4 py-3 cursor-pointer transition-colors flex items-center gap-2.5"
                    style={{
                      background: selectedSubject.value===s.value ? `${s.color}08` : "transparent",
                      borderLeft: selectedSubject.value===s.value ? `3px solid ${s.color}` : "3px solid transparent",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background:`${s.color}14` }}
                    >
                      <Award size={12} color={s.color} strokeWidth={2} />
                    </div>
                    <p className="text-xs font-bold text-gray-800">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick stats pills */}
          {[
            { label:`${filledCount}/${students.length} filled`, color:"#3B82F6", bg:"rgba(59,130,246,0.10)", border:"rgba(59,130,246,0.22)" },
            { label:`Avg: ${avgTotal}/100`,                      color:"#84CC16", bg:"rgba(132,204,22,0.10)", border:"rgba(132,204,22,0.22)" },
            { label: published ? "Published ✓" : "Draft",       color: published?"#3F6212":"#D97706", bg:published?"rgba(132,204,22,0.10)":"rgba(251,191,36,0.10)", border:published?"rgba(132,204,22,0.22)":"rgba(251,191,36,0.25)" },
          ].map((p,i) => (
            <div key={i} className="px-3.5 py-2 rounded-xl" style={{ background:p.bg, border:`1px solid ${p.border}` }}>
              <span className="text-xs font-bold" style={{ color:p.color }}>{p.label}</span>
            </div>
          ))}

          {/* Edit / Lock toggle */}
          <button
            onClick={() => setEditMode(p => !p)}
            className="ml-auto px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
            style={{
              background: editMode ? "rgba(251,191,36,0.12)" : "rgba(132,204,22,0.12)",
              border: editMode ? "1px solid rgba(251,191,36,0.28)" : "1px solid rgba(132,204,22,0.25)",
              color: editMode ? "#D97706" : "#3F6212",
            }}
          >
            {editMode ? <><Unlock size={13} strokeWidth={2.5} /> Editing</> : <><Lock size={13} strokeWidth={2.5} /> Locked</>}
          </button>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:"Total Students", value:students.length,  color:"#3B82F6", bg:"rgba(59,130,246,0.08)",  border:"rgba(59,130,246,0.20)"  },
            { label:"Marks Filled",   value:filledCount,       color:"#84CC16", bg:"rgba(132,204,22,0.08)",  border:"rgba(132,204,22,0.20)"  },
            { label:"Class Average",  value:`${avgTotal}%`,    color:"#D946EF", bg:"rgba(217,70,239,0.08)",  border:"rgba(217,70,239,0.20)"  },
            { label:"Pass Rate",      value:"90%",             color:"#FBBF24", bg:"rgba(251,191,36,0.08)",  border:"rgba(251,191,36,0.20)"  },
          ].map((k,i) => (
            <div key={i} className="p-4 sm:p-5 rounded-2xl" style={{ background:k.bg, border:`1px solid ${k.border}` }}>
              <p className="text-2xl font-black leading-none mb-1" style={{ color:k.color }}>{k.value}</p>
              <p className="text-xs text-gray-500 font-semibold">{k.label}</p>
            </div>
          ))}
        </div>

        {/* ── Marks table + Grade dist chart ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">

          {/* Marks table */}
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-white/55 flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-0 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100/80 border border-white/60">
                <Search size={13} color="#94A3B8" strokeWidth={2.5} />
                <input
                  type="text" placeholder="Search student…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="flex-1 min-w-0 border-none bg-transparent text-xs text-gray-800 outline-none"
                />
              </div>
              <button className="px-3.5 py-2 rounded-xl border border-blue-500/20 bg-blue-500/8 text-blue-800 text-xs font-bold cursor-pointer flex items-center gap-1.5 shrink-0">
                <Download size={13} strokeWidth={2.5} /> CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: 640 }}>
                <thead>
                  <tr className="bg-gray-100/60">
                    {["#","Student","Roll No","Internal (/40)","External (/60)","Total","Grade"].map(h => (
                      <th key={h} className="px-3 sm:px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s,i) => {
                    const total = s.internal !== "" && s.external !== "" ? Number(s.internal)+Number(s.external) : null
                    const gradeCfg = total !== null ? getGrade(total) : null
                    return (
                      <tr key={s.id} className="table-row-hover border-t border-white/40">
                        <td className="px-3 sm:px-4 py-2.5 text-[11px] text-gray-400 font-semibold">{i+1}</td>
                        <td className="px-3 sm:px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-extrabold shrink-0"
                              style={{ background:`linear-gradient(135deg,${s.color},${s.color}90)` }}
                            >
                              {s.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                            </div>
                            <span className="text-xs font-bold text-gray-800 truncate">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-[11px] text-gray-500">{s.roll}</td>
                        {/* Internal input */}
                        <td className="px-2 sm:px-3 py-2">
                          <input
                            type="number" min={0} max={40}
                            value={s.internal}
                            onChange={e => updateMark(s.id, "internal", e.target.value)}
                            disabled={!editMode}
                            className="w-14 sm:w-16 px-2.5 py-1.5 rounded-[9px] text-[13px] font-bold text-gray-800 text-center outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:cursor-not-allowed"
                            style={{
                              border: s.internal==="" ? "1.5px solid rgba(244,63,94,0.35)" : "1px solid rgba(255,255,255,0.60)",
                              background: editMode ? "rgba(255,255,255,0.85)" : "rgba(241,245,249,0.60)",
                            }}
                          />
                        </td>
                        {/* External input */}
                        <td className="px-2 sm:px-3 py-2">
                          <input
                            type="number" min={0} max={60}
                            value={s.external}
                            onChange={e => updateMark(s.id, "external", e.target.value)}
                            disabled={!editMode}
                            className="w-14 sm:w-16 px-2.5 py-1.5 rounded-[9px] text-[13px] font-bold text-gray-800 text-center outline-none focus:ring-2 focus:ring-fuchsia-500/30 focus:border-fuchsia-500 disabled:cursor-not-allowed"
                            style={{
                              border: s.external==="" ? "1.5px solid rgba(244,63,94,0.35)" : "1px solid rgba(255,255,255,0.60)",
                              background: editMode ? "rgba(255,255,255,0.85)" : "rgba(241,245,249,0.60)",
                            }}
                          />
                        </td>
                        {/* Total */}
                        <td className="px-3 sm:px-4 py-2.5">
                          {total !== null ? (
                            <span className={`text-sm font-black ${total>=60 ? "text-gray-800" : "text-rose-500"}`}>{total}</span>
                          ) : (
                            <span className="text-[11px] text-gray-300">—</span>
                          )}
                        </td>
                        {/* Grade */}
                        <td className="px-3 sm:px-4 py-2.5">
                          {gradeCfg ? (
                            <span className="text-xs font-black px-2.5 py-0.5 rounded-full" style={{ background:gradeCfg.bg, color:gradeCfg.color }}>
                              {gradeCfg.grade}
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Publish bar */}
            <div className="px-4 sm:px-5 py-3.5 border-t border-white/55 flex justify-end gap-2.5 bg-white/50">
              <button
                onClick={handlePublish}
                disabled={saving || filledCount < students.length || published}
                className="px-5 sm:px-6 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all duration-200 disabled:cursor-not-allowed"
                style={{
                  background: published ? "rgba(132,204,22,0.80)" :
                              saving ? "rgba(59,130,246,0.50)" :
                              filledCount < students.length ? "rgba(148,163,184,0.30)" :
                              "linear-gradient(135deg,#1D4ED8,#3B82F6)",
                  color: filledCount < students.length ? "#94A3B8" : "white",
                  boxShadow: filledCount===students.length && !saving && !published ? "0 6px 16px rgba(59,130,246,0.30)" : "none",
                  border: "none",
                }}
              >
                {saving ? (
                  <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/35 border-t-white animate-spin" /> Publishing…</>
                ) : published ? (
                  <><CheckCircle size={15} strokeWidth={2.5} /> Results Published!</>
                ) : (
                  <><Upload size={14} strokeWidth={2.5} /> Publish Results</>
                )}
              </button>
            </div>
          </div>

          {/* Grade distribution */}
          <div className="flex flex-col gap-4">
            <div className="glass-card rounded-3xl p-5 sm:p-6">
              <h3 className="text-sm font-extrabold text-gray-800 mb-1">Grade Distribution</h3>
              <p className="text-[11px] text-gray-500 mb-4">Current semester results</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={gradeDistData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="grade" tick={{ fontSize:12, fill:"#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:11, fill:"#94A3B8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:"rgba(255,255,255,0.95)", border:"1px solid rgba(255,255,255,0.65)", borderRadius:12, fontSize:12 }} />
                  <Bar dataKey="count" radius={[6,6,0,0]} name="Students">
                    {gradeDistData.map((e,i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Topper + lowest */}
            <div className="glass-card rounded-3xl p-5 sm:p-6">
              <h3 className="text-sm font-extrabold text-gray-800 mb-3.5">Performance Highlights</h3>
              <div className="flex flex-col gap-2.5">
                {[
                  { label:"🏆 Topper",       name:"Rohit Jain",  score:"92/100", color:"#84CC16", bg:"rgba(132,204,22,0.10)", border:"rgba(132,204,22,0.22)" },
                  { label:"📈 Most Improved", name:"Aryan Sharma",score:"88/100", color:"#3B82F6", bg:"rgba(59,130,246,0.10)", border:"rgba(59,130,246,0.22)" },
                  { label:"⚠ Needs Support", name:"Sneha Gupta",  score:"52/100", color:"#F43F5E", bg:"rgba(244,63,94,0.08)",  border:"rgba(244,63,94,0.20)"  },
                ].map((h,i) => (
                  <div key={i} className="px-3.5 py-2.5 rounded-xl flex justify-between items-center" style={{ background:h.bg, border:`1px solid ${h.border}` }}>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold">{h.label}</p>
                      <p className="text-xs font-bold text-gray-800 mt-0.5">{h.name}</p>
                    </div>
                    <span className="text-sm font-black" style={{ color:h.color }}>{h.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
