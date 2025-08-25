/*
  # Create reviews table for AI analysis

  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `review_text` (text)
      - `rating` (integer)
      - `author_name` (text)
      - `review_date` (date)
      - `platform` (text - 'gbp', 'yelp', etc.)
      - `ai_score` (integer 0-100)
      - `ai_keywords` (jsonb array)
      - `effectiveness_rating` (text)
      - `sentiment` (text)
      - `response_status` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `reviews` table
    - Add policy for users to read own client reviews
    - Add policy for service role to manage all reviews

  3. Indexes
    - Index on client_id for fast lookups
    - Index on ai_score for ranking
    - Index on review_date for chronological sorting
*/

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  review_text text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  author_name text NOT NULL,
  review_date date NOT NULL,
  platform text NOT NULL DEFAULT 'gbp',
  ai_score integer DEFAULT 0 CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_keywords jsonb DEFAULT '[]'::jsonb,
  effectiveness_rating text DEFAULT 'medium' CHECK (effectiveness_rating IN ('high', 'medium', 'low')),
  sentiment text DEFAULT 'positive' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  response_status text DEFAULT 'pending' CHECK (response_status IN ('responded', 'pending', 'not_needed')),
  external_review_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_ai_score ON reviews(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(review_date DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_platform ON reviews(platform);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);

-- Create RLS policies
CREATE POLICY "Users can read own client reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (client_id IN (
    SELECT clients.id
    FROM clients
    WHERE (auth.uid())::text = (clients.id)::text
  ));

CREATE POLICY "Service role can manage all reviews"
  ON reviews
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER reviews_updated_at_trigger
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();