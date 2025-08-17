import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../auth-context'
import { authClient } from '../auth-client'

// Mock the auth client
jest.mock('../auth-client')

const mockAuthClient = authClient as jest.Mocked<typeof authClient>

// Test component that uses the auth context
function TestComponent() {
  const { user, loading, error, signIn, signUp, signOut, clearError } = useAuth()

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="error">{error ? error.message : 'no-error'}</div>
      <button onClick={() => signIn('test@example.com', 'password')}>Sign In</button>
      <button onClick={() => signUp('test@example.com', 'password', 'John', 'Doe')}>Sign Up</button>
      <button onClick={signOut}>Sign Out</button>
      <button onClick={clearError}>Clear Error</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    mockAuthClient.getSession.mockResolvedValue({
      session: null,
      error: null,
    })
    
    mockAuthClient.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })
  })

  it('should provide initial loading state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('loading')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    expect(screen.getByTestId('error')).toHaveTextContent('no-error')

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })
  })

  it('should handle successful sign in', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    const mockSession = { access_token: 'token-123' }

    mockAuthClient.signIn.mockResolvedValue({
      user: mockUser,
      session: mockSession,
      error: null,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    fireEvent.click(screen.getByText('Sign In'))

    expect(screen.getByTestId('loading')).toHaveTextContent('loading')

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    expect(mockAuthClient.signIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    })
  })

  it('should handle sign in errors', async () => {
    const mockError = { message: 'Invalid credentials', status: 401 }

    mockAuthClient.signIn.mockResolvedValue({
      user: null,
      session: null,
      error: mockError,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    fireEvent.click(screen.getByText('Sign In'))

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials')
    })
  })

  it('should handle successful sign up', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    const mockSession = { access_token: 'token-123' }

    mockAuthClient.signUp.mockResolvedValue({
      user: mockUser,
      session: mockSession,
      error: null,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    fireEvent.click(screen.getByText('Sign Up'))

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    expect(mockAuthClient.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      firstName: 'John',
      lastName: 'Doe',
    })
  })

  it('should handle sign up errors', async () => {
    const mockError = { message: 'Email already registered', status: 400 }

    mockAuthClient.signUp.mockResolvedValue({
      user: null,
      session: null,
      error: mockError,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    fireEvent.click(screen.getByText('Sign Up'))

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Email already registered')
    })
  })

  it('should handle successful sign out', async () => {
    mockAuthClient.signOut.mockResolvedValue({ error: null })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    fireEvent.click(screen.getByText('Sign Out'))

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    expect(mockAuthClient.signOut).toHaveBeenCalled()
  })

  it('should handle sign out errors', async () => {
    const mockError = { message: 'Sign out failed' }

    mockAuthClient.signOut.mockResolvedValue({ error: mockError })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    fireEvent.click(screen.getByText('Sign Out'))

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Sign out failed')
    })
  })

  it('should clear errors', async () => {
    const mockError = { message: 'Test error', status: 400 }

    mockAuthClient.signIn.mockResolvedValue({
      user: null,
      session: null,
      error: mockError,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    fireEvent.click(screen.getByText('Sign In'))

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Test error')
    })

    fireEvent.click(screen.getByText('Clear Error'))

    expect(screen.getByTestId('error')).toHaveTextContent('no-error')
  })

  it('should handle auth state changes', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    const mockSession = { access_token: 'token-123', user: mockUser }

    let authStateCallback: (event: string, session: any) => void

    mockAuthClient.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return { data: { subscription: { unsubscribe: jest.fn() } } }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    // Simulate auth state change
    authStateCallback!('SIGNED_IN', mockSession)

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    })

    // Simulate sign out
    authStateCallback!('SIGNED_OUT', null)

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      expect(screen.getByTestId('error')).toHaveTextContent('no-error')
    })
  })

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })
})