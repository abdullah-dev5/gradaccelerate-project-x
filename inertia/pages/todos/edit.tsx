import { Head, Link, useForm } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Save } from 'lucide-react'



interface Todo {
  id: number;
  title: string;
  description: string | null;
  isCompleted: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface EditTodoProps {
  todo: Todo;
}

export default function EditTodo({ todo }: EditTodoProps) {
  const { data, setData, put, processing, errors } = useForm({
    title: todo.title,
    description: todo.description || '',
    isCompleted: todo.isCompleted,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    put(`/todos/${todo.id}`)
  }



  return (
    <>
      <Head title={`Edit Todo - ${todo.title}`} />
      <div className="min-h-screen bg-[#1C1C1E] text-white">
        <div className="max-w-4xl mx-auto p-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-3">
              <Link 
                href="/todos" 
                className="p-2 hover:bg-[#2C2C2E] rounded-full transition-colors duration-200"
              >
                <ArrowLeft size={24} />
              </Link>
              <h1 className="text-3xl font-bold">Edit Todo</h1>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#2C2C2E] rounded-xl p-6"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  className="w-full bg-[#1C1C1E] text-white px-4 py-3 rounded-lg border border-[#3A3A3C] focus:border-[#007AFF] focus:outline-none transition-colors duration-200"
                  placeholder="Enter todo title..."
                  required
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  rows={4}
                  className="w-full bg-[#1C1C1E] text-white px-4 py-3 rounded-lg border border-[#3A3A3C] focus:border-[#007AFF] focus:outline-none transition-colors duration-200 resize-none"
                  placeholder="Enter todo description..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isCompleted"
                  checked={data.isCompleted}
                  onChange={(e) => setData('isCompleted', e.target.checked)}
                  className="w-4 h-4 text-[#007AFF] bg-[#1C1C1E] border-[#3A3A3C] rounded focus:ring-[#007AFF] focus:ring-2"
                />
                <label htmlFor="isCompleted" className="text-sm font-medium">
                  Mark as completed
                </label>
              </div>



              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={processing}
                  className="bg-[#007AFF] hover:bg-[#0056CC] disabled:bg-[#3A3A3C] disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <Save size={20} />
                  {processing ? 'Updating...' : 'Update Todo'}
                </button>
                <Link
                  href="/todos"
                  className="bg-[#3A3A3C] hover:bg-[#48484A] px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  )
}

