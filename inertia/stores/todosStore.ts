import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

export interface TodosState {
  todos: Todo[]
  filteredTodos: Todo[]
  searchQuery: string
  selectedLabels: number[]
  selectedPriorities: TodoPriority[]
  selectedStatuses: TodoStatus[]
  isLoading: boolean
  error: string | null
  
  // Actions
  setTodos: (todos: Todo[]) => void
  setSearchQuery: (query: string) => void
  setSelectedLabels: (labels: number[]) => void
  setSelectedPriorities: (priorities: TodoPriority[]) => void
  setSelectedStatuses: (statuses: TodoStatus[]) => void
  addTodo: (todo: Todo) => void
  updateTodo: (id: number, updates: Partial<Todo>) => void
  deleteTodo: (id: number) => void
  toggleStatus: (id: number) => void
  clearFilters: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useTodosStore = create<TodosState>()(
  persist(
    (set, get) => ({
      todos: [],
      filteredTodos: [],
      searchQuery: '',
      selectedLabels: [],
      selectedPriorities: [],
      selectedStatuses: [],
      isLoading: false,
      error: null,

      setTodos: (todos) => {
        set({ todos, filteredTodos: todos })
        get().applyFilters()
      },

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

      addTodo: (todo) => {
        const newTodos = [todo, ...get().todos]
        set({ todos: newTodos })
        get().applyFilters()
      },

      updateTodo: (id, updates) => {
        const updatedTodos = get().todos.map(todo =>
          todo.id === id ? { ...todo, ...updates } : todo
        )
        set({ todos: updatedTodos })
        get().applyFilters()
      },

      deleteTodo: (id) => {
        const filteredTodos = get().todos.filter(todo => todo.id !== id)
        set({ todos: filteredTodos })
        get().applyFilters()
      },

      toggleStatus: (id) => {
        const updatedTodos = get().todos.map(todo =>
          todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
        )
        set({ todos: updatedTodos })
        get().applyFilters()
      },

      clearFilters: () => {
        set({ 
          searchQuery: '', 
          selectedLabels: [], 
          selectedPriorities: [], 
          selectedStatuses: [] 
        })
        get().applyFilters()
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      applyFilters: () => {
        const { todos, searchQuery, selectedLabels, selectedPriorities, selectedStatuses } = get()
        
        let filtered = todos

        // Apply search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(todo =>
            todo.title.toLowerCase().includes(query) ||
            (todo.description && todo.description.toLowerCase().includes(query))
          )
        }

        // Apply label filter
        if (selectedLabels.length > 0) {
          filtered = filtered.filter(todo =>
            todo.labels?.some(label => selectedLabels.includes(label.id))
          )
        }

        // Apply priority filter
        if (selectedPriorities.length > 0) {
          filtered = filtered.filter(todo =>
            selectedPriorities.includes(todo.priority)
          )
        }

        // Apply status filter
        if (selectedStatuses.length > 0) {
          filtered = filtered.filter(todo =>
            selectedStatuses.includes(todo.status)
          )
        }

        set({ filteredTodos: filtered })
      }
    }),
    {
      name: 'todos-store',
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedLabels: state.selectedLabels,
        selectedPriorities: state.selectedPriorities,
        selectedStatuses: state.selectedStatuses,
      }),
    }
  )
)
