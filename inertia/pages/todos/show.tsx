import { Head, Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, Trash2, Calendar, Clock, CheckCircle, Circle } from 'lucide-react'
import { router } from '@inertiajs/react'
import { useState, useEffect } from 'react'

interface Todo {
  id: number
  title: string
  description: string | null
  status: 'pending' | 'completed'
  createdAt: string
  updatedAt: string
}

interface Props {
  todo: Todo
}

export default function TodoShow({ todo }: Props) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this todo? This action cannot be undone.')) {
      router.delete(`/todos/${todo.id}`, {
        onSuccess: () => {
          router.visit('/todos')
        }
      })
    }
  }

  const handleToggleStatus = () => {
    router.patch(`/todos/${todo.id}/status`, {}, {
      preserveScroll: true
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
      <div className="min-h-screen bg-[#1C1C1E] p-6">
        <div className="animate-pulse max-w-4xl mx-auto">
          <div className="h-8 bg-[#3A3A3C] rounded w-64 mb-6"></div>
          <div className="h-6 bg-[#3A3A3C] rounded w-32 mb-4"></div>
          <div className="h-32 bg-[#3A3A3C] rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head title={`${todo.title} - Todo`} />
      
      <div className="min-h-screen bg-[#1C1C1E] text-white">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-4">
              <Link
                href="/todos"
                className="p-2 hover:bg-[#2C2C2E] rounded-full transition-colors duration-200"
              >
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">{todo.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    todo.status === 'completed' 
                      ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                      : 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                  }`}>
                    {todo.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleStatus}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  todo.status === 'completed'
                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 hover:bg-yellow-400/30'
                    : 'bg-green-400/20 text-green-400 border border-green-400/40 hover:bg-green-400/30'
                }`}
              >
                {todo.status === 'completed' ? (
                  <>
                    <Circle size={16} />
                    Mark Pending
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Mark Complete
                  </>
                )}
              </button>
              
              <Link
                href={`/todos/${todo.id}/edit`}
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

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#2C2C2E] rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-[#98989D] leading-relaxed">
                {todo.description || 'No description provided for this todo.'}
              </p>
            </div>

            {/* Meta information */}
            <div className="mt-6 pt-4 border-t border-[#3A3A3C] text-sm text-[#98989D]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>Created {formatDate(todo.createdAt)}</span>
                </div>
                {todo.updatedAt !== todo.createdAt && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    <span>Updated {formatDate(todo.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
