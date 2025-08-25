# Google OAuth Setup - Fix Testing Mode Issue

## The Issue
You're seeing: "has not completed the Google verification process. The app is currently being tested, and can only be accessed by developer-approved testers."

This means your Google Cloud OAuth app is in **Testing mode** and you need to either:
1. Add yourself as a test user, OR
2. Publish the app (not recommended for development)

## Solution: Add Test Users

### Step 1: Go to Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **OAuth consent screen**

### Step 2: Add Test Users
1. Scroll down to the **Test users** section
2. Click **+ ADD USERS**
3. Add your Google email address (the one you're trying to connect with)
4. Click **SAVE**

### Step 3: Verify Settings
Make sure your OAuth consent screen has:
- **App name**: Set (e.g., "Dental Vital Signs Dashboard")
- **User support email**: Your email
- **Developer contact information**: Your email
- **Publishing status**: Testing (this is fine for development)

### Step 4: Enable Required APIs
Go to **APIs & Services** → **Library** and enable these APIs:
1. **Google Analytics Reporting API**
2. **Google Analytics Admin API** 
3. **Google My Business API**
4. **Google Business Profile Performance API**
5. **Google Search Console API**

### Step 5: Add Required OAuth Scopes
Your OAuth consent screen should include these scopes:
- `https://www.googleapis.com/auth/analytics.readonly`
- `https://www.googleapis.com/auth/analytics.manage.users.readonly`
- `https://www.googleapis.com/auth/business.manage`
- `https://www.googleapis.com/auth/plus.business.manage`
- `https://www.googleapis.com/auth/businessprofileperformance`
- `https://www.googleapis.com/auth/business.reviews`
- `https://www.googleapis.com/auth/webmasters.readonly`

### Step 6: Test the Connection
1. Go back to your dashboard
2. Try "Connect GA4" again
3. You should now be able to authenticate with the email you added as a test user

## Alternative: Publish the App (Optional)
If you want anyone to be able to connect (not recommended for development):
1. In OAuth consent screen, click **PUBLISH APP**
2. This will require Google's verification process for production use

## Important Notes
- **Testing mode** is perfect for development
- You can add up to 100 test users
- Test users can use the app without Google's verification
- Only add trusted email addresses as test users

## Troubleshooting
If you still have issues after adding test users:
1. Wait 5-10 minutes for changes to propagate
2. Try in an incognito/private browser window
3. Make sure you're logging in with the exact email you added as a test user
4. Clear browser cache and cookies for Google accounts

## Next Steps
After adding yourself as a test user, the GA4 connection should work perfectly!

## Live Site Configuration
For your live Netlify site at `hamiltonwisedashboard.netlify.app`, make sure to add these URLs in your Google Cloud Console OAuth settings:

### Authorized JavaScript Origins:
- `https://hamiltonwisedashboard.netlify.app`
- `http://localhost:5173` (for development)

### Authorized Redirect URIs:
- `https://your-project-ref.supabase.co/functions/v1/ga4-callback`

This ensures the OAuth flow works properly from your live dashboard.