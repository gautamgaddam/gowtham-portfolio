-- ============================================
-- RUN THIS FIRST: Complete Database Setup
-- ============================================
-- Copy this entire file and run in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE NOT NULL,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  location text,
  website text,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due', 'trialing')),
  subscription_id text,
  stripe_customer_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- ============================================
-- PORTFOLIOS TABLE (Must exist BEFORE trigger)
-- ============================================
CREATE TABLE IF NOT EXISTS portfolios (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  template_id text DEFAULT 'default' NOT NULL,
  is_public boolean DEFAULT true,
  custom_domain text,
  theme_settings jsonb DEFAULT '{"primaryColor": "#66bb6a", "fontFamily": "Inter"}',
  seo_title text,
  seo_description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own portfolio" ON portfolios;
CREATE POLICY "Users can view own portfolio" 
  ON portfolios FOR SELECT 
  USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can insert own portfolio" ON portfolios;
CREATE POLICY "Users can insert own portfolio" 
  ON portfolios FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own portfolio" ON portfolios;
CREATE POLICY "Users can update own portfolio" 
  ON portfolios FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================
-- SKILLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS skills (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  name text NOT NULL,
  proficiency integer CHECK (proficiency >= 0 AND proficiency <= 10),
  years_experience decimal,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own skills or public portfolio skills" ON skills;
CREATE POLICY "Users can view own skills or public portfolio skills" 
  ON skills FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    user_id IN (SELECT user_id FROM portfolios WHERE is_public = true)
  );

DROP POLICY IF EXISTS "Users can manage own skills" ON skills;
CREATE POLICY "Users can manage own skills" 
  ON skills FOR ALL 
  USING (auth.uid() = user_id);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  tech_stack text[],
  github_url text,
  live_url text,
  image_url text,
  featured boolean DEFAULT false,
  display_order integer DEFAULT 0,
  start_date date,
  end_date date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own projects or public portfolio projects" ON projects;
CREATE POLICY "Users can view own projects or public portfolio projects" 
  ON projects FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    user_id IN (SELECT user_id FROM portfolios WHERE is_public = true)
  );

DROP POLICY IF EXISTS "Users can manage own projects" ON projects;
CREATE POLICY "Users can manage own projects" 
  ON projects FOR ALL 
  USING (auth.uid() = user_id);

-- ============================================
-- HEALTH PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS health_profiles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  age_band text,
  conditions text[],
  medications text,
  allergies text,
  dietary_pattern text,
  cuisine_preference text,
  budget_level text,
  pregnancy_status text,
  goals text[],
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

ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS height_cm decimal;
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS weight_kg decimal;
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS body_fat_percent decimal;
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS muscle_mass_kg decimal;
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS body_water_percent decimal;
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS bone_mass_kg decimal;
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS visceral_fat_rating decimal;
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS body_composition_method text;
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS body_composition_measured_at date;
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS body_composition_notes text;
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS bmi decimal;
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS fat_mass_kg decimal;
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS lean_mass_kg decimal;
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS body_fat_category text;
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS bmi_category text;
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS weight_to_muscle_context text;

ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own health profile" ON health_profiles;
CREATE POLICY "Users can view own health profile" 
  ON health_profiles FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own health profile" ON health_profiles;
CREATE POLICY "Users can manage own health profile" 
  ON health_profiles FOR ALL 
  USING (auth.uid() = user_id);

-- ============================================
-- HEALTH BODY COMPOSITION READINGS TABLE
-- ============================================
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

-- ============================================
-- HEALTH DAILY TRACKER TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS health_daily_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  log_date date NOT NULL,
  mood text,
  sleep_hours decimal,
  water_liters decimal,
  energy_level integer CHECK (energy_level IS NULL OR energy_level BETWEEN 1 AND 10),
  stress_level integer CHECK (stress_level IS NULL OR stress_level BETWEEN 1 AND 10),
  notes text,
  summary jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, log_date)
);

CREATE TABLE IF NOT EXISTS health_food_entries (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  log_date date NOT NULL,
  meal_type text DEFAULT 'snack' CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name text NOT NULL,
  quantity text,
  calories decimal,
  protein_g decimal,
  carbs_g decimal,
  fat_g decimal,
  fiber_g decimal,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS health_activity_entries (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  log_date date NOT NULL,
  activity_type text NOT NULL,
  duration_minutes decimal,
  intensity text DEFAULT 'moderate' CHECK (intensity IN ('low', 'moderate', 'high')),
  calories_burned decimal,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS health_symptom_entries (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  log_date date NOT NULL,
  body_zone text DEFAULT 'general',
  symptom text NOT NULL,
  severity integer CHECK (severity IS NULL OR severity BETWEEN 1 AND 10),
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS health_goals (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  goal_type text DEFAULT 'general',
  title text NOT NULL,
  target text,
  cadence text DEFAULT 'daily' CHECK (cadence IN ('daily', 'weekly', 'monthly')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  start_date date,
  target_date date,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS health_goal_checkins (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal_id uuid REFERENCES health_goals(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  checkin_date date NOT NULL,
  value decimal,
  completed boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(goal_id, checkin_date)
);

ALTER TABLE health_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_activity_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_symptom_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_goal_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own daily logs" ON health_daily_logs;
CREATE POLICY "Users can manage own daily logs" ON health_daily_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own food entries" ON health_food_entries;
CREATE POLICY "Users can manage own food entries" ON health_food_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own activity entries" ON health_activity_entries;
CREATE POLICY "Users can manage own activity entries" ON health_activity_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own symptom entries" ON health_symptom_entries;
CREATE POLICY "Users can manage own symptom entries" ON health_symptom_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own health goals" ON health_goals;
CREATE POLICY "Users can manage own health goals" ON health_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own goal checkins" ON health_goal_checkins;
CREATE POLICY "Users can manage own goal checkins" ON health_goal_checkins FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- HEALTH CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS health_conversations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title text,
  messages jsonb NOT NULL DEFAULT '[]',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE health_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversations" ON health_conversations;
CREATE POLICY "Users can view own conversations" 
  ON health_conversations FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own conversations" ON health_conversations;
CREATE POLICY "Users can manage own conversations" 
  ON health_conversations FOR ALL 
  USING (auth.uid() = user_id);

-- ============================================
-- HEALTH KNOWLEDGE BASE TABLE (Private user memory vector store)
-- ============================================
CREATE TABLE IF NOT EXISTS health_knowledge_base (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES health_conversations(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('conversation_summary', 'meal_plan', 'clinician_summary', 'progress_report', 'supplement_check', 'other')),
  content text NOT NULL,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE health_knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own knowledge base" ON health_knowledge_base;
CREATE POLICY "Users can view own knowledge base" 
  ON health_knowledge_base FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own knowledge base" ON health_knowledge_base;
CREATE POLICY "Users can manage own knowledge base" 
  ON health_knowledge_base FOR ALL 
  USING (auth.uid() = user_id);

-- ============================================
-- SHARED HEALTH DOCUMENTS TABLE (Admin-uploaded RAG books)
-- ============================================
CREATE TABLE IF NOT EXISTS health_documents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  uploaded_by uuid REFERENCES auth.users ON DELETE SET NULL,
  title text NOT NULL,
  author text,
  file_name text,
  file_size_bytes bigint,
  mime_type text DEFAULT 'application/pdf',
  source_kind text DEFAULT 'book' CHECK (source_kind IN ('book', 'article', 'guide', 'other')),
  visibility text DEFAULT 'shared' CHECK (visibility IN ('shared', 'admin_only')),
  status text DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  chunk_count integer DEFAULT 0,
  page_count integer DEFAULT 0,
  error_message text,
  storage_path text,
  tags text[] DEFAULT '{}',
  version integer DEFAULT 1,
  reprocessed_at timestamp with time zone,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE health_documents ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE health_documents ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE health_documents ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
ALTER TABLE health_documents ADD COLUMN IF NOT EXISTS reprocessed_at timestamp with time zone;

ALTER TABLE health_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view shared health documents" ON health_documents;
CREATE POLICY "Authenticated users can view shared health documents"
  ON health_documents FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      visibility = 'shared'
      OR lower(auth.jwt()->>'email') = 'gautammaddyson@gmail.com'
    )
  );

DROP POLICY IF EXISTS "Only admin can manage health documents" ON health_documents;
CREATE POLICY "Only admin can manage health documents"
  ON health_documents FOR ALL
  USING (lower(auth.jwt()->>'email') = 'gautammaddyson@gmail.com')
  WITH CHECK (lower(auth.jwt()->>'email') = 'gautammaddyson@gmail.com');

-- ============================================
-- SHARED HEALTH DOCUMENT CHUNKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS health_document_chunks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id uuid REFERENCES health_documents(id) ON DELETE CASCADE NOT NULL,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  page_start integer,
  page_end integer,
  chapter text,
  topics text[] DEFAULT '{}',
  conditions text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(document_id, chunk_index)
);

ALTER TABLE health_document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view shared health document chunks" ON health_document_chunks;
CREATE POLICY "Authenticated users can view shared health document chunks"
  ON health_document_chunks FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM health_documents d
      WHERE d.id = health_document_chunks.document_id
        AND (
          d.visibility = 'shared'
          OR lower(auth.jwt()->>'email') = 'gautammaddyson@gmail.com'
        )
    )
  );

DROP POLICY IF EXISTS "Only admin can manage health document chunks" ON health_document_chunks;
CREATE POLICY "Only admin can manage health document chunks"
  ON health_document_chunks FOR ALL
  USING (lower(auth.jwt()->>'email') = 'gautammaddyson@gmail.com')
  WITH CHECK (lower(auth.jwt()->>'email') = 'gautammaddyson@gmail.com');

-- ============================================
-- MUSIC GENERATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS music_generations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title text,
  prompt text NOT NULL,
  style text,
  key text,
  tempo integer,
  audio_url text,
  analysis jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE music_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own music generations" ON music_generations;
CREATE POLICY "Users can view own music generations" 
  ON music_generations FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own music generations" ON music_generations;
CREATE POLICY "Users can manage own music generations" 
  ON music_generations FOR ALL 
  USING (auth.uid() = user_id);

-- ============================================
-- USAGE TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  feature text NOT NULL,
  usage_count integer DEFAULT 0,
  reset_date date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, feature, reset_date)
);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage tracking" ON usage_tracking;
CREATE POLICY "Users can view own usage tracking" 
  ON usage_tracking FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage usage tracking" ON usage_tracking;
CREATE POLICY "System can manage usage tracking" 
  ON usage_tracking FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
CREATE INDEX IF NOT EXISTS skills_user_id_idx ON skills(user_id);
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_featured_idx ON projects(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS health_conversations_user_id_idx ON health_conversations(user_id);
CREATE INDEX IF NOT EXISTS health_body_composition_user_date_idx
  ON health_body_composition_readings(user_id, body_composition_measured_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS health_daily_logs_user_date_idx ON health_daily_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS health_food_entries_user_date_idx ON health_food_entries(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS health_activity_entries_user_date_idx ON health_activity_entries(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS health_symptom_entries_user_date_idx ON health_symptom_entries(user_id, log_date DESC, body_zone);
CREATE INDEX IF NOT EXISTS health_goals_user_status_idx ON health_goals(user_id, status);
CREATE INDEX IF NOT EXISTS health_goal_checkins_goal_date_idx ON health_goal_checkins(goal_id, checkin_date DESC);
CREATE INDEX IF NOT EXISTS health_kb_user_idx ON health_knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS health_kb_conversation_idx ON health_knowledge_base(conversation_id);
CREATE INDEX IF NOT EXISTS health_kb_content_type_idx ON health_knowledge_base(content_type);
CREATE INDEX IF NOT EXISTS health_kb_embedding_idx ON health_knowledge_base 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS health_documents_status_idx ON health_documents(status);
CREATE INDEX IF NOT EXISTS health_documents_visibility_idx ON health_documents(visibility);
CREATE INDEX IF NOT EXISTS health_document_chunks_document_idx ON health_document_chunks(document_id);
CREATE INDEX IF NOT EXISTS health_document_chunks_topics_idx ON health_document_chunks USING gin(topics);
CREATE INDEX IF NOT EXISTS health_document_chunks_conditions_idx ON health_document_chunks USING gin(conditions);
CREATE INDEX IF NOT EXISTS health_document_chunks_embedding_idx ON health_document_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS music_generations_user_id_idx ON music_generations(user_id);
CREATE INDEX IF NOT EXISTS usage_tracking_user_feature_idx ON usage_tracking(user_id, feature, reset_date);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_profiles_updated_at ON health_profiles;
CREATE TRIGGER update_health_profiles_updated_at BEFORE UPDATE ON health_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_conversations_updated_at ON health_conversations;
CREATE TRIGGER update_health_conversations_updated_at BEFORE UPDATE ON health_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_body_composition_updated_at ON health_body_composition_readings;
CREATE TRIGGER update_health_body_composition_updated_at BEFORE UPDATE ON health_body_composition_readings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_daily_logs_updated_at ON health_daily_logs;
CREATE TRIGGER update_health_daily_logs_updated_at BEFORE UPDATE ON health_daily_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_food_entries_updated_at ON health_food_entries;
CREATE TRIGGER update_health_food_entries_updated_at BEFORE UPDATE ON health_food_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_activity_entries_updated_at ON health_activity_entries;
CREATE TRIGGER update_health_activity_entries_updated_at BEFORE UPDATE ON health_activity_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_symptom_entries_updated_at ON health_symptom_entries;
CREATE TRIGGER update_health_symptom_entries_updated_at BEFORE UPDATE ON health_symptom_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_goals_updated_at ON health_goals;
CREATE TRIGGER update_health_goals_updated_at BEFORE UPDATE ON health_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_goal_checkins_updated_at ON health_goal_checkins;
CREATE TRIGGER update_health_goal_checkins_updated_at BEFORE UPDATE ON health_goal_checkins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_documents_updated_at ON health_documents;
CREATE TRIGGER update_health_documents_updated_at BEFORE UPDATE ON health_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VECTOR SEARCH RPC FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION match_health_knowledge(
  query_embedding vector(1536),
  match_user_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  content_type text,
  metadata jsonb,
  conversation_id uuid,
  similarity float,
  created_at timestamp with time zone
)
LANGUAGE sql STABLE
AS $$
  SELECT 
    id,
    content,
    content_type,
    metadata,
    conversation_id,
    1 - (embedding <=> query_embedding) AS similarity,
    created_at
  FROM health_knowledge_base
  WHERE user_id = match_user_id
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_health_document_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 6,
  include_admin_only boolean DEFAULT false
)
RETURNS TABLE (
  chunk_id uuid,
  document_id uuid,
  title text,
  author text,
  content text,
  page_start integer,
  page_end integer,
  chapter text,
  topics text[],
  conditions text[],
  metadata jsonb,
  similarity float,
  created_at timestamp with time zone
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id AS chunk_id,
    d.id AS document_id,
    d.title,
    d.author,
    c.content,
    c.page_start,
    c.page_end,
    c.chapter,
    c.topics,
    c.conditions,
    c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity,
    c.created_at
  FROM health_document_chunks c
  JOIN health_documents d ON d.id = c.document_id
  WHERE d.status = 'ready'
    AND (d.visibility = 'shared' OR include_admin_only = true)
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================
-- USER CREATION TRIGGER (Must be LAST)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, full_name)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  
  -- Auto-create portfolio with is_public = true
  INSERT INTO public.portfolios (user_id, is_public)
  VALUES (new.id, true);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- BACKFILL EXISTING USERS
-- ============================================
INSERT INTO public.portfolios (user_id, is_public)
SELECT id, true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.portfolios)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- If you see this, database setup is complete!
SELECT 'Database setup complete!' as status;
