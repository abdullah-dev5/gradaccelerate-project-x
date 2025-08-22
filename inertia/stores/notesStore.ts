import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Note {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt: string | null
  pinned: boolean
  imageUrl: string | null
  labels?: { id: number; name: string; color?: string }[]
}

export interface NotesState {
  notes: Note[]
  filteredNotes: Note[]
  searchQuery: string
  selectedLabels: number[]
  isLoading: boolean
  error: string | null
  
  // Actions
  setNotes: (notes: Note[]) => void
  setSearchQuery: (query: string) => void
  setSelectedLabels: (labels: number[]) => void
  addNote: (note: Note) => void
  updateNote: (id: number, updates: Partial<Note>) => void
  deleteNote: (id: number) => void
  togglePin: (id: number) => void
  clearFilters: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      filteredNotes: [],
      searchQuery: '',
      selectedLabels: [],
      isLoading: false,
      error: null,

      setNotes: (notes) => {
        set({ notes, filteredNotes: notes })
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

      addNote: (note) => {
        const newNotes = [note, ...get().notes]
        set({ notes: newNotes })
        get().applyFilters()
      },

      updateNote: (id, updates) => {
        const updatedNotes = get().notes.map(note =>
          note.id === id ? { ...note, ...updates } : note
        )
        set({ notes: updatedNotes })
        get().applyFilters()
      },

      deleteNote: (id) => {
        const filteredNotes = get().notes.filter(note => note.id !== id)
        set({ notes: filteredNotes })
        get().applyFilters()
      },

      togglePin: (id) => {
        const updatedNotes = get().notes.map(note =>
          note.id === id ? { ...note, pinned: !note.pinned } : note
        )
        set({ notes: updatedNotes })
        get().applyFilters()
      },

      clearFilters: () => {
        set({ searchQuery: '', selectedLabels: [] })
        get().applyFilters()
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      applyFilters: () => {
        const { notes, searchQuery, selectedLabels } = get()
        
        let filtered = notes

        // Apply search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(note =>
            note.title.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query)
          )
        }

        // Apply label filter
        if (selectedLabels.length > 0) {
          filtered = filtered.filter(note =>
            note.labels?.some(label => selectedLabels.includes(label.id))
          )
        }

        set({ filteredNotes: filtered })
      }
    }),
    {
      name: 'notes-store',
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedLabels: state.selectedLabels,
      }),
    }
  )
)
