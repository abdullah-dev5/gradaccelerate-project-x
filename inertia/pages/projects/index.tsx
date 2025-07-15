import { useState, useEffect } from 'react'
import { usePage, Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Plus, ChevronLeft, ChevronRight, Edit, Home } from 'lucide-react'

type Project = {
  id: number
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  createdAt: string
  updatedAt: string
}

type Props = {
  projects?: {
    data?: Project[]
    meta?: {
      current_page: number
      last_page: number
    }
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

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
}

export default function ProjectIndex() {
  const [isMounted, setIsMounted] = useState(false)
  const { projects } = usePage<Props>().props

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const statusColors = {
    pending: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    in_progress: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    completed: 'bg-green-400/10 text-green-400 border-green-400/20'
  }

  if (!isMounted) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[#98989D] hover:text-white transition-colors">
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
            <Link href="/" className="text-[#98989D] hover:text-white transition-colors">
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
        <div className="text-center py-8">
          <p className="text-[#98989D]">No projects found</p>
          <Link href="/projects/create" className="text-blue-400 hover:underline">
            Create your first project
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-6xl mx-auto bg-[#3A3A3C] text-[#98989D]">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="text-[#98989D] hover:text-white transition-colors"
            title="Back to Home"
          >
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

      <motion.div
        key="projects-container"
        initial={isMounted ? "hidden" : false}
        animate="show"
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {projects.data.map(project => (
          <motion.div
            key={`project-${project.id}`}
            variants={itemVariants}
            whileHover={isMounted ? { y: -5 } : undefined}
            className="relative overflow-hidden backdrop-blur-sm bg-[#2C2C2E]/80 border border-[#3A3A3C] rounded-xl"
            style={{
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h2 className="font-bold text-lg text-white">
                  <Link href={`/projects/${project.id}`} className="hover:underline">
                    {project.title}
                  </Link>
                </h2>
                <span className={`px-2 py-1 text-xs rounded-full border ${statusColors[project.status]}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[#98989D] mb-4 line-clamp-2">{project.description}</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#98989D]">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
                <Link 
                  href={`/projects/${project.id}/edit`}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Edit size={16} />
                  Edit
                </Link>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#2C2C2E] to-transparent" />
          </motion.div>
        ))}
      </motion.div>

      {projects.meta && projects.meta.last_page > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          {projects.meta.current_page > 1 && (
            <Link 
              href={`/projects?page=${projects.meta.current_page - 1}`}
              className="flex items-center gap-1 px-3 py-1 border border-[#3A3A3C] rounded hover:bg-[#3A3A3C] transition-colors text-[#98989D] hover:text-white"
              preserveScroll
            >
              <ChevronLeft size={16} />
              Previous
            </Link>
          )}
          
          <span className="px-3 py-1 text-[#98989D]">
            Page {projects.meta.current_page} of {projects.meta.last_page}
          </span>
          
          {projects.meta.current_page < projects.meta.last_page && (
            <Link 
              href={`/projects?page=${projects.meta.current_page + 1}`}
              className="flex items-center gap-1 px-3 py-1 border border-[#3A3A3C] rounded hover:bg-[#3A3A3C] transition-colors text-[#98989D] hover:text-white"
              preserveScroll
            >
              Next
              <ChevronRight size={16} />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}