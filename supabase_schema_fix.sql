-- SQL MIGRATION TO FIX MISSING COLUMNS IN 'exercises' TABLE
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Add EKE structural tags to exercises
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS movement_pattern TEXT,
ADD COLUMN IF NOT EXISTS plane TEXT,
ADD COLUMN IF NOT EXISTS training_goal TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS technical_tips TEXT,
ADD COLUMN IF NOT EXISTS version_history JSONB DEFAULT '[]'::jsonb;

-- 2. Add quality metrics to exercises
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS quality_status TEXT DEFAULT 'improvable',
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_review_notes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_review_at TIMESTAMPTZ;

-- 3. Add performance tracking to exercises
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS performance_score INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- 4. Add EKE metadata to workouts (if not already present)
ALTER TABLE workout_categories 
ADD COLUMN IF NOT EXISTS eke_metadata JSONB DEFAULT '{}'::jsonb;

-- 5. Create EKE configuration table
CREATE TABLE IF NOT EXISTS eke_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    quality_weight FLOAT DEFAULT 0.6,
    performance_weight FLOAT DEFAULT 0.4,
    context_weight FLOAT DEFAULT 0.5,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create EKE decision logs table
CREATE TABLE IF NOT EXISTS eke_decision_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    context JSONB,
    selected_exercises JSONB,
    scores_breakdown JSONB,
    final_decision TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure RLS is enabled for new tables
ALTER TABLE eke_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE eke_decision_logs ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow admin read config') THEN
        CREATE POLICY "Allow admin read config" ON eke_config FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow user insert logs') THEN
        CREATE POLICY "Allow user insert logs" ON eke_decision_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
