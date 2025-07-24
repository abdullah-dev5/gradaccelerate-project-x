import { useState, useEffect } from 'react'
import { usePage, Link, router } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Plus, ChevronLeft, ChevronRight, Home, Search, X, ArrowLeft } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/Toast'
import ProjectCard from './ProjectCard'
import { Project, StatusColors, StatusLabels, ProjectStatus, ProjectPagination } from '../../types/project'

type PageProps = {
  projects: ProjectPagination
  filters: {
    status?: ProjectStatus
    search?: string
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function ProjectIndex() {
  const [isMounted, setIsMounted] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | ''>('')
  const [searchTerm, setSearchTerm] = useState('')
  const { projects, filters } = usePage<PageProps>().props
  const { toasts, removeToast, success, error } = useToast()

  useEffect(() => {
    setIsMounted(true)
    setSelectedStatus(filters?.status || '')
    setSearchTerm(filters?.search || '')

    const interval = setInterval(() => {
      router.reload({ only: ['projects'] })
    }, 30000)

    return () => clearInterval(interval)
  }, [filters])

  const handleStatusFilter = (status: ProjectStatus | '') => {
    setSelectedStatus(status)
    router.get('/projects', { 
      status: status || undefined,
      search: searchTerm || undefined,
      page: 1
    }, {
      preserveState: true,
      preserveScroll: true
    })
  }

  const handleSearch = (search: string) => {
    setSearchTerm(search)
    router.get('/projects', { 
      status: selectedStatus || undefined,
      search: search || undefined,
      page: 1
    }, {
      preserveState: true,
      preserveScroll: true
    })
  }

  const clearSearch = () => {
    setSearchTerm('')
    router.get('/projects', { 
      status: selectedStatus || undefined,
      page: 1
    }, {
      preserveState: true,
      preserveScroll: true
    })
  }

  const goToPage = (page: number) => {
    if (projects.meta && page >= 1 && page <= projects.meta.last_page && page !== projects.meta.current_page) {
      router.get('/projects', {
        status: selectedStatus || undefined,
        search: searchTerm || undefined,
        page: page
      }, {
        preserveState: true,
        preserveScroll: true,
        only: ['projects'],
        onSuccess: () => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      })
    }
  }

  const handleStatusUpdate = (projectId: number, newStatus: ProjectStatus) => {
    router.patch(`/projects/${projectId}/status`, {
      status: newStatus
    }, {
      preserveScroll: true,
      preserveState: false,
      only: ['projects'],
      onSuccess: () => {
        success('Status Updated', 'Project status has been successfully updated.')
      },
      onError: () => {
        error('Update Failed', 'Failed to update project status.')
      }
    })
  }

  const handleDeleteProject = (projectId: number) => {
    router.delete(`/projects/${projectId}`, {
      preserveScroll: true,
      preserveState: false,
      only: ['projects'],
      onSuccess: () => {
        success('Project Deleted', 'Project has been successfully deleted.')
      },
      onError: () => {
        error('Delete Failed', 'Failed to delete the project.')
      }
    })
  }

  if (!isMounted) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[#98989D] hover:text-white transition-colors">
              <Home size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#3A3A3C] text-[#98989D] rounded opacity-50">
            <Plus size={18} />
            New Project
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-[#98989D]">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (!projects?.data || projects.data.length === 0) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[#98989D] hover:text-white transition-colors">
              <Home size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
          </div>
          <Link 
            href="/projects/create" 
            className="flex items-center gap-2 px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-500 transition-colors"
          >
            <Plus size={18} />
            New Project
          </Link>
        </div>
        
        <div className="mb-8 bg-[#2C2C2E]/50 backdrop-blur-sm border border-[#3A3A3C]/50 rounded-2xl p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#98989D] mb-2">Search Projects</label>
            <div className="relative max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#98989D]" />
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-[#1C1C1E] border border-[#3A3A3C] text-white rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#98989D] hover:text-white transition-colors p-1 hover:bg-[#3A3A3C] rounded"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#98989D] mb-2">Filter by Status</label>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleStatusFilter('')}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-200 ${
                  selectedStatus === '' 
                    ? 'bg-blue-400/20 text-blue-400 border-blue-400/40 shadow-lg shadow-blue-400/10'
                    : 'bg-[#1C1C1E] text-[#98989D] border-[#3A3A3C] hover:bg-[#3A3A3C] hover:text-white'
                }`}
              >
                All Projects
              </button>
              {Object.entries(StatusLabels).map(([status, label]) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status as ProjectStatus)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-200 ${
                    selectedStatus === status 
                      ? StatusColors[status as ProjectStatus] + ' shadow-lg'
                      : 'bg-[#1C1C1E] text-[#98989D] border-[#3A3A3C] hover:bg-[#3A3A3C] hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus size={32} className="text-[#98989D]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No projects found</h3>
            <p className="text-[#98989D] mb-6">
              {searchTerm || selectedStatus 
                ? "Try adjusting your search or filters to find projects."
                : "Get started by creating your first project."
              }
            </p>
            <Link 
              href="/projects/create" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium"
            >
              <Plus size={18} />
              Create Project
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E]">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="text-[#98989D] hover:text-white transition-colors p-4 hover:bg-[#3A3A3C] rounded-xl"
              title="Back to Dashboard"
            >
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Projects</h1>
              <p className="text-[#98989D] text-sm mt-1">Manage your projects and track progress</p>
            </div>
          </div>
          <Link 
            href="/projects/create" 
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/25"
          >
            <Plus size={20} />
            New Project
          </Link>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#98989D] text-sm">Filter by status:</span>
            <button
              onClick={() => handleStatusFilter('')}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                selectedStatus === '' 
                  ? 'bg-blue-400/20 text-blue-400 border-blue-400/40'
                  : 'bg-[#2C2C2E] text-[#98989D] border-[#3A3A3C] hover:bg-[#3A3A3C]'
              }`}
            >
              All
            </button>
            {Object.entries(StatusLabels).map(([status, label]) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status as ProjectStatus)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedStatus === status 
                    ? StatusColors[status as ProjectStatus]
                    : 'bg-[#2C2C2E] text-[#98989D] border-[#3A3A3C] hover:bg-[#3A3A3C]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          key="projects-container"
          initial={isMounted ? "hidden" : false}
          animate="show"
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {projects.data.map(project => (
            <ProjectCard
              key={`project-${project.id}`}
              project={project}
              onStatusUpdate={handleStatusUpdate}
              onDelete={handleDeleteProject}
            />
          ))}
        </motion.div>

        {projects.meta && projects.meta.last_page > 1 && (
          <div className="mt-8 w-full">
            <div className="flex flex-col items-center gap-4 p-6 bg-[#2C2C2E]/50 backdrop-blur-sm border border-[#3A3A3C]/50 rounded-2xl">
              <div className="flex items-center gap-2 text-sm text-[#98989D]">
                <span>Page</span>
                <span className="font-semibold text-white">{projects.meta.current_page}</span>
                <span>of</span>
                <span className="font-semibold text-white">{projects.meta.last_page}</span>
                <span className="mx-2">•</span>
                <span className="font-semibold text-white">{projects.meta.total}</span>
                <span>total projects</span>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {/* Previous Button */}
                <button
                  onClick={() => goToPage(projects.meta.current_page - 1)}
                  disabled={projects.meta.current_page <= 1}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    projects.meta.current_page <= 1
                      ? 'bg-[#2C2C2E] text-[#98989D] cursor-not-allowed'
                      : 'bg-[#3A3A3C] text-white hover:bg-[#48484A]'
                  }`}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, projects.meta.last_page) }, (_, i) => {
                  let page;
                  if (projects.meta.last_page <= 5) {
                    page = i + 1;
                  } else if (projects.meta.current_page <= 3) {
                    page = i + 1;
                  } else if (projects.meta.current_page >= projects.meta.last_page - 2) {
                    page = projects.meta.last_page - 4 + i;
                  } else {
                    page = projects.meta.current_page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-10 h-10 rounded-lg ${
                        page === projects.meta.current_page
                          ? 'bg-blue-500 text-white'
                          : 'bg-[#3A3A3C] text-[#98989D] hover:bg-[#48484A] hover:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  onClick={() => goToPage(projects.meta.current_page + 1)}
                  disabled={projects.meta.current_page >= projects.meta.last_page}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    projects.meta.current_page >= projects.meta.last_page
                      ? 'bg-[#2C2C2E] text-[#98989D] cursor-not-allowed'
                      : 'bg-[#3A3A3C] text-white hover:bg-[#48484A]'
                  }`}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </div>
  )
}