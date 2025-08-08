# 🚨 CRITICAL SECURITY FIX REQUIRED

## Credentials Leak Detected

Hardcoded Supabase credentials were found in the mobile app code:
- **File**: `apps/mobile/src/services/supabaseAuth.ts`
- **Exposed**: Supabase URL and API key

## IMMEDIATE ACTIONS REQUIRED:

### 1. Regenerate Supabase Credentials (DO THIS FIRST!)
1. Log into your Supabase dashboard at https://supabase.com
2. Go to Settings > API
3. **Click "Generate new anon key"** 
4. **Click "Generate new service_role key"** (if you're using it)
5. Update your backend `.env` file with the new keys

### 2. Configure Mobile App Environment Variables
1. Create `apps/mobile/.env` file:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_new_regenerated_publishable_key_here
```

2. Update `apps/mobile/src/config/supabase.ts`:
   - Replace `YOUR_NEW_SUPABASE_URL_HERE` with your new URL
   - Replace `YOUR_NEW_SUPABASE_PUBLISHABLE_KEY_HERE` with your new publishable key

### 3. Add .env to .gitignore (if not already)
Ensure `apps/mobile/.env` is in your .gitignore file.

### 4. Update Backend .env
Update `apps/backend/.env` with the new credentials:
```bash
SUPABASE_URL=https://your-new-project.supabase.co
SUPABASE_SECRET_KEY=your_new_regenerated_secret_key_here
HEDERA_PRIVATE_KEY=your_hedera_private_key
HEDERA_ACCOUNT_ID=your_hedera_account_id
```

### 5. Git History Cleanup (Advanced)
Consider using `git filter-branch` or `BFG Repo-Cleaner` to remove the credentials from git history if this repo is public or shared.

## Files Modified:
- ✅ `apps/mobile/src/services/supabaseAuth.ts` - Fixed to use config
- ✅ `apps/mobile/src/config/supabase.ts` - New secure config file

## Security Best Practices:
- Never commit credentials to git
- Use environment variables for all sensitive data
- Regenerate credentials immediately after any leak
- Use different credentials for development/production
- Enable database row-level security (RLS) in Supabase

## Verification:
After fixing, verify that:
1. Mobile app connects with new credentials
2. Backend connects with new credentials
3. Old credentials no longer work
4. No credentials are hardcoded in any files