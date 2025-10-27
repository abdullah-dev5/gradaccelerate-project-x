import { Head, router } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { TodoCard } from './TodoCard'
import { TodoForm } from './TodoForm'
import { useToast } from '../../hooks/useToast'
import { TodosSearchFilter } from '../../components/TodosSearchFilter'
import { TodoPriority, TodoStatus } from '../../stores/todos_store'
import Header from '../../components/Header'

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

  // Note: Authentication is handled by backend middleware, no frontend check needed

  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Extract the actual todos array from paginated data
  const todosList = todos?.data || []



  const handleToggleStatus = async (todoId: number) => {
    try {
      // Use Inertia.js router.patch for proper navigation and state management
      await router.patch(`/todos/${todoId}/complete`)
      showToast('Todo status updated successfully!', 'success')
    } catch (error) {
      console.error('Failed to toggle todo status:', error)
      showToast('Could not update todo status', 'error')
    }
  }

  const handleDelete = async (todoId: number, todoTitle: string) => {
    try {
      const { default: Swal } = await import('sweetalert2')
      
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `You are about to delete "${todoTitle}". This action cannot be undone!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', // red-500
        cancelButtonColor: '#6b7280', // gray-500
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        background: '#2C2C2E',
        color: '#ffffff',
        customClass: {
          popup: 'dark-popup',
          title: 'dark-title',
          confirmButton: 'dark-confirm-button',
          cancelButton: 'dark-cancel-button'
        }
      })

      if (result.isConfirmed) {
        // Use Inertia.js router.delete for proper navigation and state management
        await router.delete(`/todos/${todoId}`)
        showToast(`"${todoTitle}" has been successfully deleted`, 'success')
      }
    } catch (error) {
      console.error('Error deleting todo:', error)
      showToast('Failed to delete todo', 'error')
    }
  }

  const handleEdit = (todo: Todo) => {
    setEditingId(todo.id)
  }

  const handleEditCancel = () => {
    setEditingId(null)
  }

  const handleUpdate = (_id: number, _updates: Partial<Todo>) => {
    // This will be handled by the TodoForm component
  }

  const handleEditSuccess = () => {
    setEditingId(null)
    showToast('Todo updated successfully!', 'success')
    
    // Refresh data using Inertia.js
    router.visit('/todos')
  }

  const handleCreateSuccess = () => {
    setIsCreating(false)
    showToast('Todo created successfully!', 'success')
    
    // Refresh data using Inertia.js
    router.visit('/todos')
  }


  // Use Inertia.js data directly instead of store
  const currentTodos = todosList
  const hasTodos = currentTodos.length > 0

  return (
    <>
      <Head title="Todos" />
      
      <Header 
        title="Todos" 
        subtitle={`${currentTodos.length} ${currentTodos.length === 1 ? 'todo' : 'todos'} total`}
        showBackButton={true}
        backHref="/dashboard"
      />

      <div className="min-h-screen bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E]">
        {/* Header Actions */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/25"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Todo</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 pb-8">
          {/* Filters */}
          <div className="mb-6 bg-[#2C2C2E]/50 backdrop-blur-sm border border-[#3A3A3C]/50 rounded-2xl p-4 sm:p-6">
            <TodosSearchFilter 
              labels={allLabels} 
            />
          </div>

          {/* Error State */}
          {error && (
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
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Todos List */}
          {(
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
                  >
                    <TodoForm
                      todoId={todo.id}
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
                    />
                  </TodoCard>
                ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-12 sm:py-16">
                  <div className="max-w-md mx-auto px-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <svg className="h-10 w-10 sm:h-12 sm:w-12 text-[#98989D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No todos yet</h3>
                    <p className="text-sm sm:text-base text-[#98989D] mb-4 sm:mb-6">Get started by creating your first todo.</p>
                    <button
                      onClick={() => setIsCreating(true)}
                      className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium text-sm sm:text-base"
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
          {hasTodos && todos?.meta && todos.meta.total > todos.meta.per_page && (
            <div className="mt-6 sm:mt-8 w-full">
              <div className="flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-[#2C2C2E]/50 backdrop-blur-sm border border-[#3A3A3C]/50 rounded-2xl">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-[#98989D]">
                  <span>Page</span>
                  <span className="font-semibold text-white">{todos.meta.current_page}</span>
                  <span>of</span>
                  <span className="font-semibold text-white">{Math.ceil(todos.meta.total / todos.meta.per_page)}</span>
                  <span className="mx-1 sm:mx-2">•</span>
                  <span className="font-semibold text-white">{todos.meta.total}</span>
                  <span>todos</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => router.get('/todos', { page: todos.meta.current_page - 1 })}
                    disabled={todos.meta.current_page === 1}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm ${
                      todos.meta.current_page === 1
                        ? 'bg-[#2C2C2E] text-[#98989D] cursor-not-allowed'
                        : 'bg-[#3A3A3C] text-white hover:bg-[#48484A]'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  
                  <span className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-[#98989D]">
                    {todos.meta.current_page} / {Math.ceil(todos.meta.total / todos.meta.per_page)}
                  </span>
                  
                  <button
                    onClick={() => router.get('/todos', { page: todos.meta.current_page + 1 })}
                    disabled={todos.meta.current_page >= Math.ceil(todos.meta.total / todos.meta.per_page)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm ${
                      todos.meta.current_page >= Math.ceil(todos.meta.total / todos.meta.per_page)
                        ? 'bg-[#2C2C2E] text-[#98989D] cursor-not-allowed'
                        : 'bg-[#3A3A3C] text-white hover:bg-[#48484A]'
                    }`}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
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