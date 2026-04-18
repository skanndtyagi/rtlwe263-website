# Fix: Unapproved Guestbook Entries Showing Publicly

## Problem

Test entries (like "James Bond · 007") are showing on the public guestbook even though they haven't been approved by admin.

## Root Cause

One of these issues:

1. **RLS policy not enabled** - The Row Level Security policy exists in schema.sql but might not be enabled in Supabase
2. **Old test data** - Entries created with status='approved' before moderation system was in place
3. **Missing status column** - Entry created without a status value (defaults to NULL)

## Fix Steps

### Step 1: Check RLS is Enabled in Supabase

1. Go to https://supabase.com/dashboard
2. Open project: `tvshplxcgdfzvtxvqzvl`
3. Go to **Table Editor** → `guestbook_entries`
4. Look at the top right - should say **"RLS Enabled"**
5. If it says **"UNRESTRICTED"** → RLS is OFF!

### Step 2: Verify RLS Policies Exist

1. In Supabase, go to **Authentication** → **Policies**
2. Find table: `guestbook_entries`
3. Should have 3 policies:
   - ✅ "Public can submit guestbook entries" (INSERT, anon)
   - ✅ "Public read approved guestbook entries" (SELECT, anon, WHERE status='approved')
   - ✅ "Authenticated manage guestbook entries" (ALL, authenticated)

### Step 3: Check Existing Entry Status

Run this SQL in **SQL Editor**:

```sql
-- Check all guestbook entries and their status
SELECT id, name, club, message, status, created_at 
FROM guestbook_entries 
ORDER BY created_at DESC;
```

Look for the "James Bond" entry. What's its status?

- If status = 'approved' → Entry was approved (somehow)
- If status = 'pending' → RLS is NOT working
- If status = NULL → Status column is missing value

### Step 4: Fix Based on Results

#### If RLS is disabled:

Run this in SQL Editor:

```sql
-- Enable RLS on guestbook_entries
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'guestbook_entries';
-- Should show: rowsecurity = true
```

#### If policies are missing:

Run the complete RLS setup from `supabase/schema.sql` (lines with guestbook policies):

```sql
drop policy if exists "Public can submit guestbook entries" on guestbook_entries;
create policy "Public can submit guestbook entries"
  on guestbook_entries for insert to anon
  with check (status = 'pending');

drop policy if exists "Public read approved guestbook entries" on guestbook_entries;
create policy "Public read approved guestbook entries"
  on guestbook_entries for select to anon
  using (status = 'approved');

drop policy if exists "Authenticated manage guestbook entries" on guestbook_entries;
create policy "Authenticated manage guestbook entries"
  on guestbook_entries for all to authenticated
  using (true) with check (true);
```

#### If test entries exist with status='approved':

**Option A: Delete all test entries:**

```sql
-- Delete all guestbook entries (CAREFUL!)
DELETE FROM guestbook_entries WHERE status IS NOT NULL;
```

**Option B: Reset specific test entry to pending:**

```sql
-- Find the James Bond entry ID first
SELECT id, name, status FROM guestbook_entries WHERE name LIKE '%Bond%';

-- Reset it to pending
UPDATE guestbook_entries 
SET status = 'pending' 
WHERE name = 'James Bond';
```

**Option C: Delete just test entries:**

```sql
-- Delete obvious test entries
DELETE FROM guestbook_entries 
WHERE name IN ('James Bond', 'Test User', 'Test Tabler')
   OR club LIKE '%test%'
   OR club = '007';
```

### Step 5: Verify Fix

1. Go to https://www.lwe623.uk
2. Scroll to "The Visiting Book" section
3. Check "Recent Entries" sidebar
4. **Should be empty** or show only approved entries

### Step 6: Test Flow

1. Submit a new test entry from public site
2. Should see success message: "Thank you! Your entry is awaiting approval."
3. Entry should NOT appear in "Recent Entries"
4. Log in to admin panel
5. Go to Guestbook panel
6. Entry should appear in "Pending" section
7. Click "Approve"
8. Entry moves to "Approved" section
9. Refresh public site → Entry now appears

## Prevention

To prevent this in future:

### Add Database Constraint

Run in SQL Editor:

```sql
-- Ensure status column always has a value
ALTER TABLE guestbook_entries 
ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE guestbook_entries 
ALTER COLUMN status SET NOT NULL;

-- Add check constraint
ALTER TABLE guestbook_entries
DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE guestbook_entries
ADD CONSTRAINT valid_status 
CHECK (status IN ('pending', 'approved', 'rejected'));
```

This ensures:
- All new entries default to 'pending'
- Status can never be NULL
- Status must be one of the 3 valid values

## Quick Check Command

Run this to quickly see the state:

```sql
-- Quick diagnostic
SELECT 
  (SELECT count(*) FROM guestbook_entries WHERE status = 'pending') as pending_count,
  (SELECT count(*) FROM guestbook_entries WHERE status = 'approved') as approved_count,
  (SELECT count(*) FROM guestbook_entries WHERE status = 'rejected') as rejected_count,
  (SELECT count(*) FROM guestbook_entries WHERE status IS NULL) as null_status_count,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'guestbook_entries') as rls_enabled;
```

Expected result:
- `pending_count`: 0 or more (waiting for approval)
- `approved_count`: 0 or more (visible on site)
- `rejected_count`: 0 or more (rejected)
- `null_status_count`: **0** (should be zero!)
- `rls_enabled`: **true** (MUST be true!)

---

## Most Likely Issue

Based on the symptoms, the most likely cause is:

**The schema was created but RLS was not enabled.**

This happens if you created the table before running the `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` command.

**Quick Fix:**

```sql
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;
```

Then delete test entries and refresh the site.
