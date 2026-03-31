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
  "order" int default 0,
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

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

create type guestbook_status as enum ('pending', 'approved', 'rejected');

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
