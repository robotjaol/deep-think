import { ProfileClient } from '../profile-client'
import { createClientComponentClient } from '../../supabase'

// Mock the supabase client
jest.mock('../../supabase')

describe('ProfileClient', () => {
  let profileClient: ProfileClient
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      })),
      rpc: jest.fn(),
    }

    ;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)
    profileClient = new ProfileClient()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getProfile', () => {
    it('should successfully get user profile', async () => {
      const mockProfile = {
        id: 'user-123',
        preferred_domain: 'cybersecurity',
        default_job_role: 'analyst',
        default_risk_profile: 'balanced',
        training_level: 2,
        total_scenarios_completed: 5,
        average_score: 85.5,
      }

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      }

      mockSupabase.from.mockReturnValue(mockFrom)

      const result = await profileClient.getProfile('user-123')

      expect(result.profile).toEqual(mockProfile)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles')
      expect(mockFrom.select).toHaveBeenCalledWith('*')
      expect(mockFrom.eq).toHaveBeenCalledWith('id', 'user-123')
    })

    it('should handle profile not found', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116', message: 'No rows found' } 
        }),
      }

      mockSupabase.from.mockReturnValue(mockFrom)

      const result = await profileClient.getProfile('user-123')

      expect(result.profile).toBeNull()
      expect(result.error).toEqual({ message: 'Profile not found', status: 404 })
    })

    it('should handle other database errors', async () => {
      const mockError = { message: 'Database connection failed' }
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      }

      mockSupabase.from.mockReturnValue(mockFrom)

      const result = await profileClient.getProfile('user-123')

      expect(result.profile).toBeNull()
      expect(result.error).toEqual({ message: 'Database connection failed', status: 400 })
    })
  })

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const mockUpdatedProfile = {
        id: 'user-123',
        preferred_domain: 'healthcare',
        default_job_role: 'doctor',
        default_risk_profile: 'conservative',
        training_level: 2,
        total_scenarios_completed: 5,
        average_score: 85.5,
      }

      const mockFrom = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null }),
      }

      mockSupabase.from.mockReturnValue(mockFrom)

      const updates = {
        preferred_domain: 'healthcare',
        default_job_role: 'doctor',
        default_risk_profile: 'conservative' as const,
      }

      const result = await profileClient.updateProfile('user-123', updates)

      expect(result.profile).toEqual(mockUpdatedProfile)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles')
      expect(mockFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updates,
          updated_at: expect.any(String),
        })
      )
      expect(mockFrom.eq).toHaveBeenCalledWith('id', 'user-123')
    })

    it('should handle update errors', async () => {
      const mockError = { message: 'Update failed' }
      const mockFrom = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      }

      mockSupabase.from.mockReturnValue(mockFrom)

      const result = await profileClient.updateProfile('user-123', {
        preferred_domain: 'healthcare',
      })

      expect(result.profile).toBeNull()
      expect(result.error).toEqual({ message: 'Update failed', status: 400 })
    })
  })

  describe('getTrainingStats', () => {
    it('should successfully get training statistics', async () => {
      const mockStats = {
        total_sessions: 10,
        completed_sessions: 8,
        average_score: 85.5,
        best_score: 95.0,
        recent_sessions_count: 3,
      }

      mockSupabase.rpc.mockResolvedValue({ data: [mockStats], error: null })

      const result = await profileClient.getTrainingStats('user-123')

      expect(result.stats).toEqual(mockStats)
      expect(result.error).toBeNull()
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_training_stats', {
        user_uuid: 'user-123',
      })
    })

    it('should handle RPC errors', async () => {
      const mockError = { message: 'RPC function failed' }
      mockSupabase.rpc.mockResolvedValue({ data: null, error: mockError })

      const result = await profileClient.getTrainingStats('user-123')

      expect(result.stats).toBeNull()
      expect(result.error).toEqual({ message: 'RPC function failed', status: 400 })
    })
  })

  describe('updateUserStats', () => {
    it('should successfully update user statistics', async () => {
      mockSupabase.rpc.mockResolvedValue({ error: null })

      const result = await profileClient.updateUserStats('user-123', 92.5)

      expect(result.error).toBeNull()
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_user_stats', {
        user_uuid: 'user-123',
        session_score: 92.5,
      })
    })

    it('should handle update stats errors', async () => {
      const mockError = { message: 'Stats update failed' }
      mockSupabase.rpc.mockResolvedValue({ error: mockError })

      const result = await profileClient.updateUserStats('user-123', 92.5)

      expect(result.error).toEqual({ message: 'Stats update failed', status: 400 })
    })
  })

  describe('getRecentSessions', () => {
    it('should successfully get recent sessions', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          scenario_id: 'scenario-1',
          started_at: '2024-01-01T10:00:00Z',
          completed_at: '2024-01-01T10:30:00Z',
          final_score: 85.5,
          scenarios: {
            title: 'Cybersecurity Incident',
            domain: 'cybersecurity',
          },
        },
      ]

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockSessions, error: null }),
      }

      mockSupabase.from.mockReturnValue(mockFrom)

      const result = await profileClient.getRecentSessions('user-123', 5)

      expect(result.sessions).toEqual(mockSessions)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('training_sessions')
      expect(mockFrom.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(mockFrom.order).toHaveBeenCalledWith('started_at', { ascending: false })
      expect(mockFrom.limit).toHaveBeenCalledWith(5)
    })
  })

  describe('hasCompletedOnboarding', () => {
    it('should return true when user has completed onboarding', async () => {
      const mockProfile = {
        id: 'user-123',
        preferred_domain: 'cybersecurity',
        default_job_role: 'analyst',
        default_risk_profile: 'balanced',
        training_level: 1,
        total_scenarios_completed: 0,
        average_score: 0,
      }

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      }

      mockSupabase.from.mockReturnValue(mockFrom)

      const result = await profileClient.hasCompletedOnboarding('user-123')

      expect(result.completed).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return false when user has not completed onboarding', async () => {
      const mockProfile = {
        id: 'user-123',
        preferred_domain: null,
        default_job_role: null,
        default_risk_profile: null,
        training_level: 1,
        total_scenarios_completed: 0,
        average_score: 0,
      }

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      }

      mockSupabase.from.mockReturnValue(mockFrom)

      const result = await profileClient.hasCompletedOnboarding('user-123')

      expect(result.completed).toBe(false)
      expect(result.error).toBeNull()
    })
  })
})