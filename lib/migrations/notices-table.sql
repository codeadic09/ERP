-- ═══════════════════════════════════════════════════════════════
-- NOTICES TABLE
-- Run this in Supabase SQL Editor (one‑time)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notices (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT,
  target      TEXT NOT NULL DEFAULT 'All'
              CHECK (target IN ('All', 'Students', 'Faculty')),
  pinned      BOOLEAN NOT NULL DEFAULT false,
  urgent      BOOLEAN NOT NULL DEFAULT false,
  priority    TEXT DEFAULT 'medium'
              CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for target-based filtering
CREATE INDEX IF NOT EXISTS idx_notices_target     ON notices(target);
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_created_by ON notices(created_by);

-- RLS
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Everyone can read notices
CREATE POLICY "notices_read" ON notices
  FOR SELECT USING (true);

-- Only admin and faculty can insert
CREATE POLICY "notices_insert" ON notices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'faculty')
    )
  );

-- Only admin can update/delete
CREATE POLICY "notices_update" ON notices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

CREATE POLICY "notices_delete" ON notices
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (users.role = 'admin' OR users.id = notices.created_by)
    )
  );
