-- Add session management columns to training_sessions table
ALTER TABLE public.training_sessions 
ADD COLUMN current_state_id VARCHAR,
ADD COLUMN is_paused BOOLEAN DEFAULT false,
ADD COLUMN paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN resumed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN pause_count INTEGER DEFAULT 0 CHECK (pause_count >= 0),
ADD COLUMN time_spent_seconds INTEGER DEFAULT 0 CHECK (time_spent_seconds >= 0);

-- Add session recovery data
ALTER TABLE public.training_sessions 
ADD COLUMN recovery_data JSONB DEFAULT '{}'::jsonb;

-- Create index for session state queries
CREATE INDEX idx_training_sessions_current_state ON public.training_sessions(current_state_id);
CREATE INDEX idx_training_sessions_paused ON public.training_sessions(is_paused);

-- Add decision confidence tracking
ALTER TABLE public.decisions 
ADD COLUMN user_confidence INTEGER CHECK (user_confidence >= 1 AND user_confidence <= 5);

-- Create function to update session time tracking
CREATE OR REPLACE FUNCTION update_session_time()
RETURNS TRIGGER AS $$
BEGIN
    -- If session is being paused
    IF NEW.is_paused = true AND OLD.is_paused = false THEN
        NEW.paused_at = NOW();
        NEW.pause_count = OLD.pause_count + 1;
    END IF;
    
    -- If session is being resumed
    IF NEW.is_paused = false AND OLD.is_paused = true THEN
        NEW.resumed_at = NOW();
        -- Add time spent since last resume to total
        IF OLD.resumed_at IS NOT NULL THEN
            NEW.time_spent_seconds = OLD.time_spent_seconds + 
                EXTRACT(EPOCH FROM (OLD.paused_at - OLD.resumed_at))::INTEGER;
        ELSE
            -- First pause, calculate from start
            NEW.time_spent_seconds = OLD.time_spent_seconds + 
                EXTRACT(EPOCH FROM (OLD.paused_at - OLD.started_at))::INTEGER;
        END IF;
    END IF;
    
    -- If session is being completed
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
        IF OLD.is_paused = false THEN
            -- Add final time segment
            IF OLD.resumed_at IS NOT NULL THEN
                NEW.time_spent_seconds = OLD.time_spent_seconds + 
                    EXTRACT(EPOCH FROM (NEW.completed_at - OLD.resumed_at))::INTEGER;
            ELSE
                -- Never paused, calculate total from start
                NEW.time_spent_seconds = 
                    EXTRACT(EPOCH FROM (NEW.completed_at - OLD.started_at))::INTEGER;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session time tracking
CREATE TRIGGER update_training_session_time 
    BEFORE UPDATE ON public.training_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_session_time();

-- Create function to get active sessions for a user
CREATE OR REPLACE FUNCTION get_active_sessions(user_uuid UUID)
RETURNS TABLE (
    session_id UUID,
    scenario_title VARCHAR,
    current_state_id VARCHAR,
    is_paused BOOLEAN,
    started_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.id,
        s.title,
        ts.current_state_id,
        ts.is_paused,
        ts.started_at,
        ts.time_spent_seconds
    FROM public.training_sessions ts
    JOIN public.scenarios s ON ts.scenario_id = s.id
    WHERE ts.user_id = user_uuid 
    AND ts.completed_at IS NULL
    ORDER BY ts.started_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up abandoned sessions (older than 24 hours without activity)
CREATE OR REPLACE FUNCTION cleanup_abandoned_sessions()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    UPDATE public.training_sessions 
    SET completed_at = NOW(),
        session_data = session_data || '{"abandoned": true}'::jsonb
    WHERE completed_at IS NULL 
    AND (
        (is_paused = true AND paused_at < NOW() - INTERVAL '24 hours') OR
        (is_paused = false AND started_at < NOW() - INTERVAL '24 hours')
    );
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;