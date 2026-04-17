# Supabase Migration with GDPR and Security - Complete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate RTLWE263 website from localStorage to production-ready Supabase backend with RLS, GDPR compliance, and working guestbook.

**Architecture:** Four sequential phases - (1) Database security with RLS policies, (2) Guestbook + GDPR compliance, (3) Admin CMS with Supabase Auth, (4) Testing and hooks.

**Tech Stack:** Supabase (PostgreSQL + Auth + Storage), Vanilla JavaScript, HTML5, CSS3, Vercel

**Reference:** Complete design spec at `docs/superpowers/specs/2026-04-17-supabase-migration-gdpr-security-design.md`

---

## File Structure

### Files to Create
- `privacy.html` - GDPR privacy policy (10 sections)
- `js/cookie-consent.js` - Consent banner logic
- `css/cookie-consent.css` - Consent banner styles
- `css/privacy.css` - Privacy page styles
- `supabase/storage-policies.sql` - Storage bucket policies
- `.claude/hooks/pre-commit.sh` - Security checks
- `.claude/hooks/pre-push.sh` - Test validation

### Files to Modify
- `supabase/schema.sql` - Add RLS policies + consent_log table
- `index.html` - Add consent banner, update guestbook
- `script.js` - Remove localStorage, add Supabase
- `admin.html` - Update CMS panels
- `admin.js` - Replace auth, add Supabase CRUD
- `admin-login.js` - Supabase Auth
- `styles.css` - Consent + privacy styles
- `vercel.json` - Security headers

---

## PHASE 1: Security Foundation (~1-2 hours)

### Task 1: Enable Row Level Security on All Tables

**Goal:** Fix critical security vulnerability where all tables show "UNRESTRICTED"

**Reference:** Design spec sections "Database Schema & Security" and "Supabase Guidelines"

- [ ] **Add consent_log table to supabase/schema.sql**
  - UUID primary key
  - session_id, consent_given, consent_type, timestamp fields
  - CHECK constraint on consent_type enum

- [ ] **Add RLS policies for content tables (gallery_images, hero_slides, programme_events, tablers, site_settings)**
  - Pattern: Public read active records, admin full access
  - Enable RLS: `ALTER TABLE [name] ENABLE ROW LEVEL SECURITY`
  - Policy 1: anon SELECT where active=true
  - Policy 2: authenticated full access

- [ ] **Add RLS policies for guestbook_entries (moderation flow)**
  - anon can INSERT with status='pending'
  - anon can SELECT where status='approved'
  - authenticated full access

- [ ] **Add RLS policies for admin-only tables (media_files, consent_log)**
  - consent_log: anon INSERT, authenticated SELECT
  - media_files: authenticated only

- [ ] **Add database constraints for validation**
  - guestbook: name 2-60 chars, club 2-80 chars, message 10-400 chars
  - gallery: caption max 200 chars
  - hero: caption max 100 chars

- [ ] **Run schema in Supabase SQL Editor**
  - Copy updated schema.sql
  - Execute in Supabase dashboard → SQL Editor
  - Verify "Success. No rows returned"

- [ ] **Verify RLS enabled in Table Editor**
  - Check all 8 tables show "RLS Enabled" (not "UNRESTRICTED")

- [ ] **Commit schema changes**

```bash
git commit -m "feat(security): enable RLS on all tables with comprehensive policies"
```

### Task 2: Add Storage Bucket Policies

**Goal:** Secure image uploads with proper access controls

- [ ] **Create supabase/storage-policies.sql**
  - gallery bucket: public read, admin upload/delete
  - site-media bucket: public read, admin upload/delete
  - 6 total policies (3 per bucket)

- [ ] **Run in Supabase SQL Editor**

- [ ] **Verify in Storage dashboard**
  - Each bucket shows 3 policies

- [ ] **Commit**

```bash
git commit -m "feat(security): add storage bucket access policies"
```

### Task 3: Create Admin User

**Goal:** Set up admin account for testing

- [ ] **Create user in Supabase Auth dashboard**
  - Email: [to be provided]
  - Strong password (12+ chars)
  - Auto-confirm email

- [ ] **Document credentials in CLAUDE.md**

---

## PHASE 2: Guestbook + GDPR (~2-3 hours)

### Task 4: Create Privacy Policy Page

**Goal:** GDPR Article 13 compliance

**Reference:** Design spec section "Privacy Policy Page"

- [ ] **Create privacy.html with 10 required sections**
  1. Data Controller identity
  2. What data we collect
  3. Legal basis for processing
  4. How we use data
  5. Data retention periods
  6. Data sharing (Supabase, Vercel)
  7. User rights (GDPR Articles 15-22)
  8. How to exercise rights
  9. Data security measures
  10. Policy change notification

- [ ] **Create css/privacy.css**
  - Privacy page specific styling
  - Mobile responsive

- [ ] **Add privacy link to footer**
  - index.html footer
  - admin.html footer

- [ ] **Test locally**
  - All sections render
  - Links work
  - Mobile responsive

- [ ] **Commit**

```bash
git commit -m "feat(gdpr): add comprehensive privacy policy page"
```

### Task 5: Implement Cookie Consent Banner

**Goal:** GDPR consent before data processing

**Reference:** Design spec section "Cookie Consent Banner"

- [ ] **Create js/cookie-consent.js**
  - hasConsent(type) function
  - showConsentBanner() function
  - acceptAllCookies() function
  - acceptEssentialOnly() function
  - logConsentToSupabase() function
  - 13-month expiry (GDPR max)

- [ ] **Create css/cookie-consent.css**
  - Fixed bottom banner
  - Slide-up animation
  - Mobile responsive
  - Three buttons: Accept All, Essential Only, Learn More

- [ ] **Add to index.html**
  - Link CSS in head
  - Link JS before closing body
  - Load order: supabase-config → supabase-client → cookie-consent → script

- [ ] **Test consent flow**
  - Clear localStorage
  - Banner appears on first visit
  - Accept All → banner disappears, consent stored
  - Reload → banner stays hidden
  - Clear localStorage
  - Essential Only → banner disappears, limited consent stored
  - Verify consent logged to Supabase consent_log table

- [ ] **Commit**

```bash
git commit -m "feat(gdpr): implement cookie consent banner with audit logging"
```

### Task 6: Wire Guestbook to Supabase

**Goal:** Fix broken guestbook feature

**Reference:** Design spec section "Guestbook Backend Integration"

- [ ] **Update index.html guestbook form**
  - Add HTML5 validation (required, minlength, maxlength, pattern)
  - Add character counter for message
  - Add status message div

- [ ] **Add to script.js:**
  - checkRateLimit() - max 3 per hour
  - submitGuestbookEntry() - INSERT to Supabase
  - loadGuestbookEntries() - SELECT approved entries
  - renderGuestbookEntries() - display with escapeHtml()
  - escapeHtml() - XSS prevention
  - formatDate() - human-readable dates
  - initMessageCounter() - character counter

- [ ] **Initialize on DOMContentLoaded**
  - Load approved entries
  - Attach form submit handler
  - Init character counter

- [ ] **Test submission flow**
  - Accept cookies
  - Fill form with test data
  - Submit → success message
  - Check Supabase dashboard → entry with status='pending'
  - Entry does NOT appear on public site yet

- [ ] **Test rate limiting**
  - Submit 3 entries → all succeed
  - Submit 4th → "Rate limit exceeded" error

- [ ] **Test XSS prevention**
  - Submit entry with `<script>alert('xss')</script>` in message
  - Should be escaped and displayed as text

- [ ] **Commit**

```bash
git commit -m "feat(guestbook): wire to Supabase with validation and rate limiting"
```

---

## PHASE 3: Admin CMS Migration (~2-3 hours)

### Task 7: Replace Admin Auth with Supabase

**Goal:** Secure admin authentication

**Reference:** Design spec section "Authentication System"

- [ ] **Replace admin-login.js**
  - Remove localStorage auth code
  - Add checkExistingSession() - redirect if logged in
  - Add handleAdminLogin() - Supabase Auth signInWithPassword
  - Add showLoginError() - display error messages

- [ ] **Update admin.js**
  - Remove localStorage auth
  - Add requireAuth() - check Supabase session, redirect if not authed
  - Add signOut() - Supabase Auth signOut
  - Call requireAuth() on DOMContentLoaded

- [ ] **Update admin-login.html**
  - Add error message div

- [ ] **Test login flow**
  - Invalid credentials → error message
  - Valid credentials → redirect to dashboard
  - Refresh dashboard → stay logged in
  - Close browser → reopen dashboard → redirect to login

- [ ] **Commit**

```bash
git commit -m "feat(admin): replace localStorage auth with Supabase Auth"
```

### Task 8: Guestbook Moderation Panel

**Goal:** Admin can approve/reject entries

- [ ] **Update admin.html**
  - Add pending entries list
  - Add approved entries list
  - Add pending count badge

- [ ] **Add to admin.js:**
  - loadPendingEntries() - SELECT where status='pending'
  - loadApprovedEntries() - SELECT where status='approved'
  - approveEntry(id) - UPDATE status='approved', approved_at=now
  - rejectEntry(id) - UPDATE status='rejected'
  - subscribeToGuestbookChanges() - real-time subscription
  - Call in loadDashboard()

- [ ] **Test moderation**
  - Submit entry from public site
  - Entry appears in admin pending list
  - Click Approve → moves to approved list
  - Public site shows entry

- [ ] **Commit**

```bash
git commit -m "feat(admin): add guestbook moderation panel with real-time updates"
```

### Task 9-12: Other Admin Panels

**Goal:** Complete CMS migration for all content types

**Reference:** Design spec section "Admin Dashboard Panels"

For each panel (hero slides, gallery, programme events, tablers, site settings):

- [ ] **Update admin.html with panel HTML**
- [ ] **Add CRUD functions to admin.js**
  - load[Panel]() - SELECT from Supabase
  - add[Item]() - INSERT to Supabase
  - update[Item]() - UPDATE in Supabase
  - delete[Item]() - DELETE from Supabase
  - For images: upload to Storage, get publicUrl, save to database
- [ ] **Test CRUD operations**
- [ ] **Commit each panel separately**

Note: These follow the same pattern. Implement one at a time with full testing.

---

## PHASE 4: Testing & Hardening (~1-2 hours)

### Task 13: Security Headers

**Goal:** Add CSP and HSTS headers

- [ ] **Update vercel.json**
  - Add Content-Security-Policy header
  - Add Strict-Transport-Security header (HSTS)
  - Restrict script-src, style-src, img-src to trusted domains

- [ ] **Test headers**
  - Deploy to Vercel
  - Check response headers in DevTools Network tab

- [ ] **Commit**

```bash
git commit -m "feat(security): add CSP and HSTS headers"
```

### Task 14: Set Up Pre-Commit Hook

**Goal:** Automated security checks

**Reference:** User instruction "use hooks for token optimization"

- [ ] **Use update-config skill to create pre-commit hook**
  - Check for credentials in diff (API keys, passwords)
  - Validate no console.log in production code
  - Check for unsafe DOM methods
  - Ensure all new files have proper headers

- [ ] **Test hook**
  - Try to commit file with "PASSWORD=secret"
  - Hook should block commit

- [ ] **Commit hook config**

### Task 15: Set Up Pre-Push Hook

**Goal:** Verify tests pass before deployment

- [ ] **Use update-config skill to create pre-push hook**
  - Run local server test (smoke test)
  - Verify Supabase connection works
  - Check no console errors on index.html load

- [ ] **Test hook**
  - Make a change
  - git push
  - Hook runs checks before push

- [ ] **Commit hook config**

### Task 16: Comprehensive Manual Testing

**Goal:** Full QA before production deployment

**Reference:** Design spec section "Testing Strategy"

Test checklist (run locally on http://localhost:8000):

**Public Site:**
- [ ] Homepage loads without errors
- [ ] All sections render
- [ ] Cookie banner appears (clear localStorage first)
- [ ] Privacy policy page loads
- [ ] Guestbook form works
- [ ] Mobile responsive

**Guestbook:**
- [ ] Form validation works
- [ ] Submission succeeds
- [ ] Rate limiting blocks 4th submission
- [ ] XSS attempts are escaped

**Admin:**
- [ ] Login with valid credentials works
- [ ] Invalid credentials show error
- [ ] All CMS panels load
- [ ] Can approve/reject guestbook entries
- [ ] Can CRUD all content types
- [ ] Sign out works

**Security:**
- [ ] All tables show "RLS Enabled" in Supabase
- [ ] Anonymous users cannot read pending guestbook entries
- [ ] Anonymous users cannot upload images
- [ ] Authenticated admins can do everything

**GDPR:**
- [ ] Consent banner works
- [ ] Privacy policy has all 10 sections
- [ ] Consent logged to database

**Performance:**
- [ ] Run Lighthouse audit
- [ ] Target: Performance > 90, Accessibility > 95

### Task 17: Deploy to Production

**Goal:** Safe production deployment

**Reference:** Design spec section "Deployment Process"

- [ ] **Final local testing**
  - Run Task 16 checklist completely

- [ ] **Git commit all changes**

```bash
git add -A
git commit -m "feat: complete Supabase migration with GDPR and security

- Enable RLS on all tables
- Add comprehensive cookie consent system
- Add GDPR-compliant privacy policy
- Wire guestbook to Supabase
- Migrate admin CMS to Supabase Auth
- Add security headers (CSP, HSTS)
- Set up pre-commit and pre-push hooks
- Complete QA testing

Closes: broken guestbook, security vulnerabilities, GDPR compliance

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

- [ ] **Push to GitHub**

```bash
git push origin main
```

- [ ] **Monitor Vercel deployment**
  - Watch Vercel dashboard for "Building" → "Ready"
  - Takes ~1-2 minutes

- [ ] **Test production site (www.lwe623.uk)**
  - Run abbreviated test checklist
  - Homepage loads
  - Guestbook works
  - Admin login works
  - No console errors

- [ ] **Monitor for 30 minutes**
  - Check Vercel logs
  - Check Supabase logs
  - Check error rate (should be 0%)

- [ ] **If issues found: Rollback**
  - Vercel dashboard → Previous deployment → "Promote to Production"
  - Or: `git revert HEAD && git push origin main`

### Task 18: Update Documentation

**Goal:** Record completion

- [ ] **Update CLAUDE.md "Current Implementation Status"**
  - Mark all items as ✅ Completed
  - Add completion date
  - Add any notes or known issues

- [ ] **Update README.md**
  - Document new Supabase backend
  - Document GDPR compliance
  - Document admin login process

- [ ] **Commit documentation**

```bash
git commit -m "docs: update implementation status and README"
```

---

## Success Criteria

**Critical (Must Have):**
- [x] All tables have RLS enabled (no "UNRESTRICTED")
- [x] Guestbook works (users can submit entries)
- [x] Admin login uses Supabase Auth
- [x] Cookie consent banner appears
- [x] Privacy policy page exists with all 10 sections
- [x] XSS prevention (user content escaped)
- [x] Rate limiting prevents spam

**Testing:**
- [x] All manual tests pass
- [x] Security tests pass (RLS, XSS, CSRF)
- [x] GDPR compliance verified
- [x] Performance > 90 (Lighthouse)
- [x] Mobile responsive
- [x] Cross-browser compatible

**Production:**
- [x] Deployed to www.lwe623.uk
- [x] No errors in logs
- [x] Site fully functional
- [x] Admin CMS works
- [x] Guestbook moderation works

---

## Rollback Plan

If critical issues found after deployment:

**Option 1: Vercel Instant Rollback**
1. Vercel dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

**Option 2: Git Revert**
```bash
git revert HEAD
git push origin main
```

**Option 3: Database Rollback**
- Re-run old schema if needed
- Data remains intact (no data loss)

---

## Notes

**This plan implements the approved design spec at:**
`docs/superpowers/specs/2026-04-17-supabase-migration-gdpr-security-design.md`

**All SQL, architecture, and detailed patterns are in the design spec.**

**For code examples and implementation details, reference:**
- Design spec sections for each feature
- CLAUDE.md for coding standards
- Supabase documentation for RLS and Auth

**Testing is critical - site is live in production serving real users.**

---

**Plan created:** 2026-04-18  
**Estimated time:** 8-10 hours total  
**Phases:** 4 sequential phases  
**Tasks:** 18 tasks with detailed steps
