-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can only see and update their own record
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User profiles table policies
-- Users can only access their own profile
CREATE POLICY "Users can view own user_profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own user_profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own user_profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Scenarios table policies
-- All authenticated users can view active scenarios
CREATE POLICY "Authenticated users can view active scenarios" ON public.scenarios
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Users can view scenarios they created (even if inactive)
CREATE POLICY "Users can view own scenarios" ON public.scenarios
  FOR SELECT USING (auth.uid() = created_by);

-- Users can create new scenarios
CREATE POLICY "Authenticated users can create scenarios" ON public.scenarios
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

-- Users can update scenarios they created
CREATE POLICY "Users can update own scenarios" ON public.scenarios
  FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete scenarios they created
CREATE POLICY "Users can delete own scenarios" ON public.scenarios
  FOR DELETE USING (auth.uid() = created_by);

-- Training sessions table policies
-- Users can only access their own training sessions
CREATE POLICY "Users can view own training_sessions" ON public.training_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own training_sessions" ON public.training_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training_sessions" ON public.training_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own training_sessions" ON public.training_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Decisions table policies
-- Users can only access decisions from their own training sessions
CREATE POLICY "Users can view own decisions" ON public.decisions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.training_sessions 
      WHERE training_sessions.id = decisions.session_id 
      AND training_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create decisions for own sessions" ON public.decisions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.training_sessions 
      WHERE training_sessions.id = decisions.session_id 
      AND training_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own decisions" ON public.decisions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.training_sessions 
      WHERE training_sessions.id = decisions.session_id 
      AND training_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own decisions" ON public.decisions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.training_sessions 
      WHERE training_sessions.id = decisions.session_id 
      AND training_sessions.user_id = auth.uid()
    )
  );

-- Learning resources table policies
-- All authenticated users can view learning resources
CREATE POLICY "Authenticated users can view learning_resources" ON public.learning_resources
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users can create learning resources
CREATE POLICY "Authenticated users can create learning_resources" ON public.learning_resources
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update learning resources
CREATE POLICY "Authenticated users can update learning_resources" ON public.learning_resources
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Only authenticated users can delete learning resources
CREATE POLICY "Authenticated users can delete learning_resources" ON public.learning_resources
  FOR DELETE USING (auth.role() = 'authenticated');