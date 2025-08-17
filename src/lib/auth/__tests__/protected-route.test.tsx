import React from 'react'
import { render, screen } from '@testing-library/react'
import { ProtectedRoute, withAuth } from '../protected-route'
import { useAuth } from '../auth-context'

// Mock the auth context
jest.mock('../auth-context')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const mockPush = jest.fn()

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show loading spinner when loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      clearError: jest.fn(),
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByRole('generic')).toHaveClass('animate-spin')
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should redirect to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      clearError: jest.fn(),
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(mockPush).toHaveBeenCalledWith('/auth/login')
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should redirect to custom path when specified', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      clearError: jest.fn(),
    })

    render(
      <ProtectedRoute redirectTo="/custom-login">
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(mockPush).toHaveBeenCalledWith('/custom-login')
  })

  it('should render children when user is authenticated', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: { access_token: 'token-123' } as any,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      clearError: jest.fn(),
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })
})

describe('withAuth HOC', () => {
  function TestComponent({ message }: { message: string }) {
    return <div>{message}</div>
  }

  it('should wrap component with ProtectedRoute', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: { access_token: 'token-123' } as any,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      clearError: jest.fn(),
    })

    const WrappedComponent = withAuth(TestComponent)

    render(<WrappedComponent message="Hello World" />)

    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('should pass options to ProtectedRoute', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      clearError: jest.fn(),
    })

    const WrappedComponent = withAuth(TestComponent, {
      redirectTo: '/custom-redirect',
    })

    render(<WrappedComponent message="Hello World" />)

    expect(mockPush).toHaveBeenCalledWith('/custom-redirect')
  })
})