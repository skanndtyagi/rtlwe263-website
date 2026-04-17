-- Supabase schema for RTLWE263 CMS
-- Run this in Supabase SQL editor after creating a project.

create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default now()
);

create table if not exists hero_slides (
  id uuid default gen_random_uuid() primary key,
  src text not null,
  caption text,
  "order" int default 0,
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists gallery_images (
  id uuid default gen_random_uuid() primary key,
  src text not null,
  caption text,
  event_name text default 'General',
  event_date date,
  "order" bigint default 0,
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Migration: add event columns if upgrading from an earlier schema
alter table gallery_images add column if not exists event_name text default 'General';
alter table gallery_images add column if not exists event_date date;
-- Migration: widen order column to bigint if it was created as integer
alter table gallery_images alter column "order" type bigint using "order"::bigint;

-- Enable Row Level Security
alter table gallery_images enable row level security;
-- Public can read active gallery images
drop policy if exists "Public gallery images readable" on gallery_images;
create policy "Public gallery images readable"
  on gallery_images for select to anon
  using (active = true);
-- Authenticated (admin) can do everything
drop policy if exists "Authenticated users manage gallery" on gallery_images;
create policy "Authenticated users manage gallery"
  on gallery_images for all to authenticated
  using (true) with check (true);

-- ----------------------------------------------------------------
-- Supabase Storage bucket for gallery photo uploads
-- Run these lines OR create the bucket via the Supabase Dashboard:
--   Name: gallery   |   Public: ON
-- ----------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('gallery', 'gallery', true)
  on conflict (id) do nothing;

-- Allow public to read gallery files
drop policy if exists "Public gallery reads" on storage.objects;
create policy "Public gallery reads"
  on storage.objects for select to anon
  using (bucket_id = 'gallery');
-- Allow authenticated admin to upload / delete gallery files
drop policy if exists "Admin gallery uploads" on storage.objects;
create policy "Admin gallery uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery');
drop policy if exists "Admin gallery deletes" on storage.objects;
create policy "Admin gallery deletes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'gallery');

create table if not exists programme_events (
  id uuid default gen_random_uuid() primary key,
  date date,
  time text,
  location text,
  title text not null,
  description text,
  contact text,
  "order" int default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists tablers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  title text,
  photo_url text,
  bio text,
  "order" int default 0,
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

do $$ begin
  create type guestbook_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists guestbook_entries (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  club text not null,
  message text not null,
  status guestbook_status default 'pending',
  created_at timestamp with time zone default now(),
  approved_at timestamp with time zone
);

create table if not exists media_files (
  id uuid default gen_random_uuid() primary key,
  path text not null,
  url text not null,
  type text,
  uploaded_by uuid,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- ----------------------------------------------------------------
-- Consent logging table for GDPR compliance
-- ----------------------------------------------------------------
create table if not exists consent_log (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  consent_given boolean not null,
  consent_type text not null check (consent_type in ('essential', 'all', 'custom')),
  timestamp timestamp with time zone default now()
);

-- ----------------------------------------------------------------
-- Row Level Security Policies
-- ----------------------------------------------------------------

-- Enable RLS on hero_slides
alter table hero_slides enable row level security;
drop policy if exists "Public read active hero slides" on hero_slides;
create policy "Public read active hero slides"
  on hero_slides for select to anon
  using (active = true);
drop policy if exists "Authenticated manage hero slides" on hero_slides;
create policy "Authenticated manage hero slides"
  on hero_slides for all to authenticated
  using (true) with check (true);

-- Enable RLS on tablers
alter table tablers enable row level security;
drop policy if exists "Public read active tablers" on tablers;
create policy "Public read active tablers"
  on tablers for select to anon
  using (active = true);
drop policy if exists "Authenticated manage tablers" on tablers;
create policy "Authenticated manage tablers"
  on tablers for all to authenticated
  using (true) with check (true);

-- Enable RLS on site_settings (public read all settings)
alter table site_settings enable row level security;
drop policy if exists "Public read site settings" on site_settings;
create policy "Public read site settings"
  on site_settings for select to anon
  using (true);
drop policy if exists "Authenticated manage site settings" on site_settings;
create policy "Authenticated manage site settings"
  on site_settings for all to authenticated
  using (true) with check (true);

-- Enable RLS on programme_events (public read all events)
alter table programme_events enable row level security;
drop policy if exists "Public read programme events" on programme_events;
create policy "Public read programme events"
  on programme_events for select to anon
  using (true);
drop policy if exists "Authenticated manage programme events" on programme_events;
create policy "Authenticated manage programme events"
  on programme_events for all to authenticated
  using (true) with check (true);

-- Enable RLS on guestbook_entries (moderation flow)
alter table guestbook_entries enable row level security;
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

-- Enable RLS on media_files (authenticated only)
alter table media_files enable row level security;
drop policy if exists "Authenticated manage media files" on media_files;
create policy "Authenticated manage media files"
  on media_files for all to authenticated
  using (true) with check (true);

-- Enable RLS on consent_log (anon insert, authenticated read)
alter table consent_log enable row level security;
drop policy if exists "Public can log consent" on consent_log;
create policy "Public can log consent"
  on consent_log for insert to anon
  with check (true);
drop policy if exists "Authenticated read consent log" on consent_log;
create policy "Authenticated read consent log"
  on consent_log for select to authenticated
  using (true);

-- ----------------------------------------------------------------
-- Database constraints for input validation
-- ----------------------------------------------------------------

-- Guestbook entries constraints
alter table guestbook_entries
  add constraint if not exists name_length check (length(name) >= 2 and length(name) <= 60),
  add constraint if not exists club_length check (length(club) >= 2 and length(club) <= 80),
  add constraint if not exists message_length check (length(message) >= 10 and length(message) <= 400);

-- Gallery images constraints
alter table gallery_images
  add constraint if not exists caption_length check (caption is null or length(caption) <= 200);

-- Hero slides constraints
alter table hero_slides
  add constraint if not exists caption_length check (caption is null or length(caption) <= 100);

-- ----------------------------------------------------------------
-- Supabase Storage bucket for site media uploads
-- Run these lines OR create the bucket via the Supabase Dashboard:
--   Name: site-media   |   Public: ON
-- ----------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('site-media', 'site-media', true)
  on conflict (id) do nothing;

-- Allow public to read site-media files
drop policy if exists "Public site-media reads" on storage.objects;
create policy "Public site-media reads"
  on storage.objects for select to anon
  using (bucket_id = 'site-media');
-- Allow authenticated admin to upload site-media files
drop policy if exists "Admin site-media uploads" on storage.objects;
create policy "Admin site-media uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media');
drop policy if exists "Admin site-media deletes" on storage.objects;
create policy "Admin site-media deletes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'site-media');
