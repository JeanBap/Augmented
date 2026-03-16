-- Run this in Supabase SQL Editor to create the saved_models table.
-- After creating a Supabase project, add these env vars to Netlify:
--   SUPABASE_URL = https://your-project.supabase.co
--   SUPABASE_SERVICE_KEY = your-service-role-key (NOT the anon key)

CREATE TABLE IF NOT EXISTS saved_models (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL DEFAULT 'My Model',
  assumptions jsonb NOT NULL,
  hires jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Row Level Security: users can only access their own models
ALTER TABLE saved_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own models"
  ON saved_models FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own models"
  ON saved_models FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own models"
  ON saved_models FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own models"
  ON saved_models FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast user lookups
CREATE INDEX idx_saved_models_user_id ON saved_models(user_id);

-- Unique constraint: one model per name per user (for upsert)
CREATE UNIQUE INDEX idx_saved_models_user_name ON saved_models(user_id, name);
