import { useContext } from 'react'
import { AuthContext } from '../components/AuthProvider'

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Additional auth-related hooks

export function useIsAuthenticated() {
  const { user } = useAuth()
  return !!user
}

export function useCurrentUser() {
  const { user } = useAuth()
  return user
}

export function useCurrentUserId() {
  const { user } = useAuth()
  return user?.id
}