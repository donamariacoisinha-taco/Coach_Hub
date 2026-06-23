-- =========================================================================
-- MIGRATION: FIX ATHLETE PROFILE SAVING ISSUE (COLUMNS & RLS POLICIES)
-- Run this in your Supabase SQL Editor to apply database fixes.
-- =========================================================================

-- 1. Ensure Table and Extra Columns exist on public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS frequency TEXT,
ADD COLUMN IF NOT EXISTS workouts_completed INTEGER DEFAULT 0;

-- Ensure other biographical columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS goal TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS weight DECIMAL,
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS target_weight DECIMAL,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS workout_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- 2. Configure Row Level Security (RLS) for public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users to perform operations
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 3. Idempotently Create/Replace RLS Policies for Profiles

-- Policy: Select (Users can read their own profile)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Policy: Insert (Users can insert their own initial profile row)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Update (Users can update all their own profile metrics)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Full Access for Service Role Admin
DROP POLICY IF EXISTS "Service role has full access to profiles" ON public.profiles;
CREATE POLICY "Service role has full access to profiles" ON public.profiles
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Adding helpful column descriptions
COMMENT ON COLUMN public.profiles.name IS 'Nome de exibição curto do atleta utilizado no Dashboard de boas-vindas.';
COMMENT ON COLUMN public.profiles.frequency IS 'Frequência de treinos desejada (ex: "3", "4", "5", "7" dias semanais).';
COMMENT ON COLUMN public.profiles.workouts_completed IS 'Contador de número total de treinos concluídos pelo atleta.';
