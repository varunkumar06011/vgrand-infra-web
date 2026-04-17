-- 1. Add budget, location, property_type, and whatsapp columns to leads table if they don't exist
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS budget TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS property_type TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- 2. Create whatsapp_sessions table for state management
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    phone_number TEXT PRIMARY KEY,
    step TEXT DEFAULT 'START',
    name TEXT,
    budget TEXT,
    location TEXT,
    property_type TEXT, -- Added this missing column
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for whatsapp_sessions
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage sessions (used by our API route)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'whatsapp_sessions' AND policyname = 'Allow service role to manage sessions'
    ) THEN
        CREATE POLICY "Allow service role to manage sessions" 
        ON whatsapp_sessions 
        FOR ALL 
        USING (auth.role() = 'service_role');
    END IF;
END $$;
