-- Fix OTP long expiry security warning
-- Set OTP expiry to 1 hour (3600 seconds) which is the recommended maximum

-- Update auth configuration to set reasonable OTP expiry
UPDATE auth.config 
SET 
  otp_exp = 3600,  -- 1 hour in seconds
  password_min_length = 6
WHERE TRUE;