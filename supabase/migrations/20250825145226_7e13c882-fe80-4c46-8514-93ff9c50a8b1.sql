-- Improve table token format for robustness
-- Ensure all tokens are hex format and URL-safe

-- Add constraint to reject tokens with whitespace
ALTER TABLE public.tables DROP CONSTRAINT IF EXISTS tables_token_format_check;
ALTER TABLE public.tables ADD CONSTRAINT tables_token_format_check 
  CHECK (token ~ '^[a-fA-F0-9]+$' AND char_length(token) >= 16);

-- Function to generate secure hex tokens
CREATE OR REPLACE FUNCTION generate_table_token() 
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Update existing tokens to use proper hex format
UPDATE public.tables 
SET token = generate_table_token()
WHERE token !~ '^[a-fA-F0-9]+$' OR char_length(token) < 16;

-- Add created_at timestamp if missing for token expiry logic
ALTER TABLE public.tables 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();