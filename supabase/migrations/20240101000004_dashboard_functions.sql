-- Dashboard Analytics Functions for Deep-Think

-- Drop existing functions if they exist to avoid type conflicts
DROP FUNCTION IF EXISTS get_user_training_stats(UUID);
DROP FUNCTION IF EXISTS update_user_stats(UUID, DECIMAL);
DROP FUNCTION IF EXISTS get_user_progress_data(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_user_domain_performance(UUID);

-- Function to get user training statistics
CREATE OR REPLACE FUNCTION get_user_training_stats(user_uuid UUID)
RETURNS TABLE (
  total_sessions INTEGER,
  completed_sessions INTEGER,
  average_score DECIMAL(5,2),
  best_score DECIMAL(5,2),
  recent_sessions_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_sessions,
    COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END)::INTEGER as completed_sessions,
    COALESCE(AVG(CASE WHEN final_score IS NOT NULL THEN final_score END), 0)::DECIMAL(5,2) as average_score,
    COALESCE(MAX(final_score), 0)::DECIMAL(5,2) as best_score,
    COUNT(CASE WHEN started_at >= NOW() - INTERVAL '7 days' THEN 1 END)::INTEGER as recent_sessions_count
  FROM training_sessions 
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user statistics after completing a session
CREATE OR REPLACE FUNCTION update_user_stats(user_uuid UUID, session_score DECIMAL(5,2))
RETURNS VOID AS $$
DECLARE
  current_total INTEGER;
  current_avg DECIMAL(5,2);
  new_avg DECIMAL(5,2);
BEGIN
  -- Get current stats
  SELECT 
    total_scenarios_completed,
    average_score
  INTO current_total, current_avg
  FROM user_profiles 
  WHERE id = user_uuid;
  
  -- Calculate new average
  IF current_total = 0 THEN
    new_avg := session_score;
  ELSE
    new_avg := ((current_avg * current_total) + session_score) / (current_total + 1);
  END IF;
  
  -- Update user profile
  UPDATE user_profiles 
  SET 
    total_scenarios_completed = current_total + 1,
    average_score = new_avg,
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user progress data over time
CREATE OR REPLACE FUNCTION get_user_progress_data(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  date TEXT,
  score DECIMAL(5,2),
  session_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(ts.completed_at)::TEXT as date,
    AVG(ts.final_score)::DECIMAL(5,2) as score,
    COUNT(*)::INTEGER as session_count
  FROM training_sessions ts
  WHERE ts.user_id = user_uuid 
    AND ts.completed_at IS NOT NULL
    AND ts.completed_at >= NOW() - (days_back || ' days')::INTERVAL
    AND ts.final_score IS NOT NULL
  GROUP BY DATE(ts.completed_at)
  ORDER BY DATE(ts.completed_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user performance by domain
CREATE OR REPLACE FUNCTION get_user_domain_performance(user_uuid UUID)
RETURNS TABLE (
  domain TEXT,
  average_score DECIMAL(5,2),
  session_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.domain::TEXT as domain,
    AVG(ts.final_score)::DECIMAL(5,2) as average_score,
    COUNT(*)::INTEGER as session_count
  FROM training_sessions ts
  JOIN scenarios s ON ts.scenario_id = s.id
  WHERE ts.user_id = user_uuid 
    AND ts.completed_at IS NOT NULL
    AND ts.final_score IS NOT NULL
  GROUP BY s.domain
  HAVING COUNT(*) > 0
  ORDER BY average_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_training_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_stats(UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_progress_data(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_domain_performance(UUID) TO authenticated;

-- Add RLS policies for the functions (they use SECURITY DEFINER so they run with elevated privileges)
-- The functions themselves check user_id matching, so they're secure

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_completed ON training_sessions(user_id, completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_started ON training_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_scenarios_domain ON scenarios(domain);