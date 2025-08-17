import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Default client instance
export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Client-side Supabase client
export const createClientComponentClient = (): SupabaseClient<Database> => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Server-side Supabase client for API routes
export const createServerComponentClient = (): SupabaseClient<Database> => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  
  if (error?.code === 'PGRST116') {
    return 'No data found'
  }
  
  if (error?.code === '23505') {
    return 'This record already exists'
  }
  
  if (error?.code === '42501') {
    return 'You do not have permission to perform this action'
  }
  
  return error?.message || 'An unexpected error occurred'
}

// Helper function to check if user is authenticated
export const isAuthenticated = async (client: SupabaseClient<Database>) => {
  const { data: { user }, error } = await client.auth.getUser()
  return { user, error }
}

// Helper function to get current user profile
export const getCurrentUserProfile = async (client: SupabaseClient<Database>) => {
  const { user, error: authError } = await isAuthenticated(client)
  
  if (authError || !user) {
    return { profile: null, error: authError }
  }
  
  const { data: profile, error: profileError } = await client
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return { profile, error: profileError }
}