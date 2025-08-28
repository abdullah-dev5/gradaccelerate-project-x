import { Head, Link, router } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { PlusIcon, XIcon, ArrowLeft } from 'lucide-react'
import NoteCard from './note-card'
import NoteForm from './note-form'
import ViewSwitcher from './view-switcher'
import { NotesSearchFilter } from '../../components/NotesSearchFilter'
import { allLabels } from '../../components/Label'
import { Card, CardContent } from '../../components/ui/card'
import { useNotesStore } from '../../stores/notes_store'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../contexts/AuthContext'

interface Note {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt: string | null
  pinned: boolean
  imageUrl: string | null
  labels?: { id: number; name: string; color?: string }[]
}

interface Meta {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  firstPage: number
  firstPageUrl: string
  lastPageUrl: string
  nextPageUrl: string | null
  previousPageUrl: string | null
}

interface SortOptions {
  currentSort: string
  currentOrder: string
  searchQuery: string
}

interface Filters {
  searchQuery: string
  sortBy: 'createdAt' | 'updatedAt' | 'title'
  sortOrder: 'asc' | 'desc'
  currentPage: number
  selectedLabels: number[]
}

// Default filter values
const DEFAULT_FILTERS: Filters = {
  searchQuery: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  currentPage: 1,
  selectedLabels: []
}

export default function Index({ 
  notes: initialNotes = [], 
  meta: initialMeta,
  sortOptions 
}: { 
  notes: Note[]
  meta?: Meta
  sortOptions?: SortOptions
}) {
  const { showToast } = useToast()
  const { isAuthenticated, user } = useAuth()
  // Store is no longer needed since we're using Inertia.js data directly
  // const { 
  //   allIds,
  //   filteredIds,
  //   isLoading, 
  //   error, 
  //   pagination,
  //   fetchNotes,
  //   setSearchQuery,
  //   setSelectedLabels,
  //   clearFilters,
  //   getFilteredNotes
  // } = useNotesStore()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login')
      router.visit('/login')
    }
  }, [isAuthenticated])

  const [isFormVisible, setIsFormVisible] = useState(false)
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid')

  // Consolidated filters state with default values
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    searchQuery: sortOptions?.searchQuery || DEFAULT_FILTERS.searchQuery,
    sortBy: (sortOptions?.currentSort === 'title' ? 'title' : DEFAULT_FILTERS.sortBy),
    sortOrder: (sortOptions?.currentOrder === 'asc' ? 'asc' : DEFAULT_FILTERS.sortOrder),
    currentPage: initialMeta?.currentPage || DEFAULT_FILTERS.currentPage
  })

  // Notes are now managed by Inertia.js - no manual store initialization needed
  // The data comes directly from the backend via Inertia props

  // Use Inertia.js data directly instead of store state
  const currentNotes = initialNotes || []
  const currentMeta = initialMeta || {
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1
  }
  
  console.log('Notes Index Render:', {
    notes: currentNotes,
    meta: currentMeta,
    isAuthenticated,
    user
  })

  // Callback functions for note actions
  const handlePinToggle = async (noteId: number) => {
    try {
      // Use Inertia.js router.visit for proper navigation and state management
      await router.patch(`/notes/${noteId}/pin`)
      showToast('Note pin status updated!', 'success')
    } catch (error) {
      console.error('Error toggling pin:', error)
      showToast('Failed to update pin status', 'error')
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    if (confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      try {
        // Use Inertia.js router.delete for proper navigation and state management
        await router.delete(`/notes/${noteId}`)
        showToast('Note deleted successfully!', 'success')
      } catch (error) {
        console.error('Error deleting note:', error)
        showToast('Failed to delete note', 'error')
      }
    }
  }

  // Helper function to update filters
  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Handle search - use Inertia.js router for proper navigation
  const handleSearch = (query: string) => {
    updateFilter('searchQuery', query)
    router.get('/notes', { search: query }, { 
      preserveState: true,
      preserveScroll: true 
    })
  }

  // Handle label selection - use Inertia.js router
  const handleLabelSelect = (labelIds: number[]) => {
    updateFilter('selectedLabels', labelIds)
    router.get('/notes', { labels: labelIds.join(',') }, { 
      preserveState: true,
      preserveScroll: true 
    })
  }

  // Handle sort change - use Inertia.js router
  const handleSortChange = (sortBy: 'createdAt' | 'updatedAt' | 'title', sortOrder: 'asc' | 'desc') => {
    updateFilter('sortBy', sortBy)
    updateFilter('sortOrder', sortOrder)
    router.get('/notes', { sort: sortBy, order: sortOrder }, { 
      preserveState: true,
      preserveScroll: true 
    })
  }

  // Handle page change - use Inertia.js router
  const handlePageChange = (page: number) => {
    router.get('/notes', { page }, { 
      preserveState: true,
      preserveScroll: true 
    })
  }

  // Handle form success - redirect to notes page to refresh data
  const handleFormSuccess = (note: Note) => {
    setIsFormVisible(false)
    showToast('Note saved successfully!', 'success')
    
    // Redirect to notes page to refresh data
    router.visit('/notes')
  }

  // Get current notes to display from Inertia.js props
  const hasNotes = currentNotes.length > 0

  return (
    <>
      <Head title="Notes" />
      


      <div className="min-h-screen bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E]">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="text-[#98989D] hover:text-white transition-colors p-4 hover:bg-[#3A3A3C] rounded-xl"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">Notes</h1>
                <p className="text-[#98989D] text-sm mt-1">Organize your thoughts and ideas</p>
              </div>
            </div>
              
            <div className="flex items-center space-x-4">
              <ViewSwitcher 
                currentView={viewType} 
                onChange={setViewType}
                sortBy={filters.sortBy}
                setSortBy={(value) => updateFilter('sortBy', value)}
                sortOrder={filters.sortOrder}
                setSortOrder={(value) => updateFilter('sortOrder', value)}
                searchQuery={filters.searchQuery}
                setSearchQuery={(value) => updateFilter('searchQuery', value)}
              />
                
              <button
                onClick={() => setIsFormVisible(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/25"
              >
                <PlusIcon className="w-4 h-4" />
                New Note
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6">
          {/* Filters */}
          <div className="mb-8 bg-[#2C2C2E]/50 backdrop-blur-sm border border-[#3A3A3C]/50 rounded-2xl p-6">
            <NotesSearchFilter 
              labels={allLabels} 
            />
          </div>

          {/* Loading and error states handled by Inertia.js */}
          {/* Notes Grid/List */}
          {(
            <>
              {hasNotes ? (
                <>
                  {/* Pinned Notes Section */}
                  {currentNotes.filter(note => note.pinned).length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Pinned Notes</h2>
                        <span className="text-sm text-[#98989D] bg-[#3A3A3C] px-2 py-1 rounded-full">
                          {currentNotes.filter(note => note.pinned).length}
                        </span>
                      </div>
                      <div className={viewType === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                        <AnimatePresence>
                          {currentNotes.filter(note => note.pinned).map((note) => (
                            <motion.div
                              key={note.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.2 }}
                            >
                              <NoteCard 
                                note={note} 
                                viewType={viewType} 
                                onPinToggle={handlePinToggle}
                                onDelete={handleDeleteNote}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* Regular Notes Section */}
                  {currentNotes.filter(note => !note.pinned).length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-[#3A3A3C] rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-[#98989D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">All Notes</h2>
                        <span className="text-sm text-[#98989D] bg-[#3A3A3C] px-2 py-1 rounded-full">
                          {currentNotes.filter(note => !note.pinned).length}
                        </span>
                      </div>
                      <div className={viewType === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                        <AnimatePresence>
                          {currentNotes.filter(note => !note.pinned).map((note) => (
                            <motion.div
                              key={note.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.2 }}
                            >
                              <NoteCard 
                                note={note} 
                                viewType={viewType} 
                                onPinToggle={handlePinToggle}
                                onDelete={handleDeleteNote}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <div className="w-24 h-24 bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="h-12 w-12 text-[#98989D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No notes yet</h3>
                    <p className="text-[#98989D] mb-6">Get started by creating your first note.</p>
                    <button
                      onClick={() => setIsFormVisible(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Create Note
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

                  {/* Pagination */}
        {hasNotes && currentMeta.total > currentMeta.perPage && (
          <div className="mt-8 w-full">
            <div className="flex flex-col items-center gap-4 p-6 bg-[#2C2C2E]/50 backdrop-blur-sm border border-[#3A3A3C]/50 rounded-2xl">
              <div className="flex items-center gap-2 text-sm text-[#98989D]">
                <span>Page</span>
                <span className="font-semibold text-white">{currentMeta.currentPage}</span>
                <span>of</span>
                <span className="font-semibold text-white">{Math.ceil(currentMeta.total / currentMeta.perPage)}</span>
                <span className="mx-2">•</span>
                <span className="font-semibold text-white">{currentMeta.total}</span>
                <span>total notes</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  onClick={() => handlePageChange(currentMeta.currentPage - 1)}
                  disabled={currentMeta.currentPage === 1}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    currentMeta.currentPage === 1
                      ? 'bg-[#2C2C2E] text-[#98989D] cursor-not-allowed'
                      : 'bg-[#3A3A3C] text-white hover:bg-[#48484A]'
                  }`}
                >
                  Previous
                </button>
                
                <span className="px-3 py-2 text-sm text-[#98989D]">
                  Page {currentMeta.currentPage} of {Math.ceil(currentMeta.total / currentMeta.perPage)}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentMeta.currentPage + 1)}
                  disabled={currentMeta.currentPage >= Math.ceil(currentMeta.total / currentMeta.perPage)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    currentMeta.currentPage >= Math.ceil(currentMeta.total / currentMeta.perPage)
                      ? 'bg-[#2C2C2E] text-[#98989D] cursor-not-allowed'
                      : 'bg-[#3A3A3C] text-white hover:bg-[#48484A]'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
            </div>
            
        {/* Note Form Modal */}
                  <AnimatePresence>
          {isFormVisible && (
                      <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            >
                  <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#2C2C2E] rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#3A3A3C]"
              >
                                  <div className="flex items-center justify-between p-6 border-b border-[#3A3A3C]">
                    <h2 className="text-xl font-semibold text-white">Create New Note</h2>
                    <button
                      onClick={() => setIsFormVisible(false)}
                      className="text-[#98989D] hover:text-white transition-colors"
                    >
                      <XIcon className="w-6 h-6" />
                    </button>
                  </div>
                        
                <NoteForm
                  onSuccess={handleFormSuccess}
                  onCancel={() => setIsFormVisible(false)}
                />
              </motion.div>
                  </motion.div>
                )}
        </AnimatePresence>
      </div>
    </>
  )
} 