import { Head, Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react'

interface PageNotFoundProps {
  message?: string
}

export default function PageNotFound({ 
  message = 'The page you are looking for does not exist or has been moved.' 
}: PageNotFoundProps) {
  return (
    <>
      <Head title="404 - Page Not Found" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-[#1C1C1E] flex items-center justify-center p-4"
      >
        <div className="text-center max-w-lg">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="w-24 h-24 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={48} className="text-blue-400" />
            </div>
            
            <h1 className="text-6xl font-bold text-blue-400 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
            <p className="text-[#98989D] text-lg">
              {message}
            </p>
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
              className="flex items-center gap-2 px-6 py-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              <Home size={18} />
              Go Home
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-6 py-3 border border-[#3A3A3C] text-[#98989D] rounded-lg hover:bg-[#3A3A3C] hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          </div>

          <Link
            href="/notes"
            className="text-blue-400 hover:underline text-sm"
          >
            Browse Notes
          </Link>
        </motion.div>
      </div>
    </motion.div>
    </>
  )
}
