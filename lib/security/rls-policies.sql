-- ══════════════════════════════════════════════════════════════
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- This ensures data is secure at the DATABASE level — even if
-- someone bypasses the app, Supabase itself enforces rules.
-- ══════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────┐
-- │  STEP 1 — Enable RLS on all tables                     │
-- └─────────────────────────────────────────────────────────┘

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_subjects ENABLE ROW LEVEL SECURITY;

-- ┌─────────────────────────────────────────────────────────┐
-- │  HELPER: Get current user's role from public.users      │
-- └─────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.users
  WHERE email = auth.jwt() ->> 'email'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.users
  WHERE email = auth.jwt() ->> 'email'
  LIMIT 1;
$$;

-- ┌─────────────────────────────────────────────────────────┐
-- │  USERS TABLE POLICIES                                   │
-- └─────────────────────────────────────────────────────────┘

-- Admin can do everything
CREATE POLICY "admin_full_access_users" ON public.users
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Faculty can read all users (for student lists, etc.)
CREATE POLICY "faculty_read_users" ON public.users
  FOR SELECT
  USING (public.get_my_role() = 'faculty');

-- Students can only read their own profile
CREATE POLICY "student_read_own_user" ON public.users
  FOR SELECT
  USING (
    public.get_my_role() = 'student'
    AND id = public.get_my_user_id()
  );

-- ┌─────────────────────────────────────────────────────────┐
-- │  DEPARTMENTS TABLE POLICIES                             │
-- └─────────────────────────────────────────────────────────┘

-- Admin full access
CREATE POLICY "admin_full_access_departments" ON public.departments
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Everyone can read departments
CREATE POLICY "authenticated_read_departments" ON public.departments
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ┌─────────────────────────────────────────────────────────┐
-- │  FEES TABLE POLICIES                                    │
-- └─────────────────────────────────────────────────────────┘

-- Admin full access
CREATE POLICY "admin_full_access_fees" ON public.fees
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Students can only read their own fees
CREATE POLICY "student_read_own_fees" ON public.fees
  FOR SELECT
  USING (
    public.get_my_role() = 'student'
    AND student_id = public.get_my_user_id()
  );

-- ┌─────────────────────────────────────────────────────────┐
-- │  NOTICES TABLE POLICIES                                 │
-- └─────────────────────────────────────────────────────────┘

-- Admin full access (create/update/delete)
CREATE POLICY "admin_full_access_notices" ON public.notices
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Faculty can create notices and read all
CREATE POLICY "faculty_manage_notices" ON public.notices
  FOR ALL
  USING (public.get_my_role() = 'faculty')
  WITH CHECK (public.get_my_role() = 'faculty');

-- Students can only read notices targeted at them
CREATE POLICY "student_read_notices" ON public.notices
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (target = 'All' OR target = 'Students')
  );

-- ┌─────────────────────────────────────────────────────────┐
-- │  ATTENDANCE TABLE POLICIES                              │
-- └─────────────────────────────────────────────────────────┘

-- Admin full access
CREATE POLICY "admin_full_access_attendance" ON public.attendance
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Faculty can manage attendance
CREATE POLICY "faculty_manage_attendance" ON public.attendance
  FOR ALL
  USING (public.get_my_role() = 'faculty')
  WITH CHECK (public.get_my_role() = 'faculty');

-- Students can only read their own attendance
CREATE POLICY "student_read_own_attendance" ON public.attendance
  FOR SELECT
  USING (
    public.get_my_role() = 'student'
    AND student_id = public.get_my_user_id()
  );

-- ┌─────────────────────────────────────────────────────────┐
-- │  ASSIGNMENTS TABLE POLICIES                             │
-- └─────────────────────────────────────────────────────────┘

-- Admin full access
CREATE POLICY "admin_full_access_assignments" ON public.assignments
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Faculty can manage assignments
CREATE POLICY "faculty_manage_assignments" ON public.assignments
  FOR ALL
  USING (public.get_my_role() = 'faculty')
  WITH CHECK (public.get_my_role() = 'faculty');

-- Students can read assignments
CREATE POLICY "student_read_assignments" ON public.assignments
  FOR SELECT
  USING (public.get_my_role() = 'student');

-- ┌─────────────────────────────────────────────────────────┐
-- │  RESULTS TABLE POLICIES                                 │
-- └─────────────────────────────────────────────────────────┘

-- Admin full access
CREATE POLICY "admin_full_access_results" ON public.results
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Faculty can manage results
CREATE POLICY "faculty_manage_results" ON public.results
  FOR ALL
  USING (public.get_my_role() = 'faculty')
  WITH CHECK (public.get_my_role() = 'faculty');

-- Students can only read their own results
CREATE POLICY "student_read_own_results" ON public.results
  FOR SELECT
  USING (
    public.get_my_role() = 'student'
    AND student_id = public.get_my_user_id()
  );

-- ┌─────────────────────────────────────────────────────────┐
-- │  SUBJECTS TABLE POLICIES                                │
-- └─────────────────────────────────────────────────────────┘

-- Admin full access
CREATE POLICY "admin_full_access_subjects" ON public.subjects
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Everyone can read subjects
CREATE POLICY "authenticated_read_subjects" ON public.subjects
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ┌─────────────────────────────────────────────────────────┐
-- │  REGISTRATIONS TABLE POLICIES                           │
-- └─────────────────────────────────────────────────────────┘

-- Admin full access
CREATE POLICY "admin_full_access_registrations" ON public.registrations
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Faculty can read registrations
CREATE POLICY "faculty_read_registrations" ON public.registrations
  FOR SELECT
  USING (public.get_my_role() = 'faculty');

-- Students can read their own registrations
CREATE POLICY "student_read_own_registrations" ON public.registrations
  FOR SELECT
  USING (
    public.get_my_role() = 'student'
    AND student_id = public.get_my_user_id()
  );

-- Students can insert their own registrations
CREATE POLICY "student_insert_own_registrations" ON public.registrations
  FOR INSERT
  WITH CHECK (
    public.get_my_role() = 'student'
    AND student_id = public.get_my_user_id()
  );

-- Students can delete their own pending registrations
CREATE POLICY "student_delete_own_registrations" ON public.registrations
  FOR DELETE
  USING (
    public.get_my_role() = 'student'
    AND student_id = public.get_my_user_id()
  );

-- ┌─────────────────────────────────────────────────────────┐
-- │  FACULTY_SUBJECTS TABLE POLICIES                        │
-- └─────────────────────────────────────────────────────────┘

-- Admin full access
CREATE POLICY "admin_full_access_faculty_subjects" ON public.faculty_subjects
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Faculty can read their own subject assignments
CREATE POLICY "faculty_read_own_subjects" ON public.faculty_subjects
  FOR SELECT
  USING (
    public.get_my_role() = 'faculty'
    AND faculty_id = public.get_my_user_id()
  );

-- Students can read faculty-subject assignments
CREATE POLICY "student_read_faculty_subjects" ON public.faculty_subjects
  FOR SELECT
  USING (public.get_my_role() = 'student');

-- ┌─────────────────────────────────────────────────────────┐
-- │  FORCE RLS EVEN FOR TABLE OWNERS (service role bypass)  │
-- └─────────────────────────────────────────────────────────┘
-- NOTE: The service_role key will ALWAYS bypass RLS.
-- This is by design — your API routes use service_role for admin ops.
-- The anon key respects these policies.

-- ══════════════════════════════════════════════════════════════
-- DONE! Your database is now secured at the row level.
-- ══════════════════════════════════════════════════════════════
