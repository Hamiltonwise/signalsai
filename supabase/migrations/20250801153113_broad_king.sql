/*
  # Add UPDATE policy for users table

  1. Security Enhancement
    - Add policy to allow authenticated users to update their own data
    - Ensures users can modify their own preferences and profile information
    - Maintains security by restricting updates to own records only

  2. Policy Details
    - Allows UPDATE operations on users table
    - Restricts to authenticated users only
    - Uses auth.uid() = id to ensure users can only update their own records
*/

-- Add UPDATE policy for users table to allow preference updates
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);