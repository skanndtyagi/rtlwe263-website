# RTLWE263 Website - Development Guidelines

**Project:** Round Table London West End No. 623 Website  
**Production URL:** https://www.lwe623.uk  
**Status:** Live in production  
**Last Updated:** 2026-04-30

## Table of Contents
- [Project Overview](#project-overview)
- [Quick Commands](#quick-commands)
- [Architecture](#architecture)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Deployment Workflow](#deployment-workflow)
- [Supabase Guidelines](#supabase-guidelines)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Project Overview

This is a **production website** serving UK/EU users for a London-based Round Table fellowship organization. The site includes:
- Public-facing content (events, member profiles, club information)
- Guestbook for visiting Tablers
- Admin CMS for content management

**Critical Context:**
- Site is LIVE - changes must be tested locally first
- EU region (GDPR compliance legally required)
- ⚠️ **SECURITY CRITICAL:** Missing RLS on 5 tables (see Security Advisor)

## Quick Commands

**Local Development:**
```bash
cd rtlwe263-website
python3 -m http.server 8000
# Open http://localhost:8000
```

**Test Admin Dashboard:**
```bash
open http://localhost:8000/admin-login.html
# Login: london.westend@roundtable.org.uk
```

**Git Workflow:**
```bash
git status                 # Check changes
git diff                   # Review changes
git add <files>           # Stage specific files (never use git add .)
git commit -m "message"   # Commit with descriptive message
git push origin main      # Deploy to production (auto-deploys via Vercel)
```

**Supabase Quick Checks:**
```sql
-- Check RLS status on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- View active policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Architecture

**Stack:**
- Frontend: Vanilla HTML, CSS, JavaScript (no frameworks)
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Hosting: Vercel (auto-deploy from main branch)
- Region: eu-west-2 (AWS London)

**Key Services:**
- Supabase URL: https://tvshplxcgdfzvtxvqzvl.supabase.co
- Production: www.lwe623.uk
- Preview: rtlwe263-website.vercel.app

**Database Tables:**
- `hero_slides` - Homepage rotating images
- `gallery_images` - Event photo albums
- `programme_events` - Event calendar
- `tablers` - Member profiles
- `guestbook_entries` - Visitor messages
- `site_settings` - Site configuration
- `media_files` - Upload tracking
- `consent_log` - GDPR audit trail

## Coding Standards

### Security (Non-Negotiable)

**1. Always Escape User Content**
- Use `textContent` instead of `innerHTML` for user data
- Use `setAttribute()` instead of template strings for attributes
- Never trust user input - always sanitize

**2. Validate All Inputs**
- Client-side: HTML5 validation (required, minlength, maxlength, pattern)
- Server-side: Database CHECK constraints
- Never trust client-side validation alone

**3. Row Level Security (RLS)**
- Every Supabase table MUST have RLS enabled
- No table should show "UNRESTRICTED" in Supabase dashboard
- Test both anonymous and authenticated access

**4. Never Commit Secrets**
- Supabase anon key is public (safe to commit)
- Service role key is SECRET (never commit)
- Check .gitignore before committing

### GDPR Compliance (Legally Required)

**Required Before Any Data Collection:**
1. Cookie consent banner (first visit)
2. Privacy policy page with all 10 required sections
3. Data subject rights information
4. Consent logging (audit trail)

**Data Minimization:**
- Only collect what's necessary
- Guestbook: name, club, message (no email unless required)
- No tracking without consent

**User Rights:**
- Users can request data export (admin dashboard)
- Users can request deletion (admin dashboard)
- Response time: 30 days maximum

### JavaScript Patterns

**Use Modern ES6+:**
- `const`/`let` instead of `var`
- `async`/`await` instead of promises chains
- Template literals for strings
- Destructuring for object properties

**Error Handling:**
- Always check for errors from Supabase operations
- Show user-friendly error messages
- Log detailed errors to console
- Never expose internal errors to users

**DOM Manipulation:**
- Use `createElement()` and `appendChild()`
- Use `textContent` for user-generated content
- Use `classList` for CSS class manipulation
- Query selectors at the top of functions

### CSS Standards

**Use Existing Patterns:**
- Follow the current styles.css structure
- Use CSS custom properties (variables) for colors
- Mobile-first responsive design
- BEM-like naming: `.section`, `.section__element`, `.section--modifier`

**No Inline Styles:**
- Always use CSS classes
- Keep styling in styles.css
- Use utility classes where appropriate

### HTML Standards

**Semantic HTML:**
- Use semantic tags (`section`, `article`, `nav`, `header`, `footer`)
- Proper heading hierarchy (`h1` → `h2` → `h3`)
- Use `button` for actions, `a` for navigation

**Accessibility:**
- All images have `alt` attributes
- Forms have `label` elements
- Buttons have descriptive text
- ARIA attributes where needed
- Keyboard navigation works

## Testing Requirements

### Before Every Commit

**Manual checks:**
1. Changes work in local browser (http://localhost:8000)
2. No console errors
3. Forms validate correctly
4. Changes don't break existing features

### Before Every Deployment

**Comprehensive testing:**
1. **Security:** RLS policies enforced, XSS attempts blocked
2. **GDPR:** Consent banner works, privacy policy accessible
3. **Functionality:** All features work (guestbook, admin CMS, uploads)
4. **Performance:** Lighthouse score > 90
5. **Responsive:** Test mobile, tablet, desktop
6. **Browsers:** Chrome, Firefox, Safari, Edge

### Local Testing Setup

```bash
# Start local server
cd rtlwe263-website
python3 -m http.server 8000

# Open browser
open http://localhost:8000

# Test admin
open http://localhost:8000/admin-login.html
```

## Deployment Workflow

**CRITICAL: This site is live in production!**

### Safe Deployment Process

1. **Local Testing First**
   - Test all changes on localhost:8000
   - Verify nothing breaks
   - Check console for errors

2. **Database Changes**
   - Run SQL in Supabase SQL Editor
   - Verify in Table Editor (check RLS status)
   - Test queries in local environment

3. **Git Commit**
   - Review changes with `git diff`
   - Commit with descriptive message
   - Include co-author attribution

4. **Push & Monitor**
   - `git push origin main`
   - Vercel auto-deploys (watch dashboard)
   - Test production site immediately
   - Monitor logs for 30 minutes

5. **Rollback Plan**
   - Vercel: Instant rollback to previous deployment
   - Git: `git revert HEAD && git push origin main`
   - Database: Re-run old schema (data persists)

### Never Do This

❌ Push directly to main without local testing  
❌ Run destructive SQL without backup  
❌ Commit credentials or API keys  
❌ Skip GDPR compliance checks  
❌ Deploy on Friday evening (harder to rollback issues)  
❌ Make breaking changes without migration plan

## Supabase Guidelines

### Row Level Security Policies

**Pattern 1: Public Read, Admin Write**
```sql
-- Tables: hero_slides, gallery_images, programme_events, tablers, site_settings
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active" ON [table]
  FOR SELECT TO anon USING (active = true);

CREATE POLICY "Admin full access" ON [table]
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

**Pattern 2: Guestbook (Moderation)**
```sql
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;

-- Anonymous can submit (status auto-set to 'pending')
CREATE POLICY "Public can submit" ON guestbook_entries
  FOR INSERT TO anon WITH CHECK (status = 'pending');

-- Anonymous can read approved only
CREATE POLICY "Public read approved" ON guestbook_entries
  FOR SELECT TO anon USING (status = 'approved');

-- Admins manage all
CREATE POLICY "Admin full access" ON guestbook_entries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

**Pattern 3: Admin Only**
```sql
-- Tables: media_files, consent_log (for reading)
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only" ON [table]
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Storage Policies

**Public Read, Admin Write:**
```sql
-- Buckets: gallery, site-media
CREATE POLICY "Public read" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'bucket-name');

CREATE POLICY "Admin upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'bucket-name');

CREATE POLICY "Admin delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'bucket-name');
```

## Common Tasks

### Create Admin User (Required for CMS Access)

**IMPORTANT:** Admin users must be created in Supabase Auth dashboard before they can log in.

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Enter email: `london.westend@roundtable.org.uk`
4. Enter a secure password (20+ characters recommended)
5. Enable "Auto Confirm User" (skip email verification)
6. Click "Create User"
7. Test login at `/admin-login.html`

**Note:** The admin authentication system uses Supabase Auth. There is no localStorage fallback. If Supabase is not configured or the user doesn't exist in Supabase Auth, login will fail.

### Add New Database Table

1. Write SQL in `supabase/schema.sql`
2. Include RLS policies (choose appropriate pattern)
3. Add CHECK constraints for validation
4. Test in Supabase SQL Editor
5. Verify RLS works (test anon + auth access)
6. Update CLAUDE.md database table list

### Add New Admin Panel

1. Add panel HTML to `admin.html`
2. Add panel button to admin nav
3. Add JavaScript CRUD functions in `admin.js`
4. Use Supabase client for all operations
5. Add real-time subscriptions if needed
6. Test locally before committing

### Add New Public Section

1. Add section HTML to `index.html`
2. Add styles to `styles.css`
3. Add JavaScript in `script.js` (if interactive)
4. Ensure mobile responsive
5. Test accessibility (keyboard nav, alt text)
6. Update navigation links

### Upload Images

1. Admin logs in via Supabase Auth
2. Select image file(s)
3. Upload to Supabase Storage bucket
4. Get public URL from upload response
5. Insert URL into database table
6. Verify image displays on public site

## Troubleshooting

### Guestbook Not Working

**Symptoms:** Form submits but nothing happens

**Checks:**
1. Console errors? (Open browser DevTools)
2. Supabase client initialized? (`isSupabaseReady()`)
3. RLS policies enabled on `guestbook_entries`?
4. Rate limiting hit? (Check localStorage)
5. Network tab shows request? (Check response)

### Admin Login Fails

**Checks:**
1. Supabase Auth session valid?
2. Email/password correct?
3. Admin user exists in Supabase Auth?
4. Session storage working? (cookies enabled)
5. Console errors?

### Images Not Loading

**Checks:**
1. Storage bucket policies set?
2. Image URL correct? (check in Supabase Storage)
3. CORS configured? (Vercel handles this)
4. Image file size reasonable? (< 5MB recommended)
5. File extension allowed? (jpg, png, svg, webp)

### RLS Policy Denies Everything

**Symptoms:** "new row violates row-level security policy"

**Fix:**
1. Check policy `WITH CHECK` clause
2. For INSERT, ensure policy allows the specific values
3. For UPDATE, ensure `USING` clause allows reading existing row
4. Test with service role key to bypass RLS temporarily
5. Fix policy, re-enable RLS

## Project Contacts

**Data Controller:** Round Table London West End No. 623  
**Admin Email:** london.westend@roundtable.org.uk  
**Website:** https://www.lwe623.uk

**For Data Subject Requests:**
- Email: london.westend@roundtable.org.uk
- Response time: 30 days maximum (GDPR requirement)

## Reference Documentation

**External Docs:**
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [GDPR Official Text](https://gdpr-info.eu/)
- [UK ICO GDPR Guide](https://ico.org.uk/for-organisations/guide-to-data-protection/)
- [Vercel Deployment Docs](https://vercel.com/docs)

**Internal Docs:**
- Design Spec: `docs/superpowers/specs/2026-04-18-supabase-migration-gdpr-security-design.md`
- Backend Plan: `backend-plan.md`
- README: `README.md`

## Current Implementation Status

**⚠️ SECURITY ISSUES DETECTED (2026-04-29)**

**Phase 1: Security Foundation**
- ❌ **CRITICAL:** RLS missing on 5 tables (site_settings, hero_slides, programme_events, tablers, media_files)
- ⚠️ gallery_images has overly permissive RLS policy (USING true)
- ⚠️ Storage bucket allows public listing
- ⚠️ Leaked password protection disabled
- ✅ Database constraints for validation
- ✅ CSP and HSTS security headers

**Phase 2: Guestbook + GDPR**
- ✅ Privacy Policy page (10 GDPR Article 13 sections)
- ✅ Cookie consent banner with audit logging
- ✅ Guestbook wired to Supabase backend
- ✅ Rate limiting and XSS prevention
- ✅ Moderation workflow (pending → approved)

**Phase 3: Admin CMS**
- ✅ Supabase Auth for admin login
- ✅ Guestbook moderation panel with real-time updates
- ✅ Hero slides management panel
- ✅ Gallery management panel
- ✅ Programme events management panel
- ✅ Tablers management panel
- ✅ Site settings panel
- ✅ Image upload to Supabase Storage

**Phase 4: Security & Testing**
- ✅ Pre-commit hook (credential scanning, console.log warnings)
- ✅ Pre-push hook (syntax validation, TODO warnings)
- ✅ Deployed to production (www.lwe623.uk)
- ✅ RLS policies applied (security-fix-clean.sql executed)

**Phase 5: Mobile Admin Optimization (2026-04-30)**
- ✅ Mobile-first responsive CSS (admin-mobile.css)
- ✅ Bottom navigation (6 buttons, touch-optimized 48px targets)
- ✅ Guestbook notification system (localStorage-based)
- ✅ Badge counter showing total pending entries
- ✅ Toast notifications for new entries on login
- ✅ Fixed WebSocket failures on iOS Safari
- ✅ Professional typography (16px+ minimum, proper spacing)
- ✅ Touch-friendly form inputs (48px height, generous padding)
- ✅ Auto-dismissing toasts (2s timeout)
- ✅ Content padding prevents bottom nav cutoff

**Mobile Notification System:**
- File: `js/mobile-notification-service.js`
- Tracks last visit timestamp in localStorage
- Shows toast for NEW entries since last login
- Badge displays TOTAL pending count (live database query)
- Updates badge after approve/reject actions
- No WebSocket dependency (works on all mobile browsers)

**Known Mobile Issues Fixed:**
- ✅ Navigation buttons not appearing (CSS class mismatch)
- ✅ Toast overlapping content (repositioned above nav)
- ✅ Badge showing 0 when entries pending (logic rewritten)
- ✅ Content cut off by bottom nav (increased padding)
- ✅ Fonts too small/cramped (proper typography scale)

**URGENT Tasks:**
- 📋 Manual QA testing of all features on mobile devices
- 📋 Performance audit (Lighthouse > 90 target)
- 📋 Test notification system with multiple pending entries

## Notes for Claude

**When working on this project:**
1. Always test locally before committing (site is live!)
2. Security first - RLS policies are non-negotiable
3. GDPR compliance is legally required (EU users)
4. Escape all user content (XSS prevention)
5. Ask before destructive operations (especially database changes)
6. Follow existing code patterns (vanilla JS, no frameworks)
7. Mobile responsive is required (not optional)
8. Performance matters (Lighthouse > 90)

**Design Principles:**
- Security by default (not bolted on later)
- GDPR compliant from day one
- Test locally, deploy confidently
- User experience over developer convenience
- Accessibility is required, not optional

**Current Priority:**
Mobile admin dashboard is fully functional. Focus on:
1. Comprehensive mobile testing (iOS Safari, Android Chrome)
2. Performance optimization (Lighthouse audit)
3. User acceptance testing with real admin workflows

**Mobile Admin is Production-Ready:**
- Notification system works on iOS Safari (no WebSocket)
- Touch-optimized UI with proper spacing
- Real-time badge updates for pending guestbook entries
- Professional typography and mobile-first design

---

**Last Updated:** 2026-04-30  
**Project Start:** 2019  
**Website Launch:** 2026-04-01  
**Current Phase:** Mobile Optimization & User Testing
