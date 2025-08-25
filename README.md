# Dental Vital Signs Dashboard

A comprehensive dashboard for dental practices to monitor their online presence and patient engagement metrics.

## Features

- **Vital Signs Score**: Overall performance score based on multiple metrics
- **Google Analytics 4 Integration**: Website performance tracking
- **Google Business Profile Metrics**: Local search performance
- **Google Search Console**: Search visibility and rankings
- **Microsoft Clarity**: User experience insights
- **AI-Powered Insights**: Automated analysis and recommendations

## Setup

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase Edge Functions Environment Variables

In your Supabase dashboard, go to Project Settings → Edge Functions → Environment Variables and add:

```env
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Analytics API and Google Analytics Admin API
4. Create OAuth 2.0 credentials
5. Add your Supabase Edge Function callback URL as an authorized redirect URI:
   `https://your-project-ref.supabase.co/functions/v1/ga4-callback`
6. **For your live Netlify site, also add these URLs to Google OAuth:**
   - Authorized JavaScript origins: `https://hamiltonwisedashboard.netlify.app`
   - Authorized redirect URIs: `https://your-project-ref.supabase.co/functions/v1/ga4-callback`

### 4. Database Setup

The database schema is already configured in Supabase with the following tables:
- `clients` - Practice information
- `api_credentials` - Encrypted API tokens
- `ga4_metrics` - Google Analytics data

### 5. Deployment

This is a static React application that can be deployed to any static hosting service:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: Supabase PostgreSQL
- **Authentication**: Google OAuth 2.0
- **APIs**: Google Analytics 4, Google Business Profile, Google Search Console, Microsoft Clarity

## Usage

1. Deploy the application to your preferred hosting service
2. Configure the environment variables
3. Access the dashboard and connect your Google Analytics account
4. View your dental practice's vital signs and performance metrics

## Security

- All API credentials are encrypted before storage
- OAuth tokens are securely managed through Supabase
- Row Level Security (RLS) is enabled on all database tables