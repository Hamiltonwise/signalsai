import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the server directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Environment variables check:');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  console.error('Current working directory:', process.cwd());
  console.error('NODE_ENV:', process.env.NODE_ENV);
  
  throw new Error(`Missing Supabase configuration. Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.
Current status:
- SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Missing'}
- SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'Set' : 'Missing'}

Make sure you have a .env file in the server/ directory with your actual Supabase credentials.`);
}

export const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database schema types
export interface Client {
  id: string;
  practice_name: string;
  contact_person: string;
  email: string;
  phone_number?: string;
  website_url?: string;
  timezone: string;
  account_status: 'active' | 'suspended' | 'trial' | 'cancelled';
  tasks_client_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiCredential {
  id: string;
  client_id: string;
  service_name: 'gbp' | 'ga4' | 'gsc' | 'clarity';
  credential_type: 'oauth_token' | 'api_key' | 'refresh_token' | 'access_token';
  encrypted_value: string;
  expiration_date?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface GA4Metric {
  id: string;
  client_id: string;
  date: string;
  new_users: number;
  total_users: number;
  sessions: number;
  engagement_rate: number;
  conversions: number;
  avg_session_duration: number;
  bounce_rate: number;
  pages_per_session: number;
  calculated_score: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  client_id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'user' | 'viewer';
  is_active: boolean;
  last_login?: string;
  email_notifications_enabled: boolean;
  weekly_reports_enabled: boolean;
  performance_alerts_enabled: boolean;
  data_sharing_enabled: boolean;
  usage_analytics_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntegrationAccount {
  id: string;
  client_id: string;
  platform: 'ga4' | 'gbp' | 'gsc' | 'clarity';
  account_name?: string;
  encrypted_credentials: Record<string, any>;
  connection_status: 'active' | 'expired' | 'error' | 'disconnected';
  last_sync?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface GBPMetric {
  id: string;
  client_id: string;
  date: string;
  location_name?: string;
  total_views: number;
  search_views: number;
  maps_views: number;
  phone_calls: number;
  website_clicks: number;
  direction_requests: number;
  total_reviews: number;
  average_rating: number;
  new_reviews: number;
  total_photos: number;
  new_photos: number;
  questions_answered: number;
  posts_created: number;
  calculated_score: number;
  created_at: string;
  updated_at: string;
}

export interface GSCMetric {
  id: string;
  client_id: string;
  date: string;
  query?: string;
  page?: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  country: string;
  device: 'desktop' | 'mobile' | 'tablet';
  calculated_score: number;
  created_at: string;
  updated_at: string;
}

export interface ClarityMetric {
  id: string;
  client_id: string;
  date: string;
  total_sessions: number;
  unique_users: number;
  page_views: number;
  avg_session_duration: number;
  bounce_rate: number;
  dead_clicks: number;
  rage_clicks: number;
  quick_backs: number;
  excessive_scrolling: number;
  javascript_errors: number;
  calculated_score: number;
  created_at: string;
  updated_at: string;
}

export interface PMSData {
  id: string;
  client_id: string;
  date: string;
  referral_type: 'doctor_referral' | 'self_referral' | 'insurance_referral' | 'emergency' | 'other';
  referral_source?: string;
  patient_count: number;
  production_amount: number;
  appointment_type?: string;
  treatment_category?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientTask {
  id: string; // Airtable record ID
  client_id: string;
  task_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'done' | 'cancelled';
  date_created: string;
  date_completed?: string;
  assignee: string;
  airtable_data?: Record<string, any>;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}