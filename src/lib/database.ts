import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

type Tables = Database['public']['Tables']
type UserProfile = Tables['user_profiles']['Row']
type Scenario = Tables['scenarios']['Row']
type TrainingSession = Tables['training_sessions']['Row']
type Decision = Tables['decisions']['Row']
type LearningResource = Tables['learning_resources']['Row']

export class DatabaseService {
  constructor(private supabase: SupabaseClient<Database>) {}

  // User Profile Operations
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)

    if (error) {
      console.error('Error updating user profile:', error)
      return false
    }

    return true
  }

  // Scenario Operations
  async getActiveScenarios(domain?: string): Promise<Scenario[]> {
    let query = this.supabase
      .from('scenarios')
      .select('*')
      .eq('is_active', true)

    if (domain) {
      query = query.eq('domain', domain)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching scenarios:', error)
      return []
    }

    return data || []
  }

  async getScenario(scenarioId: string): Promise<Scenario | null> {
    const { data, error } = await this.supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single()

    if (error) {
      console.error('Error fetching scenario:', error)
      return null
    }

    return data
  }

  // Training Session Operations
  async createTrainingSession(
    userId: string,
    scenarioId: string,
    configuration: any
  ): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('training_sessions')
      .insert({
        user_id: userId,
        scenario_id: scenarioId,
        configuration,
        session_data: {}
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating training session:', error)
      return null
    }

    return data.id
  }

  async updateTrainingSession(
    sessionId: string,
    updates: Partial<TrainingSession>
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('training_sessions')
      .update(updates)
      .eq('id', sessionId)

    if (error) {
      console.error('Error updating training session:', error)
      return false
    }

    return true
  }

  async completeTrainingSession(
    sessionId: string,
    finalScore: number
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('training_sessions')
      .update({
        completed_at: new Date().toISOString(),
        final_score: finalScore
      })
      .eq('id', sessionId)

    if (error) {
      console.error('Error completing training session:', error)
      return false
    }

    return true
  }

  async getUserTrainingSessions(userId: string): Promise<TrainingSession[]> {
    const { data, error } = await this.supabase
      .from('training_sessions')
      .select(`
        *,
        scenarios (
          title,
          domain,
          difficulty_level
        )
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Error fetching user training sessions:', error)
      return []
    }

    return data || []
  }

  // Decision Operations
  async recordDecision(
    sessionId: string,
    stateId: string,
    decisionText: string,
    timeTaken: number,
    scoreImpact: number,
    consequences: any[]
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('decisions')
      .insert({
        session_id: sessionId,
        state_id: stateId,
        decision_text: decisionText,
        time_taken: timeTaken,
        score_impact: scoreImpact,
        consequences
      })

    if (error) {
      console.error('Error recording decision:', error)
      return false
    }

    return true
  }

  async getSessionDecisions(sessionId: string): Promise<Decision[]> {
    const { data, error } = await this.supabase
      .from('decisions')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Error fetching session decisions:', error)
      return []
    }

    return data || []
  }

  // Learning Resources Operations
  async getLearningResources(
    domain?: string,
    keywords?: string[]
  ): Promise<LearningResource[]> {
    let query = this.supabase
      .from('learning_resources')
      .select('*')

    if (domain) {
      query = query.eq('domain', domain)
    }

    if (keywords && keywords.length > 0) {
      query = query.overlaps('relevance_keywords', keywords)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching learning resources:', error)
      return []
    }

    return data || []
  }

  // Statistics Operations
  async getUserTrainingStats(userId: string) {
    const { data, error } = await this.supabase
      .rpc('get_user_training_stats', { user_uuid: userId })

    if (error) {
      console.error('Error fetching user training stats:', error)
      return null
    }

    return data?.[0] || null
  }

  async getScenarioStats(scenarioId: string) {
    const { data, error } = await this.supabase
      .rpc('get_scenario_stats', { scenario_uuid: scenarioId })

    if (error) {
      console.error('Error fetching scenario stats:', error)
      return null
    }

    return data?.[0] || null
  }

  async updateUserStats(userId: string, sessionScore: number): Promise<boolean> {
    const { error } = await this.supabase
      .rpc('update_user_stats', { 
        user_uuid: userId, 
        session_score: sessionScore 
      })

    if (error) {
      console.error('Error updating user stats:', error)
      return false
    }

    return true
  }
}