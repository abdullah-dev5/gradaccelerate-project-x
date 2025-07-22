import { Head, Link, router, useForm } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, CheckCircle, Circle, Clock, Edit, Trash2, Save, X, ChevronLeft, ChevronRight, AlertCircle, Tag } from 'lucide-react'
import { useState, useEffect } from 'react'
import React from 'react'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/Toast'

interface Label {
  id: number
  name: string
  color: string
}

interface Todo {
  id: number
  title: string
  description: string | null
  isCompleted: boolean
  userId: number
  createdAt: string
  updatedAt: string
  labels: Label[]
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

export default function Todos({ todos, error }: TodosProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [labels, setLabels] = useState<Label[]>([])
  const { toasts, removeToast, success, error: toastError } = useToast()

  // Extract the actual todos array from paginated data
  const todosList = todos?.data || []

  const { data: createData, setData: setCreateData, post, processing: createProcessing, errors: createErrors, reset: resetCreate } = useForm({
    title: '',
    description: '',
    isCompleted: false as boolean,
    labelIds: [] as number[],
  })

  const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
    title: '',
    description: '',
    isCompleted: false as boolean,
    labelIds: [] as number[],
  })

  // Fetch labels when component mounts
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const response = await fetch('/labels', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // Explicitly NOT including 'X-Inertia' header to get JSON response
          },
        })
        
        if (response.ok) {
          const labelsData = await response.json()
          
          // Handle both formats: direct array or wrapped in success response
          if (labelsData.success && labelsData.data) {
            setLabels(labelsData.data)
          } else if (Array.isArray(labelsData)) {
            setLabels(labelsData)
          } else {
            console.error('Unexpected labels response format:', labelsData)
          }
        } else {
          const errorText = await response.text()
          console.error('Failed to fetch labels - Status:', response.status, 'Error:', errorText)
          toastError('Failed to load labels', 'Could not fetch available labels')
        }
      } catch (error) {
        console.error('Failed to fetch labels:', error)
        toastError('Failed to load labels', 'An unexpected error occurred')
      }
    }
    
    fetchLabels()
  }, [])

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
        const result = await response.json()
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

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/todos', {
      onSuccess: () => {
        resetCreate()
        setIsCreating(false)
        success('Todo created', 'New todo has been successfully created')
      },
      onError: (errors: any) => {
        console.error('Failed to create todo:', errors)
        toastError('Failed to create todo', 'Could not create the new todo item')
      }
    })
  }

  const handleEditStart = (todo: Todo) => {
    setEditData({
      title: todo.title,
      description: todo.description || '',
      isCompleted: todo.isCompleted,
      labelIds: todo.labels?.map(l => l.id) || [],
    })
    setEditingId(todo.id)
  }

  const toggleCreateLabel = (labelId: number) => {
    setCreateData('labelIds', 
      createData.labelIds.includes(labelId)
        ? createData.labelIds.filter(id => id !== labelId)
        : [...createData.labelIds, labelId]
    )
  }

  const toggleEditLabel = (labelId: number) => {
    setEditData('labelIds', 
      editData.labelIds.includes(labelId)
        ? editData.labelIds.filter(id => id !== labelId)
        : [...editData.labelIds, labelId]
    )
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      put(`/todos/${editingId}`, {
        onSuccess: () => {
          resetEdit()
          setEditingId(null)
          success('Todo updated', 'Todo has been successfully updated')
        },
        onError: (errors: any) => {
          console.error('Failed to update todo:', errors)
          toastError('Failed to update todo', 'Could not update the todo item')
        }
      })
    }
  }

  const handleEditCancel = () => {
    setEditingId(null)
    resetEdit()
  }

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
                href="/" 
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

          {/* Create Todo Form */}
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#2C2C2E] rounded-xl p-6 mb-6"
            >
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={createData.title}
                    onChange={(e) => setCreateData('title', e.target.value)}
                    className="w-full bg-[#1C1C1E] text-white px-4 py-3 rounded-lg border border-[#3A3A3C] focus:border-[#007AFF] focus:outline-none transition-colors duration-200"
                    placeholder="Enter todo title..."
                    required
                  />
                  {createErrors.title && (
                    <p className="text-red-500 text-sm mt-1">{createErrors.title}</p>
                  )}
                </div>
                <div>
                  <textarea
                    value={createData.description}
                    onChange={(e) => setCreateData('description', e.target.value)}
                    rows={3}
                    className="w-full bg-[#1C1C1E] text-white px-4 py-3 rounded-lg border border-[#3A3A3C] focus:border-[#007AFF] focus:outline-none transition-colors duration-200 resize-none"
                    placeholder="Enter todo description..."
                  />
                </div>
                
                {/* Labels section for create form */}
                {labels.length > 0 && (
                  <div>
                    <div className="flex items-center text-[#98989D] mb-2">
                      <Tag size={16} className="mr-2" />
                      <span>Labels</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {labels.map(label => (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() => toggleCreateLabel(label.id)}
                          className={`text-xs px-3 py-1 rounded-full transition-colors ${
                            createData.labelIds.includes(label.id) 
                              ? 'opacity-100' 
                              : 'opacity-60 hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor: label.color ? `${label.color}20` : '#3A3A3C',
                            color: label.color || '#98989D',
                            border: label.color ? `1px solid ${label.color}30` : '1px solid #3A3A3C'
                          }}
                        >
                          {label.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={createData.isCompleted}
                      onChange={(e) => setCreateData('isCompleted', e.target.checked)}
                      className="w-4 h-4 text-[#007AFF] bg-[#1C1C1E] border-[#3A3A3C] rounded focus:ring-[#007AFF] focus:ring-2"
                    />
                    <label className="text-sm">Mark as completed</label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={createProcessing}
                      className="bg-[#007AFF] hover:bg-[#0056CC] disabled:bg-[#3A3A3C] px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <Save size={16} />
                      {createProcessing ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="bg-[#3A3A3C] hover:bg-[#48484A] px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
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
                  className="bg-[#2C2C2E] rounded-xl p-4 hover:bg-[#3A3A3C] transition-colors duration-200"
                >
                  {editingId === todo.id ? (
                    /* Edit Form */
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                      <div>
                        <input
                          type="text"
                          value={editData.title}
                          onChange={(e) => setEditData('title', e.target.value)}
                          className="w-full bg-[#1C1C1E] text-white px-4 py-3 rounded-lg border border-[#3A3A3C] focus:border-[#007AFF] focus:outline-none transition-colors duration-200"
                          required
                        />
                        {editErrors.title && (
                          <p className="text-red-500 text-sm mt-1">{editErrors.title}</p>
                        )}
                      </div>
                      <div>
                        <textarea
                          value={editData.description}
                          onChange={(e) => setEditData('description', e.target.value)}
                          rows={3}
                          className="w-full bg-[#1C1C1E] text-white px-4 py-3 rounded-lg border border-[#3A3A3C] focus:border-[#007AFF] focus:outline-none transition-colors duration-200 resize-none"
                        />
                      </div>
                      
                      {/* Labels section for edit form */}
                      {labels.length > 0 && (
                        <div>
                          <div className="flex items-center text-[#98989D] mb-2">
                            <Tag size={16} className="mr-2" />
                            <span>Labels</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {labels.map(label => (
                              <button
                                key={label.id}
                                type="button"
                                onClick={() => toggleEditLabel(label.id)}
                                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                                  editData.labelIds.includes(label.id) 
                                    ? 'opacity-100' 
                                    : 'opacity-60 hover:opacity-80'
                                }`}
                                style={{
                                  backgroundColor: label.color ? `${label.color}20` : '#3A3A3C',
                                  color: label.color || '#98989D',
                                  border: label.color ? `1px solid ${label.color}30` : '1px solid #3A3A3C'
                                }}
                              >
                                {label.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={editData.isCompleted}
                            onChange={(e) => setEditData('isCompleted', e.target.checked)}
                            className="w-4 h-4 text-[#007AFF] bg-[#1C1C1E] border-[#3A3A3C] rounded focus:ring-[#007AFF] focus:ring-2"
                          />
                          <label className="text-sm">Mark as completed</label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={editProcessing}
                            className="bg-[#007AFF] hover:bg-[#0056CC] disabled:bg-[#3A3A3C] px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                          >
                            <Save size={16} />
                            {editProcessing ? 'Updating...' : 'Update'}
                          </button>
                          <button
                            type="button"
                            onClick={handleEditCancel}
                            className="bg-[#3A3A3C] hover:bg-[#48484A] px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    /* Display Todo */
                    <div className="flex items-start gap-3">
                      <button 
                        onClick={() => handleToggleStatus(todo.id)}
                        className="mt-1 hover:scale-110 transition-transform duration-200"
                      >
                        {todo.isCompleted ? (
                          <CheckCircle size={20} className="text-green-500" />
                        ) : (
                          <Circle size={20} className="text-[#98989D] hover:text-green-400" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`text-lg font-medium ${todo.isCompleted ? 'line-through text-[#98989D]' : 'text-white'}`}>
                              {todo.title}
                            </h3>
                            {todo.description && (
                              <p className={`text-sm mt-1 ${todo.isCompleted ? 'line-through text-[#6D6D70]' : 'text-[#98989D]'}`}>
                                {todo.description}
                              </p>
                            )}
                            {todo.labels.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {todo.labels.map((label) => (
                                  <span
                                    key={label.id}
                                    className="px-2 py-1 text-xs rounded-full"
                                    style={{ 
                                      backgroundColor: `${label.color}20`, 
                                      color: label.color,
                                      border: `1px solid ${label.color}40`
                                    }}
                                  >
                                    {label.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-[#6D6D70] mt-2">
                              Created {new Date(todo.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleEditStart(todo)}
                              className="p-2 hover:bg-[#48484A] rounded-lg transition-colors duration-200 text-[#98989D] hover:text-white"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(todo.id, todo.title)}
                              className="p-2 hover:bg-[#48484A] rounded-lg transition-colors duration-200 text-[#98989D] hover:text-red-400"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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