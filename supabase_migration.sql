-- 1. Add budget and location columns to leads table if they don't exist
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS budget TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- 2. Create whatsapp_sessions table for state management
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    phone_number TEXT PRIMARY KEY,
    step TEXT DEFAULT 'START',
    name TEXT,
    budget TEXT,
    location TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for whatsapp_sessions (optional, but good practice for admin access)
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage sessions
CREATE POLICY "Allow service role to manage sessions" 
ON whatsapp_sessions 
FOR ALL 
USING (auth.role() = 'service_role');
