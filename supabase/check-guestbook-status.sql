-- Diagnostic: Check guestbook entries and RLS status
-- Run this in Supabase SQL Editor to see what's actually in the database

-- 1. Check if RLS is enabled
SELECT
  'RLS ENABLED?' as check_name,
  CASE WHEN rowsecurity THEN '✅ YES' ELSE '❌ NO - THIS IS THE PROBLEM!' END as result
FROM pg_tables
WHERE tablename = 'guestbook_entries';

-- 2. Count policies (should be 3)
SELECT
  'POLICY COUNT' as check_name,
  COUNT(*)::text || ' policies (should be 3)' as result
FROM pg_policies
WHERE tablename = 'guestbook_entries';

-- 3. Show ALL entries with their status
SELECT
  id,
  name,
  club,
  LEFT(message, 50) as message_preview,
  status,
  created_at
FROM guestbook_entries
ORDER BY created_at DESC;

-- 4. Test what anonymous users can see (this is what the public sees)
SET ROLE anon;
SELECT
  'ENTRIES VISIBLE TO PUBLIC' as info,
  COUNT(*) as count
FROM guestbook_entries;

SELECT
  name,
  club,
  status,
  'THIS IS WHAT PUBLIC SEES' as note
FROM guestbook_entries;

-- Reset to admin role
RESET ROLE;
