-- Ensure all tables.token are exactly 32-char hex (lowercase)
-- This migration standardizes all tokens to the canonical format

-- First, let's update any tokens that don't match the 32-char hex format
UPDATE tables 
SET token = encode(gen_random_bytes(16), 'hex')
WHERE token IS NULL 
   OR token !~ '^[a-f0-9]{32}$'
   OR length(token) != 32;

-- Add a check constraint to ensure future tokens are always 32-char hex
ALTER TABLE tables 
ADD CONSTRAINT check_token_format 
CHECK (token ~ '^[a-f0-9]{32}$' AND length(token) = 32);

-- Update the token generation function to always return lowercase hex
CREATE OR REPLACE FUNCTION public.generate_table_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$function$;