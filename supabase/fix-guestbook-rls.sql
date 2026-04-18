-- Emergency Fix: Enable RLS and Clean Test Data
-- Run this in Supabase SQL Editor if guestbook entries showing without approval

-- 1. Enable RLS (if not already enabled)
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;

-- 2. Ensure policies exist (re-create them)
DROP POLICY IF EXISTS "Public can submit guestbook entries" ON guestbook_entries;
CREATE POLICY "Public can submit guestbook entries"
  ON guestbook_entries FOR INSERT TO anon
  WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "Public read approved guestbook entries" ON guestbook_entries;
CREATE POLICY "Public read approved guestbook entries"
  ON guestbook_entries FOR SELECT TO anon
  USING (status = 'approved');

DROP POLICY IF EXISTS "Authenticated manage guestbook entries" ON guestbook_entries;
CREATE POLICY "Authenticated manage guestbook entries"
  ON guestbook_entries FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 3. Set all existing entries to 'pending' (requires admin approval)
UPDATE guestbook_entries
SET status = 'pending'
WHERE status = 'approved' OR status IS NULL;

-- 4. Add constraints to prevent future issues
ALTER TABLE guestbook_entries
ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE guestbook_entries
ALTER COLUMN status SET NOT NULL;

DROP CONSTRAINT IF EXISTS valid_status ON guestbook_entries;
ALTER TABLE guestbook_entries
ADD CONSTRAINT valid_status
CHECK (status IN ('pending', 'approved', 'rejected'));

-- 5. Verify everything is set up correctly
SELECT
  'RLS Status' as check_type,
  CASE WHEN rowsecurity THEN 'ENABLED ✅' ELSE 'DISABLED ❌' END as status
FROM pg_tables
WHERE tablename = 'guestbook_entries'

UNION ALL

SELECT
  'Total Entries',
  COUNT(*)::text
FROM guestbook_entries

UNION ALL

SELECT
  'Pending Entries',
  COUNT(*)::text
FROM guestbook_entries WHERE status = 'pending'

UNION ALL

SELECT
  'Approved Entries',
  COUNT(*)::text
FROM guestbook_entries WHERE status = 'approved'

UNION ALL

SELECT
  'Policy Count',
  COUNT(*)::text
FROM pg_policies
WHERE tablename = 'guestbook_entries';

-- Expected output:
-- RLS Status: ENABLED ✅
-- Total Entries: (your count)
-- Pending Entries: (entries waiting approval)
-- Approved Entries: 0 (or only legitimately approved ones)
-- Policy Count: 3 (must be 3)
