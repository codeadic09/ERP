-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION: Subject-wise Attendance
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Fill in NULLs so we can make column NOT NULL
UPDATE attendance SET subject = 'General' WHERE subject IS NULL OR subject = '';

-- 2. Drop old unique constraint (student_id, date) — only 1 record per student/day
--    (The constraint name may differ; try both common patterns)
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_student_id_date_key;
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_student_id_date_unique;

-- If the constraint was created inline, find and drop it:
DO $$
DECLARE
  cname TEXT;
BEGIN
  SELECT constraint_name INTO cname
    FROM information_schema.table_constraints
   WHERE table_name = 'attendance'
     AND constraint_type = 'UNIQUE'
     AND constraint_name LIKE '%student_id%date%'
   LIMIT 1;
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE attendance DROP CONSTRAINT %I', cname);
  END IF;
END $$;

-- 3. Make subject NOT NULL with default
ALTER TABLE attendance ALTER COLUMN subject SET DEFAULT 'General';
ALTER TABLE attendance ALTER COLUMN subject SET NOT NULL;

-- 4. New unique constraint: one record per student, per date, per subject
ALTER TABLE attendance
  ADD CONSTRAINT attendance_student_date_subject_key
  UNIQUE (student_id, date, subject);

-- 5. Update RLS policy for attendance if needed (students read own rows)
-- (existing policies should still work since columns haven't changed)

-- ═══════════════════════════════════════════════════════════════════
-- VERIFY
-- ═══════════════════════════════════════════════════════════════════
-- SELECT constraint_name, constraint_type
--   FROM information_schema.table_constraints
--  WHERE table_name = 'attendance';
