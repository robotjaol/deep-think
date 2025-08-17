'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  requireOnboarding?: boolean
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/auth/login',
  requireOnboarding = false 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo)
      }
    }
  }, [user, loading, router, redirectTo])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render children if user is not authenticated
  if (!user) {
    return null
  }

  return <>{children}</>
}

// Higher-order component version
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: { redirectTo?: string; requireOnboarding?: boolean } = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}