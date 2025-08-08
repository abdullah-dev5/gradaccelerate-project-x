import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: number
  fullName: string
  email: string
}

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isClient, setIsClient] = useState(false)

  const isAuthenticated = !!user

  const logout = async () => {
    // Only run on client side
    if (typeof window === 'undefined') return

    try {
      // Get token from localStorage
      const token = localStorage.getItem('auth_token')
      
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      }
      
      // Clear local storage and user state
      localStorage.removeItem('auth_token')
      setUser(null)
      
      // Redirect to home
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      // Clear local storage anyway
      localStorage.removeItem('auth_token')
      setUser(null)
      window.location.href = '/'
    }
  }

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check if user is authenticated on app load - only on client side
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return

    const token = localStorage.getItem('auth_token')
    if (token) {
      // Verify token and get user info
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
        .then(response => {
          if (response.ok) {
            return response.json()
          }
          // Handle 401 Unauthorized specifically
          if (response.status === 401) {
            console.log('Token expired or invalid, removing from storage')
            localStorage.removeItem('auth_token')
            return null
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        })
        .then(data => {
          if (data && data.user) {
            setUser(data.user)
          }
        })
        .catch((error) => {
          console.log('Auth verification failed:', error.message)
          // Token is invalid, remove it
          localStorage.removeItem('auth_token')
        })
    }
  }, [isClient])

  const value = {
    user,
    setUser,
    isAuthenticated,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
