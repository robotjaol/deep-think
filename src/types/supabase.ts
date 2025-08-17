export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          profile: Json
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
          profile?: Json
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          profile?: Json
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          preferred_domain: string | null
          default_job_role: string | null
          default_risk_profile: 'conservative' | 'balanced' | 'aggressive' | null
          training_level: number
          total_scenarios_completed: number
          average_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          preferred_domain?: string | null
          default_job_role?: string | null
          default_risk_profile?: 'conservative' | 'balanced' | 'aggressive' | null
          training_level?: number
          total_scenarios_completed?: number
          average_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          preferred_domain?: string | null
          default_job_role?: string | null
          default_risk_profile?: 'conservative' | 'balanced' | 'aggressive' | null
          training_level?: number
          total_scenarios_completed?: number
          average_score?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      scenarios: {
        Row: {
          id: string
          title: string
          domain: string
          difficulty_level: number
          config: Json
          created_by: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          domain: string
          difficulty_level?: number
          config: Json
          created_by?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          domain?: string
          difficulty_level?: number
          config?: Json
          created_by?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      training_sessions: {
        Row: {
          id: string
          user_id: string | null
          scenario_id: string | null
          configuration: Json
          started_at: string
          completed_at: string | null
          final_score: number | null
          session_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          scenario_id?: string | null
          configuration?: Json
          started_at?: string
          completed_at?: string | null
          final_score?: number | null
          session_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          scenario_id?: string | null
          configuration?: Json
          started_at?: string
          completed_at?: string | null
          final_score?: number | null
          session_data?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_scenario_id_fkey"
            columns: ["scenario_id"]
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      decisions: {
        Row: {
          id: string
          session_id: string | null
          state_id: string
          decision_text: string
          timestamp: string
          time_taken: number | null
          score_impact: number | null
          consequences: Json
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          state_id: string
          decision_text: string
          timestamp?: string
          time_taken?: number | null
          score_impact?: number | null
          consequences?: Json
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          state_id?: string
          decision_text?: string
          timestamp?: string
          time_taken?: number | null
          score_impact?: number | null
          consequences?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      learning_resources: {
        Row: {
          id: string
          title: string
          type: 'paper' | 'textbook' | 'video' | 'case-study'
          url: string | null
          domain: string | null
          tags: string[] | null
          relevance_keywords: string[] | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          type: 'paper' | 'textbook' | 'video' | 'case-study'
          url?: string | null
          domain?: string | null
          tags?: string[] | null
          relevance_keywords?: string[] | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          type?: 'paper' | 'textbook' | 'video' | 'case-study'
          url?: string | null
          domain?: string | null
          tags?: string[] | null
          relevance_keywords?: string[] | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_scenario_stats: {
        Args: {
          scenario_uuid: string
        }
        Returns: {
          total_attempts: number
          average_score: number
          completion_rate: number
        }[]
      }
      get_user_training_stats: {
        Args: {
          user_uuid: string
        }
        Returns: {
          total_sessions: number
          completed_sessions: number
          average_score: number
          best_score: number
          recent_sessions_count: number
        }[]
      }
      update_user_stats: {
        Args: {
          user_uuid: string
          session_score: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}