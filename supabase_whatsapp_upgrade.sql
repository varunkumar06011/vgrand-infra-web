-- ============================================================
-- V Grand Group — Supabase Migration (WhatsApp Integration)
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- 1. Upgrade LEADS TABLE with new columns
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS property_type TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS project_id UUID;

-- 2. Upgrade SESSIONS TABLE for the bot
ALTER TABLE public.whatsapp_sessions
ADD COLUMN IF NOT EXISTS property_type TEXT;

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS leads_source_idx     ON public.leads(source);
CREATE INDEX IF NOT EXISTS leads_status_idx     ON public.leads(status);

-- 3. Enable realtime for leads table (for the auto-updating dashboard)
-- Note: This requires the 'supabase_realtime' publication to exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If publication doesn't exist, just skip (the user might not have set it up)
    NULL;
END $$;
