-- Function to handle new user registration
-- This function will be called via a trigger when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.created_at, NEW.updated_at);
  
  -- Insert default user profile
  INSERT INTO public.user_profiles (id, training_level, total_scenarios_completed, average_score)
  VALUES (NEW.id, 1, 0, 0.00);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user profile statistics
CREATE OR REPLACE FUNCTION public.update_user_stats(user_uuid UUID, session_score DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles 
  SET 
    total_scenarios_completed = total_scenarios_completed + 1,
    average_score = (
      (average_score * total_scenarios_completed + session_score) / 
      (total_scenarios_completed + 1)
    ),
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user training statistics
CREATE OR REPLACE FUNCTION public.get_user_training_stats(user_uuid UUID)
RETURNS TABLE (
  total_sessions BIGINT,
  completed_sessions BIGINT,
  average_score DECIMAL,
  best_score DECIMAL,
  recent_sessions_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(ts.id) as total_sessions,
    COUNT(ts.completed_at) as completed_sessions,
    COALESCE(AVG(ts.final_score), 0.00) as average_score,
    COALESCE(MAX(ts.final_score), 0.00) as best_score,
    COUNT(CASE WHEN ts.started_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_sessions_count
  FROM public.training_sessions ts
  WHERE ts.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get scenario statistics
CREATE OR REPLACE FUNCTION public.get_scenario_stats(scenario_uuid UUID)
RETURNS TABLE (
  total_attempts BIGINT,
  average_score DECIMAL,
  completion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(ts.id) as total_attempts,
    COALESCE(AVG(ts.final_score), 0.00) as average_score,
    CASE 
      WHEN COUNT(ts.id) > 0 THEN 
        (COUNT(ts.completed_at)::DECIMAL / COUNT(ts.id)::DECIMAL) * 100
      ELSE 0.00 
    END as completion_rate
  FROM public.training_sessions ts
  WHERE ts.scenario_id = scenario_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;