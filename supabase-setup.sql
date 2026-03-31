-- ============================================================
-- SOLARMAP AI — SUPABASE DATABASE SETUP
-- Execute este SQL no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  company TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SIMULATIONS
CREATE TABLE IF NOT EXISTS simulations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address TEXT,
  panels INT,
  monthly_kwh NUMERIC,
  annual_savings NUMERIC,
  investment NUMERIC,
  payback_years NUMERIC,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'rascunho',
  roof_area NUMERIC,
  panels INT,
  power_kwp NUMERIC,
  monthly_kwh NUMERIC,
  investment NUMERIC,
  payback_years NUMERIC,
  equipment_panel TEXT,
  equipment_inverter TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. BUDGETS
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_name TEXT,
  client_email TEXT,
  total_value NUMERIC,
  items JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY — cada usuário vê apenas seus dados
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Profiles: user can read/update own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Simulations: full CRUD on own data
CREATE POLICY "Users can manage own simulations"
  ON simulations FOR ALL USING (auth.uid() = user_id);

-- Projects: full CRUD on own data
CREATE POLICY "Users can manage own projects"
  ON projects FOR ALL USING (auth.uid() = user_id);

-- Budgets: full CRUD on own data
CREATE POLICY "Users can manage own budgets"
  ON budgets FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
