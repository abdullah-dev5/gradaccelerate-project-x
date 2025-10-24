import { Head, Link } from '@inertiajs/react'
import { 
  FileText, 
  CheckSquare, 
  FolderOpen, 
  ArrowRight,
  Clock,
  Settings
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'
import { useEffect, useState } from 'react'

interface DashboardStats {
  notes: number
  todos: number
  projects: number
  bookmarks: number
  reminders: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({ notes: 0, todos: 0, projects: 0, bookmarks: 0, reminders: 0 })
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

        // For reminders
        let remindersData = { meta: { total: 0 } }
        try {
          const remindersResponse = await fetch('/reminders?limit=1', {
            headers: { 
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
          })
          
          if (remindersResponse.ok) {
            remindersData = await remindersResponse.json()
          }
        } catch (reminderError) {
          console.log('Reminders API not ready yet, using fallback:', reminderError.message)
        }
        
        setStats({
          notes: notesData.meta?.total || 0,
          todos: todosData.meta?.total || 0,
          projects: projectsData.meta?.total || 0,
          bookmarks: bookmarksData.meta?.total || 0,
          reminders: remindersData.meta?.total || 0
        })
        
        console.log('Final stats:', {
          notes: notesData.meta?.total || 0,
          todos: todosData.meta?.total || 0,
          projects: projectsData.meta?.total || 0,
          bookmarks: bookmarksData.meta?.total || 0,
          reminders: remindersData.meta?.total || 0
        })
        
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        // Set fallback stats on error
        setStats({
          notes: 0,
          todos: 0,
          projects: 0,
          bookmarks: 0,
          reminders: 0
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])


  return (
    <>
      <Head title="Dashboard - Race Track" />
      <div className="min-h-screen bg-[#1C1C1E] text-white">
        <Header 
          title="Dashboard" 
          subtitle={`Welcome back, ${user?.fullName || 'User'}!`}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card variant="dashboard" size="default">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Total Notes</p>
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
                    <p className="text-sm font-medium text-white">Projects</p>
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
                    <p className="text-sm font-medium text-white">Active Todos</p>
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
                    <p className="text-sm font-medium text-white">Bookmarks</p>
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

            <Card variant="dashboard" size="default">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Reminders</p>
                    <p className="text-2xl font-bold text-white">
                      {isLoading ? '...' : stats.reminders}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-500 rounded-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Link href="/notes">
              <Card variant="dashboard" size="default">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Notes</h3>
                      <p className="text-white">Create and manage your notes</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-white" />
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
                      <p className="text-white">Track your project progress</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-white" />
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
                      <p className="text-white">Manage your daily tasks</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-white" />
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
                      <p className="text-white">Save and organize your links with AI</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-white" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/reminders">
              <Card variant="dashboard" size="default">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Reminders</h3>
                      <p className="text-white">Set and manage your reminders</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-white" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/user/preferences">
              <Card variant="dashboard" size="default">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Preferences</h3>
                      <p className="text-white">Manage notification settings</p>
                    </div>
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </main>
        {/* Dev-only: Sentry test button */}
        {import.meta.env.MODE === 'development' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <button
              className="mt-8 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              onClick={async () => {
                try {
                  throw new Error('Frontend test error')
                } catch (e) {
                  const { frontendErrorReporter } = await import('../services/errorReporter')
                  await frontendErrorReporter.captureException(e as unknown)
                  alert('Frontend test error sent to Sentry (check Issues)')
                }
              }}
            >
              Break the world (Sentry test)
            </button>
          </div>
        )}
      </div>
    </>
  )
}
