export type Role         = "student" | "faculty" | "admin"
export type UserStatus   = "active"  | "inactive"
export type FeeStatus    = "paid"    | "pending"  | "overdue"
export type NoticeTarget = "All"     | "Students" | "Faculty"

export interface Department {
  id:          string
  name:        string
  code:        string
  head:        string | null
  description: string | null
  status:      UserStatus
  color:       string
  established: string | null
  created_at:  string
}

export interface User {
  id:          string
  name:        string
  email:       string
  password:    string | null
  role:        Role
  dept_id:     string | null
  phone:       string | null
  status:      UserStatus
  enrolled_at: string
  created_at:  string
  semester?:   number | null   // ← add this
  departments?: Department
}


export interface Fee {
  id:          string
  student_id:  string
  amount:      number
  status:      FeeStatus
  due_date:    string | null
  paid_date:   string | null
  description: string | null
  created_at:  string
  users?:      User
}

export interface Notice {
  id:         string
  title:      string
  content:    string | null
  target:     NoticeTarget
  pinned:     boolean
  urgent:     boolean
  priority:   string | null
  created_by: string | null
  created_at: string
}

export interface Attendance {
  id:         string
  student_id: string
  faculty_id: string | null
  subject:    string | null
  status:     "present" | "absent" | "late"
  date:       string
  created_at: string
  users?: {
    name:    string
    email:   string
    dept_id: string
  }
}


export interface Assignment {
  id:          string
  title:       string
  description: string | null
  faculty_id:  string | null
  dept_id:     string | null
  due_date:    string | null
  created_at:  string
}

export interface Result {
  id:          string
  student_id:  string
  subject:     string
  score:       number
  total_marks: number
  grade:       string | null
  exam_type:   string | null
  created_at:  string
}

export interface Payment {
  id:         string
  student_id: string
  amount:     number
  date:       string
  method?:    string
  ref_no?:    string
  status?:    string
}

export interface Subject {
  id:         string
  name:       string
  code:       string
  dept_id:    string
  faculty_id: string | null
  semester:   number | null
  created_at: string
  departments?: Department
  users?:       User        // assigned faculty
}


export interface FacultySubject {
  id:         string
  faculty_id: string
  subject_id: string
  created_at: string
  users?:     User
  subjects?:  Subject
}

export interface Registration {
  id:         string
  student_id: string
  subject_id: string
  status:     "pending" | "approved" | "rejected"
  created_at: string
  users?:     User
  subjects?:  Subject
}

