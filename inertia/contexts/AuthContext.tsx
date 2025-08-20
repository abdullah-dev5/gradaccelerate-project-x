import React, { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: number
  fullName: string
  email: string
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // ✅ SIMPLIFIED: Initialize auth state from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('auth_user')
      
      if (storedToken && storedUser) {
        try {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
        } catch (parseError) {
          console.warn('AuthProvider: Failed to parse stored auth data')
          // Clear invalid data
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
        }
      }
    } catch (error) {
      console.warn('AuthProvider: Error initializing auth state:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // ✅ SIMPLIFIED: Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          if (data.data && data.data.user) {
            setUser(data.data.user)
            setToken(data.data.token || null)
          }
        } else {
          // Not authenticated, clear local state
          setUser(null)
          setToken(null)
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
        }
      } catch (error) {
        console.warn('AuthProvider: Error checking auth status:', error)
        // On error, clear local state
        setUser(null)
        setToken(null)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }

    checkAuthStatus()
  }, [])

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('auth_user', JSON.stringify(newUser))
  }

  const logout = async () => {
    try {
      // Call backend logout endpoint
      const response = await fetch('/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Inertia': 'true'
        },
        credentials: 'include'
      })

      if (response.ok) {
        console.log('Logout successful')
      } else {
        console.warn('Logout request failed:', response.status)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // ✅ STANDARD: Clear local state and storage
      setToken(null)
      setUser(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      
      // ✅ STANDARD: Use Inertia's built-in navigation
      // This ensures proper cleanup and prevents browser back button issues
      window.location.href = '/login'
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      token,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // ✅ FIXED: Return safe defaults during SSR instead of throwing
    if (typeof window === 'undefined') {
      return {
        user: null,
        isAuthenticated: false,
        token: null,
        login: () => {},
        logout: () => {},
        loading: true
      }
    }
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
