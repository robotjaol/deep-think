-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  profile JSONB DEFAULT '{}'::jsonb
);

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  preferred_domain VARCHAR,
  default_job_role VARCHAR,
  default_risk_profile VARCHAR CHECK (default_risk_profile IN ('conservative', 'balanced', 'aggressive')),
  training_level INTEGER DEFAULT 1 CHECK (training_level >= 1),
  total_scenarios_completed INTEGER DEFAULT 0 CHECK (total_scenarios_completed >= 0),
  average_score DECIMAL(5,2) DEFAULT 0.00 CHECK (average_score >= 0.00 AND average_score <= 100.00),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scenarios table
CREATE TABLE public.scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  domain VARCHAR NOT NULL,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
  config JSONB NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_sessions table
CREATE TABLE public.training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  final_score DECIMAL(5,2) CHECK (final_score >= 0.00 AND final_score <= 100.00),
  session_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create decisions table
CREATE TABLE public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  state_id VARCHAR NOT NULL,
  decision_text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_taken INTEGER CHECK (time_taken >= 0), -- milliseconds
  score_impact DECIMAL(5,2),
  consequences JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning_resources table
CREATE TABLE public.learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('paper', 'textbook', 'video', 'case-study')),
  url TEXT,
  domain VARCHAR,
  tags TEXT[],
  relevance_keywords TEXT[],
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(id);
CREATE INDEX idx_scenarios_domain ON public.scenarios(domain);
CREATE INDEX idx_scenarios_active ON public.scenarios(is_active);
CREATE INDEX idx_training_sessions_user_id ON public.training_sessions(user_id);
CREATE INDEX idx_training_sessions_scenario_id ON public.training_sessions(scenario_id);
CREATE INDEX idx_training_sessions_completed ON public.training_sessions(completed_at);
CREATE INDEX idx_decisions_session_id ON public.decisions(session_id);
CREATE INDEX idx_decisions_timestamp ON public.decisions(timestamp);
CREATE INDEX idx_learning_resources_domain ON public.learning_resources(domain);
CREATE INDEX idx_learning_resources_type ON public.learning_resources(type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON public.scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON public.training_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_resources_updated_at BEFORE UPDATE ON public.learning_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();