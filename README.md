# Round Table London West End 623 website

This repository contains the RTLWE263 public website and a protected admin dashboard for content updates.

## Image assets

Put your images in the `assets/` folder. Recommended names:

- `assets/hero.jpg`
- `assets/og-cover.jpg`
- `assets/gallery-01.jpg`
- `assets/gallery-02.jpg`
- `assets/gallery-03.jpg`
- `assets/gallery-04.jpg`
- `assets/gallery-05.jpg`
- `assets/gallery-06.jpg`

Tabler photos:

- `assets/tabler-ryan-zammit.jpg`
- `assets/tabler-matteo.jpg`
- `assets/tabler-amit-shah.jpg`
- `assets/tabler-steve.jpg`
- `assets/tabler-john-bergqvist.jpg`
- `assets/tabler-kyle-west.jpg`
- `assets/tabler-vedang-tyagi.jpg`
- `assets/tabler-david-crow.jpg`
- `assets/tabler-amrinder-chana.jpg`
- `assets/tabler-jon-clark.jpg`
- `assets/tabler-jay-shah.jpg`

## Admin workflow

The public site is `index.html`.
The protected CMS starts at `admin-login.html`.
After login, the dashboard is available at `admin.html`.

### Guestbook approvals

Visitor entries are sent to `london.westend@roundtable.org.uk` via mailto and stored locally for admin moderation.

### Event management

The admin page includes date, time, location, contact, title, and description fields for each event.
Approved entries show on the public site in a calendar-style layout with details and add-to-calendar actions.

## Development

Open `index.html` in a browser for the public site, or use `admin-login.html` to access the protected dashboard.

## Notes

- The homepage no longer exposes the CMS.
- Photo gallery updates are managed through the admin panel.
- The hero banner now cycles through gallery images automatically.

## Backend migration plan

This repo now includes a Supabase backend plan for turning the current site into a real CMS:

- `supabase/schema.sql` contains the DB schema for content, hero slides, gallery images, events, tablers, guestbook entries, and media.
- `backend-plan.md` describes the exact Supabase + Vercel migration steps.

If you want, I can now continue by wiring Supabase into `script.js` and `admin.js` so the dashboard becomes live-backed instead of localStorage-based.
