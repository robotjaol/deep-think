// Auth client and utilities
export { authClient } from './auth-client'
export type { AuthError, AuthResponse, SignUpData, SignInData } from './auth-client'

// Auth context and hooks
export { AuthProvider, useAuth } from './auth-context'

// Profile client and utilities
export { profileClient } from './profile-client'
export type { ProfileUpdateData, ProfileError } from './profile-client'

// Profile context and hooks
export { ProfileProvider, useProfile } from './profile-context'

// Protected route components
export { ProtectedRoute, withAuth } from './protected-route'