-- Health bot incremental migration
-- Run in Supabase SQL Editor when an existing project is missing newer health tables/columns.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE IF EXISTS health_conversations
  ADD COLUMN IF NOT EXISTS summary text;

ALTER TABLE IF EXISTS health_conversations
  ADD COLUMN IF NOT EXISTS message_count integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS health_body_composition_readings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  height_cm decimal,
  weight_kg decimal,
  body_fat_percent decimal,
  muscle_mass_kg decimal,
  body_water_percent decimal,
  bone_mass_kg decimal,
  visceral_fat_rating decimal,
  body_composition_method text,
  body_composition_measured_at date,
  body_composition_notes text,
  bmi decimal,
  fat_mass_kg decimal,
  lean_mass_kg decimal,
  body_fat_category text,
  bmi_category text,
  weight_to_muscle_context text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE health_body_composition_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own body composition readings" ON health_body_composition_readings;
CREATE POLICY "Users can view own body composition readings"
  ON health_body_composition_readings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own body composition readings" ON health_body_composition_readings;
CREATE POLICY "Users can manage own body composition readings"
  ON health_body_composition_readings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS health_body_composition_user_date_idx
  ON health_body_composition_readings(user_id, body_composition_measured_at DESC, created_at DESC);

ALTER TABLE IF EXISTS health_profiles ADD COLUMN IF NOT EXISTS height_cm decimal;
ALTER TABLE IF EXISTS health_profiles ADD COLUMN IF NOT EXISTS weight_kg decimal;
ALTER TABLE IF EXISTS health_profiles ADD COLUMN IF NOT EXISTS body_fat_percent decimal;
ALTER TABLE IF EXISTS health_profiles ADD COLUMN IF NOT EXISTS muscle_mass_kg decimal;
ALTER TABLE IF EXISTS health_profiles ADD COLUMN IF NOT EXISTS body_water_percent decimal;
ALTER TABLE IF EXISTS health_profiles ADD COLUMN IF NOT EXISTS bone_mass_kg decimal;
ALTER TABLE IF EXISTS health_profiles ADD COLUMN IF NOT EXISTS visceral_fat_rating decimal;
ALTER TABLE IF EXISTS health_profiles ADD COLUMN IF NOT EXISTS body_composition_method text;
ALTER TABLE IF EXISTS health_profiles ADD COLUMN IF NOT EXISTS body_composition_measured_at date;
ALTER TABLE IF EXISTS health_profiles ADD COLUMN IF NOT EXISTS body_composition_notes text;
ALTER TABLE IF EXISTS health_profiles ADD COLUMN IF NOT EXISTS bmi decimal;
ALTER TABLE IF EXISTS health_profiles ADD COLUMN IF NOT EXISTS fat_mass_kg decimal;
ALTER TABLE IF EXISTS health_profiles ADD COLUMN IF NOT EXISTS lean_mass_kg decimal;
ALTER TABLE IF EXISTS health_profiles ADD COLUMN IF NOT EXISTS body_fat_category text;
ALTER TABLE IF EXISTS health_profiles ADD COLUMN IF NOT EXISTS bmi_category text;
ALTER TABLE IF EXISTS health_profiles ADD COLUMN IF NOT EXISTS weight_to_muscle_context text;
