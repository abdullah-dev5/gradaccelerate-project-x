import React, { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: number
  fullName: string | null
  email: string
  provider?: string | null
  avatarUrl?: string | null
  createdAt: string
  updatedAt: string
  // Notification preferences
  emailNotificationsEnabled?: boolean
  webNotificationsEnabled?: boolean
  reminderEmailsEnabled?: boolean
  reminderWebEnabled?: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  clearAuth: () => void
  updateUser: (updates: Partial<User>) => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // ✅ IMPROVED: Initialize auth state from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('auth_user')
      
      if (storedToken && storedUser) {
        try {
          setToken(storedToken)
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
        } catch (parseError) {
          console.warn('AuthProvider: Failed to parse stored auth data', parseError)
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

  // ✅ IMPROVED: Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Check if we just logged out
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('logout') === 'success') {
        setUser(null)
        setToken(null)
        setLoading(false)
        return
      }
      
      try {
        // Try to fetch user data from backend (session-based)
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
            if (data.data.token) {
              setToken(data.data.token)
              localStorage.setItem('auth_token', data.data.token)
            }
            localStorage.setItem('auth_user', JSON.stringify(data.data.user))
          } else {
            setUser(null)
            setToken(null)
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
          }
        } else if (response.status === 401) {
          setUser(null)
          setToken(null)
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
        } else {
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
    // ✅ CRITICAL: Clear local state IMMEDIATELY to prevent race conditions
    setToken(null)
    setUser(null)
    
    // Clear all storage and cookies
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Call backend logout
    try {
      await fetch('/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Inertia': 'true'
        },
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    // Hard redirect to clear everything
    window.location.href = '/?logout=success&t=' + Date.now()
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

  // ✅ NEW: Update current user (merge) and persist to localStorage
  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      const next = { ...(prev || {} as User), ...updates } as User
      try {
        localStorage.setItem('auth_user', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      token,
      login,
      logout,
      clearAuth,
      updateUser,
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
        updateUser: () => {},
        loading: true
      }
    }
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
