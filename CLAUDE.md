# RTLWE263 Website - Development Guidelines

**Project:** Round Table London West End No. 623 Website  
**Production URL:** https://www.lwe623.uk  
**Status:** Live in production  
**Last Updated:** 2026-04-18

## Project Overview

This is a **production website** serving UK/EU users for a London-based Round Table fellowship organization. The site includes:
- Public-facing content (events, member profiles, club information)
- Guestbook for visiting Tablers
- Admin CMS for content management

**Critical Context:**
- Site is LIVE - changes must be tested locally first
- EU region (GDPR compliance legally required)
- Currently broken: guestbook feature (users cannot submit entries)
- Security vulnerability: All database tables lack Row Level Security

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

**Completed:**
- ✅ Supabase project created and configured
- ✅ Database tables created
- ✅ Storage buckets created
- ✅ Design specification written and approved
- ✅ CLAUDE.md created

**In Progress:**
- 🔄 Row Level Security policies (currently UNRESTRICTED - security risk!)
- 🔄 Guestbook Supabase integration (currently broken)
- 🔄 GDPR compliance system
- 🔄 Admin CMS Supabase migration

**Not Started:**
- ⏳ Cookie consent banner
- ⏳ Privacy policy page
- ⏳ Admin authentication with Supabase Auth
- ⏳ Comprehensive testing
- ⏳ Security hardening
- ⏳ Hooks setup

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

**Always create CLAUDE.md at project start** - Document architecture, standards, and context before implementation begins.

**Use hooks for token optimization** - Set up automated workflows (pre-commit, pre-push, testing) to reduce repetitive instructions and optimize token usage.

**Design Principles:**
- Security by default (not bolted on later)
- GDPR compliant from day one
- Test locally, deploy confidently
- User experience over developer convenience
- Accessibility is required, not optional

**Current Priority:**
Complete the Supabase migration with proper security and GDPR compliance. Fix the broken guestbook. Make the site production-ready with proper Row Level Security policies.

---

**Last Updated:** 2026-04-18  
**Project Start:** 2019  
**Website Launch:** 2026-04-01  
**Current Phase:** Migration & Security Hardening
