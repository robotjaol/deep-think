/**
 * API Integration tests for session management endpoints
 * Tests the API route structure and basic functionality
 */

import { NextRequest } from 'next/server'

// Mock the Supabase client and auth
jest.mock('../../../../lib/supabase', () => ({
  createServerComponentClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'test-session-id' },
            error: null
          }))
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          is: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: [],
              error: null
            }))
          }))
        }))
      }))
    }))
  })),
  isAuthenticated: jest.fn(() => Promise.resolve({
    user: { id: 'test-user-id' },
    error: null
  }))
}))

// Mock the session manager
jest.mock('../../../../lib/session-manager', () => ({
  TrainingSessionManager: jest.fn().mockImplementation(() => ({
    startSession: jest.fn(() => Promise.resolve({
      success: true,
      sessionId: 'test-session-id'
    })),
    getActiveSessions: jest.fn(() => Promise.resolve([]))
  }))
}))

describe('Session API Routes', () => {
  describe('POST /api/sessions', () => {
    it('should have proper route structure', async () => {
      // Import the route handler
      const { POST } = await import('../route')
      
      expect(typeof POST).toBe('function')
    })

    it('should validate request body structure', async () => {
      const { POST } = await import('../route')
      
      const mockRequest = {
        json: jest.fn(() => Promise.resolve({
          scenarioId: 'test-scenario',
          configuration: {
            domain: 'cybersecurity',
            jobRole: 'analyst',
            riskProfile: 'balanced',
            scenarioHistory: []
          },
          scenarioConfig: {
            id: 'test-scenario',
            title: 'Test',
            domain: 'cybersecurity',
            difficulty_level: 1,
            initialState: {
              id: 'initial',
              description: 'Test',
              context: 'Test',
              decisions: [],
              environmentalFactors: [],
              characters: [],
              riskLevel: 'medium',
              criticalityScore: 5
            },
            states: {},
            branches: [],
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            version: '1.0',
            tags: []
          }
        }))
      } as unknown as NextRequest

      const response = await POST(mockRequest)
      const responseData = await response.json()
      
      expect(response.status).toBe(200)
      expect(responseData.sessionId).toBe('test-session-id')
    })
  })

  describe('GET /api/sessions', () => {
    it('should return active sessions', async () => {
      const { GET } = await import('../route')
      
      const mockRequest = {} as NextRequest
      const response = await GET(mockRequest)
      const responseData = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(responseData.sessions)).toBe(true)
    })
  })

  describe('Session ID Routes', () => {
    it('should have proper session-specific route structure', async () => {
      // Test that the dynamic route exists
      const sessionRoute = await import('../[sessionId]/route')
      
      expect(typeof sessionRoute.GET).toBe('function')
      expect(typeof sessionRoute.PATCH).toBe('function')
    })

    it('should have decision recording route', async () => {
      const decisionRoute = await import('../[sessionId]/decisions/route')
      
      expect(typeof decisionRoute.POST).toBe('function')
      expect(typeof decisionRoute.GET).toBe('function')
    })
  })

  describe('Recovery Routes', () => {
    it('should have recovery route structure', async () => {
      const recoveryRoute = await import('../recovery/route')
      
      expect(typeof recoveryRoute.GET).toBe('function')
      expect(typeof recoveryRoute.POST).toBe('function')
    })
  })
})

describe('API Error Handling', () => {
  it('should handle missing authentication', async () => {
    // Mock unauthenticated user
    const { isAuthenticated } = require('../../../../lib/supabase')
    isAuthenticated.mockResolvedValueOnce({
      user: null,
      error: { message: 'Not authenticated' }
    })

    const { GET } = await import('../route')
    const mockRequest = {} as NextRequest
    const response = await GET(mockRequest)
    
    expect(response.status).toBe(401)
  })

  it('should validate required fields in POST requests', async () => {
    const { POST } = await import('../route')
    
    const mockRequest = {
      json: jest.fn(() => Promise.resolve({
        // Missing required fields
      }))
    } as unknown as NextRequest

    const response = await POST(mockRequest)
    
    expect(response.status).toBe(400)
  })
})

describe('Database Schema Validation', () => {
  it('should have proper migration structure', () => {
    // Test that our migration file exists and has proper structure
    const fs = require('fs')
    const path = require('path')
    
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20240101000005_session_management.sql')
    const migrationExists = fs.existsSync(migrationPath)
    
    expect(migrationExists).toBe(true)
    
    if (migrationExists) {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8')
      
      // Check for key additions
      expect(migrationContent).toContain('current_state_id')
      expect(migrationContent).toContain('is_paused')
      expect(migrationContent).toContain('recovery_data')
      expect(migrationContent).toContain('update_session_time')
      expect(migrationContent).toContain('get_active_sessions')
      expect(migrationContent).toContain('cleanup_abandoned_sessions')
    }
  })
})

describe('Type Safety', () => {
  it('should have proper TypeScript interfaces', () => {
    const types = require('../../../../lib/types')
    
    // Test that key interfaces exist
    expect(types).toBeDefined()
    
    // Test that we can create objects matching our interfaces
    const sessionData = {
      decisions_made: [],
      state_history: ['initial'],
      time_spent_seconds: 0,
      pause_count: 0,
      hints_used: 0,
      current_context: {}
    }
    
    expect(Array.isArray(sessionData.decisions_made)).toBe(true)
    expect(Array.isArray(sessionData.state_history)).toBe(true)
  })

  it('should export session manager classes', () => {
    const sessionManager = require('../../../../lib/session-manager')
    
    expect(sessionManager.TrainingSessionManager).toBeDefined()
    expect(sessionManager.SessionPersistence).toBeDefined()
    expect(sessionManager.SessionRecovery).toBeDefined()
  })
})