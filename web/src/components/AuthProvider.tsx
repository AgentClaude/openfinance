import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { ME } from '../graphql/queries'
import { LOGIN, REGISTER } from '../graphql/mutations'
import { updateAuthToken } from '../lib/apollo'
import type { User, AuthContextType } from '../types'

const TOKEN_KEY = 'access_token'

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Query current user on app load
  const { loading: queryLoading } = useQuery(ME, {
    skip: !localStorage.getItem(TOKEN_KEY),
    errorPolicy: 'ignore', // Don't show errors for unauthenticated users
    onCompleted: (data) => {
      if (data?.me) {
        setUser(data.me)
      }
      setLoading(false)
    },
    onError: (error) => {
      // Only clear tokens for authentication errors, not network errors
      const isAuthError = error.graphQLErrors?.some(
        e => e.message.includes('Authentication') || e.message.includes('Unauthorized')
      ) || error.networkError && 'statusCode' in error.networkError && error.networkError.statusCode === 401
      
      if (isAuthError) {
        updateAuthToken(null)
        setUser(null)
      }
      setLoading(false)
    },
  })

  // Login mutation
  const [loginMutation] = useMutation(LOGIN, {
    onCompleted: (data) => {
      if (data?.login?.token) {
        const { user: userData, token } = data.login
        updateAuthToken(token)
        setUser(userData)
      }
    },
  })

  // Register mutation
  const [registerMutation] = useMutation(REGISTER, {
    onCompleted: (data) => {
      if (data?.register?.token) {
        const { user: userData, token } = data.register
        updateAuthToken(token)
        setUser(userData)
      }
    },
  })

  // Set loading state based on query loading
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false)
    } else {
      setLoading(queryLoading)
    }
  }, [queryLoading])

  const login = async (email: string, password: string) => {
    try {
      const result = await loginMutation({
        variables: { email, password },
      })

      if (!result.data?.login?.token) {
        throw new Error('Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const result = await registerMutation({
        variables: { name, email, password },
      })

      if (!result.data?.register?.token) {
        throw new Error('Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const logout = () => {
    updateAuthToken(null)
    setUser(null)
    // Note: You might want to add a logout mutation here if needed
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}