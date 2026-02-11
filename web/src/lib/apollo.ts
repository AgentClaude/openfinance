import { ApolloClient, InMemoryCache, from, HttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import toast from 'react-hot-toast'

// HTTP link for GraphQL API
const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || '/graphql',
  credentials: 'include', // Include cookies for CSRF protection
})

// Authentication link to add JWT token to requests
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('access_token')
  
  return {
    headers: {
      ...headers,
      ...(token && { authorization: `Bearer ${token}` }),
    },
  }
})

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `GraphQL error: ${message}`,
        { locations, path, operation: operation.operationName }
      )
      
      // Show user-friendly error messages
      if (message.includes('Authentication required')) {
        toast.error('Please log in to continue')
        // Redirect to login or clear stored tokens
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      } else if (!message.includes('Network')) {
        // Don't show network errors as they're handled elsewhere
        toast.error(message)
      }
    })
  }

  if (networkError) {
    console.error('Network error:', networkError)
    
    // Handle network errors based on type
    if ('statusCode' in networkError) {
      if (networkError.statusCode === 401) {
        toast.error('Session expired. Please log in again.')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      } else if (networkError.statusCode >= 500) {
        toast.error('Server error. Please try again later.')
      }
    }
    // Don't show toast for transient network errors (e.g., during page reload)
  }
})

// Apollo Client cache configuration
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        transactions: {
          // Replace on each fetch — pagination handled by fetchMore
          merge: false,
        },
      },
    },
    User: {
      fields: {
        preferences: {
          merge: true, // Merge objects instead of replacing
        },
      },
    },
    Household: {
      fields: {
        accounts: {
          merge: false, // Replace instead of merging for fresh data
        },
        transactions: {
          merge: false,
        },
      },
    },
  },
})

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'network-only',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  connectToDevTools: import.meta.env.MODE === 'development',
})

// Helper function to update auth token
export const updateAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('access_token', token)
  } else {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
  
  // Clear Apollo cache when token changes
  apolloClient.clearStore()
}

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token')
}