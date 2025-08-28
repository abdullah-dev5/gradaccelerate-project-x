import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiService, ApiResponse, ApiError } from '../services/api'

export interface Note {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt: string | null
  pinned: boolean
  imageUrl: string | null
  gif_url?: string | null
  gif_slug?: string | null
  labels?: { id: number; name: string; color?: string }[]
  userId: number
}

// Normalized state structure for better performance
export interface NotesState {
  // Normalized data storage
  byId: Record<number, Note>
  allIds: number[]

  // UI state
  filteredIds: number[]
  searchQuery: string
  selectedLabels: number[]
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
  fetchNotes: (page?: number, perPage?: number) => Promise<void>
  fetchNote: (id: number) => Promise<Note | null>

  // CRUD operations
  createNote: (noteData: Partial<Note>) => Promise<Note | null>
  updateNote: (id: number, updates: Partial<Note>) => Promise<Note | null>
  deleteNote: (id: number) => Promise<boolean>
  togglePin: (id: number) => Promise<boolean>

  // UI actions
  setSearchQuery: (query: string) => void
  setSelectedLabels: (labels: number[]) => void
  clearFilters: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Internal helpers
  applyFilters: () => void
  normalizeNotes: (notes: Note[]) => void
  getNoteById: (id: number) => Note | undefined
  getFilteredNotes: () => Note[]
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      // Initial state
      byId: {},
      allIds: [],
      filteredIds: [],
      searchQuery: '',
      selectedLabels: [],
      isLoading: false,
      error: null,
      pagination: {
        currentPage: 1,
        perPage: 10,
        total: 0,
        hasMore: false,
      },

      // Data fetching methods
      fetchNotes: async (page = 1, perPage = 10, search?: string, labels?: number[], sortBy?: string, sortOrder?: string) => {
        try {
          set({ isLoading: true, error: null })

          const params: any = {
            page,
            per_page: perPage,
            sort: sortBy || 'created_at',
            order: sortOrder || 'desc',
          }

          if (search) {
            params.search = search
          }

          if (labels && labels.length > 0) {
            params.labels = labels.join(',')
          }

          const response = await apiService.get<Note[]>('/notes', params)

          // Handle both direct response and wrapped response
          let notes: Note[]
          let meta: any = {}
          
          if (Array.isArray(response.data)) {
            // Direct array response
            notes = response.data
          } else if (response.data && Array.isArray(response.data.data)) {
            // Wrapped response: { data: [], meta: {} }
            notes = response.data.data
            meta = response.data.meta || {}
          } else if (response.data && Array.isArray(response.data.notes)) {
            // Alternative wrapped response: { notes: [], meta: {} }
            notes = response.data.notes
            meta = response.data.meta || {}
          } else {
            throw new Error('Invalid response format')
          }

          // Ensure all notes have the required fields, including GIF data
          const normalizedNotes = notes.map(note => ({
            id: note.id,
            title: note.title,
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            pinned: note.pinned,
            imageUrl: note.imageUrl,
            gif_url: note.gif_url || null,
            gif_slug: note.gif_slug || null,
            labels: note.labels || [],
            userId: note.userId,
          }))

          get().normalizeNotes(normalizedNotes)

          set({
            pagination: {
              currentPage: page,
              perPage,
              total: meta.total || notes.length,
              hasMore: meta.current_page < meta.last_page,
            },
            isLoading: false,
            error: null,
          })
        } catch (error) {
          const apiError = error as ApiError
          set({
            error: apiError.message || 'Failed to fetch notes',
            isLoading: false,
          })
        }
      },

      fetchNote: async (id: number) => {
        try {
          const response = await apiService.get<Note>(`/notes/${id}`)
          const note = response.data

          if (note) {
            set((state) => ({
              byId: { ...state.byId, [note.id]: note },
              allIds: state.allIds.includes(note.id) ? state.allIds : [...state.allIds, note.id],
            }))
          }

          return note || null
        } catch (error) {
          const apiError = error as ApiError
          set({ error: apiError.message || 'Failed to fetch note' })
          return null
        }
      },

      // CRUD operations with optimistic updates
      createNote: async (noteData: Partial<Note>) => {
        try {
          set({ isLoading: true, error: null })

          const response = await apiService.post<Note>('/notes', noteData)
          
          // Handle both direct response and wrapped response
          let newNote: Note
          if (response.data && 'id' in response.data) {
            // Direct note response
            newNote = response.data
          } else if (response.data && 'note' in response.data) {
            // Wrapped response: { message, note }
            newNote = response.data.note
          } else {
            throw new Error('Invalid response format')
          }

          if (newNote) {
            // Ensure all fields are properly set, including GIF data
            const completeNote: Note = {
              id: newNote.id,
              title: newNote.title,
              content: newNote.content,
              createdAt: newNote.createdAt,
              updatedAt: newNote.updatedAt,
              pinned: newNote.pinned,
              imageUrl: newNote.imageUrl,
              gif_url: newNote.gif_url || noteData.gif_url || null,
              gif_slug: newNote.gif_slug || noteData.gif_slug || null,
              labels: newNote.labels || noteData.labels || [],
              userId: newNote.userId,
            }

            set((state) => ({
              byId: { ...state.byId, [completeNote.id]: completeNote },
              allIds: [completeNote.id, ...state.allIds],
            }))
            get().applyFilters()
          }

          return newNote || null
        } catch (error) {
          const apiError = error as ApiError
          set({
            error: apiError.message || 'Failed to create note',
            isLoading: false,
          })
          return null
        } finally {
          set({ isLoading: false })
        }
      },

      updateNote: async (id: number, updates: Partial<Note>) => {
        try {
          // Optimistic update
          const currentNote = get().byId[id]
          if (currentNote) {
            set((state) => ({
              byId: { ...state.byId, [id]: { ...currentNote, ...updates } },
            }))
            get().applyFilters()
          }

          const response = await apiService.put<Note>(`/notes/${id}`, updates)
          
          // Handle both direct response and wrapped response
          let updatedNote: Note
          if (response.data && 'id' in response.data) {
            // Direct note response
            updatedNote = response.data
          } else if (response.data && 'note' in response.data) {
            // Wrapped response: { message, note }
            updatedNote = response.data.note
          } else {
            throw new Error('Invalid response format')
          }

          if (updatedNote) {
            // Ensure all fields are properly set, including GIF data
            const completeNote: Note = {
              id: updatedNote.id,
              title: updatedNote.title,
              content: updatedNote.content,
              createdAt: updatedNote.createdAt,
              updatedAt: updatedNote.updatedAt,
              pinned: updatedNote.pinned,
              imageUrl: updatedNote.imageUrl,
              gif_url: updatedNote.gif_url || updates.gif_url || currentNote?.gif_url || null,
              gif_slug: updatedNote.gif_slug || updates.gif_slug || currentNote?.gif_slug || null,
              labels: updatedNote.labels || updates.labels || currentNote?.labels || [],
              userId: updatedNote.userId,
            }

            set((state) => ({
              byId: { ...state.byId, [id]: completeNote },
            }))
            get().applyFilters()
          }

          return updatedNote || null
        } catch (error) {
          // Revert optimistic update on error
          if (currentNote) {
            set((state) => ({
              byId: { ...state.byId, [id]: currentNote },
            }))
            get().applyFilters()
          }

          const apiError = error as ApiError
          set({ error: apiError.message || 'Failed to update note' })
          return null
        }
      },

      deleteNote: async (id: number) => {
        try {
          // Optimistic update
          const currentNote = get().byId[id]
          if (currentNote) {
            set((state) => ({
              byId: {
                ...state.byId,
                [id]: { ...currentNote, deletedAt: new Date().toISOString() },
              },
            }))
            get().applyFilters()
          }

          await apiService.delete(`/notes/${id}`)

          // Remove from state
          set((state) => {
            const { [id]: deleted, ...remainingNotes } = state.byId
            return {
              byId: remainingNotes,
              allIds: state.allIds.filter((noteId) => noteId !== id),
            }
          })
          get().applyFilters()

          return true
        } catch (error) {
          // Revert optimistic update on error
          if (currentNote) {
            set((state) => ({
              byId: { ...state.byId, [id]: currentNote },
            }))
            get().applyFilters()
          }

          const apiError = error as ApiError
          set({ error: apiError.message || 'Failed to delete note' })
          return false
        }
      },

      togglePin: async (id: number) => {
        try {
          const currentNote = get().byId[id]
          if (!currentNote) return false

          // Optimistic update - immediately update UI
          set((state) => ({
            byId: { ...state.byId, [id]: { ...currentNote, pinned: !currentNote.pinned } },
          }))
          
          // Apply filters to update the view
          get().applyFilters()

          // Make API call
          const response = await apiService.patch(`/notes/${id}/pin`)
          
          if (response.success) {
            return true
          } else {
            // Revert optimistic update on API failure
            set((state) => ({
              byId: { ...state.byId, [id]: currentNote },
            }))
            get().applyFilters()
            return false
          }
        } catch (error) {
          // Revert optimistic update on error
          const currentNote = get().byId[id]
          if (currentNote) {
            set((state) => ({
              byId: { ...state.byId, [id]: { ...currentNote, pinned: !currentNote.pinned } },
            }))
            get().applyFilters()
          }

          const apiError = error as ApiError
          set({ error: apiError.message || 'Failed to toggle pin' })
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

      clearFilters: () => {
        set({ searchQuery: '', selectedLabels: [] })
        get().applyFilters()
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Internal helpers
      applyFilters: () => {
        const { byId, allIds, searchQuery, selectedLabels } = get()

        let filtered = allIds

        // Apply search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter((id) => {
            const note = byId[id]
            return (
              note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query)
            )
          })
        }

        // Apply label filter
        if (selectedLabels.length > 0) {
          filtered = filtered.filter((id) => {
            const note = byId[id]
            return note.labels?.some((label) => selectedLabels.includes(label.id))
          })
        }

        set({ filteredIds: filtered })
      },

      normalizeNotes: (notes: Note[]) => {
        const byId: Record<number, Note> = {}
        const allIds: number[] = []

        notes.forEach((note) => {
          byId[note.id] = note
          allIds.push(note.id)
        })

        set({ byId, allIds })
      },

      getNoteById: (id: number) => get().byId[id],

      getFilteredNotes: () => {
        const { byId, filteredIds } = get()
        return filteredIds.map((id) => byId[id]).filter(Boolean)
      },
    }),
    {
      name: 'notes-store',
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedLabels: state.selectedLabels,
        pagination: state.pagination,
      }),
    }
  )
)
