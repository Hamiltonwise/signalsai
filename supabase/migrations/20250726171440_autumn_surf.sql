/*
  # Rename revenue_amount to production_amount in pms_data table

  1. Schema Changes
    - Rename `revenue_amount` column to `production_amount` in `pms_data` table
  
  2. Notes
    - This migration safely renames the column without data loss
    - All existing data will be preserved
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pms_data' AND column_name = 'revenue_amount'
  ) THEN
    ALTER TABLE pms_data RENAME COLUMN revenue_amount TO production_amount;
  END IF;
END $$;