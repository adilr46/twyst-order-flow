-- Update existing tokens to 32-char hex format if they're not already
-- This will regenerate tokens for any tables that don't have valid 32-char hex tokens

UPDATE public.tables 
SET token = encode(gen_random_bytes(16), 'hex')
WHERE NOT (token ~ '^[a-fA-F0-9]{32}$');

-- Add a check to ensure all future tokens are 32-char hex
ALTER TABLE public.tables 
ADD CONSTRAINT tables_token_format_check 
CHECK (token ~ '^[a-fA-F0-9]{32}$');

-- Update the generate_table_token function to always generate 32-char hex
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