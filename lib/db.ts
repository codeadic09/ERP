import { createClient } from "@/lib/supabase/client"
import type {
  User, Department, Fee, Notice,
  Attendance, Assignment, Result, Payment, Subject, Registration,
  FacultySubject,
} from "@/lib/types"

// ════════════════════════════════════════════════════════
// DEPARTMENTS
// ════════════════════════════════════════════════════════

export async function getDepartments() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name")
  if (error) throw error
  return data as Department[]
}

export async function addDepartment(
  dept: Omit<Department, "id" | "created_at">
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("departments")
    .insert([dept])
    .select()
    .single()
  if (error) throw error
  return data as Department
}

export async function updateDepartment(
  id: string,
  updates: Partial<Department>
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("departments")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as Department
}

export async function deleteDepartment(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", id)
  if (error) throw error
}

// ════════════════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════════════════

export async function getUsers() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("users")
    .select(`*, departments(id, name, code, color)`)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as User[]
}

export async function getUsersByRole(
  role: "student" | "faculty" | "admin"
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("users")
    .select(`*, departments(id, name, code, color)`)
    .eq("role", role)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as User[]
}

export async function getUserById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("users")
    .select(`*, departments(id, name, code, color)`)
    .eq("id", id)
    .single()
  if (error) throw error
  return data as User
}

export async function addUser(
  user: Omit<User, "id" | "created_at" | "departments">
) {
  const res = await fetch("/api/users/create", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(user),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error)
  return json.user as User
}

export async function updateUser(
  id: string,
  updates: Partial<User>
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select(`*, departments(id, name, code, color)`)
    .single()
  if (error) throw error
  return data as User
}

export async function deleteUser(id: string, email: string) {
  const res = await fetch("/api/users/delete", {
    method:  "DELETE",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ userId: id, email }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error)
}

// ════════════════════════════════════════════════════════
// FEES
// ════════════════════════════════════════════════════════

export async function getFees() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("fees")
    .select(`*, users(id, name, email, dept_id, departments(name, code))`)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as Fee[]
}

export async function getFeesByStudent(studentId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("fees")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as Fee[]
}

export async function addFee(
  fee: Omit<Fee, "id" | "created_at" | "users">
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("fees")
    .insert([fee])
    .select(`*, users(id, name, email, departments(name, code))`)
    .single()
  if (error) throw error
  return data as Fee
}

export async function updateFee(
  id: string,
  updates: Partial<Fee>
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("fees")
    .update(updates)
    .eq("id", id)
    .select(`*, users(id, name, email, departments(name, code))`)
    .single()
  if (error) throw error
  return data as Fee
}

export async function deleteFee(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("fees")
    .delete()
    .eq("id", id)
  if (error) throw error
}

// ════════════════════════════════════════════════════════
// NOTICES
// ════════════════════════════════════════════════════════

export async function getNotices() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("notices")
    .select(`*, users(id, name)`)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as Notice[]
}

export async function getNoticesByTarget(
  target: "All" | "Students" | "Faculty"
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .in("target", [target, "All"])
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as Notice[]
}

export async function addNotice(
  notice: Omit<Notice, "id" | "created_at">
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("notices")
    .insert([notice])
    .select()
    .single()
  if (error) throw error
  return data as Notice
}

export async function updateNotice(
  id: string,
  updates: Partial<Notice>
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("notices")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as Notice
}

export async function deleteNotice(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("notices")
    .delete()
    .eq("id", id)
  if (error) throw error
}

// ════════════════════════════════════════════════════════
// ATTENDANCE
// ════════════════════════════════════════════════════════

export async function getAttendance() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("attendance")
    .select(`*, users:student_id(name, email, dept_id)`)
    .order("date", { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAttendanceByStudent(studentId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Attendance[]
}

export async function upsertAttendance(
  records: {
    student_id: string
    faculty_id: string | null
    subject:    string | null
    date:       string
    status:     "present" | "absent" | "late"
  }[]
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("attendance")
    .upsert(records, { onConflict: "student_id,date" })
    .select()
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function deleteAttendance(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("attendance")
    .delete()
    .eq("id", id)
  if (error) throw new Error(error.message)
}

// ════════════════════════════════════════════════════════
// ASSIGNMENTS
// ════════════════════════════════════════════════════════

export async function getAssignmentsByFaculty(facultyId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("assignments")
    .select(`*, departments(name, code)`)
    .eq("faculty_id", facultyId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as Assignment[]
}

export async function getAssignmentsByDept(deptId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("assignments")
    .select(`*, departments(name, code)`)
    .eq("dept_id", deptId)
    .order("due_date", { ascending: true })
  if (error) throw error
  return data as Assignment[]
}

export async function addAssignment(
  a: Omit<Assignment, "id" | "created_at">
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("assignments")
    .insert([a])
    .select()
    .single()
  if (error) throw error
  return data as Assignment
}

export async function updateAssignment(
  id: string,
  updates: Partial<Assignment>
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("assignments")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as Assignment
}

export async function deleteAssignment(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", id)
  if (error) throw error
}

// ════════════════════════════════════════════════════════
// RESULTS
// ════════════════════════════════════════════════════════

export async function getResultsByStudent(studentId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("results")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as Result[]
}

export async function getResultsByDept(deptId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("results")
    .select(`*, users:student_id(id, name, email, dept_id)`)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as Result[]
}

export async function upsertResult(
  result: Omit<Result, "id" | "created_at">
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("results")
    .upsert([result], { onConflict: "student_id,subject,exam_type" })
    .select()
    .single()
  if (error) throw error
  return data as Result
}

export async function deleteResult(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("results")
    .delete()
    .eq("id", id)
  if (error) throw error
}

// ════════════════════════════════════════════════════════
// PAYMENTS
// ════════════════════════════════════════════════════════

export async function getPaymentHistory(
  studentId: string
): Promise<Payment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

// ════════════════════════════════════════════════════════
// ADMIN STATS
// ════════════════════════════════════════════════════════

export async function getAdminStats() {
  const supabase = createClient()
  const [students, faculty, departments, fees] = await Promise.all([
    supabase.from("users").select("id", { count: "exact" }).eq("role", "student"),
    supabase.from("users").select("id", { count: "exact" }).eq("role", "faculty"),
    supabase.from("departments").select("id", { count: "exact" }),
    supabase.from("fees").select("amount, status"),
  ])

  const totalFeeCollected = fees.data
    ?.filter(f => f.status === "paid")
    .reduce((sum, f) => sum + Number(f.amount), 0) ?? 0

  const totalFeePending = fees.data
    ?.filter(f => f.status !== "paid")
    .reduce((sum, f) => sum + Number(f.amount), 0) ?? 0

  return {
    totalStudents:    students.count    ?? 0,
    totalFaculty:     faculty.count     ?? 0,
    totalDepartments: departments.count ?? 0,
    totalFeeCollected,
    totalFeePending,
  }
}

// ════════════════════════════════════════════════════════
// SUBJECTS
// ════════════════════════════════════════════════════════

export async function getSubjects() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("subjects")
    .select(`*, departments(id, name, code, color), users:faculty_id(id, name, email)`)
    .order("name")
  if (error) throw error
  return data as Subject[]
}

export async function getSubjectsByDept(deptId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("subjects")
    .select(`*, departments(id, name, code, color), users:faculty_id(id, name, email)`)
    .eq("dept_id", deptId)
    .order("name")
  if (error) throw error
  return data as Subject[]
}

export async function getSubjectsByFaculty(facultyId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("subjects")
    .select(`*, departments(id, name, code, color)`)
    .eq("faculty_id", facultyId)
    .order("name")
  if (error) throw error
  return data as Subject[]
}

export async function addSubject(
  subject: Omit<Subject, "id" | "created_at" | "departments" | "users">
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("subjects")
    .insert([subject])
    .select(`*, departments(id, name, code, color), users:faculty_id(id, name, email)`)
    .single()
  if (error) throw error
  return data as Subject
}

export async function updateSubject(
  id: string,
  updates: Partial<Omit<Subject, "id" | "created_at" | "departments" | "users">>
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("subjects")
    .update(updates)
    .eq("id", id)
    .select(`*, departments(id, name, code, color), users:faculty_id(id, name, email)`)
    .single()
  if (error) throw error
  return data as Subject
}

export async function deleteSubject(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("id", id)
  if (error) throw error
}

// ════════════════════════════════════════════════════════
// FACULTY  ↔  SUBJECTS  (many-to-many junction)
// ════════════════════════════════════════════════════════

/** All assignments */
export async function getFacultySubjects() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("faculty_subjects")
    .select(`*, users:faculty_id(id, name, email, dept_id), subjects:subject_id(id, name, code, dept_id, semester)`)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as FacultySubject[]
}

/** Subjects for one faculty member */
export async function getSubjectsByFacultyId(facultyId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("faculty_subjects")
    .select(`*, subjects:subject_id(id, name, code, dept_id, semester, departments(id, name, code, color))`)
    .eq("faculty_id", facultyId)
  if (error) throw error
  return (data ?? []).map((fs: any) => fs.subjects) as Subject[]
}

/** Faculty members for one subject */
export async function getFacultyBySubjectId(subjectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("faculty_subjects")
    .select(`*, users:faculty_id(id, name, email, dept_id)`)
    .eq("subject_id", subjectId)
  if (error) throw error
  return (data ?? []).map((fs: any) => fs.users) as User[]
}

/** Set ALL faculty for a given subject (replaces existing) */
export async function setSubjectFaculty(subjectId: string, facultyIds: string[]) {
  const supabase = createClient()
  // delete existing
  const { error: delErr } = await supabase
    .from("faculty_subjects")
    .delete()
    .eq("subject_id", subjectId)
  if (delErr) throw delErr
  // insert new
  if (facultyIds.length) {
    const rows = facultyIds.map(fid => ({ faculty_id: fid, subject_id: subjectId }))
    const { error: insErr } = await supabase
      .from("faculty_subjects")
      .insert(rows)
    if (insErr) throw insErr
  }
}

/** Set ALL subjects for a given faculty member (replaces existing) */
export async function setFacultySubjectsForUser(facultyId: string, subjectIds: string[]) {
  const supabase = createClient()
  // delete existing
  const { error: delErr } = await supabase
    .from("faculty_subjects")
    .delete()
    .eq("faculty_id", facultyId)
  if (delErr) throw delErr
  // insert new
  if (subjectIds.length) {
    const rows = subjectIds.map(sid => ({ faculty_id: facultyId, subject_id: sid }))
    const { error: insErr } = await supabase
      .from("faculty_subjects")
      .insert(rows)
    if (insErr) throw insErr
  }
}

// ════════════════════════════════════════════════════════
// REGISTRATIONS
// ════════════════════════════════════════════════════════

export async function getRegistrations() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("registrations")
    .select(`
      *,
      users:student_id(id, name, email, dept_id, semester, departments(name, code)),
      subjects:subject_id(id, name, code, semester, departments(name, code))
    `)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as Registration[]
}

export async function getRegistrationsByStudent(studentId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("registrations")
    .select(`*, subjects:subject_id(id, name, code, semester, faculty_id, departments(name, code), users:faculty_id(name))`)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as Registration[]
}

export async function addRegistration(studentId: string, subjectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("registrations")
    .insert([{ student_id: studentId, subject_id: subjectId }])
    .select()
    .single()
  if (error) throw error
  return data as Registration
}

export async function deleteRegistration(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("registrations")
    .delete()
    .eq("id", id)
  if (error) throw error
}

export async function updateRegistrationStatus(
  id: string,
  status: "approved" | "rejected"
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("registrations")
    .update({ status })
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as Registration
}

export async function updateUserSemester(id: string, semester: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("users")
    .update({ semester })
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as User
}

export async function getUserByEmail(email: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("users")
    .select("*, departments(id, name, code, color)")
    .eq("email", email)
    .single()
  if (error) return null
  return data as User
}
