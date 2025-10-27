import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiService, ApiResponse, ApiError } from '../services/api'

export type TodoPriority = 'low' | 'medium' | 'high'
export type TodoStatus = 'pending' | 'in_progress' | 'completed'

export interface Todo {
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

// Normalized state structure for better performance
export interface TodosState {
  // Normalized data storage
  byId: Record<number, Todo>
  allIds: number[]

  // UI state
  filteredIds: number[]
  searchQuery: string
  selectedLabels: number[]
  selectedPriorities: TodoPriority[]
  selectedStatuses: TodoStatus[]
  isLoading: boolean
  error: string | null

  // Pagination
  pagination: {
    currentPage: number
    perPage: number
    total: number
    hasMore: boolean
  }

  // Actions
  // Data fetching
  fetchTodos: (page?: number, perPage?: number) => Promise<void>
  fetchTodo: (id: number) => Promise<Todo | null>

  // CRUD operations
  createTodo: (todoData: Partial<Todo>) => Promise<Todo | null>
  updateTodo: (id: number, updates: Partial<Todo>) => Promise<Todo | null>
  deleteTodo: (id: number) => Promise<boolean>
  toggleStatus: (id: number) => Promise<boolean>
  updatePriorityStatus: (id: number, field: 'priority' | 'status', value: any) => Promise<boolean>

  // UI actions
  setSearchQuery: (query: string) => void
  setSelectedLabels: (labels: number[]) => void
  setSelectedPriorities: (priorities: TodoPriority[]) => void
  setSelectedStatuses: (statuses: TodoStatus[]) => void
  clearFilters: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Internal helpers
  applyFilters: () => void
  normalizeTodos: (todos: Todo[]) => void
  getTodoById: (id: number) => Todo | undefined
  getFilteredTodos: () => Todo[]
}

export const useTodosStore = create<TodosState>()(
  persist(
    (set, get) => ({
      // Initial state
      byId: {},
      allIds: [],
      filteredIds: [],
      searchQuery: '',
      selectedLabels: [],
      selectedPriorities: [],
      selectedStatuses: [],
      isLoading: false,
      error: null,
      pagination: {
        currentPage: 1,
        perPage: 10,
        total: 0,
        hasMore: false,
      },

      // Data fetching methods
      fetchTodos: async (
        page = 1,
        perPage = 10,
        search?: string,
        labels?: number[],
        statuses?: TodoStatus[],
        priorities?: TodoPriority[]
      ) => {
        try {
          set({ isLoading: true, error: null })

          const params: any = {
            page,
            per_page: perPage,
            sort: 'created_at',
            order: 'desc',
          }

          if (search) {
            params.search = search
          }

          if (labels && labels.length > 0) {
            params.labels = labels.join(',')
          }

          if (statuses && statuses.length > 0) {
            params.statuses = statuses.join(',')
          }

          if (priorities && priorities.length > 0) {
            params.priorities = priorities.join(',')
          }

          const response = await apiService.get<{ data: Todo[]; meta?: any }>('/todos', params)

          const todos = response.data?.data || response.data || []
          get().normalizeTodos(todos)

          set({
            pagination: {
              currentPage: page,
              perPage,
              total: response.meta?.total || response.data?.meta?.total || todos.length,
              hasMore:
                (response.meta?.current_page || response.data?.meta?.current_page || page) <
                (response.meta?.last_page || response.data?.meta?.last_page || 1),
            },
          })

          get().applyFilters()
        } catch (error) {
          const apiError = error as ApiError
          set({
            error: apiError.message || 'Failed to fetch todos',
            isLoading: false,
          })
        } finally {
          set({ isLoading: false })
        }
      },

      fetchTodo: async (id: number) => {
        try {
          const response = await apiService.get<{ data: Todo }>(`/todos/${id}`)
          const todo = response.data?.data || response.data

          if (todo) {
            set((state) => ({
              byId: { ...state.byId, [todo.id]: todo },
              allIds: state.allIds.includes(todo.id) ? state.allIds : [...state.allIds, todo.id],
            }))
          }

          return todo || null
        } catch (error) {
          const apiError = error as ApiError
          set({ error: apiError.message || 'Failed to fetch todo' })
          return null
        }
      },

      // CRUD operations with optimistic updates
      createTodo: async (todoData: Partial<Todo>) => {
        try {
          set({ isLoading: true, error: null })

          const response = await apiService.post<{ message: string; data: Todo }>(
            '/todos',
            todoData
          )
          const newTodo = response.data?.data || response.data

          if (newTodo) {
            set((state) => ({
              byId: { ...state.byId, [newTodo.id]: newTodo },
              allIds: [newTodo.id, ...state.allIds],
            }))
            get().applyFilters()
          }

          return newTodo || null
        } catch (error) {
          const apiError = error as ApiError
          set({
            error: apiError.message || 'Failed to create todo',
            isLoading: false,
          })
          return null
        } finally {
          set({ isLoading: false })
        }
      },

      updateTodo: async (id: number, updates: Partial<Todo>) => {
        // Get original todo for potential rollback
        const originalTodo = get().byId[id]
        if (!originalTodo) return null

        try {
          // Optimistic update
          const updatedTodo = { ...originalTodo, ...updates }
          set((state) => ({
            byId: { ...state.byId, [id]: updatedTodo },
          }))
          get().applyFilters()

          const response = await apiService.put<{ message: string; data: Todo }>(
            `/todos/${id}`,
            updates
          )
          const result = response.data?.data || response.data

          if (result) {
            set((state) => ({
              byId: { ...state.byId, [id]: result },
            }))
            get().applyFilters()
          }

          return result || null
        } catch (error) {
          // Revert optimistic update on error
          set((state) => ({
            byId: { ...state.byId, [id]: originalTodo },
          }))
          get().applyFilters()

          const apiError = error as ApiError
          set({ error: apiError.message || 'Failed to update todo' })
          return null
        }
      },

      deleteTodo: async (id: number) => {
        console.log('deleteTodo called with id:', id)
        // Get original todo for potential rollback
        const originalTodo = get().byId[id]
        if (!originalTodo) {
          console.log('No todo found with id:', id)
          return false
        }

        try {
          console.log('Attempting to delete todo:', originalTodo.title)
          // Optimistic update
          set((state) => ({
            byId: {
              ...state.byId,
              [id]: { ...originalTodo, deletedAt: new Date().toISOString() },
            },
          }))
          get().applyFilters()

          console.log('Making API delete request to:', `/todos/${id}`)
          const response = await apiService.delete(`/todos/${id}`)
          console.log('Delete API response:', response)

          // Remove from state
          set((state) => {
            const { [id]: deleted, ...remainingTodos } = state.byId
            return {
              byId: remainingTodos,
              allIds: state.allIds.filter((todoId) => todoId !== id),
            }
          })
          get().applyFilters()

          console.log('Todo deleted successfully')
          return true
        } catch (error) {
          console.error('Delete error:', error)
          // Revert optimistic update on error
          set((state) => ({
            byId: { ...state.byId, [id]: originalTodo },
          }))
          get().applyFilters()

          const apiError = error as ApiError
          console.error('API Error details:', {
            message: apiError.message,
            status: apiError.status,
            errors: apiError.errors,
          })
          set({ error: apiError.message || 'Failed to delete todo' })
          return false
        }
      },

      toggleStatus: async (id: number) => {
        try {
          console.log('toggleStatus called with id:', id)
          const originalTodo = get().byId[id]
          if (!originalTodo) {
            console.log('No todo found with id:', id)
            return false
          }

          console.log('Original todo:', originalTodo)
          console.log('Current isCompleted:', originalTodo.isCompleted)

          // Optimistic update
          set((state) => ({
            byId: {
              ...state.byId,
              [id]: { ...originalTodo, isCompleted: !originalTodo.isCompleted },
            },
          }))
          get().applyFilters()

          console.log('Sending PATCH request to:', `/todos/${id}/complete`)
          const response = await apiService.patch(`/todos/${id}/complete`)
          console.log('API response:', response)

          return true
        } catch (error) {
          console.error('Error in toggleStatus:', error)

          // Revert optimistic update on error
          const revertedTodo = get().byId[id]
          if (revertedTodo) {
            set((state) => ({
              byId: {
                ...state.byId,
                [id]: { ...revertedTodo, isCompleted: !revertedTodo.isCompleted },
              },
            }))
            get().applyFilters()
          }

          const apiError = error as ApiError
          set({ error: apiError.message || 'Failed to toggle status' })
          return false
        }
      },

      updatePriorityStatus: async (id: number, field: 'priority' | 'status', value: any) => {
        try {
          const currentTodo = get().byId[id]
          if (!currentTodo) return false

          // Optimistic update
          set((state) => ({
            byId: { ...state.byId, [id]: { ...currentTodo, [field]: value } },
          }))
          get().applyFilters()

          await apiService.patch(`/todos/${id}/priority-status`, { [field]: value })
          return true
        } catch (error) {
          // Revert optimistic update on error
          const originalTodo = get().byId[id]
          if (originalTodo) {
            set((state) => ({
              byId: { ...state.byId, [id]: originalTodo },
            }))
            get().applyFilters()
          }

          const apiError = error as ApiError
          set({ error: apiError.message || `Failed to update ${field}` })
          return false
        }
      },

      // UI actions
      setSearchQuery: (query) => {
        set({ searchQuery: query })
        get().applyFilters()
      },

      setSelectedLabels: (labels) => {
        set({ selectedLabels: labels })
        get().applyFilters()
      },

      setSelectedPriorities: (priorities) => {
        set({ selectedPriorities: priorities })
        get().applyFilters()
      },

      setSelectedStatuses: (statuses) => {
        set({ selectedStatuses: statuses })
        get().applyFilters()
      },

      clearFilters: () => {
        set({
          searchQuery: '',
          selectedLabels: [],
          selectedPriorities: [],
          selectedStatuses: [],
        })
        get().applyFilters()
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Internal helpers
      applyFilters: () => {
        const { byId, allIds, searchQuery, selectedLabels, selectedPriorities, selectedStatuses } =
          get()

        let filtered = allIds

        // Apply search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter((id) => {
            const todo = byId[id]
            return (
              todo.title.toLowerCase().includes(query) ||
              (todo.description && todo.description.toLowerCase().includes(query))
            )
          })
        }

        // Apply label filter
        if (selectedLabels.length > 0) {
          filtered = filtered.filter((id) => {
            const todo = byId[id]
            return todo.labels?.some((label) => selectedLabels.includes(label.id))
          })
        }

        // Apply priority filter
        if (selectedPriorities.length > 0) {
          filtered = filtered.filter((id) => {
            const todo = byId[id]
            return selectedPriorities.includes(todo.priority)
          })
        }

        // Apply status filter
        if (selectedStatuses.length > 0) {
          filtered = filtered.filter((id) => {
            const todo = byId[id]
            return selectedStatuses.includes(todo.status)
          })
        }

        set({ filteredIds: filtered })
      },

      normalizeTodos: (todos: Todo[]) => {
        console.log('normalizeTodos called with:', todos)
        const byId: Record<number, Todo> = {}
        const allIds: number[] = []

        todos.forEach((todo) => {
          byId[todo.id] = todo
          allIds.push(todo.id)
        })

        console.log('normalizeTodos result:', { byIdKeys: Object.keys(byId), allIds })
        set({ byId, allIds })
      },

      getTodoById: (id: number) => get().byId[id],

      getFilteredTodos: () => {
        const { byId, filteredIds } = get()
        return filteredIds.map((id) => byId[id]).filter(Boolean)
      },
    }),
    {
      name: 'todos-store',
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedLabels: state.selectedLabels,
        selectedPriorities: state.selectedPriorities,
        selectedStatuses: state.selectedStatuses,
        pagination: state.pagination,
      }),
    }
  )
)
