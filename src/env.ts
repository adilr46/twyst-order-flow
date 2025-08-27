import { z } from "zod";

/**
 * Environment Variables Schema
 * 
 * This schema validates all required environment variables at startup.
 * If any required variable is missing or invalid, the app will fail to start
 * with a clear error message.
 */
const EnvSchema = z.object({
  // Supabase Configuration (public) - temporarily optional for setup
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),

  // Stripe Configuration (server-side only) - optional for development
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Application Configuration - optional with defaults
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),
  
  // Environment variables with defaults
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DEMO_MODE: z.string().optional(),
  DEMO_PIN: z.string().optional(),
  SUPABASE_SERVICE_ROLE: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

/**
 * Validated Environment Variables
 * 
 * Import this object instead of using process.env directly.
 * This ensures type safety and validation of all environment variables.
 * 
 * Usage:
 *   import { ENV } from "@/env";
 *   const url = ENV.NEXT_PUBLIC_SUPABASE_URL; // Type-safe and validated
 */
export const ENV = EnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
  DEMO_MODE: process.env.DEMO_MODE,
  DEMO_PIN: process.env.DEMO_PIN,
  SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE,
  SENTRY_DSN: process.env.SENTRY_DSN,
});

