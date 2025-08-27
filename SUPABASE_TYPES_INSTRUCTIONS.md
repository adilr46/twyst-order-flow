# Supabase Types Generation Instructions

## Step 1: Generate Real Types
Run these commands in your terminal:

```bash
# Link to your project (if not already linked)
supabase link

# Generate TypeScript types from your database schema
supabase gen types typescript --linked --schema public > src/types/supabase.ts
```

## Step 2: Verify the Generated Types
After running the command, `src/types/supabase.ts` should contain:
- A large `export type Database = { ... }` object
- Tables definitions for: `venues`, `tables`, `sessions`, `orders`, `order_items`, `items`, `stripe_events`, `event_log`, `metrics_daily`
- Proper column types for each table

## Step 3: Check Your Database Schema
If the generated types don't match what the code expects, you may need to run migrations or adjust queries. Common mismatches:
- Missing columns that code tries to select
- Wrong column names or types
- Missing tables

## Current Status
- ✅ Supabase client is already typed with `createClient<Database>(...)`
- ✅ Stable re-export exists at `src/lib/supabase.ts`
- ❌ Real types needed to fix 93 type errors

## After Types are Generated
Run `npm run typecheck` to see remaining errors, which should drop dramatically from 93 to <10.



