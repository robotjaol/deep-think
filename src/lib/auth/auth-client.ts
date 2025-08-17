import { createClientComponentClient } from '../supabase'
import { Database } from '../../types/supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthError {
  message: string
  status?: number
}

export interface AuthResponse {
  user: User | null
  session: Session | null
  error: AuthError | null
}

export interface SignUpData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface SignInData {
  email: string
  password: string
}

export class AuthClient {
  private supabase = createClientComponentClient()

  /**
   * Sign up a new user with email and password
   */
  async signUp({ email, password, firstName, lastName }: SignUpData): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })

      if (error) {
        return {
          user: null,
          session: null,
          error: { message: error.message, status: 400 }
        }
      }

      // If user is created, also create their profile
      if (data.user) {
        await this.createUserProfile(data.user.id, email)
      }

      return {
        user: data.user,
        session: data.session,
        error: null
      }
    } catch (error: any) {
      return {
        user: null,
        session: null,
        error: { message: error.message || 'An unexpected error occurred' }
      }
    }
  }

  /**
   * Sign in an existing user with email and password
   */
  async signIn({ email, password }: SignInData): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return {
          user: null,
          session: null,
          error: { message: error.message, status: 401 }
        }
      }

      return {
        user: data.user,
        session: data.session,
        error: null
      }
    } catch (error: any) {
      return {
        user: null,
        session: null,
        error: { message: error.message || 'An unexpected error occurred' }
      }
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.signOut()
      
      if (error) {
        return { error: { message: error.message } }
      }

      return { error: null }
    } catch (error: any) {
      return { error: { message: error.message || 'An unexpected error occurred' } }
    }
  }

  /**
   * Get the current user session
   */
  async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()
      
      if (error) {
        return { session: null, error: { message: error.message } }
      }

      return { session, error: null }
    } catch (error: any) {
      return { session: null, error: { message: error.message || 'An unexpected error occurred' } }
    }
  }

  /**
   * Get the current user
   */
  async getUser(): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error) {
        return { user: null, error: { message: error.message } }
      }

      return { user, error: null }
    } catch (error: any) {
      return { user: null, error: { message: error.message || 'An unexpected error occurred' } }
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }

  /**
   * Create user profile in our custom users table
   */
  private async createUserProfile(userId: string, email: string) {
    try {
      // Create user record
      const { error: userError } = await this.supabase
        .from('users')
        .insert({
          id: userId,
          email,
          profile: {}
        })

      if (userError) {
        console.error('Error creating user record:', userError)
      }

      // Create user profile record
      const { error: profileError } = await this.supabase
        .from('user_profiles')
        .insert({
          id: userId,
          training_level: 1,
          total_scenarios_completed: 0,
          average_score: 0.00
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error)
    }
  }

  /**
   * Reset password for a user
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        return { error: { message: error.message } }
      }

      return { error: null }
    } catch (error: any) {
      return { error: { message: error.message || 'An unexpected error occurred' } }
    }
  }

  /**
   * Update user password
   */
  async updatePassword(password: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.updateUser({ password })

      if (error) {
        return { error: { message: error.message } }
      }

      return { error: null }
    } catch (error: any) {
      return { error: { message: error.message || 'An unexpected error occurred' } }
    }
  }
}

// Export singleton instance
export const authClient = new AuthClient()