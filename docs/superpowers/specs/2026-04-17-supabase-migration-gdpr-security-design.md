# RTLWE263 Website: Complete Supabase Migration with GDPR Compliance and Security

**Date:** 2026-04-17  
**Status:** Approved  
**Priority:** Critical (Production site broken)

## Executive Summary

This design completes the migration of the RTLWE263 website from localStorage-based storage to a production-ready Supabase backend with comprehensive security and GDPR compliance. The site is currently live at www.lwe623.uk with a broken guestbook feature and unsecured database tables. This design fixes critical production issues while implementing best practices for security, compliance, and testing.

## Problem Statement

**Current Critical Issues:**
1. Guestbook is broken - users cannot submit entries (no backend integration)
2. All database tables show "UNRESTRICTED" - no Row Level Security enabled (security vulnerability)
3. No GDPR compliance - site serves EU users but lacks cookie consent, privacy policy, and data subject rights
4. localStorage-based admin auth - insecure authentication mechanism
5. Incomplete storage policies - potential unauthorized access to uploads

**Site Context:**
- Live in production at www.lwe623.uk (Vercel)
- Supabase project created (rtlwe263, eu-west-2 London region)
- Tables created but security policies missing
- Getting ~55 requests per 6 hours
- 0% error rate (but guestbook non-functional)

## Design Approach

**Selected Approach:** Foundation-Up (Secure & Compliant from Start)

**Rationale:** Site is live serving EU users, making GDPR compliance legally required. Building security and compliance into the foundation prevents technical debt, legal risk, and future rework. The comprehensive approach takes ~8 hours but delivers a production-ready, legally compliant, secure system.

**Phases:**
1. Security foundation (1-2 hours) - RLS policies, storage security
2. Guestbook + GDPR (2-3 hours) - Fix broken feature with compliance
3. Complete CMS migration (2-3 hours) - Admin auth and full functionality
4. Testing & hardening (1-2 hours) - Verification and optimization

## Architecture Overview

### System Layers

**Frontend Layer:**
- `index.html` - Public site (anonymous access with RLS protection)
- `admin.html` - Admin CMS (authenticated access required)
- `privacy.html` - Privacy policy and data rights information
- Cookie consent interceptor - Blocks non-essential tracking until consent

**Backend Layer (Supabase):**
- PostgreSQL database with RLS policies on every table
- Storage buckets with granular access policies
- Supabase Auth for admin authentication
- Edge Functions for server-side operations (rate limiting, moderation)

**Compliance Layer:**
- Cookie consent banner (runs before any non-essential processing)
- Privacy policy with GDPR data subject rights
- localStorage wrapper (consent-aware storage)
- Audit logging for data processing events

**Security Principle:** Security and compliance checks occur BEFORE functional code. Failed RLS or missing consent blocks operations at infrastructure level.

### Data Flow

**Public User Journey:**
1. User visits www.lwe623.uk
2. Cookie consent banner appears (first visit only)
3. User accepts/rejects non-essential cookies
4. Consent stored in localStorage (13-month expiry per GDPR)
5. Public content loaded from Supabase (anonymous read via RLS)
6. Guestbook submission → Supabase INSERT with status='pending'
7. Real-time updates via Supabase subscriptions

**Admin User Journey:**
1. Admin visits www.lwe623.uk/admin-login.html
2. Supabase Auth login (email/password)
3. Session established (7-day expiry)
4. Admin dashboard loads with authenticated access
5. CMS operations (CRUD) via Supabase client
6. Changes immediately reflected on public site
7. Logout clears session

## Database Schema & Security

### Tables with RLS Policies

**Public Read, Admin Write (Pattern 1):**

Tables: `hero_slides`, `gallery_images`, `programme_events`, `tablers`, `site_settings`

```sql
-- Enable RLS
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Public can read active records
CREATE POLICY "Public read active" ON [table_name]
  FOR SELECT TO anon
  USING (active = true);

-- Authenticated admins can do everything
CREATE POLICY "Admin full access" ON [table_name]
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
```

**Guestbook (Special Moderation Flow):**

Table: `guestbook_entries`

```sql
-- Enable RLS
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;

-- Anonymous can submit new entries (auto-pending)
CREATE POLICY "Public can submit" ON guestbook_entries
  FOR INSERT TO anon
  WITH CHECK (status = 'pending');

-- Anonymous can read approved entries only
CREATE POLICY "Public read approved" ON guestbook_entries
  FOR SELECT TO anon
  USING (status = 'approved');

-- Admins can manage all entries
CREATE POLICY "Admin full access" ON guestbook_entries
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
```

**Admin Only (Pattern 3):**

Table: `media_files`

```sql
-- Enable RLS
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can access
CREATE POLICY "Admin only" ON media_files
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
```

**Audit Logging (Pattern 4):**

Table: `consent_log` (new table)

```sql
CREATE TABLE consent_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  consent_given boolean NOT NULL,
  consent_type text NOT NULL, -- 'essential', 'all', 'custom'
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;

-- Anonymous can insert their own consent
CREATE POLICY "Public can log consent" ON consent_log
  FOR INSERT TO anon
  WITH CHECK (true);

-- Admins can read all consent logs
CREATE POLICY "Admin read consent" ON consent_log
  FOR SELECT TO authenticated
  USING (true);
```

### Storage Buckets

**Gallery Bucket (public read, admin write):**

```sql
-- Public can read
CREATE POLICY "Public gallery read" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'gallery');

-- Authenticated can upload
CREATE POLICY "Admin gallery upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery');

-- Authenticated can delete
CREATE POLICY "Admin gallery delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'gallery');
```

**Site-Media Bucket (same policies as gallery):**

```sql
-- Public can read
CREATE POLICY "Public media read" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'site-media');

-- Authenticated can upload
CREATE POLICY "Admin media upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-media');

-- Authenticated can delete
CREATE POLICY "Admin media delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'site-media');
```

### Database Constraints

**Input validation at database level:**

```sql
-- Guestbook entries
ALTER TABLE guestbook_entries
  ADD CONSTRAINT name_length CHECK (length(name) <= 60 AND length(name) >= 2),
  ADD CONSTRAINT club_length CHECK (length(club) <= 80 AND length(club) >= 2),
  ADD CONSTRAINT message_length CHECK (length(message) <= 400 AND length(message) >= 10);

-- Gallery images
ALTER TABLE gallery_images
  ADD CONSTRAINT caption_length CHECK (length(caption) <= 200);

-- Hero slides
ALTER TABLE hero_slides
  ADD CONSTRAINT caption_length CHECK (length(caption) <= 100);
```

## GDPR Compliance System

### Legal Basis

**Data Controller:** Round Table London West End No. 623  
**Contact:** london.westend@roundtable.org.uk  
**UK ICO Registration:** Required (to be confirmed by user)  
**Geographic Scope:** UK/EU users (GDPR applies)

### Cookie Consent Banner

**Implementation approach:**
- Check consent status from localStorage
- Show banner on first visit if no consent recorded
- Store consent choice with 13-month expiry (GDPR max)
- Block non-essential features until consent given
- Log consent to Supabase audit table

**Banner Design:**
- Fixed position at bottom of screen
- Cannot be dismissed without making a choice
- Clear language (no legalese)
- Links to privacy policy
- Visible on all pages until consent given

### Privacy Policy Page

**File:** `privacy.html`

**Required Sections (GDPR Article 13):**

1. **Identity of Data Controller**
   - Round Table London West End No. 623
   - Contact: london.westend@roundtable.org.uk

2. **What Data We Collect**
   - Guestbook: name, club/table name, message, timestamp
   - Admin: email address, session tokens
   - Technical: IP address (for rate limiting), browser info (for security)
   - Cookies: consent preferences (localStorage)

3. **Legal Basis for Processing**
   - Legitimate interest (club operations, member management)
   - Consent (cookies, optional features)
   - Contract (admin accounts)

4. **How We Use Your Data**
   - Display guestbook entries on public website
   - Manage club content and events
   - Prevent spam and abuse (rate limiting)
   - Comply with legal obligations

5. **Data Retention**
   - Guestbook entries: Indefinitely (public record of club history)
   - Admin sessions: 7 days (then auto-logout)
   - Consent logs: 2 years (compliance audit trail)
   - Rate limit logs: 24 hours (then auto-delete)

6. **Data Sharing**
   - No third-party sharing except:
     - Supabase (data processor, EU-hosted, GDPR-compliant)
     - Vercel (hosting provider, GDPR-compliant)

7. **Your Rights (GDPR Articles 15-22)**
   - **Right to access** - Request copy of your data
   - **Right to rectification** - Correct inaccurate data
   - **Right to erasure** - Delete your data (where applicable)
   - **Right to data portability** - Receive data in machine-readable format
   - **Right to object** - Object to processing
   - **Right to lodge complaint** - Contact ICO (UK regulator)

8. **How to Exercise Rights**
   - Email: london.westend@roundtable.org.uk
   - Response time: 30 days maximum (GDPR requirement)
   - Free of charge (unless requests are excessive)

9. **Data Security**
   - Encryption in transit (HTTPS)
   - Encryption at rest (Supabase)
   - Access controls (RLS policies)
   - Regular security audits

10. **Changes to Policy**
    - Last updated: 2026-04-17
    - Notice of changes via website banner
    - Significant changes require re-consent

### Data Subject Rights Implementation

**Admin Dashboard "Data Requests" Panel:**

Features:
- View all data subject requests
- Export user data as JSON (for portability)
- Anonymize guestbook entries (replace name/club with "[Removed]")
- Delete user data (where no legal retention obligation)
- Log all actions (compliance audit trail)

**Manual Process (Phase 1):**
1. User emails london.westend@roundtable.org.uk
2. Admin verifies identity (reasonable steps)
3. Admin processes request via dashboard
4. Response sent within 30 days

**Automated Process (Future):**
- User self-service portal
- Automated data export
- Automated anonymization

## Guestbook Backend Integration

### Frontend Form

**File:** `index.html` (section #visiting-book)

**Enhanced form with HTML5 validation:**
- Required fields: name, club, message
- Min/max length enforcement
- Pattern validation for name field
- Character counters for textarea
- Submit button disabled during submission
- Success/error status messages

**Form submission handler approach:**
- Check cookie consent before submission
- Client-side validation (HTML5 + JavaScript)
- Rate limit check (localStorage tracking)
- Submit to Supabase guestbook_entries table
- Handle success and error states
- Reset form after successful submission

### Rate Limiting

**Client-side rate limiting (Phase 1):**
- Track submissions in localStorage
- Maximum 3 submissions per IP per hour
- Remove old submissions (>1 hour) before checking
- Show friendly error if limit exceeded

**Supabase Edge Function (Phase 2, future enhancement):**
- Server-side IP tracking
- More sophisticated rate limiting
- Exponential backoff for repeat offenders
- Can add CAPTCHA for suspicious activity

### Admin Moderation Panel

**File:** `admin.html` (panel: #guestbook-panel)

**Features:**
- Display pending entries in queue
- Show entry count badge
- Approve button (sets status='approved', approved_at=now)
- Reject button (sets status='rejected')
- Delete button (permanent removal)
- Real-time updates via Supabase subscriptions
- Display approved entries list

**Real-time notifications:**
- Subscribe to guestbook_entries INSERT events
- Show browser notification when new entry arrives
- Update pending count automatically

## Admin CMS Migration

### Authentication System

**Replace localStorage with Supabase Auth:**

**admin-login.html changes:**
- Remove localStorage auth code
- Use SUPABASE.auth.signInWithPassword()
- Handle login errors gracefully
- Redirect to dashboard on success
- Check existing session on page load

**admin.html changes:**
- Check Supabase session on page load
- Redirect to login if no valid session
- Add sign-out button functionality
- Session automatically refreshes

**admin.js changes:**
- Remove ADMIN_AUTH_KEY constant
- Remove localStorage auth functions
- Add Supabase session checking
- Add sign-out handler

### Admin Dashboard Panels

**1. Hero Slides Management**
- Load slides from hero_slides table
- Upload images to gallery storage bucket
- Insert/update/delete records
- Drag-to-reorder functionality (updates order field)
- Toggle active/inactive status

**2. Gallery Management**
- Load images from gallery_images table grouped by event
- Single image upload
- Bulk image upload (multiple files at once)
- Add event metadata (name, date)
- Archive old events (set active=false)
- Delete images (removes from storage and database)

**3. Programme Events**
- Load events from programme_events table
- Add/edit/delete events
- Form fields: date, time, location, title, description, contact
- Sort by date (upcoming events first)
- Export to .ics calendar file (for user downloads)

**4. Tablers Management**
- Load tablers from tablers table
- Add/edit/delete tabler profiles
- Upload profile photos to gallery bucket
- Form fields: name, title, photo, bio, order
- Reorder tablers (chairman first)
- Toggle active/inactive status

**5. Guestbook Moderation**
- (Covered in Guestbook section above)

**6. Site Settings**
- Load settings from site_settings table
- Edit hero title and subtitle
- Edit about text
- Edit integration URLs (if needed)
- Changes immediately reflected on public site

### Remove Legacy Code

**localStorage keys to remove:**
- `lwe623-admin-auth` (replaced by Supabase Auth)
- `lwe623-content-v3` (replaced by Supabase tables)
- `lwe623-guestbook-fallback` (replaced by Supabase)
- `lwe623-guestbook-approved` (no longer needed)

**localStorage keys to keep:**
- `lwe623-cookie-consent` (GDPR consent, essential)
- `lwe623-guestbook-submissions` (rate limiting, temporary)

## Security Hardening

### Input Validation

**Client-side validation (HTML5):**
- `required` attribute on all required fields
- `minlength` and `maxlength` attributes
- `pattern` attribute for format validation
- `type="email"` for email fields
- JavaScript validation before submission

**Server-side validation (Supabase constraints):**
- Database CHECK constraints enforce limits
- Name: 2-60 characters
- Club: 2-80 characters
- Message: 10-400 characters
- Email: valid email format

### XSS Prevention

**Output encoding approach:**
- Use textContent instead of innerHTML for user data
- Escape HTML entities when necessary
- Never render user content without sanitization
- Use DOM APIs safely (createElement, setAttribute)

**Content Security Policy (CSP):**
- Add CSP meta tag to all HTML pages
- Restrict script sources to trusted domains
- Block inline scripts (except with nonce)
- Prevent XSS attacks at browser level

### CSRF Protection

**Supabase handles CSRF automatically:**
- Auth tokens in Authorization header
- SameSite cookies
- Origin validation

**Additional protection:**
- Verify Supabase session on all admin operations
- Token validation happens automatically

### Rate Limiting

**Implemented at multiple levels:**

1. **Client-side (immediate feedback):**
   - Track in localStorage
   - Max 3 guestbook submissions per hour
   - Show friendly error message

2. **Database level (backup enforcement):**
   - Unique constraint on submissions
   - Prevents duplicate entries

3. **Edge Function level (future enhancement):**
   - Supabase Edge Function checks IP
   - More sophisticated rate limiting
   - Can implement exponential backoff

### HTTPS & HSTS

**Vercel provides HTTPS by default.**

**Add HSTS header in `vercel.json`:**
- Strict-Transport-Security header
- max-age=31536000 (1 year)
- includeSubDomains
- preload

### Password Policy

**Supabase Auth configuration:**
- Minimum password length: 12 characters
- Require uppercase letters
- Require lowercase letters
- Require numbers
- Require special characters

**Session security:**
- Session expiry: 7 days
- Auto-refresh disabled (re-login required)
- Secure session storage

## Testing Strategy

### Phase 1: Local Development Testing

**Setup:**
```bash
cd rtlwe263-website
python3 -m http.server 8000
open http://localhost:8000
```

**Manual testing checklist:**

**Public Site:**
- Homepage loads without errors
- All sections render correctly
- Images display properly
- Hero banner cycles through slides
- Gallery loads and displays albums
- Programme events render
- Tabler profiles show correctly
- Cookie consent banner appears
- Privacy policy page loads
- Mobile responsive

**Guestbook:**
- Form displays correctly
- Validation works (required, min/max length)
- Submit button disabled during submission
- Success message appears
- Form resets after submission
- Entry does not appear immediately (pending)
- Rate limiting prevents spam

**Admin Login:**
- Login page loads
- Invalid credentials rejected
- Valid credentials accepted
- Session persists across refresh
- Logout works correctly

**Admin Dashboard:**
- All panels accessible
- Hero slides management works
- Gallery management works
- Programme events management works
- Tablers management works
- Guestbook moderation works
- Site settings work
- Changes reflect on public site

### Phase 2: Security Testing

**RLS Policy Verification:**
- Test anonymous read access (should work for active records)
- Test anonymous write access (should fail)
- Test authenticated access (should work for everything)
- Test cross-user access (should be blocked)

**Manual security checks:**
- Access admin.html without login (should redirect)
- Read pending guestbook entries as anonymous (should fail)
- Upload image as anonymous (should fail)
- Delete data as anonymous (should fail)

**XSS Testing:**
- Submit script tags in guestbook (should be escaped)
- Submit image tags with onerror (should be escaped)
- Submit malicious links (should be escaped)

**Rate Limiting:**
- Submit 3 entries (should work)
- Submit 4th entry (should fail)
- Wait 1 hour and submit (should work)

### Phase 3: GDPR Compliance Testing

**Cookie Consent:**
- Banner appears on first visit
- Accept All stores consent
- Essential Only stores consent
- Banner does not appear after consent
- Consent expires after 13 months

**Privacy Policy:**
- Page loads correctly
- All required sections present
- Contact email works
- Data retention stated
- User rights explained

**Data Subject Rights:**
- Admin can export data
- Admin can anonymize entries
- Admin can delete data
- Actions logged

### Phase 4: Browser/Device Testing

**Desktop browsers:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Mobile devices:**
- iOS Safari
- Android Chrome
- Tablet

**Responsive breakpoints:**
- Desktop (1920px)
- Laptop (1366px)
- Tablet (768px)
- Mobile (375px)

### Phase 5: Performance Testing

**Lighthouse audit targets:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

**Core Web Vitals:**
- First Contentful Paint < 1.8s
- Largest Contentful Paint < 2.5s
- Cumulative Layout Shift < 0.1
- Time to Interactive < 3.8s

**Image optimization:**
- Lazy loading enabled
- Width/height attributes set
- Modern formats used
- Compression applied

## Deployment Process

### Step 1: Local Development

**Directory:** `/Users/skanndtyagi/Library/Mobile Documents/com~apple~CloudDocs/01-projects/LWE263-website/rtlwe263-website`

**Start local server:**
```bash
cd rtlwe263-website
python3 -m http.server 8000
```

**Test in browser:** http://localhost:8000

### Step 2: Database Migration

**Run SQL in Supabase SQL Editor:**
1. Open Supabase dashboard → SQL Editor
2. Load saved query: "RTLWE263 CMS Schema Setup"
3. Review changes (verify RLS policies included)
4. Click "Run" button
5. Verify success

**Verify schema:**
1. Go to Table Editor
2. Check all tables show "RLS Enabled"
3. Go to Storage
4. Verify buckets have policies

**Create admin user:**
1. Go to Authentication → Users
2. Click "Add user"
3. Enter email and strong password
4. Confirm email
5. Create user

**Test admin login locally:**
1. Visit http://localhost:8000/admin-login.html
2. Login with credentials
3. Verify dashboard loads

### Step 3: Git Commit

```bash
cd rtlwe263-website
git status
git add .
git commit -m "Complete Supabase migration with RLS, GDPR, and security hardening

- Enable Row Level Security on all tables
- Complete guestbook Supabase integration
- Replace localStorage auth with Supabase Auth
- Add GDPR cookie consent and privacy policy
- Implement rate limiting
- Add XSS prevention and input validation
- Add CSP and HSTS headers
- Complete admin CMS migration

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push origin main
```

### Step 4: Vercel Deployment

**Vercel auto-deploys on git push.**

**Monitor deployment:**
1. Open Vercel dashboard
2. Check "Deployments" tab
3. Wait for "Ready" status
4. Click "Visit" button

**Deployment URLs:**
- Production: https://www.lwe623.uk
- Preview: https://rtlwe263-website.vercel.app

### Step 5: Environment Variables (Optional)

**Current setup:** Supabase credentials hardcoded in config file (acceptable for anon key).

**To use environment variables:**
1. Add to Vercel dashboard
2. Update code to read from env vars
3. Redeploy

### Step 6: Post-Deployment Verification

**Test production site:**
- Homepage loads
- Cookie banner appears
- Guestbook works
- Admin login works
- All features functional

**Performance check:**
- Run Lighthouse audit
- Check Core Web Vitals
- Verify fast load times

**Monitor:**
- Vercel logs (first 30 minutes)
- Supabase logs
- Error rate (should be 0%)

### Step 7: Rollback Plan

**If issues found:**

**Option 1: Vercel Instant Rollback**
1. Vercel dashboard → Deployments
2. Find previous deployment
3. Click "Promote to Production"

**Option 2: Git Revert**
```bash
git revert HEAD
git push origin main
```

**Option 3: Database Rollback**
- Re-run old schema if needed
- Data remains intact

## File Changes Summary

### Files to Create
1. `privacy.html` - GDPR privacy policy page
2. `docs/superpowers/specs/2026-04-17-supabase-migration-gdpr-security-design.md` - This design doc

### Files to Modify
1. `index.html` - Add consent banner, update guestbook, add CSP
2. `script.js` - Remove localStorage, add Supabase integration
3. `admin.html` - Update panels, add CSP
4. `admin.js` - Replace auth, add Supabase CRUD
5. `admin-login.html` - Update login form
6. `admin-login.js` - Replace localStorage auth
7. `styles.css` - Add consent banner styles
8. `supabase/schema.sql` - Add RLS policies and constraints
9. `vercel.json` - Add security headers

### Files to Keep
- `supabase-config.js` - Already configured correctly

## Implementation Phases

### Phase 1: Security Foundation (1-2 hours)
1. Update supabase/schema.sql with RLS policies
2. Run SQL in Supabase
3. Verify all tables secured
4. Add storage policies
5. Create admin user

### Phase 2: Guestbook + GDPR (2-3 hours)
1. Create privacy.html
2. Add cookie consent banner
3. Implement consent logic
4. Update guestbook form
5. Add Supabase integration
6. Add rate limiting
7. Add admin moderation
8. Test end-to-end

### Phase 3: Complete CMS Migration (2-3 hours)
1. Replace localStorage auth
2. Update admin-login.js
3. Update admin.js
4. Migrate all CMS panels
5. Add real-time subscriptions
6. Remove legacy code

### Phase 4: Testing & Hardening (1-2 hours)
1. Run all testing checklists
2. Security testing
3. GDPR compliance testing
4. Browser/device testing
5. Performance testing
6. Add CSP and HSTS headers
7. Fix any issues
8. Final verification

## Success Criteria

**Critical (Must Have):**
- Guestbook works
- All tables RLS enabled
- Admin uses Supabase Auth
- Cookie consent banner
- Privacy policy page
- XSS protection
- Rate limiting

**Important (Should Have):**
- Admin CMS migrated
- Image uploads work
- Real-time updates
- Performance > 90
- Mobile responsive
- Browser compatibility

**Nice to Have (Could Have):**
- Automated tests
- Edge Functions
- Self-service data export
- Calendar export
- Admin notifications

## Risk Mitigation

**Risk 1: RLS too restrictive**
- Mitigation: Test thoroughly
- Rollback: Temporarily disable if needed

**Risk 2: Guestbook breaks in production**
- Mitigation: Test locally first
- Rollback: Vercel instant rollback

**Risk 3: Admin lockout**
- Mitigation: Create admin user before deploying
- Rollback: Keep old code commented

**Risk 4: GDPR gaps**
- Mitigation: Use comprehensive template
- Fallback: Consult expert

**Risk 5: Performance degradation**
- Mitigation: Optimize images, use CDN
- Monitoring: Lighthouse before/after

**Risk 6: Data loss**
- Mitigation: Additive changes only
- Backup: Supabase auto-backups

## Future Enhancements

**Post-launch improvements:**
1. Enhanced rate limiting with Edge Functions
2. Automated data subject rights portal
3. Advanced analytics (with consent)
4. Email notifications
5. Search functionality
6. Internationalization
7. PWA features
8. AI moderation

## Appendix

### Supabase Project Details
**Project:** rtlwe263  
**Region:** eu-west-2 (AWS London)  
**Plan:** Nano (free tier)  
**URL:** https://tvshplxcgdfzvtxvqzvl.supabase.co

### Vercel Project Details
**Project:** rtlwe263-website  
**URL:** https://www.lwe623.uk  
**Framework:** Static HTML/CSS/JS

### Contact Information
**Data Controller:** Round Table London West End No. 623  
**Email:** london.westend@roundtable.org.uk  
**Website:** https://www.lwe623.uk

### Glossary
- **RLS:** Row Level Security
- **GDPR:** General Data Protection Regulation
- **CSP:** Content Security Policy
- **HSTS:** HTTP Strict Transport Security
- **XSS:** Cross-Site Scripting
- **CSRF:** Cross-Site Request Forgery

### References
- Supabase RLS Documentation
- GDPR Official Text
- UK ICO GDPR Guide
- Content Security Policy Guide
- Web.dev Performance Best Practices

---

**End of Design Document**

*This design has been reviewed and approved by the user. Ready for implementation planning.*
