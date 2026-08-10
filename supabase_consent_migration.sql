-- Consent Logs table — stores proof of user acceptance of Terms, Privacy Policy, and Contact consent
CREATE TABLE IF NOT EXISTS consent_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    accepted_terms BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_privacy BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_contact BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address TEXT,
    user_agent TEXT,
    page_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert and read consent logs (used by our API route)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'consent_logs' AND policyname = 'Allow service role to manage consent logs'
    ) THEN
        CREATE POLICY "Allow service role to manage consent logs"
        ON consent_logs
        FOR ALL
        USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Index for sorting by most recent
CREATE INDEX IF NOT EXISTS idx_consent_logs_created_at ON consent_logs (created_at DESC);
