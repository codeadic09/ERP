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
      <div style={{ padding:"28px 32px", display:"flex", flexDirection:"column", gap:22 }}>

        {/* ── Subject selector ── */}
        <div style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ position:"relative", minWidth:320 }}>
            <button onClick={() => setShowDD(p => !p)} style={{
              width:"100%", padding:"12px 18px", borderRadius:16,
              background:"rgba(255,255,255,0.80)", border:"1px solid rgba(255,255,255,0.65)",
              backdropFilter:"blur(12px)", cursor:"pointer",
              display:"flex", alignItems:"center", gap:10, justifyContent:"space-between",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:`${selectedSubject.color}14`, border:`1px solid ${selectedSubject.color}28`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Award size={14} color={selectedSubject.color} strokeWidth={2} />
                </div>
                <p style={{ fontSize:13, fontWeight:800, color:"#1E293B" }}>{selectedSubject.label}</p>
              </div>
              <ChevronDown size={14} color="#64748B" strokeWidth={2.5} style={{ transform: showDD ? "rotate(180deg)" : "none", transition:"transform 0.2s" }} />
            </button>
            {showDD && (
              <div style={{
                position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:50,
                background:"rgba(255,255,255,0.96)", backdropFilter:"blur(20px)",
                border:"1px solid rgba(255,255,255,0.70)", borderRadius:16,
                boxShadow:"0 16px 40px rgba(59,130,246,0.16)", overflow:"hidden",
              }}>
                {subjects.map(s => (
                  <div key={s.value}
                    onClick={() => { setSelectedSubject(s); setShowDD(false); setPublished(false); setEditMode(true) }}
                    style={{
                      padding:"12px 16px", cursor:"pointer", transition:"background 0.15s",
                      background: selectedSubject.value===s.value ? `${s.color}08` : "transparent",
                      borderLeft: selectedSubject.value===s.value ? `3px solid ${s.color}` : "3px solid transparent",
                      display:"flex", alignItems:"center", gap:10,
                    }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:`${s.color}14`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Award size={12} color={s.color} strokeWidth={2} />
                    </div>
                    <p style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{s.label}</p>
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
            <div key={i} style={{ padding:"8px 14px", borderRadius:12, background:p.bg, border:`1px solid ${p.border}` }}>
              <span style={{ fontSize:12, fontWeight:700, color:p.color }}>{p.label}</span>
            </div>
          ))}

          {/* Edit / Lock toggle */}
          <button
            onClick={() => setEditMode(p => !p)}
            style={{
              marginLeft:"auto", padding:"9px 16px", borderRadius:12, border:"none",
              background: editMode ? "rgba(251,191,36,0.12)" : "rgba(132,204,22,0.12)",
              border: editMode ? "1px solid rgba(251,191,36,0.28)" : "1px solid rgba(132,204,22,0.25)",
              color: editMode ? "#D97706" : "#3F6212",
              fontSize:12, fontWeight:700, cursor:"pointer",
              display:"flex", alignItems:"center", gap:6,
            }}>
            {editMode ? <><Unlock size={13} strokeWidth={2.5} /> Editing</> : <><Lock size={13} strokeWidth={2.5} /> Locked</>}
          </button>
        </div>

        {/* ── KPI cards ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          {[
            { label:"Total Students", value:students.length,  color:"#3B82F6", bg:"rgba(59,130,246,0.08)",  border:"rgba(59,130,246,0.20)"  },
            { label:"Marks Filled",   value:filledCount,       color:"#84CC16", bg:"rgba(132,204,22,0.08)",  border:"rgba(132,204,22,0.20)"  },
            { label:"Class Average",  value:`${avgTotal}%`,    color:"#D946EF", bg:"rgba(217,70,239,0.08)",  border:"rgba(217,70,239,0.20)"  },
            { label:"Pass Rate",      value:"90%",             color:"#FBBF24", bg:"rgba(251,191,36,0.08)",  border:"rgba(251,191,36,0.20)"  },
          ].map((k,i) => (
            <div key={i} style={{ padding:"18px 20px", borderRadius:18, background:k.bg, border:`1px solid ${k.border}` }}>
              <p style={{ fontSize:24, fontWeight:900, color:k.color, lineHeight:1, marginBottom:4 }}>{k.value}</p>
              <p style={{ fontSize:12, color:"#64748B", fontWeight:600 }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* ── Marks table + Grade dist chart ── */}
        <div style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:20 }}>

          {/* Marks table */}
          <div className="glass-card" style={{ borderRadius:24, overflow:"hidden" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.55)", display:"flex", gap:12, alignItems:"center" }}>
              <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:12, background:"rgba(241,245,249,0.80)", border:"1px solid rgba(255,255,255,0.60)" }}>
                <Search size={13} color="#94A3B8" strokeWidth={2.5} />
                <input
                  type="text" placeholder="Search student…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ flex:1, border:"none", background:"transparent", fontSize:12, color:"#1E293B", outline:"none" }}
                />
              </div>
              <button style={{
                padding:"8px 14px", borderRadius:12, border:"1px solid rgba(59,130,246,0.22)",
                background:"rgba(59,130,246,0.08)", color:"#1D4ED8",
                fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6,
              }}>
                <Download size={13} strokeWidth={2.5} /> CSV
              </button>
            </div>

            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"rgba(241,245,249,0.60)" }}>
                    {["#","Student","Roll No",`Internal (/40)`,`External (/60)`,"Total","Grade"].map(h => (
                      <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s,i) => {
                    const total = s.internal !== "" && s.external !== "" ? Number(s.internal)+Number(s.external) : null
                    const gradeCfg = total !== null ? getGrade(total) : null
                    return (
                      <tr key={s.id} className="table-row-hover" style={{ borderTop:"1px solid rgba(255,255,255,0.40)" }}>
                        <td style={{ padding:"11px 16px", fontSize:11, color:"#94A3B8", fontWeight:600 }}>{i+1}</td>
                        <td style={{ padding:"11px 16px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(135deg,${s.color},${s.color}90)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:10, fontWeight:800, flexShrink:0 }}>
                              {s.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                            </div>
                            <span style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{s.name}</span>
                          </div>
                        </td>
                        <td style={{ padding:"11px 16px", fontSize:11, color:"#64748B" }}>{s.roll}</td>
                        {/* Internal input */}
                        <td style={{ padding:"8px 12px" }}>
                          <input
                            type="number" min={0} max={40}
                            value={s.internal}
                            onChange={e => updateMark(s.id, "internal", e.target.value)}
                            disabled={!editMode}
                            style={{
                              width:60, padding:"6px 10px", borderRadius:9,
                              border: s.internal==="" ? "1.5px solid rgba(244,63,94,0.35)" : "1px solid rgba(255,255,255,0.60)",
                              background: editMode ? "rgba(255,255,255,0.85)" : "rgba(241,245,249,0.60)",
                              fontSize:13, fontWeight:700, color:"#1E293B", outline:"none",
                              textAlign:"center", cursor: editMode ? "text" : "not-allowed",
                            }}
                            onFocus={e => { e.target.style.borderColor="#3B82F6"; e.target.style.boxShadow="0 0 0 3px rgba(59,130,246,0.12)" }}
                            onBlur={e  => { e.target.style.borderColor=s.internal===""?"rgba(244,63,94,0.35)":"rgba(255,255,255,0.60)"; e.target.style.boxShadow="none" }}
                          />
                        </td>
                        {/* External input */}
                        <td style={{ padding:"8px 12px" }}>
                          <input
                            type="number" min={0} max={60}
                            value={s.external}
                            onChange={e => updateMark(s.id, "external", e.target.value)}
                            disabled={!editMode}
                            style={{
                              width:60, padding:"6px 10px", borderRadius:9,
                              border: s.external==="" ? "1.5px solid rgba(244,63,94,0.35)" : "1px solid rgba(255,255,255,0.60)",
                              background: editMode ? "rgba(255,255,255,0.85)" : "rgba(241,245,249,0.60)",
                              fontSize:13, fontWeight:700, color:"#1E293B", outline:"none",
                              textAlign:"center", cursor: editMode ? "text" : "not-allowed",
                            }}
                            onFocus={e => { e.target.style.borderColor="#D946EF"; e.target.style.boxShadow="0 0 0 3px rgba(217,70,239,0.12)" }}
                            onBlur={e  => { e.target.style.borderColor=s.external===""?"rgba(244,63,94,0.35)":"rgba(255,255,255,0.60)"; e.target.style.boxShadow="none" }}
                          />
                        </td>
                        {/* Total */}
                        <td style={{ padding:"11px 16px" }}>
                          {total !== null ? (
                            <span style={{ fontSize:14, fontWeight:900, color: total>=60?"#1E293B":"#F43F5E" }}>{total}</span>
                          ) : (
                            <span style={{ fontSize:11, color:"#CBD5E1" }}>—</span>
                          )}
                        </td>
                        {/* Grade */}
                        <td style={{ padding:"11px 16px" }}>
                          {gradeCfg ? (
                            <span style={{ fontSize:12, fontWeight:900, padding:"3px 10px", borderRadius:99, background:gradeCfg.bg, color:gradeCfg.color }}>
                              {gradeCfg.grade}
                            </span>
                          ) : (
                            <span style={{ fontSize:11, color:"#CBD5E1" }}>—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Publish bar */}
            <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,0.55)", display:"flex", justifyContent:"flex-end", gap:10, background:"rgba(255,255,255,0.50)" }}>
              <button
                onClick={handlePublish}
                disabled={saving || filledCount < students.length || published}
                style={{
                  padding:"10px 24px", borderRadius:14, border:"none",
                  background: published ? "rgba(132,204,22,0.80)" :
                              saving ? "rgba(59,130,246,0.50)" :
                              filledCount < students.length ? "rgba(148,163,184,0.30)" :
                              "linear-gradient(135deg,#1D4ED8,#3B82F6)",
                  color: filledCount < students.length ? "#94A3B8" : "white",
                  fontSize:13, fontWeight:700,
                  cursor: filledCount < students.length ? "not-allowed" : "pointer",
                  boxShadow: filledCount===students.length && !saving && !published ? "0 6px 16px rgba(59,130,246,0.30)" : "none",
                  display:"flex", alignItems:"center", gap:8, transition:"all 0.2s",
                }}
              >
                {saving ? (
                  <><div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.35)", borderTopColor:"white", animation:"spin 0.8s linear infinite" }} /> Publishing…</>
                ) : published ? (
                  <><CheckCircle size={15} strokeWidth={2.5} /> Results Published!</>
                ) : (
                  <><Upload size={14} strokeWidth={2.5} /> Publish Results</>
                )}
              </button>
            </div>
          </div>

          {/* Grade distribution */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div className="glass-card" style={{ borderRadius:24, padding:"22px 24px" }}>
              <h3 style={{ fontSize:14, fontWeight:800, color:"#1E293B", marginBottom:3 }}>Grade Distribution</h3>
              <p style={{ fontSize:11, color:"#64748B", marginBottom:16 }}>Current semester results</p>
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
            <div className="glass-card" style={{ borderRadius:24, padding:"22px 24px" }}>
              <h3 style={{ fontSize:14, fontWeight:800, color:"#1E293B", marginBottom:14 }}>Performance Highlights</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { label:"🏆 Topper",       name:"Rohit Jain",  score:"92/100", color:"#84CC16", bg:"rgba(132,204,22,0.10)", border:"rgba(132,204,22,0.22)" },
                  { label:"📈 Most Improved", name:"Aryan Sharma",score:"88/100", color:"#3B82F6", bg:"rgba(59,130,246,0.10)", border:"rgba(59,130,246,0.22)" },
                  { label:"⚠ Needs Support", name:"Sneha Gupta",  score:"52/100", color:"#F43F5E", bg:"rgba(244,63,94,0.08)",  border:"rgba(244,63,94,0.20)"  },
                ].map((h,i) => (
                  <div key={i} style={{ padding:"11px 14px", borderRadius:13, background:h.bg, border:`1px solid ${h.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <p style={{ fontSize:10, color:"#94A3B8", fontWeight:600 }}>{h.label}</p>
                      <p style={{ fontSize:12, fontWeight:700, color:"#1E293B", marginTop:2 }}>{h.name}</p>
                    </div>
                    <span style={{ fontSize:14, fontWeight:900, color:h.color }}>{h.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </DashboardLayout>
  )
}
