import React, { useState } from 'react'
import { Link } from '@inertiajs/react'
import { LogOut, User, Settings, Bell } from 'lucide-react'
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

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <>
      <header className="bg-[#2C2C2E] border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
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
                <h1 className="text-3xl font-bold text-white">{title}</h1>
                {subtitle && (
                  <p className="text-gray-400 mt-2 text-white">{subtitle}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {children}
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm text-gray-400 text-white">Today</p>
                  <p className="text-lg font-semibold text-white">{new Date().toLocaleDateString()}</p>
                </div>
                
                {/* Profile Icon with Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowPreferences(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#3A3A3C] hover:bg-[#4A4A4C] text-white rounded-lg transition-colors duration-200"
                    title="Notification Preferences"
                  >
                    <User size={20} />
                    <span className="hidden sm:inline text-white">{user?.fullName || 'User'}</span>
                    <Bell size={16} className="text-blue-400" />
                  </button>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline text-white">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
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
