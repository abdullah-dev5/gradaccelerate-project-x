import { useState, useEffect } from 'react'
import { useForm, Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Save, X, ArrowLeft } from 'lucide-react'

type Project = {
  id?: number
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
}

type Props = {
  project?: Partial<Project>
  errors?: Partial<Record<keyof Project, string>>
}

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function ProjectForm({ project, errors }: Props) {
  const [isMounted, setIsMounted] = useState(false)
  const { data, setData, post, put, processing, reset } = useForm<Project>({
    title: project?.title || '',
    description: project?.description || '',
    status: project?.status || 'pending'
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    project?.id 
      ? put(`/projects/${project.id}`, {
          onSuccess: () => reset(),
          preserveScroll: true
        })
      : post('/projects', {
          onSuccess: () => reset(),
          preserveScroll: true
        })
  }

  if (!isMounted) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="text-[#98989D]">
            <ArrowLeft size={20} />
          </div>
          <div className="h-8 w-64 bg-[#3A3A3C] rounded animate-pulse"></div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-[#3A3A3C] rounded w-1/4"></div>
          <div className="h-10 bg-[#3A3A3C] rounded"></div>
          <div className="h-4 bg-[#3A3A3C] rounded w-1/4"></div>
          <div className="h-24 bg-[#3A3A3C] rounded"></div>
          <div className="h-4 bg-[#3A3A3C] rounded w-1/4"></div>
          <div className="h-10 bg-[#3A3A3C] rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      key={project?.id ? `edit-${project.id}` : 'create'}
      initial={isMounted ? "hidden" : false}
      animate="visible"
      variants={formVariants}
      className="p-4 max-w-2xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/projects" 
          className="text-[#98989D] hover:text-white transition-colors"
          preserveScroll
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">
          {project?.id ? 'Edit Project' : 'Create Project'}
        </h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block mb-2 font-medium text-[#98989D]">
            Project Name *
          </label>
          <motion.input
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            id="title"
            type="text"
            value={data.title}
            onChange={e => setData('title', e.target.value)}
            className="w-full p-3 bg-[#2C2C2E] border border-[#3A3A3C] text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            required
            autoFocus
          />
          {errors?.title && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mt-1"
            >
              {errors.title}
            </motion.p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block mb-2 font-medium text-[#98989D]">
            Description
          </label>
          <motion.textarea
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            id="description"
            value={data.description}
            onChange={e => setData('description', e.target.value)}
            className="w-full p-3 bg-[#2C2C2E] border border-[#3A3A3C] text-white rounded-lg min-h-[120px] focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            rows={4}
          />
          {errors?.description && (
            <p className="text-red-400 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="status" className="block mb-2 font-medium text-[#98989D]">
            Status *
          </label>
          <select
            id="status"
            value={data.status}
            onChange={e => setData('status', e.target.value as Project['status'])}
            className="w-full p-3 bg-[#2C2C2E] border border-[#3A3A3C] text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            required
          >
            <option value="pending" className="bg-[#2C2C2E]">Pending</option>
            <option value="in_progress" className="bg-[#2C2C2E]">In Progress</option>
            <option value="completed" className="bg-[#2C2C2E]">Completed</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4 border-t border-[#3A3A3C]">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={processing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            <Save size={18} />
            {processing ? 'Saving...' : 'Save Project'}
          </motion.button>
          <Link
            href="/projects"
            className="flex items-center gap-2 px-4 py-2 border border-[#3A3A3C] text-[#98989D] rounded-lg hover:bg-[#3A3A3C] hover:text-white transition-colors"
            preserveScroll
          >
            <X size={18} />
            Cancel
          </Link>
        </div>
      </form>
    </motion.div>
  )
}