-- Lead & click tracking
-- Run once in Supabase → SQL Editor. Safe to run again.
--
-- 1. site_events: every link/button click, form submit and 3D-walkthrough open on the site
-- 2. leads + consent_logs: where the visitor came from (utm / referrer / landing page)
-- 3. consent_logs: the optional mobile number from the consent pop-up, with the exact consent text
--
-- Until this is run, the website keeps working: leads and consent are saved without the new
-- columns (see src/lib/leadSource.ts) and click events are simply not stored.

-- ─── 1. SITE_EVENTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_type TEXT NOT NULL,          -- call_click, whatsapp_click, directions_click, form_submit, 3d_open, link_click, button_click …
    label TEXT,                        -- button text, e.g. "Book a site visit"
    href TEXT,                         -- where the link pointed
    page_path TEXT,                    -- page the click happened on
    session_id TEXT,                   -- groups one visitor's clicks in one browser tab session
    device TEXT,                       -- mobile / desktop
    utm_source TEXT,                   -- google, instagram, facebook_ads, google_ads, a referring site, or direct
    utm_medium TEXT,
    utm_campaign TEXT,
    referrer TEXT,
    landing_page TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert events" ON public.site_events;
DROP POLICY IF EXISTS "Admin reads events" ON public.site_events;

CREATE POLICY "Public can insert events"
  ON public.site_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin reads events"
  ON public.site_events FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_site_events_created_at ON public.site_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_type ON public.site_events (event_type, created_at DESC);

-- ─── 2. LEADS: where the visitor came from ────────────────
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_source TEXT DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_medium TEXT DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS referrer TEXT DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS landing_page TEXT DEFAULT NULL;

COMMENT ON COLUMN public.leads.utm_source IS 'First-visit source: utm_source, google_ads/facebook_ads (click id), referring site, or direct';
COMMENT ON COLUMN public.leads.landing_page IS 'First page the visitor landed on';

-- ─── 3. CONSENT_LOGS: optional phone from the pop-up ──────
ALTER TABLE public.consent_logs ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT NULL;
ALTER TABLE public.consent_logs ADD COLUMN IF NOT EXISTS consent_text TEXT DEFAULT NULL;
ALTER TABLE public.consent_logs ADD COLUMN IF NOT EXISTS utm_source TEXT DEFAULT NULL;

COMMENT ON COLUMN public.consent_logs.phone IS 'Mobile number the visitor typed after ticking "contact me" (optional)';
COMMENT ON COLUMN public.consent_logs.consent_text IS 'Exact wording the visitor agreed to';

-- ─── Handy report: clicks by type, last 30 days ───────────
-- SELECT event_type, COUNT(*) FROM public.site_events
-- WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY 1 ORDER BY 2 DESC;
--
-- Leads by source:
-- SELECT COALESCE(utm_source, 'direct') AS source, COUNT(*) FROM public.leads GROUP BY 1 ORDER BY 2 DESC;
