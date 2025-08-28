import { Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Edit, Eye, Trash2, Calendar, Clock } from 'lucide-react'
import { Project, StatusColors, StatusLabels, ProjectStatus } from '../../types/project'

interface ProjectCardProps {
  project: Project
  onStatusUpdate: (projectId: number, newStatus: ProjectStatus) => void
  onDelete: (projectId: number) => void
}

export default function ProjectCard({ project, onStatusUpdate, onDelete }: ProjectCardProps) {
  const maxDescriptionLength = 50 // Reduced from 120 to 50 for better UX

  // Debug: Log project data
  console.log('ProjectCard render:', {
    id: project.id,
    title: project.title,
    description: project.description,
    descriptionLength: project.description?.length || 0,
    maxLength: maxDescriptionLength,
    shouldShowViewMore: project.description && project.description.length > maxDescriptionLength
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    return formatDate(dateString)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden backdrop-blur-sm bg-gradient-to-br from-[#2C2C2E]/90 to-[#1C1C1E]/90 border border-[#3A3A3C]/50 rounded-2xl hover:border-[#3A3A3C] transition-all duration-300 hover:transform hover:-translate-y-2"
      style={{
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)'
      }}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative p-6">
        {/* Header with title and status */}
        <div className="flex justify-between items-start mb-4 relative z-40">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl text-white mb-2 line-clamp-2 group-hover:text-blue-100 transition-colors">
              <Link 
                href={`/projects/${project.id}`} 
                className="hover:underline decoration-blue-400/50 underline-offset-2"
              >
                {project.title}
              </Link>
            </h3>
          </div>
          
          {/* Status Dropdown */}
          <div className="flex-shrink-0 ml-3 relative z-50">
            <select
              value={project.status}
              onChange={(e) => {
                e.stopPropagation()
                onStatusUpdate(project.id, e.target.value as ProjectStatus)
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-full border cursor-pointer transition-all duration-200 bg-opacity-20 hover:bg-opacity-30 ${StatusColors[project.status]}`}
              style={{ minWidth: '110px' }}
            >
              {Object.entries(StatusLabels).map(([value, label]) => (
                <option key={value} value={value} className="bg-[#2C2C2E] text-white">
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6 relative z-30">
          <p className="text-[#98989D] leading-relaxed">
            {(project.description?.substring(0, maxDescriptionLength) || 'No description provided for this project.')}
            {project.description && project.description.length > maxDescriptionLength && '...'}
          </p>
          {project.description && project.description.length > maxDescriptionLength && (
            <Link
              href={`/projects/${project.id}`}
              onClick={(e) => {
                e.preventDefault()
                console.log('View More clicked for project:', {
                  id: project.id,
                  title: project.title,
                  description: project.description,
                  descriptionLength: project.description?.length || 0,
                  maxLength: maxDescriptionLength,
                  shouldShowViewMore: project.description && project.description.length > maxDescriptionLength
                })
                
                // Try to navigate programmatically
                window.location.href = `/projects/${project.id}`
              }}
              className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer relative z-50 bg-blue-400/10 px-2 py-1 rounded-md border border-blue-400/20 hover:bg-blue-400/20"
            >
              <span>View more</span>
              <Eye size={12} />
            </Link>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-[#98989D] mb-4 relative z-30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-[#98989D]" />
              <span>Created {formatDate(project.createdAt)}</span>
            </div>
            {project.updatedAt !== project.createdAt && (
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-[#98989D]" />
                <span>Updated {getTimeAgo(project.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#3A3A3C]/50 relative z-40">
          <div className="flex items-center gap-2">
            <Link 
              href={`/projects/${project.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-all duration-200"
            >
              <Edit size={14} />
              Edit
            </Link>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (confirm('Are you sure you want to delete this project?')) {
                onDelete(project.id)
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1C1C1E]/80 to-transparent pointer-events-none z-10" />
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 via-blue-400/0 to-purple-500/0 group-hover:from-blue-400/5 group-hover:via-blue-400/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none z-20" />
      
    </motion.div>
  )
}