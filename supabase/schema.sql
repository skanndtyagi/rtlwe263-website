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
