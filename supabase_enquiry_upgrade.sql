-- Add interested_flat column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS interested_flat TEXT DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN leads.interested_flat IS 'The property the customer responded to in the Enquire Now modal';
