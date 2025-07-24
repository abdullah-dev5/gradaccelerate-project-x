import { Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Share2, AlertCircle } from 'lucide-react'

interface SharedNoteNotFoundProps {
  message?: string
}

export default function SharedNoteNotFound({ 
  message = 'Shared note not found or has been removed' 
}: SharedNoteNotFoundProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4"
    >
      <div className="text-center max-w-lg">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-4 rounded-full">
              <Share2 className="h-12 w-12 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shared Note Not Found</h1>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <p className="text-lg text-gray-600">{message}</p>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              This could happen if:
            </p>
            <ul className="text-sm text-amber-700 mt-2 text-left space-y-1">
              <li>• The shared link has expired or been revoked</li>
              <li>• The note has been deleted by its owner</li>
              <li>• The link URL is incomplete or incorrect</li>
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
            >
              <Home size={18} />
              Go Home
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            If you believe this is an error, please contact the person who shared this note.
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
