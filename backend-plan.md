# Backend migration plan for RTLWE263

This is the exact path to move the current site from localStorage to a real CMS-backed architecture using Supabase and Vercel.

## 1. Create the Supabase project

1. Sign up at https://supabase.com and create a new project.
2. Copy the project URL and the anon public API key.
3. In the Supabase dashboard, open SQL editor and run `supabase/schema.sql`.
4. Create a Storage bucket named `site-media`.
5. Enable public access for the bucket or configure signed URL access.

## 2. Create Supabase Auth admin user

1. Open the Supabase Auth panel.
2. Create a new user with admin email and password.
3. Optionally configure email confirmations.
4. Keep this admin account for logging in through the dashboard.

## 3. Configure Row Level Security (RLS)

For each table, enable RLS and add the following example policies:

- `hero_slides` / `gallery_images` / `programme_events` / `tablers`
  - allow `select` for `auth.role = 'anonymous'` or public policies
  - allow `insert`, `update`, `delete` for authenticated admin users
- `guestbook_entries`
  - allow `insert` for anonymous users
  - allow `select`, `update`, `delete` for authenticated admin users

Supabase will let you create policies in the dashboard.

## 4. Wire the frontend to Supabase

### a) Add global config placeholders

In the repo, create a small config file or use environment variables in deployment:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### b) Replace localStorage reads with Supabase queries

- `index.html` / `script.js`
  - query `hero_slides`, `gallery_images`, `programme_events`, `tablers`, and `site_settings`
  - render results live on page load

- `admin.html` / `admin.js`
  - use Supabase Auth instead of the local password
  - save content back to the database
  - upload files to `site-media` storage and save URLs in `media_files`

## 5. Build the media upload flow

1. Add a file upload field to the admin dashboard.
2. Use Supabase Storage client to upload images into `site-media`.
3. Save the returned public URL into `media_files` and reference it in `hero_slides` or `gallery_images`.

## 6. Deploy the frontend

Use Vercel or Netlify free tier:

1. Connect the GitHub repository.
2. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Deploy the site.

## 7. Optional: use Supabase Edge Functions

For better security and content validation, add Edge Functions for:

- secure guestbook submission
- admin content save
- hero/gallery content updates
- image upload metadata processing

This lets you keep the browser client limited to read-only public data and use a protected service role for writes.

## Where I need your assistance

1. Create the Supabase project and give me the project URL + anon key.
2. Decide whether you want a public `anon` frontend or a small API layer.
3. Confirm which fields must be editable from the dashboard:
   - hero slides
   - gallery images
   - event cards
   - tabler profiles
   - guestbook approval
4. Confirm whether you want image upload directly in admin or managed manually with paths.

## What I can build next

- full Supabase frontend integration inside `script.js` and `admin.js`
- admin login with Supabase Auth
- image upload UI and storage integration
- deploy-ready Vercel configuration
- a lightweight API layer for secure writes
