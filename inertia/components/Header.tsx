import React, { useState } from 'react'
import { Link } from '@inertiajs/react'
import { LogOut, Settings, Bell, Menu, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import PreferencesPopup from './PreferencesPopup'

interface HeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  backHref?: string
  children?: React.ReactNode
}

export default function Header({ 
  title, 
  subtitle, 
  showBackButton = false, 
  backHref = '/dashboard',
  children 
}: HeaderProps) {
  const { user, logout } = useAuth()
  const [showPreferences, setShowPreferences] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      setIsMobileMenuOpen(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getUserName = () => {
    // Priority: fullName (first name only if multi-word) > fullName > email username > 'User'
    if (user?.fullName) {
      const nameParts = user.fullName.trim().split(' ')
      // If multiple words, return first name only
      return nameParts[0]
    }
    if (user?.email) {
      // Extract username from email and capitalize first letter
      const username = user.email.split('@')[0]
      return username.charAt(0).toUpperCase() + username.slice(1)
    }
    return 'User'
  }

  return (
    <>
      <header className="bg-[#2C2C2E] border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 lg:py-6">
            {/* Left Side - Title and Back Button */}
            <div className="flex items-center gap-4">
              {showBackButton && (
                <Link 
                  href={backHref} 
                  className="text-[#98989D] hover:text-white transition-colors p-2 hover:bg-[#3A3A3C] rounded-lg"
                  title="Back"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
                {subtitle && (
                  <p className="text-sm md:text-base text-gray-400 mt-1 md:mt-2">{subtitle}</p>
                )}
              </div>
            </div>
            
            {/* Desktop View - Right Side */}
            <div className="hidden lg:flex items-center space-x-4">
              {children}
              
              <div className="flex items-center space-x-3">
                <div className="text-right hidden xl:block">
                  <p className="text-sm text-gray-400">Today</p>
                  <p className="text-lg font-semibold text-white">{formatDate()}</p>
                </div>
                
                {/* Notification Preferences Button */}
                <button
                  onClick={() => setShowPreferences(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-[#3A3A3C] hover:bg-[#4A4A4C] text-white rounded-lg transition-colors duration-200"
                  title="Notification Preferences"
                >
                  <Bell size={18} className="text-blue-400" />
                </button>
                
                {/* User Profile */}
                <div className="relative">
                  <button
                    className="flex items-center gap-2 px-3 py-2 bg-[#3A3A3C] hover:bg-[#4A4A4C] text-white rounded-lg transition-colors duration-200"
                    title={getUserName()}
                  >
                    {/* User Avatar */}
                    {user?.avatarUrl && !avatarError ? (
                      <img 
                        src={user.avatarUrl} 
                        alt={getUserName()}
                        className="w-8 h-8 rounded-full"
                        onError={() => setAvatarError(true)}
                      />
                    ) : user?.provider === 'google' ? (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {getUserInitials(getUserName())}
                        </span>
                      </div>
                    )}
                    <span className="text-white">{getUserName()}</span>
                  </button>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                >
                  <LogOut size={16} />
                  <span className="text-white">Logout</span>
                </button>
              </div>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-[#3A3A3C] rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-700 bg-[#2C2C2E]">
            <div className="px-4 py-4 space-y-3">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-[#3A3A3C] rounded-lg">
                {user?.avatarUrl && !avatarError ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={getUserName()}
                    className="w-10 h-10 rounded-full"
                    onError={() => setAvatarError(true)}
                  />
                ) : user?.provider === 'google' ? (
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {getUserInitials(getUserName())}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-white font-medium">{getUserName()}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>

              {/* Notification Preferences */}
              <button
                onClick={() => {
                  setShowPreferences(true)
                  setIsMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#3A3A3C] hover:bg-[#4A4A4C] text-white rounded-lg transition-colors"
              >
                <Bell size={20} className="text-blue-400" />
                <span className="flex-1 text-left">Notification Preferences</span>
                <Settings size={16} />
              </button>

              {/* Today's Date */}
              <div className="px-4 py-2 bg-[#3A3A3C] rounded-lg">
                <p className="text-sm text-gray-400">Today</p>
                <p className="text-lg font-semibold text-white">{formatDate()}</p>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <LogOut size={20} />
                <span className="flex-1 text-left">Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Preferences Popup */}
      {showPreferences && (
        <PreferencesPopup 
          onClose={() => setShowPreferences(false)}
          user={user}
        />
      )}
    </>
  )
}
