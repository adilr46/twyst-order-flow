-- First, ensure RLS is enabled (which you've already done)
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Create a policy for public read access
CREATE POLICY "Venues are viewable by everyone" 
ON public.venues
FOR SELECT
USING (true);

-- Create a policy for admin/service role to manage venues
CREATE POLICY "Service role can manage venues"
ON public.venues
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions to service role
GRANT ALL ON public.venues TO service_role;

