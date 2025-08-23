import { Head, Link, router, useForm } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import React from 'react'
import { TodoCard } from './TodoCard'
import { TodoForm } from './TodoForm'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/Toast'
import { TodosSearchFilter } from '../../components/TodosSearchFilter'
import { TodoPriority, TodoStatus } from '../../stores/todosStore'
import { Card, CardContent } from '../../components/ui/card'

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
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const { toasts, removeToast, success, error: toastError } = useToast()

  // Extract the actual todos array from paginated data
  const todosList = todos?.data || []

  // Remove all useForm and form state for create/edit

  const handleToggleStatus = async (todoId: number) => {
    try {
      const response = await fetch(`/todos/${todoId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Explicitly NOT including 'X-Inertia' header to get JSON response
        },
      })
      
      if (response.ok) {
        await response.json()
        success('Todo status updated', 'Todo status has been successfully changed')
        // Reload the page to get updated data
        router.reload({ only: ['todos'] })
      } else {
        throw new Error('Failed to toggle status')
      }
    } catch (error) {
      console.error('Failed to toggle todo status:', error)
      toastError('Failed to update status', 'Could not change todo status')
    }
  }

  const handleDelete = (todoId: number, todoTitle: string) => {
    if (confirm(`Are you sure you want to delete "${todoTitle}"?`)) {
      router.delete(`/todos/${todoId}`, {
        onSuccess: () => {
          success('Todo deleted', `"${todoTitle}" has been successfully deleted`)
        },
        onError: (errors: any) => {
          console.error('Failed to delete todo:', errors)
          toastError('Failed to delete todo', 'Could not delete the todo item')
        }
      })
    }
  }

  // Remove all form change/submit/cancel handlers for create/edit
  const handleEditStart = (todo: Todo) => {
    setEditingId(todo.id)
  }
  const handleEditCancel = () => {
    setEditingId(null)
  }

  const handleTodoUpdate = async (id: number, updates: Partial<Todo>) => {
    try {
      // Show success message
      success('Todo updated', 'Priority/Status has been successfully updated');
      
      // Reload the todos data to show the updated values
      router.reload({ only: ['todos'] });
      
    } catch (error) {
      console.error('Failed to update todo:', error);
      toastError('Failed to update todo', 'Could not update the priority/status');
    }
  };

  return (
    <>
      <Head title="Todos" />
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="min-h-screen bg-[#1C1C1E] text-white">
        <div className="max-w-4xl mx-auto p-6">
          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-center gap-3"
            >
              <AlertCircle size={20} className="text-red-400" />
              <p className="text-red-400">{error}</p>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-3">
              <Link 
                href="/dashboard" 
                className="p-2 hover:bg-[#2C2C2E] rounded-full transition-colors duration-200"
              >
                <ArrowLeft size={24} />
              </Link>
              <h1 className="text-3xl font-bold">Todos</h1>
              {todos?.meta && (
                <span className="text-sm text-[#98989D] bg-[#2C2C2E] px-3 py-1 rounded-full">
                  {todos.meta.total} total
                </span>
              )}
            </div>
            <button 
              onClick={() => setIsCreating(!isCreating)}
              className="bg-[#007AFF] hover:bg-[#0056CC] px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <Plus size={20} />
              Add Todo
            </button>
          </motion.div>

          {/* Search and Filter Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card variant="default" size="default">
              <CardContent>
                <TodosSearchFilter 
                  labels={allLabels} 
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Create Form */}
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <Card variant="form" size="default">
                <CardContent>
                  <TodoForm
                    onSuccess={() => {
                      setIsCreating(false);
                      success('Todo created', 'Todo has been successfully created');
                    }}
                    onCancel={() => setIsCreating(false)}
                    submitLabel="Create"
                    allLabels={allLabels}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {todosList.length === 0 ? (
            <div className="flex items-center justify-center h-[60vh]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <Clock size={64} className="text-[#98989D] mx-auto mb-4" />
                <p className="text-2xl text-[#98989D] font-medium">
                  No todos yet
                </p>
                <p className="text-[#98989D] mt-2">
                  Create your first todo to get started
                </p>
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-3"
            >
              {todosList.map((todo, index) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card variant="interactive" size="sm">
                    <CardContent>
                      <TodoCard
                        todo={todo}
                        isEditing={editingId === todo.id}
                        onEditStart={handleEditStart}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                        onUpdate={handleTodoUpdate}
                      >
                        {editingId === todo.id && (
                          <TodoForm
                            initialData={{
                              title: todo.title,
                              description: todo.description || '',
                              isCompleted: todo.isCompleted,
                              priority: todo.priority,
                              status: todo.status,
                              labels: todo.labels || [],
                            }}
                            todoId={todo.id}
                            onCancel={handleEditCancel}
                            onSuccess={() => {
                              setEditingId(null);
                              success('Todo updated', 'Todo has been successfully updated');
                            }}
                            submitLabel="Update"
                            allLabels={allLabels}
                          />
                        )}
                      </TodoCard>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Pagination */}
        
{todos?.meta && todos.meta.last_page > 1 && (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 flex items-center justify-center gap-2"
    >
        {/* Previous Button */}
        <Link
            href={todos.meta.previous_page_url || '#'}
            className={`p-2 rounded-lg flex items-center gap-2 ${
                todos.meta.previous_page_url
                    ? 'bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white'
                    : 'bg-[#1C1C1E] text-[#98989D] cursor-not-allowed'
            }`}
            preserveState
            preserveScroll
            only={['todos', 'filters']}
            replace
        >
            <ChevronLeft size={16} />
            Previous
        </Link>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
            {Array.from({ length: todos.meta.last_page }, (_, i) => i + 1)
                .filter(page => {
                    const current = todos.meta.current_page
                    const last = todos.meta.last_page
                    return (
                        page === 1 ||
                        page === last ||
                        (page >= current - 1 && page <= current + 1)
                    )
                })
                .map((page, i, arr) => (
                    <React.Fragment key={page}>
                        {i > 0 && arr[i - 1] !== page - 1 && (
                            <span className="px-2 text-[#98989D]">...</span>
                        )}
                        <Link
                            href={`/todos?page=${page}`}
                            className={`px-3 py-1 rounded ${
                                page === todos.meta.current_page
                                    ? 'bg-[#007AFF] text-white'
                                    : 'bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#98989D] hover:text-white'
                            }`}
                            preserveState
                            preserveScroll
                            only={['todos', 'filters']}
                            replace
                        >
                            {page}
                        </Link>
                    </React.Fragment>
                ))}
        </div>

        {/* Next Button */}
        <Link
            href={todos.meta.next_page_url || '#'}
            className={`p-2 rounded-lg flex items-center gap-2 ${
                todos.meta.next_page_url
                    ? 'bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white'
                    : 'bg-[#1C1C1E] text-[#98989D] cursor-not-allowed'
            }`}
            preserveState
            preserveScroll
            only={['todos', 'filters']}
            replace
        >
            Next
            <ChevronRight size={16} />
        </Link>
    </motion.div>
)}
         
        </div>
      </div>
    </>
  )
} 