-- ══════════════════════════════════════════════════════════════
-- TIMETABLE SYSTEM — Run in Supabase SQL editor
-- ══════════════════════════════════════════════════════════════

-- 1. Timetable coordinator requests
-- Faculty request admin approval to become timetable coordinator for their department
CREATE TABLE IF NOT EXISTS timetable_requests (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dept_id     UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  message     TEXT,                          -- optional note from faculty
  admin_note  TEXT,                          -- optional note from admin
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(faculty_id, dept_id)               -- one request per faculty per department
);

-- 2. Timetable slots
-- Created by approved coordinator, each row is one class period in a week
CREATE TABLE IF NOT EXISTS timetable_slots (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dept_id       UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  subject_id    UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week   INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Mon … 6=Sun
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  room          TEXT,
  section       TEXT DEFAULT 'A',            -- for multiple sections in same dept
  semester      INT,
  created_by    UUID REFERENCES users(id),   -- the coordinator who created it
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT no_overlap_faculty UNIQUE (faculty_id, day_of_week, start_time),
  CONSTRAINT valid_time CHECK (end_time > start_time)
);

-- Index for quick schedule lookups
CREATE INDEX IF NOT EXISTS idx_timetable_dept    ON timetable_slots(dept_id);
CREATE INDEX IF NOT EXISTS idx_timetable_faculty ON timetable_slots(faculty_id);
CREATE INDEX IF NOT EXISTS idx_timetable_day     ON timetable_slots(day_of_week);

-- Enable RLS (adapt policies to your setup)
ALTER TABLE timetable_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots    ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Anyone can read timetable_requests"
  ON timetable_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can read timetable_slots"
  ON timetable_slots FOR SELECT USING (true);

-- Allow authenticated inserts/updates (further restrict via app logic)
CREATE POLICY "Authenticated can insert timetable_requests"
  ON timetable_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update timetable_requests"
  ON timetable_requests FOR UPDATE USING (true);
CREATE POLICY "Authenticated can insert timetable_slots"
  ON timetable_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update timetable_slots"
  ON timetable_slots FOR UPDATE USING (true);
CREATE POLICY "Authenticated can delete timetable_slots"
  ON timetable_slots FOR DELETE USING (true);
