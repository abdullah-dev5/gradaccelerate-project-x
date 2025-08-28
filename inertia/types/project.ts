export interface Project {
  id: number
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed'
  userId: number
  createdAt: string
  updatedAt: string
}

export type ProjectPagination = {
  data: Project[]
  meta: {
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
}

export interface ProjectFormData {
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed'
}

export type ProjectStatus = 'pending' | 'in_progress' | 'completed'

export const StatusColors = {
  pending: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  in_progress: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  completed: 'bg-green-400/10 text-green-400 border-green-400/20',
} as const

export const StatusLabels = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
} as const
