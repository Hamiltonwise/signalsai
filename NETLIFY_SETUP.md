# Netlify Environment Variables Setup

## 🚨 The Issue
Your dashboard is live but the connect buttons don't work because environment variables aren't set in Netlify.

## ✅ The Fix

### Step 1: Get Your Supabase Credentials
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** (starts with `https://`)
   - **Anon/Public Key** (starts with `eyJ`)

### Step 2: Add Environment Variables to Netlify
1. Go to your [Netlify Dashboard](https://app.netlify.com)
2. Click on your **hamiltonwisedashboard** site
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable** and add these:

```
VITE_SUPABASE_URL = https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Redeploy Your Site
1. In Netlify, go to **Deploys**
2. Click **Trigger deploy** → **Deploy site**
3. Wait for deployment to complete

### Step 4: Test the Connection
1. Go to `hamiltonwisedashboard.netlify.app`
2. The yellow warning should be gone
3. Click "Connect GA4" - it should now work!

## 🔍 How to Find Your Supabase Values

### Project URL:
- Format: `https://abcdefghijklmnop.supabase.co`
- Found in: Supabase Dashboard → Settings → API → Project URL

### Anon Key:
- Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long)
- Found in: Supabase Dashboard → Settings → API → Project API keys → anon/public

## ✅ After Setup
Once environment variables are added and site is redeployed:
- Connect buttons will work
- Yellow warning will disappear  
- GA4 integration will function properly
- All Supabase Edge Functions will be accessible

## 🚨 Security Note
- Never commit `.env` files to GitHub
- Environment variables in Netlify are secure
- Only use the **anon/public** key, never the service role key for frontend