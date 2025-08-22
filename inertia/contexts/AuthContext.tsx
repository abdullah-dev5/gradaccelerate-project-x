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
  clearAuth: () => void
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
        // First check if we have any stored auth data
        const storedToken = localStorage.getItem('auth_token')
        const storedUser = localStorage.getItem('auth_user')
        
        // If no stored data, user is definitely not authenticated
        if (!storedToken && !storedUser) {
          setUser(null)
          setToken(null)
          setLoading(false)
          return
        }
        
        // Check with backend to verify authentication status
        const response = await fetch('/api/auth/me', {
          headers: {
            'Accept': 'application/json'
          },
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          if (data.data && data.data.user) {
            setUser(data.data.user)
            setToken(data.data.token || storedToken)
            // Update stored data if it's different
            if (data.data.token !== storedToken) {
              localStorage.setItem('auth_token', data.data.token)
            }
            if (JSON.stringify(data.data.user) !== storedUser) {
              localStorage.setItem('auth_user', JSON.stringify(data.data.user))
            }
          } else {
            // Backend says not authenticated, clear everything
            setUser(null)
            setToken(null)
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
          }
        } else if (response.status === 401) {
          // Explicitly unauthorized, clear everything
          setUser(null)
          setToken(null)
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
        } else {
          // Other error, clear local state
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
      } finally {
        setLoading(false)
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
    let response: Response | undefined
    
    try {
      // ✅ CRITICAL: Clear local state immediately to prevent race conditions
      setToken(null)
      setUser(null)
      
      // Call backend logout endpoint
      response = await fetch('/logout', {
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
        // Backend will handle the redirect to home page
      } else {
        console.warn('Logout request failed:', response.status)
        // If backend fails, manually redirect to home page
        window.location.replace('/')
      }
    } catch (error) {
      console.error('Logout error:', error)
      // On error, manually redirect to home page
      window.location.replace('/')
    } finally {
      // ✅ CRITICAL: Clear all storage and cookies
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      sessionStorage.clear()
      
      // Clear any custom cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Clear any remaining localStorage items that might contain auth data
      Object.keys(localStorage).forEach(key => {
        if (key.includes('auth') || key.includes('token') || key.includes('user')) {
          localStorage.removeItem(key)
        }
      })
      
      // Don't redirect here - let the backend handle it
      // If we get here, it means the backend didn't redirect, so we should
      if (!response?.ok) {
        window.location.replace('/')
      }
    }
  }

  // ✅ NEW: Function to manually clear authentication state
  const clearAuth = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    sessionStorage.clear()
    
    // Clear any custom cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      token,
      login,
      logout,
      clearAuth,
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
        clearAuth: () => {},
        loading: true
      }
    }
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
