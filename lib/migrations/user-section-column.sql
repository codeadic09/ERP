-- ══════════════════════════════════════════════════════════════
-- ADD SECTION COLUMN TO USERS — Run in Supabase SQL editor
-- ══════════════════════════════════════════════════════════════
-- Allows students to have a division/section (A, B, C, etc.)
-- The student timetable page auto-filters by section + semester.

ALTER TABLE users ADD COLUMN IF NOT EXISTS section TEXT DEFAULT NULL;

-- Optional: Add some sample sections for existing students
-- UPDATE users SET section = 'A' WHERE role = 'student' AND section IS NULL;

COMMENT ON COLUMN users.section IS 'Division/section for students (e.g. A, B, C). Used for auto-filtering timetable.';
