# Supabase RLS Setup Instructions

**Task:** Enable Row Level Security on all tables with comprehensive policies

**Date:** 2026-04-17

## Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: **rtlwe263** (eu-west-2 London)
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

## Step 2: Run the Schema SQL

1. Open the file: `supabase/schema.sql`
2. Copy the ENTIRE contents of the file
3. Paste into the Supabase SQL Editor
4. Click **Run** button (or press Cmd/Ctrl + Enter)

**Expected result:** "Success. No rows returned"

## Step 3: Verify RLS Policies

### Check Table Editor

1. Go to **Table Editor** in the left sidebar
2. For each table, verify the shield icon shows **RLS enabled**:
   - hero_slides
   - gallery_images
   - tablers
   - site_settings
   - programme_events
   - guestbook_entries
   - media_files
   - consent_log

**CRITICAL:** No table should show "UNRESTRICTED"

### Check Policies

1. Click on any table (e.g., `guestbook_entries`)
2. Click the **Policies** tab at the top
3. Verify policies are listed:
   - `Public can submit guestbook entries` (INSERT for anon)
   - `Public read approved guestbook entries` (SELECT for anon)
   - `Authenticated manage guestbook entries` (ALL for authenticated)

Repeat for other tables to verify policies match the schema.

## Step 4: Verify Storage Buckets

### Check Gallery Bucket

1. Go to **Storage** in the left sidebar
2. Click on **gallery** bucket
3. Click **Policies** tab
4. Verify 3 policies exist:
   - `Public gallery reads` (SELECT for anon)
   - `Admin gallery uploads` (INSERT for authenticated)
   - `Admin gallery deletes` (DELETE for authenticated)

### Check Site-Media Bucket

1. In **Storage**, verify **site-media** bucket exists
2. Click on **site-media** bucket
3. Click **Policies** tab
4. Verify 3 policies exist:
   - `Public site-media reads` (SELECT for anon)
   - `Admin site-media uploads` (INSERT for authenticated)
   - `Admin site-media deletes` (DELETE for authenticated)

**If site-media bucket doesn't exist:** The SQL created it automatically. Refresh the page.

## Step 5: Verify Constraints

### Test Guestbook Constraints

1. Go to **Table Editor** → **guestbook_entries**
2. Click **Insert row**
3. Try to insert invalid data (e.g., name = "A" - too short)
4. Click **Save**

**Expected result:** Error message "new row violates check constraint"

This confirms constraints are working.

### Check Constraint Details

Run this SQL to see all constraints:

```sql
SELECT
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid::regclass::text IN (
  'guestbook_entries',
  'gallery_images',
  'hero_slides'
)
AND contype = 'c'
ORDER BY table_name, conname;
```

**Expected constraints:**
- `guestbook_entries`: name_length, club_length, message_length
- `gallery_images`: caption_length
- `hero_slides`: caption_length

## Step 6: Test RLS Policies

### Test Anonymous Access

Run this SQL to simulate anonymous user:

```sql
-- Switch to anon role
SET ROLE anon;

-- Should work: Read active gallery images
SELECT * FROM gallery_images WHERE active = true LIMIT 5;

-- Should work: Read approved guestbook entries
SELECT * FROM guestbook_entries WHERE status = 'approved' LIMIT 5;

-- Should FAIL: Read pending guestbook entries
SELECT * FROM guestbook_entries WHERE status = 'pending' LIMIT 5;

-- Should FAIL: Delete gallery image
DELETE FROM gallery_images WHERE id = (SELECT id FROM gallery_images LIMIT 1);

-- Reset role
RESET ROLE;
```

**Expected results:**
- First two queries: Return data (or empty if no data)
- Third query: Return empty (RLS filters out pending entries)
- Fourth query: Error "permission denied for table gallery_images"

### Test Authenticated Access

1. Go to **Authentication** → **Users**
2. Create a test admin user if needed:
   - Click **Add user**
   - Email: test@example.com
   - Password: (strong password)
   - Confirm email: Check the box
   - Click **Create user**

3. In SQL Editor, run:

```sql
-- This simulates authenticated user access
-- (In real app, this happens automatically via Supabase client)

-- Should work: Read all guestbook entries (including pending)
SELECT COUNT(*) FROM guestbook_entries;

-- Should work: Update gallery image
UPDATE gallery_images 
SET active = false 
WHERE id = (SELECT id FROM gallery_images LIMIT 1);
```

**Expected result:** Both queries succeed (authenticated has full access)

## Step 7: Verify Consent Log Table

Run this SQL:

```sql
-- Check consent_log table exists
SELECT * FROM consent_log LIMIT 5;

-- Check constraint works
INSERT INTO consent_log (session_id, consent_given, consent_type)
VALUES ('test-session', true, 'invalid-type');
```

**Expected results:**
- First query: Returns empty (or existing data)
- Second query: Error "violates check constraint" (invalid consent_type)

Valid consent_type values: 'essential', 'all', 'custom'

## Step 8: Final Security Check

Run this comprehensive check:

```sql
-- List all tables with RLS status
SELECT 
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'hero_slides',
  'gallery_images',
  'tablers',
  'site_settings',
  'programme_events',
  'guestbook_entries',
  'media_files',
  'consent_log'
)
ORDER BY tablename;
```

**Expected result:** ALL tables show `rls_status = 'ENABLED'`

## Troubleshooting

### Issue: "relation already exists" error

**Cause:** Table or policy already exists from previous run

**Fix:** The schema uses `IF NOT EXISTS` and `DROP POLICY IF EXISTS`, so this shouldn't happen. If it does, manually drop the conflicting object first.

### Issue: "permission denied" when testing

**Cause:** RLS is working correctly! This is expected for unauthorized operations.

**Fix:** This is not a bug - it proves RLS is protecting your data.

### Issue: site-media bucket not created

**Cause:** Rare SQL execution issue

**Fix:** Create manually:
1. Go to Storage
2. Click **New bucket**
3. Name: `site-media`
4. Public: **ON**
5. Click **Create**
6. Then run just the storage policy SQL from schema.sql

### Issue: Constraints not working

**Cause:** Constraint names might conflict

**Fix:** The schema uses `IF NOT EXISTS` for constraints, so they won't be added if they already exist. Drop existing constraints manually if needed:

```sql
ALTER TABLE guestbook_entries DROP CONSTRAINT IF EXISTS name_length;
ALTER TABLE guestbook_entries DROP CONSTRAINT IF EXISTS club_length;
ALTER TABLE guestbook_entries DROP CONSTRAINT IF EXISTS message_length;
-- Then re-run the schema.sql
```

## Success Criteria

**Before proceeding, verify:**

- [ ] All 8 tables show "RLS ENABLED" in Table Editor
- [ ] consent_log table exists with 5 columns
- [ ] site-media bucket exists with 3 policies
- [ ] gallery bucket has 3 policies
- [ ] Constraints prevent invalid data (tested)
- [ ] Anonymous users can read approved entries (tested)
- [ ] Anonymous users cannot read pending entries (tested)
- [ ] Anonymous users cannot delete data (tested)
- [ ] No "UNRESTRICTED" tables in database

## Next Steps

After successful verification:

1. Test locally with the frontend code
2. Verify guestbook submission works
3. Verify admin login and CMS functions
4. Deploy to production

## Support

If issues persist:
- Check Supabase logs: Dashboard → Logs → Postgres Logs
- Review RLS guide: https://supabase.com/docs/guides/auth/row-level-security
- Contact: london.westend@roundtable.org.uk
