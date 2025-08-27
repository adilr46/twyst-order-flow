-- Fix table token format for robustness
-- First update existing tokens, then add constraints

-- Function to generate secure hex tokens
CREATE OR REPLACE FUNCTION generate_table_token() 
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Update all existing tokens to use proper hex format
UPDATE public.tables 
SET token = generate_table_token();

-- Now add constraint to reject tokens with whitespace or wrong format
ALTER TABLE public.tables DROP CONSTRAINT IF EXISTS tables_token_format_check;
ALTER TABLE public.tables ADD CONSTRAINT tables_token_format_check 
  CHECK (token ~ '^[a-fA-F0-9]+$' AND char_length(token) >= 16);

-- Add created_at timestamp if missing for token expiry logic  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tables' AND column_name = 'created_at') THEN
    ALTER TABLE public.tables ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
END
$$;