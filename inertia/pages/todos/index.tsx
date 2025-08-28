import { Head, Link, router, useForm } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import React from 'react'
import { TodoCard } from './TodoCard'
import { TodoForm } from './TodoForm'
import { useToast } from '../../hooks/useToast'
import { TodosSearchFilter } from '../../components/TodosSearchFilter'
import { TodoPriority, TodoStatus, useTodosStore } from '../../stores/todos_store'
import { Card, CardContent } from '../../components/ui/card'
import { useAuth } from '../../contexts/AuthContext'

interface Todo {
  id: number
  title: string
  description: string | null
  isCompleted: boolean
  userId: number
  createdAt: string
  updatedAt: string
  priority: TodoPriority
  status: TodoStatus
  labels?: { id: number; name: string; color?: string }[]
}

// Update your interface to match exactly what the backend sends
interface PaginationMeta {
  total: number
  per_page: number
  current_page: number
  last_page: number
  first_page: number
  first_page_url: string | null
  last_page_url: string | null
  next_page_url: string | null
  previous_page_url: string | null
}

interface PaginatedTodos {
  data: Todo[]
  meta: PaginationMeta
}

interface TodosProps {
  todos: PaginatedTodos
  filters?: {
    status?: string
    search?: string
    page?: number
    limit?: number
  }
  error?: string
}

import { allLabels } from '../../components/Label';

export default function Todos({ todos, error }: TodosProps) {
  const { showToast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const { 
    allIds,
    filteredIds,
    isLoading, 
    error: storeError, 
    pagination,
    fetchTodos,
    setSearchQuery,
    setSelectedLabels,
    setSelectedStatuses,
    clearFilters,
    getFilteredTodos,
    toggleStatus,
    deleteTodo
  } = useTodosStore()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login')
      router.visit('/login')
    }
  }, [isAuthenticated])

  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Extract the actual todos array from paginated data
  const todosList = todos?.data || []

  // Initialize store with initial data
  useEffect(() => {
    console.log('Todos Index - Initial Data:', { todos, todosList })
    if (todosList.length > 0) {
      // Initialize the store with the initial data from the backend
      console.log('Initializing todos store with:', todosList)
      useTodosStore.getState().normalizeTodos(todosList)
    } else {
      console.log('No initial todos found, fetching manually...')
      // Always fetch manually to ensure we have data
      fetchTodos(1, 10)
    }
  }, [todosList, todos, fetchTodos])

  // Debug store state
  useEffect(() => {
    const storeState = useTodosStore.getState()
    console.log('Todos Store State:', {
      allIds: storeState.allIds,
      byId: storeState.byId,
      filteredIds: storeState.filteredIds,
      pagination: storeState.pagination
    })
  }, [allIds, filteredIds, pagination])

  // Always fetch data on mount to ensure we have data
  useEffect(() => {
    console.log('Component mounted, fetching todos...')
    console.log('Auth status:', { isAuthenticated, user })
    fetchTodos(1, 10)
  }, [fetchTodos, isAuthenticated, user])

  // Simple test to see what's happening
  console.log('Todos Index Render:', {
    todos,
    todosList,
    isAuthenticated,
    user,
    allIds,
    filteredIds,
    isLoading,
    error: storeError
  })


  const handleToggleStatus = async (todoId: number) => {
    try {
      console.log('handleToggleStatus called with todoId:', todoId)
      
      // Optimistic update - immediately update the UI
      const currentTodos = useTodosStore.getState().byId
      const currentTodo = currentTodos[todoId]
      
      console.log('Current todo from store:', currentTodo)
      
      if (currentTodo) {
        const updatedTodo = { ...currentTodo, isCompleted: !currentTodo.isCompleted }
        console.log('Updated todo:', updatedTodo)
        
        useTodosStore.setState(state => ({
          byId: { ...state.byId, [todoId]: updatedTodo }
        }))
      }
      
      console.log('Calling toggleStatus from store...')
      const success = await toggleStatus(todoId)
      console.log('toggleStatus result:', success)
      
      if (success) {
        showToast('Todo status updated successfully!', 'success')
        // No need to refresh since we already updated the UI optimistically
      } else {
        // Revert optimistic update on failure
        if (currentTodo) {
          useTodosStore.setState(state => ({
            byId: { ...state.byId, [todoId]: currentTodo }
          }))
        }
        showToast('Failed to update todo status', 'error')
      }
    } catch (error) {
      console.error('Error in handleToggleStatus:', error)
      
      // Revert optimistic update on error
      const currentTodos = useTodosStore.getState().byId
      const currentTodo = currentTodos[todoId]
      if (currentTodo) {
        useTodosStore.setState(state => ({
          byId: { ...state.byId, [todoId]: { ...currentTodo, isCompleted: !currentTodo.isCompleted } }
        }))
      }
      
      console.error('Failed to toggle todo status:', error)
      showToast('Could not update todo status', 'error')
    }
  }

  const handleDelete = async (todoId: number, todoTitle: string) => {
    if (confirm(`Are you sure you want to delete "${todoTitle}"?`)) {
      try {
        // Optimistic update - immediately remove from UI
        const currentTodos = useTodosStore.getState().byId
        const currentTodo = currentTodos[todoId]
        
        if (currentTodo) {
          useTodosStore.setState(state => {
            const { [todoId]: deleted, ...remainingTodos } = state.byId
            return {
              byId: remainingTodos,
              allIds: state.allIds.filter(id => id !== todoId)
            }
          })
        }
        
        const success = await deleteTodo(todoId)
        if (success) {
          showToast(`"${todoTitle}" has been successfully deleted`, 'success')
          // No need to refresh since we already updated the UI optimistically
        } else {
          // Revert optimistic update on failure
          if (currentTodo) {
            useTodosStore.setState(state => ({
              byId: { ...state.byId, [todoId]: currentTodo },
              allIds: [...state.allIds, todoId].sort((a, b) => a - b)
            }))
          }
          showToast('Failed to delete todo', 'error')
        }
      } catch (error) {
        // Revert optimistic update on error
        const currentTodos = useTodosStore.getState().byId
        const currentTodo = currentTodos[todoId]
        if (currentTodo) {
          useTodosStore.setState(state => ({
            byId: { ...state.byId, [todoId]: currentTodo },
            allIds: [...state.allIds, todoId].sort((a, b) => a - b)
          }))
        }
        
        console.error('Failed to delete todo:', error)
        showToast('Could not delete the todo item', 'error')
      }
    }
  }

  const handleEdit = (todo: Todo) => {
    setEditingId(todo.id)
  }

  const handleEditCancel = () => {
    setEditingId(null)
  }

  const handleUpdate = (id: number, updates: Partial<Todo>) => {
    // Immediately update the store state for optimistic updates
    const currentTodos = useTodosStore.getState().byId
    const currentTodo = currentTodos[id]
    
    if (currentTodo) {
      const updatedTodo = { ...currentTodo, ...updates }
      useTodosStore.setState(state => ({
        byId: { ...state.byId, [id]: updatedTodo }
      }))
    }
  }

  const handleEditSuccess = () => {
    setEditingId(null)
    showToast('Todo updated successfully!', 'success')
    
    // Refresh data to show the updated todo
    fetchTodos(pagination.currentPage, pagination.perPage)
  }

  const handleCreateSuccess = () => {
    setIsCreating(false)
    showToast('Todo created successfully!', 'success')
    
    // Refresh data to show the new todo
    fetchTodos(pagination.currentPage, pagination.perPage)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    
    // Use manual fetching for search to ensure it works properly
    fetchTodos(1, pagination.perPage)
  }

  const handleLabelSelect = (labelIds: number[]) => {
    setSelectedLabels(labelIds)
    
    // Use manual fetching for label filtering to ensure it works properly
    fetchTodos(1, pagination.perPage)
  }

  const handleStatusFilter = (status: TodoStatus | 'all') => {
    if (status === 'all') {
      setSelectedStatuses([])
    } else {
      setSelectedStatuses([status])
    }
    
    // Use manual fetching for status filtering to ensure it works properly
    fetchTodos(1, pagination.perPage)
  }

  const handlePageChange = (page: number) => {
    // Use manual fetching for pagination to ensure it works properly
    fetchTodos(page, pagination.perPage)
  }

  // Get current todos to display
  const currentTodos = getFilteredTodos()
  const hasTodos = currentTodos.length > 0

  return (
    <>
      <Head title="Todos" />
      


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
                <h1 className="text-3xl font-bold text-white">Todos</h1>
                <p className="text-[#98989D] text-sm mt-1">Track your tasks and stay organized</p>
              </div>
            </div>
              
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/25"
              >
                <Plus className="w-4 h-4" />
                New Todo
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6">
          {/* Filters */}
          <div className="mb-8 bg-[#2C2C2E]/50 backdrop-blur-sm border border-[#3A3A3C]/50 rounded-2xl p-6">
            <TodosSearchFilter 
              labels={allLabels} 
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-[#98989D]">Loading todos...</span>
            </div>
          )}

          {/* Error State */}
          {(storeError || error) && (
            <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-400">
                    Error
                  </h3>
                  <div className="mt-2 text-sm text-red-400/80">
                    {storeError || error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Todos List */}
          {!isLoading && (
            <>
              {hasTodos ? (
                <div className="space-y-4">
                  <AnimatePresence>
                    {currentTodos.map((todo) => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    isEditing={editingId === todo.id}
                    onEditStart={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    onUpdate={handleUpdate}
                    onRefresh={fetchTodos}
                    currentPage={pagination.currentPage}
                    perPage={pagination.perPage}
                  >
                    <TodoForm
                      initialData={{
                        title: todo.title,
                        description: todo.description || '',
                        isCompleted: todo.isCompleted,
                        priority: todo.priority,
                        status: todo.status,
                        labels: todo.labels || []
                      }}
                      onSuccess={handleEditSuccess}
                      onCancel={handleEditCancel}
                      onRefresh={fetchTodos}
                      currentPage={pagination.currentPage}
                      perPage={pagination.perPage}
                    />
                  </TodoCard>
                ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <div className="w-24 h-24 bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="h-12 w-12 text-[#98989D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No todos yet</h3>
                    <p className="text-[#98989D] mb-6">Get started by creating your first todo.</p>
                    <button
                      onClick={() => setIsCreating(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Create Todo
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

                    {/* Pagination */}
          {!isLoading && hasTodos && pagination.total > pagination.perPage && (
            <div className="mt-8 w-full">
              <div className="flex flex-col items-center gap-4 p-6 bg-[#2C2C2E]/50 backdrop-blur-sm border border-[#3A3A3C]/50 rounded-2xl">
                <div className="flex items-center gap-2 text-sm text-[#98989D]">
                  <span>Page</span>
                  <span className="font-semibold text-white">{pagination.currentPage}</span>
                  <span>of</span>
                  <span className="font-semibold text-white">{Math.ceil(pagination.total / pagination.perPage)}</span>
                  <span className="mx-2">•</span>
                  <span className="font-semibold text-white">{pagination.total}</span>
                  <span>total todos</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      pagination.currentPage === 1
                        ? 'bg-[#2C2C2E] text-[#98989D] cursor-not-allowed'
                        : 'bg-[#3A3A3C] text-white hover:bg-[#48484A]'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>
                  
                  <span className="px-3 py-2 text-sm text-[#98989D]">
                    Page {pagination.currentPage} of {Math.ceil(pagination.total / pagination.perPage)}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= Math.ceil(pagination.total / pagination.perPage)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      pagination.currentPage >= Math.ceil(pagination.total / pagination.perPage)
                        ? 'bg-[#2C2C2E] text-[#98989D] cursor-not-allowed'
                        : 'bg-[#3A3A3C] text-white hover:bg-[#48484A]'
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Todo Modal */}
        <AnimatePresence>
          {isCreating && (
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
                  <h2 className="text-xl font-semibold text-white">Create New Todo</h2>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="text-[#98989D] hover:text-white transition-colors"
                  >
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <TodoForm
                  onSuccess={handleCreateSuccess}
                  onCancel={() => setIsCreating(false)}
                  onRefresh={fetchTodos}
                  currentPage={pagination.currentPage}
                  perPage={pagination.perPage}
                  allLabels={allLabels}
                />
              </motion.div>
    </motion.div>
)}
        </AnimatePresence>
      </div>
    </>
  )
} 