/*
  # Add Monday.com Integration Support

  1. Schema Updates
    - Add 'monday' to service_name_enum
    - Add 'monday' to integration_accounts platform constraint
    - Add monday_workspace_id column to integration_accounts

  2. Security
    - Maintain existing RLS policies
    - No changes to permissions structure
*/

-- Add 'monday' to the service_name_enum
ALTER TYPE service_name_enum ADD VALUE IF NOT EXISTS 'monday';

-- Add 'monday' to the platform constraint in integration_accounts
ALTER TABLE integration_accounts DROP CONSTRAINT IF EXISTS integration_accounts_platform_check;
ALTER TABLE integration_accounts ADD CONSTRAINT integration_accounts_platform_check 
  CHECK (platform = ANY (ARRAY['ga4'::text, 'gbp'::text, 'gsc'::text, 'clarity'::text, 'monday'::text]));

-- Add monday_workspace_id column to integration_accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integration_accounts' AND column_name = 'monday_workspace_id'
  ) THEN
    ALTER TABLE integration_accounts ADD COLUMN monday_workspace_id text;
  END IF;
END $$;

-- Add index for monday workspace queries
CREATE INDEX IF NOT EXISTS idx_integration_accounts_monday_workspace 
ON integration_accounts (monday_workspace_id) 
WHERE platform = 'monday' AND monday_workspace_id IS NOT NULL;