/*
  # Add User Preferences Schema

  1. New Columns Added to Users Table
    - `email_notifications_enabled` (boolean, default true) - Controls email notification preferences
    - `weekly_reports_enabled` (boolean, default true) - Controls weekly report delivery
    - `performance_alerts_enabled` (boolean, default true) - Controls performance alert notifications
    - `data_sharing_enabled` (boolean, default false) - Controls anonymous data sharing for product improvement
    - `usage_analytics_enabled` (boolean, default true) - Controls usage analytics collection

  2. Security
    - Existing RLS policies on users table will apply to new columns
    - Users can only update their own preferences
    - Service role maintains full access for administrative purposes

  3. Changes
    - Added 5 new boolean columns to users table with appropriate defaults
    - No breaking changes to existing functionality
*/

-- Add notification and privacy preference columns to users table
DO $$
BEGIN
  -- Add email_notifications_enabled column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_notifications_enabled'
  ) THEN
    ALTER TABLE users ADD COLUMN email_notifications_enabled boolean DEFAULT true;
  END IF;

  -- Add weekly_reports_enabled column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'weekly_reports_enabled'
  ) THEN
    ALTER TABLE users ADD COLUMN weekly_reports_enabled boolean DEFAULT true;
  END IF;

  -- Add performance_alerts_enabled column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'performance_alerts_enabled'
  ) THEN
    ALTER TABLE users ADD COLUMN performance_alerts_enabled boolean DEFAULT true;
  END IF;

  -- Add data_sharing_enabled column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'data_sharing_enabled'
  ) THEN
    ALTER TABLE users ADD COLUMN data_sharing_enabled boolean DEFAULT false;
  END IF;

  -- Add usage_analytics_enabled column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'usage_analytics_enabled'
  ) THEN
    ALTER TABLE users ADD COLUMN usage_analytics_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Create index for efficient querying of notification preferences
CREATE INDEX IF NOT EXISTS idx_users_notification_preferences 
ON users (email_notifications_enabled, weekly_reports_enabled, performance_alerts_enabled);

-- Create index for privacy preferences
CREATE INDEX IF NOT EXISTS idx_users_privacy_preferences 
ON users (data_sharing_enabled, usage_analytics_enabled);