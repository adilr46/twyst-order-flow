-- Fix function security by setting search_path
CREATE OR REPLACE FUNCTION generate_table_token() 
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;