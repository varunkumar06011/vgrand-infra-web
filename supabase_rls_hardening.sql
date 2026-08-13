-- ============================================================
-- V Grand Infra — RLS Hardening Migration
-- Run this in Supabase → SQL Editor → New Query → Run
--
-- This enables Row Level Security on ALL tables and creates
-- proper policies. Even though our API uses the service role
-- key (which bypasses RLS), this adds defense-in-depth in case
-- the service key is ever compromised or if the anon key is
-- used to access tables directly from the browser.
-- ============================================================

-- ─── LEADS TABLE ──────────────────────────────────────────
-- Already has RLS enabled in schema.sql, but ensure policies are complete

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate cleanly (safe — IF EXISTS)
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Admin reads leads" ON public.leads;
DROP POLICY IF EXISTS "Admin updates leads" ON public.leads;
DROP POLICY IF EXISTS "Admin deletes leads" ON public.leads;

-- Public can insert (form submissions, brochure downloads, enquiries)
CREATE POLICY "Public can insert leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- Only authenticated admin can read
CREATE POLICY "Admin reads leads"
  ON public.leads FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authenticated admin can update
CREATE POLICY "Admin updates leads"
  ON public.leads FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Only authenticated admin can delete
CREATE POLICY "Admin deletes leads"
  ON public.leads FOR DELETE
  USING (auth.role() = 'authenticated');

-- ─── PROJECTS TABLE ───────────────────────────────────────
-- Already has RLS enabled, but ensure DELETE policy exists

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads projects" ON public.projects;
DROP POLICY IF EXISTS "Admin manages projects" ON public.projects;

-- Public can read (marketing data shown on website)
CREATE POLICY "Public reads projects"
  ON public.projects FOR SELECT
  USING (true);

-- Only authenticated admin can insert/update/delete
CREATE POLICY "Admin manages projects"
  ON public.projects FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ─── MATERIALS TABLE ──────────────────────────────────────
-- Enable RLS — this table was missing it entirely

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages materials" ON public.materials;

-- Only authenticated admin can do anything (inventory is private)
CREATE POLICY "Admin manages materials"
  ON public.materials FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ─── CONSENT_LOGS TABLE ───────────────────────────────────
-- Already has RLS enabled, but add public INSERT policy

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert consent" ON public.consent_logs;
DROP POLICY IF EXISTS "Allow service role to manage consent logs" ON public.consent_logs;
DROP POLICY IF EXISTS "Admin reads consent logs" ON public.consent_logs;

-- Public can insert (consent popup submission)
CREATE POLICY "Public can insert consent"
  ON public.consent_logs FOR INSERT
  WITH CHECK (true);

-- Only authenticated admin can read
CREATE POLICY "Admin reads consent logs"
  ON public.consent_logs FOR SELECT
  USING (auth.role() = 'authenticated');

-- ─── SITE_VISITS TABLE ────────────────────────────────────
-- Enable RLS — this table was missing it entirely

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert visits" ON public.site_visits;
DROP POLICY IF EXISTS "Admin reads visits" ON public.site_visits;

-- Public can insert (visit tracking from website)
CREATE POLICY "Public can insert visits"
  ON public.site_visits FOR INSERT
  WITH CHECK (true);

-- Only authenticated admin can read
CREATE POLICY "Admin reads visits"
  ON public.site_visits FOR SELECT
  USING (auth.role() = 'authenticated');

-- ─── CONSTRUCTION_UPDATES TABLE ───────────────────────────
-- Enable RLS — this table was missing it entirely

ALTER TABLE public.construction_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads construction updates" ON public.construction_updates;
DROP POLICY IF EXISTS "Admin manages construction updates" ON public.construction_updates;

-- Public can read (shown on project pages)
CREATE POLICY "Public reads construction updates"
  ON public.construction_updates FOR SELECT
  USING (true);

-- Only authenticated admin can insert/update/delete
CREATE POLICY "Admin manages construction updates"
  ON public.construction_updates FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ─── WHATSAPP_SESSIONS TABLE ──────────────────────────────
-- Already has RLS enabled, verify policy is correct

ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role to manage sessions" ON public.whatsapp_sessions;

-- Only service role can manage (used by webhook API)
CREATE POLICY "Allow service role to manage sessions"
  ON public.whatsapp_sessions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- DONE! All tables now have proper RLS policies.
-- 
-- Summary:
--   leads:                public INSERT, admin SELECT/UPDATE/DELETE
--   projects:             public SELECT, admin INSERT/UPDATE/DELETE
--   materials:            admin ALL (private inventory)
--   consent_logs:         public INSERT, admin SELECT
--   site_visits:          public INSERT, admin SELECT
--   construction_updates: public SELECT, admin INSERT/UPDATE/DELETE
--   whatsapp_sessions:    service_role ALL (webhook only)
-- ============================================================
