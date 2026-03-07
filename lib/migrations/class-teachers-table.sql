-- ══════════════════════════════════════════════════════════════
-- CLASS TEACHER SYSTEM — Run in Supabase SQL editor
-- ══════════════════════════════════════════════════════════════

-- 1. Class teacher assignments
-- Faculty request admin approval to become class teacher for a division
CREATE TABLE IF NOT EXISTS class_teachers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dept_id     UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  section     TEXT NOT NULL DEFAULT 'A',         -- division (A, B, C…)
  semester    INT  NOT NULL DEFAULT 1,           -- which semester
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  message     TEXT,                              -- optional note from faculty
  admin_note  TEXT,                              -- optional note from admin
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dept_id, section, semester)             -- one class teacher per division per semester
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_ct_faculty ON class_teachers(faculty_id);
CREATE INDEX IF NOT EXISTS idx_ct_dept    ON class_teachers(dept_id);
CREATE INDEX IF NOT EXISTS idx_ct_section ON class_teachers(dept_id, section, semester);

-- Enable RLS
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read class_teachers"
  ON class_teachers FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert class_teachers"
  ON class_teachers FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update class_teachers"
  ON class_teachers FOR UPDATE USING (true);
CREATE POLICY "Authenticated can delete class_teachers"
  ON class_teachers FOR DELETE USING (true);
