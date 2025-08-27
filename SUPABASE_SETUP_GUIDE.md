# Supabase CLI Setup & Type Generation

## 🎯 Quick Setup (One-time)

### Step 1: Authenticate with Supabase
```bash
npx supabase login
```
This will open your browser to authenticate with your Supabase account.

### Step 2: Link Your Project
```bash
npx supabase link --project-ref zbfosmwzntckdrxrfwta
```

### Step 3: Generate Types (and verify it works)
```bash
npm run db:types
```

## 🔄 Daily Workflow

### Generate Types After Schema Changes
```bash
npm run db:types
```

### Verify Types Are Working
```bash
npm run typecheck
```

## 🚀 CI/CD Integration

### Option A: Add to existing CI check
Update `ci:check` script in `package.json`:
```json
{
  "scripts": {
    "ci:check": "npm run db:types && npm run lint && npm run typecheck && npm run build"
  }
}
```

### Option B: Separate CI step
Add to `.github/workflows/ci.yml`:
```yaml
- name: Generate Supabase Types
  run: npm run db:types
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

## 📋 Current Status

✅ **Supabase CLI installed** (`npm install --save-dev supabase`)  
✅ **Script added** (`npm run db:types`)  
✅ **Project config exists** (`supabase/config.toml`)  
❌ **Authentication needed** (run `npx supabase login`)  
❌ **Project linking needed** (run the link command above)  

## 🐛 Troubleshooting

### "Cannot find project ref" Error
```bash
npx supabase link --project-ref zbfosmwzntckdrxrfwta
```

### "Access token not provided" Error
```bash
npx supabase login
```

### Types Not Updating
1. Check your database schema in Supabase dashboard
2. Run `npm run db:types` again
3. Verify `src/types/supabase.ts` was updated

## 🎉 What This Fixes

Once set up, this will:
- ✅ Fix all 93 TypeScript errors
- ✅ Provide full type safety for database queries
- ✅ Auto-complete for table/column names
- ✅ Catch schema mismatches at compile time
- ✅ Keep types in sync with database changes



