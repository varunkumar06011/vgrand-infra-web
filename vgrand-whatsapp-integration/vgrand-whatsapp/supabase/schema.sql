-- ============================================================
-- V Grand Group — Supabase Schema
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- 1. LEADS TABLE
-- Stores all leads from WhatsApp bot + enquiry forms

create table if not exists public.leads (
  id             uuid primary key default gen_random_uuid(),
  name           text,
  phone          text,
  whatsapp       text,            -- raw WhatsApp number from Meta
  email          text,
  location       text,            -- Ongole / Koppolu / Other
  budget         text,            -- Under ₹40L / ₹40L-₹80L / ₹80L+
  property_type  text,            -- 2BHK / 3BHK / Villa
  message        text,            -- free-text from enquiry form
  source         text default 'website',  -- 'whatsapp' | 'form' | 'website'
  status         text default 'new',      -- 'new' | 'contacted' | 'converted' | 'lost'
  project_id     uuid,            -- if lead came from a specific project page
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Index for admin dashboard queries
create index if not exists leads_source_idx     on public.leads(source);
create index if not exists leads_status_idx     on public.leads(status);
create index if not exists leads_created_at_idx on public.leads(created_at desc);

-- 2. PROJECTS TABLE

create table if not exists public.projects (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  location       text,
  maps_url       text,
  type           text,            -- '2BHK' | '3BHK' | 'Villa' | 'Plot'
  status         text default 'upcoming',  -- 'upcoming' | 'ongoing' | 'completed'
  price_start    bigint,          -- in rupees, e.g. 3500000
  price_display  text,            -- e.g. "₹35 Lakhs onwards"
  rera_number    text,
  amenities      text[],          -- array of strings
  images         text[],          -- Cloudinary URLs
  floor_plans    text[],          -- Cloudinary URLs
  description    text,
  slug           text unique,     -- URL slug: "green-meadows-ongole"
  featured       boolean default false,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_slug_idx   on public.projects(slug);

-- 3. AUTO-UPDATE updated_at

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.handle_updated_at();

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

-- 4. ROW LEVEL SECURITY
-- Public can INSERT leads (form / webhook)
-- Only authenticated admin can SELECT/UPDATE/DELETE

alter table public.leads    enable row level security;
alter table public.projects enable row level security;

-- Leads: anyone can insert, only admin can read
create policy "Public can insert leads"
  on public.leads for insert
  with check (true);

create policy "Admin reads leads"
  on public.leads for select
  using (auth.role() = 'authenticated');

create policy "Admin updates leads"
  on public.leads for update
  using (auth.role() = 'authenticated');

-- Projects: public can read, only admin can write
create policy "Public reads projects"
  on public.projects for select
  using (true);

create policy "Admin manages projects"
  on public.projects for all
  using (auth.role() = 'authenticated');

-- ============================================================
-- Done! Now go to Supabase → Auth → Users → Add User
-- Create one admin user: admin@vgrandgroup.com
-- ============================================================
