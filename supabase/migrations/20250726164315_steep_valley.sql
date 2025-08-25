@@ .. @@
 -- Rename revenue_amount to production_amount
 ALTER TABLE public.pms_data
 RENAME COLUMN revenue_amount TO production_amount;

+-- Change referral_type from enum to text to allow flexible values
+ALTER TABLE public.pms_data 
+ALTER COLUMN referral_type TYPE text;
+
+-- Remove the old enum constraint if it exists
+ALTER TABLE public.pms_data 
+DROP CONSTRAINT IF EXISTS pms_data_referral_type_check;
+
+-- Add a simple constraint to ensure referral_type is not empty and has reasonable length
+ALTER TABLE public.pms_data 
+ADD CONSTRAINT pms_data_referral_type_check 
+CHECK (referral_type IS NOT NULL AND length(trim(referral_type)) > 0 AND length(referral_type) <= 100);
+
 -- Ensure patient_count exists and defaults to 1 (if it was somehow removed or changed)