# GA4 Integration Debug Checklist

## 🔍 Step-by-Step Troubleshooting Guide

### 1. Google Cloud Console Setup
- [ ] **Project Created**: You have a Google Cloud project
- [ ] **APIs Enabled**: 
  - [ ] Google Analytics Reporting API
  - [ ] Google Analytics Admin API
- [ ] **OAuth Consent Screen Configured**:
  - [ ] App name set
  - [ ] User support email set
  - [ ] Developer contact information provided
  - [ ] Publishing status is "Testing" or "In production"

### 2. OAuth 2.0 Client Configuration
- [ ] **Client Type**: Web application
- [ ] **Authorized JavaScript origins**: 
  - [ ] `https://your-project-ref.supabase.co`
  - [ ] `http://localhost:5173` (for development)
- [ ] **Authorized redirect URIs**:
  - [ ] `https://your-project-ref.supabase.co/functions/v1/ga4-callback`
  - [ ] `https://your-project-ref.supabase.co/functions/v1/gbp-callback`
  - [ ] `https://your-project-ref.supabase.co/functions/v1/gsc-callback`
  - [ ] Exact match (no trailing slashes, correct protocol)

### 3. Supabase Environment Variables
Go to: Supabase Dashboard → Project Settings → Edge Functions → Environment Variables

- [ ] **GOOGLE_CLIENT_ID**: Your OAuth client ID (ends with `.apps.googleusercontent.com`)
- [ ] **GOOGLE_CLIENT_SECRET**: Your OAuth client secret
- [ ] **GOOGLE_GBP_CLIENT_ID**: (Optional) Separate GBP OAuth client ID if using different credentials
- [ ] **GOOGLE_GBP_CLIENT_SECRET**: (Optional) Separate GBP OAuth client secret if using different credentials
- [ ] **SUPABASE_URL**: Auto-populated by Supabase
- [ ] **SUPABASE_SERVICE_ROLE_KEY**: Auto-populated by Supabase

### 4. Frontend Environment Variables
Check your `.env` file:

- [ ] **VITE_SUPABASE_URL**: Your Supabase project URL
- [ ] **VITE_SUPABASE_ANON_KEY**: Your Supabase anon key

### 5. Database Setup
- [ ] **Tables exist**: `clients`, `api_credentials`, `ga4_metrics`
- [ ] **RLS enabled**: Row Level Security is active
- [ ] **Policies configured**: Service role can manage all data

### 6. Edge Functions Deployment
- [ ] **Functions deployed**: ga4-auth, ga4-callback, ga4-fetch-data, ga4-metrics
- [ ] **Functions accessible**: Test URLs return responses (not 404)

## 🐛 Common Issues & Solutions

### "Accounts refuse to connect"
**Possible causes:**
1. **Redirect URI mismatch**: Check Google Cloud Console redirect URIs exactly match
2. **OAuth consent screen**: Not configured or missing required fields
3. **API not enabled**: Google Analytics APIs not enabled in Google Cloud
4. **Client ID/Secret**: Wrong credentials or not set in Supabase
5. **Token refresh fails**: Using wrong client credentials for token refresh

### "unauthorized_client" during token refresh
**Possible causes:**
1. **Wrong client credentials**: Refresh token was issued with different client_id/secret
2. **Environment variables**: GOOGLE_CLIENT_ID/SECRET don't match the OAuth app that issued the refresh token
3. **Multiple OAuth apps**: Using different OAuth apps for initial auth vs token refresh

**Solution:**
- Ensure the same GOOGLE_CLIENT_ID/SECRET are used for both initial OAuth and token refresh
- If using separate GBP credentials, set GOOGLE_GBP_CLIENT_ID and GOOGLE_GBP_CLIENT_SECRET
- Disconnect and reconnect GBP to get fresh tokens with correct client credentials
### "Error 400: redirect_uri_mismatch"
**Solution:** 
- Copy the exact redirect URI from the error message
- Add it to Google Cloud Console → APIs & Services → Credentials → Your OAuth Client

### "Error 403: access_denied"
**Possible causes:**
1. **OAuth consent screen**: App not verified or user not added to test users
2. **Scopes**: Required scopes not granted
3. **Account permissions**: User doesn't have access to GA4 properties

### "No properties found"
**Possible causes:**
1. **Account access**: User doesn't have GA4 properties
2. **API permissions**: Missing Analytics Admin API access
3. **Token scope**: Insufficient permissions granted

## 🔧 Debug Steps

### Step 1: Test Edge Function Directly
```bash
curl "https://your-project-ref.supabase.co/functions/v1/ga4-auth?clientId=test-123"
```
**Expected:** JSON response with `authUrl`

### Step 2: Check Environment Variables
Look at Supabase function logs for environment variable debug output

### Step 3: Test OAuth Flow
1. Click "Connect GA4" button
2. Check browser developer console for errors
3. Check Supabase function logs for detailed debug output

### Step 4: Verify Google Cloud Setup
1. Go to Google Cloud Console
2. Check OAuth consent screen status
3. Verify redirect URIs exactly match
4. Test with a different Google account

## 📋 Quick Verification Commands

### Check if APIs are enabled:
```bash
# In Google Cloud Shell
gcloud services list --enabled --filter="name:analytics"
```

### Test Supabase function:
```javascript
// In browser console
fetch('https://your-project-ref.supabase.co/functions/v1/ga4-auth?clientId=test', {
  headers: { 'Authorization': 'Bearer your-anon-key' }
}).then(r => r.json()).then(console.log)
```

## 🚨 Red Flags to Check

- [ ] **Redirect URI**: Must be EXACTLY `https://your-project-ref.supabase.co/functions/v1/ga4-callback`
- [ ] **Environment Variables**: No extra spaces, correct format
- [ ] **OAuth Consent Screen**: Must be configured, not just created
- [ ] **API Quotas**: Check if you've hit Google API limits
- [ ] **Function Logs**: Check Supabase function logs for detailed errors

## 📞 Getting More Help

If you're still stuck:
1. Check Supabase function logs for detailed debug output
2. Test with a fresh Google account
3. Verify all URLs and credentials character-by-character
4. Try the OAuth flow in an incognito browser window

The enhanced debug logging will now show exactly where the process is failing!