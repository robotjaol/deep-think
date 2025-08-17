import { AuthClient } from '../auth-client'
import { createClientComponentClient } from '../../supabase'

// Mock the supabase client
jest.mock('../../supabase')

describe('AuthClient', () => {
  let authClient: AuthClient
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
        getUser: jest.fn(),
        onAuthStateChange: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        updateUser: jest.fn(),
      },
      from: jest.fn(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      })),
    }

    ;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)
    authClient = new AuthClient()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSession = { access_token: 'token-123' }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
      })

      const result = await authClient.signUp({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      })

      expect(result.user).toEqual(mockUser)
      expect(result.session).toEqual(mockSession)
      expect(result.error).toBeNull()
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            first_name: 'John',
            last_name: 'Doe',
          },
        },
      })
    })

    it('should handle sign up errors', async () => {
      const mockError = { message: 'Email already registered' }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      })

      const result = await authClient.signUp({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.user).toBeNull()
      expect(result.session).toBeNull()
      expect(result.error).toEqual({ message: 'Email already registered', status: 400 })
    })
  })

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSession = { access_token: 'token-123' }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const result = await authClient.signIn({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.user).toEqual(mockUser)
      expect(result.session).toEqual(mockSession)
      expect(result.error).toBeNull()
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('should handle sign in errors', async () => {
      const mockError = { message: 'Invalid credentials' }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      })

      const result = await authClient.signIn({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      expect(result.user).toBeNull()
      expect(result.session).toBeNull()
      expect(result.error).toEqual({ message: 'Invalid credentials', status: 401 })
    })
  })

  describe('signOut', () => {
    it('should successfully sign out a user', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const result = await authClient.signOut()

      expect(result.error).toBeNull()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle sign out errors', async () => {
      const mockError = { message: 'Sign out failed' }
      mockSupabase.auth.signOut.mockResolvedValue({ error: mockError })

      const result = await authClient.signOut()

      expect(result.error).toEqual({ message: 'Sign out failed' })
    })
  })

  describe('getSession', () => {
    it('should successfully get current session', async () => {
      const mockSession = { access_token: 'token-123' }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const result = await authClient.getSession()

      expect(result.session).toEqual(mockSession)
      expect(result.error).toBeNull()
    })

    it('should handle session errors', async () => {
      const mockError = { message: 'Session expired' }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: mockError,
      })

      const result = await authClient.getSession()

      expect(result.session).toBeNull()
      expect(result.error).toEqual({ message: 'Session expired' })
    })
  })

  describe('getUser', () => {
    it('should successfully get current user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await authClient.getUser()

      expect(result.user).toEqual(mockUser)
      expect(result.error).toBeNull()
    })

    it('should handle user errors', async () => {
      const mockError = { message: 'User not found' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockError,
      })

      const result = await authClient.getUser()

      expect(result.user).toBeNull()
      expect(result.error).toEqual({ message: 'User not found' })
    })
  })

  describe('resetPassword', () => {
    it('should successfully send reset password email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })

      // Mock window.location.origin
      delete (window as any).location
      ;(window as any).location = { origin: 'http://localhost:3000' }

      const result = await authClient.resetPassword('test@example.com')

      expect(result.error).toBeNull()
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: 'http://localhost:3000/auth/reset-password' }
      )
    })

    it('should handle reset password errors', async () => {
      const mockError = { message: 'Email not found' }
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: mockError })

      const result = await authClient.resetPassword('test@example.com')

      expect(result.error).toEqual({ message: 'Email not found' })
    })
  })

  describe('updatePassword', () => {
    it('should successfully update password', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null })

      const result = await authClient.updatePassword('newpassword123')

      expect(result.error).toBeNull()
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      })
    })

    it('should handle update password errors', async () => {
      const mockError = { message: 'Password update failed' }
      mockSupabase.auth.updateUser.mockResolvedValue({ error: mockError })

      const result = await authClient.updatePassword('newpassword123')

      expect(result.error).toEqual({ message: 'Password update failed' })
    })
  })
})