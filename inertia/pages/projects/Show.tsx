import { useState, useEffect } from 'react'
import { usePage, Link, router } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, Trash2, Calendar, Clock, Tag } from 'lucide-react'
import { Project, StatusColors, StatusLabels, ProjectStatus } from '../../types/project'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/Toast'

type Props = {
  project: Project
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function ProjectShow() {
  const [isMounted, setIsMounted] = useState(false)
  const { project } = usePage<Props>().props
  const { toasts, removeToast, success, error } = useToast()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      router.delete(`/projects/${project.id}`, {
        onSuccess: () => {
          success('Project Deleted', 'Project has been successfully deleted.')
        },
        onError: () => {
          error('Delete Failed', 'Failed to delete the project.')
        }
      })
    }
  }

  const handleStatusUpdate = (newStatus: ProjectStatus) => {
    router.patch(`/projects/${project.id}/status`, {
      status: newStatus
    }, {
      preserveScroll: true,
      onSuccess: () => {
        success('Status Updated', 'Project status has been successfully updated.')
      },
      onError: () => {
        error('Update Failed', 'Failed to update project status.')
      }
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (!isMounted) {
    return (
      <div className="p-4 max-w-6xl mx-auto bg-[#1C1C1E] min-h-screen">
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-8 h-8 bg-[#3A3A3C] rounded"></div>
            <div>
              <div className="h-8 bg-[#3A3A3C] rounded w-64 mb-2"></div>
              <div className="h-6 bg-[#3A3A3C] rounded w-32"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-40 bg-[#3A3A3C] rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-[#3A3A3C] rounded"></div>
              <div className="h-48 bg-[#3A3A3C] rounded"></div>
              <div className="h-20 bg-[#3A3A3C] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-6xl mx-auto bg-[#1C1C1E] min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#98989D] mb-6">
        <Link href="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/projects" className="hover:text-white transition-colors">
          Projects
        </Link>
        <span>/</span>
        <span className="text-white">{project.title}</span>
      </div>

      {/* Header */}
      <motion.div
        initial={isMounted ? "hidden" : false}
        animate="visible"
        variants={containerVariants}
        className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8"
      >
        <div className="flex items-start gap-4 flex-1">
          <Link 
            href="/projects" 
            className="p-2 text-[#98989D] hover:text-white hover:bg-[#3A3A3C] rounded-lg transition-all duration-200"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3 leading-tight">
              {project.title}
            </h1>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full border ${StatusColors[project.status]}`}>
                <Tag size={14} className="mr-1.5" />
                {StatusLabels[project.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${project.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-400/20 text-blue-400 border border-blue-400/40 rounded-lg hover:bg-blue-400/30 transition-all duration-200"
          >
            <Edit size={16} />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-400/20 text-red-400 border border-red-400/40 rounded-lg hover:bg-red-400/30 transition-all duration-200"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-sm bg-gradient-to-br from-[#2C2C2E]/90 to-[#1C1C1E]/90 border border-[#3A3A3C]/50 rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Tag size={20} className="text-[#98989D]" />
              Description
            </h2>
            <p className="text-[#98989D] leading-relaxed text-base">
              {project.description || 'No description provided for this project.'}
            </p>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-sm bg-gradient-to-br from-[#2C2C2E]/90 to-[#1C1C1E]/90 border border-[#3A3A3C]/50 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Update Status</h3>
            <select
              value={project.status}
              onChange={(e) => handleStatusUpdate(e.target.value as ProjectStatus)}
              className={`w-full px-4 py-3 text-sm font-medium rounded-lg border cursor-pointer transition-all duration-200 bg-opacity-20 hover:bg-opacity-30 ${StatusColors[project.status]}`}
            >
              {Object.entries(StatusLabels).map(([value, label]) => (
                <option key={value} value={value} className="bg-[#2C2C2E] text-white">
                  {label}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Metadata */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-sm bg-gradient-to-br from-[#2C2C2E]/90 to-[#1C1C1E]/90 border border-[#3A3A3C]/50 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-[#98989D] mt-1" />
                <div>
                  <p className="text-sm text-[#98989D]">Created</p>
                  <p className="text-white font-medium">{formatDate(project.createdAt)}</p>
                </div>
              </div>
              
              {project.updatedAt !== project.createdAt && (
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-[#98989D] mt-1" />
                  <div>
                    <p className="text-sm text-[#98989D]">Last Updated</p>
                    <p className="text-white font-medium">{formatDate(project.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
