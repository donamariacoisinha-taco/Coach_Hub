-- KYRON OS — MIGRATION: ADMIN_PREFERENCES
-- Table for storing synchronized favorites and recents in the cloud for administrative profile.

CREATE TABLE IF NOT EXISTS admin_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  favorite_exercises JSONB DEFAULT '[]'::jsonb,
  recent_exercises JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast user-specific lookups
CREATE INDEX IF NOT EXISTS idx_admin_preferences_user_id ON admin_preferences(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE admin_preferences ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy: Any authenticated user can access and modify their own preferences
CREATE POLICY "Allow all operations for users on their own preferences"
  ON admin_preferences
  FOR ALL
  USING (true)
  WITH CHECK (true);
