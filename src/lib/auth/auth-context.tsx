'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { authClient, type AuthError } from './auth-client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { session, error } = await authClient.getSession()
        if (error) {
          setError(error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (err: any) {
        setError({ message: err.message || 'Failed to get session' })
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = authClient.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        if (event === 'SIGNED_OUT') {
          setError(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    const { user, session, error } = await authClient.signIn({ email, password })
    
    if (error) {
      setError(error)
    } else {
      setUser(user)
      setSession(session)
    }
    
    setLoading(false)
  }

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    setLoading(true)
    setError(null)

    const { user, session, error } = await authClient.signUp({ 
      email, 
      password, 
      firstName, 
      lastName 
    })
    
    if (error) {
      setError(error)
    } else {
      setUser(user)
      setSession(session)
    }
    
    setLoading(false)
  }

  const signOut = async () => {
    setLoading(true)
    setError(null)

    const { error } = await authClient.signOut()
    
    if (error) {
      setError(error)
    } else {
      setUser(null)
      setSession(null)
    }
    
    setLoading(false)
  }

  const resetPassword = async (email: string) => {
    setError(null)

    const { error } = await authClient.resetPassword(email)
    
    if (error) {
      setError(error)
    }
  }

  const updatePassword = async (password: string) => {
    setError(null)

    const { error } = await authClient.updatePassword(password)
    
    if (error) {
      setError(error)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}