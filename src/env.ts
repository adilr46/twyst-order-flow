import { z } from "zod";

/**
 * Simplified Environment Variables for Pilot
 * 
 * Only validates the essential variables needed for the pilot.
 * This reduces complexity and potential runtime errors.
 */
const EnvSchema = z.object({
  // Required Supabase Configuration (Public only for pilot)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),

  // Server-side Supabase Configuration (for API routes)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Optional Stripe Configuration (for checkout)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string(), // Required for webhook signature verification

  // Application Configuration with defaults
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Optional Demo Configuration
  DEMO_MODE: z.string().optional(),
  DEMO_PIN: z.string().optional(),
});

// Load and validate environment variables
const envData = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NODE_ENV: process.env.NODE_ENV || 'development',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  DEMO_MODE: process.env.DEMO_MODE,
  DEMO_PIN: process.env.DEMO_PIN,
};

// Validate and export
export const ENV = EnvSchema.parse(envData);