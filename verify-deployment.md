# Supabase Edge Functions Deployment Verification

## Current Status
❌ Edge Functions are NOT deployed (getting "site cannot be reached")

## Next Steps

### 1. Connect to Supabase
Click the **"Connect to Supabase"** button in the top right of Bolt to:
- Automatically deploy all Edge Functions
- Set up the database schema
- Configure environment variables

### 2. Manual Verification
After connecting, test these URLs:

- Test function: `https://uyjaouovbqppopzkifmtp.supabase.co/functions/v1/test-function`
- GA4 auth: `https://uyjaouovbqppopzkifmtp.supabase.co/functions/v1/ga4-auth?clientId=test`

### 3. Environment Variables Needed
In Supabase Dashboard → Project Settings → Edge Functions → Environment Variables:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `https://your-project-ref.supabase.co/functions/v1/ga4-callback`
3. Add redirect URI: `https://uyjaouovbqppopzkifmtp.supabase.co/functions/v1/ga4-callback`
4. Enable Google Analytics APIs

## Expected Result
After deployment, the URLs should return JSON responses instead of "site cannot be reached"