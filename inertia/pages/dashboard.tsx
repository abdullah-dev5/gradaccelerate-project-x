import { Head, Link, router } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  CheckSquare, 
  FolderOpen, 
  ArrowRight,
  LogOut
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'

interface DashboardStats {
  notes: number
  todos: number
  projects: number
  bookmarks: number
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({ notes: 0, todos: 0, projects: 0, bookmarks: 0 })
  const [isLoading, setIsLoading] = useState(true)

  // Handle OAuth token from URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      
      if (token) {
        // Store the token
        localStorage.setItem('auth_token', token)
        
        // Clean up URL
        window.history.replaceState({}, '', '/dashboard')
      }
    }
  }, [])

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        
        // Use manual fetch calls to get real-time data
        const notesResponse = await fetch('/api/v1/notes?perPage=1', {
          headers: { 
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'include'
        })
        
        if (!notesResponse.ok) {
          throw new Error(`Notes API error: ${notesResponse.status}`)
        }
        const notesData = await notesResponse.json()
        
        const todosResponse = await fetch('/api/v1/todos?perPage=1', {
          headers: { 
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'include'
        })
        
        if (!todosResponse.ok) {
          throw new Error(`Todos API error: ${todosResponse.status}`)
        }
        const todosData = await todosResponse.json()
        
        const projectsResponse = await fetch('/api/v1/projects?perPage=1', {
          headers: { 
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'include'
        })
        
        if (!projectsResponse.ok) {
          throw new Error(`Projects API error: ${projectsResponse.status}`)
        }
        const projectsData = await projectsResponse.json()
        
        // For bookmarks, we'll use a fallback since the API might not be ready yet
        let bookmarksData = { meta: { total: 0 } }
        try {
          const bookmarksResponse = await fetch('/api/v1/bookmarks?perPage=1', {
            headers: { 
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
          })
          
          if (bookmarksResponse.ok) {
            bookmarksData = await bookmarksResponse.json()
          }
        } catch (bookmarkError) {
          console.log('Bookmarks API not ready yet, using fallback:', bookmarkError.message)
        }
        
        setStats({
          notes: notesData.meta?.total || 0,
          todos: todosData.meta?.total || 0,
          projects: projectsData.meta?.total || 0,
          bookmarks: bookmarksData.meta?.total || 0
        })
        
        console.log('Final stats:', {
          notes: notesData.meta?.total || 0,
          todos: todosData.meta?.total || 0,
          projects: projectsData.meta?.total || 0,
          bookmarks: bookmarksData.meta?.total || 0
        })
        
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        // Set fallback stats on error
        setStats({
          notes: 0,
          todos: 0,
          projects: 0,
          bookmarks: 0
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const handleLogout = () => {
    // Clear any OAuth tokens stored in dashboard
    localStorage.removeItem('auth_token')
    
    // Call the main logout function
    logout()
    
    // Use router.visit to home page instead of login
    router.visit('/')
  }

  return (
    <>
      <Head title="Dashboard - Race Track" />
      <div className="min-h-screen bg-[#1C1C1E] text-white">
        {/* Header */}
        <header className="bg-[#2C2C2E] border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400 mt-2">Welcome back, {user?.fullName || 'User'}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-400">Today</p>
                  <p className="text-lg font-semibold text-white">{new Date().toLocaleDateString()}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card variant="dashboard" size="default">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Notes</p>
                    <p className="text-2xl font-bold text-white">
                      {isLoading ? '...' : stats.notes}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="dashboard" size="default">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Projects</p>
                    <p className="text-2xl font-bold text-white">
                      {isLoading ? '...' : stats.projects}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500 rounded-lg">
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="dashboard" size="default">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Active Todos</p>
                    <p className="text-2xl font-bold text-white">
                      {isLoading ? '...' : stats.todos}
                    </p>
                  </div>
                  <div className="p-3 bg-green-500 rounded-lg">
                    <CheckSquare className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="dashboard" size="default">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Bookmarks</p>
                    <p className="text-2xl font-bold text-white">
                      {isLoading ? '...' : stats.bookmarks}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-500 rounded-lg">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/notes">
              <Card variant="dashboard" size="default">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Notes</h3>
                      <p className="text-gray-400">Create and manage your notes</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/projects">
              <Card variant="dashboard" size="default">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Projects</h3>
                      <p className="text-gray-400">Track your project progress</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/todos">
              <Card variant="dashboard" size="default">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Todos</h3>
                      <p className="text-gray-400">Manage your daily tasks</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/bookmarks">
              <Card variant="dashboard" size="default">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Bookmarks</h3>
                      <p className="text-gray-400">Save and organize your links with AI</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </main>
      </div>
    </>
  )
}
