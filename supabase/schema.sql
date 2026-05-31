-- ============================================
-- PORTFOLIOFLOW DATABASE SCHEMA
-- Supabase PostgreSQL Setup
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
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

CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Create profile on user signup (trigger)
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
  
  -- Also create portfolio entry with is_public = true by default
  INSERT INTO public.portfolios (user_id, is_public)
  VALUES (new.id, true);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PORTFOLIOS TABLE
-- ============================================
CREATE TABLE portfolios (
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

CREATE POLICY "Users can view own portfolio" 
  ON portfolios FOR SELECT 
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own portfolio" 
  ON portfolios FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio" 
  ON portfolios FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================
-- SKILLS TABLE
-- ============================================
CREATE TABLE skills (
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

CREATE POLICY "Users can view own skills or public portfolio skills" 
  ON skills FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    user_id IN (SELECT user_id FROM portfolios WHERE is_public = true)
  );

CREATE POLICY "Users can manage own skills" 
  ON skills FOR ALL 
  USING (auth.uid() = user_id);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE projects (
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

CREATE POLICY "Users can view own projects or public portfolio projects" 
  ON projects FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    user_id IN (SELECT user_id FROM portfolios WHERE is_public = true)
  );

CREATE POLICY "Users can manage own projects" 
  ON projects FOR ALL 
  USING (auth.uid() = user_id);

-- ============================================
-- HEALTH PROFILES TABLE
-- ============================================
CREATE TABLE health_profiles (
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
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health profile" 
  ON health_profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own health profile" 
  ON health_profiles FOR ALL 
  USING (auth.uid() = user_id);

-- ============================================
-- HEALTH CONVERSATIONS TABLE
-- ============================================
CREATE TABLE health_conversations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title text,
  messages jsonb NOT NULL DEFAULT '[]',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE health_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" 
  ON health_conversations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own conversations" 
  ON health_conversations FOR ALL 
  USING (auth.uid() = user_id);

-- ============================================
-- MUSIC GENERATIONS TABLE
-- ============================================
CREATE TABLE music_generations (
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

CREATE POLICY "Users can view own music generations" 
  ON music_generations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own music generations" 
  ON music_generations FOR ALL 
  USING (auth.uid() = user_id);

-- ============================================
-- USAGE TRACKING TABLE (for free tier limits)
-- ============================================
CREATE TABLE usage_tracking (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  feature text NOT NULL, -- 'health_chat', 'music_generation'
  usage_count integer DEFAULT 0,
  reset_date date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, feature, reset_date)
);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage tracking" 
  ON usage_tracking FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage usage tracking" 
  ON usage_tracking FOR ALL 
  USING (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX profiles_username_idx ON profiles(username);
CREATE INDEX skills_user_id_idx ON skills(user_id);
CREATE INDEX projects_user_id_idx ON projects(user_id);
CREATE INDEX projects_featured_idx ON projects(featured) WHERE featured = true;
CREATE INDEX health_conversations_user_id_idx ON health_conversations(user_id);
CREATE INDEX music_generations_user_id_idx ON music_generations(user_id);
CREATE INDEX usage_tracking_user_feature_idx ON usage_tracking(user_id, feature, reset_date);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_profiles_updated_at BEFORE UPDATE ON health_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_conversations_updated_at BEFORE UPDATE ON health_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKETS (Create via Supabase Dashboard)
-- ============================================
-- Create these buckets in Supabase Dashboard > Storage:
-- 1. avatars (public)
-- 2. project-images (public)
-- 3. music-files (private, per-user access)

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- This will be automatically created when users sign up
-- No need to insert sample data manually
