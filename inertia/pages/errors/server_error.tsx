import { Head, Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react'

interface ServerErrorProps {
  error?: {
    message?: string
    stack?: string
  }
}

export default function ServerError({ 
  error = { message: 'An unexpected error occurred on the server.' }
}: ServerErrorProps) {
  return (
    <>
      <Head title="500 - Server Error" />
      
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
            <div className="w-24 h-24 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={48} className="text-red-400" />
            </div>
            
            <h1 className="text-6xl font-bold text-red-400 mb-4">500</h1>
            <h2 className="text-2xl font-semibold text-white mb-4">Server Error</h2>
            <p className="text-[#98989D] text-lg mb-4">
              {error.message}
            </p>
            {error.stack && process.env.NODE_ENV === 'development' && (
              <details className="text-left bg-[#2C2C2E] p-4 rounded-lg border border-[#3A3A3C]">
                <summary className="text-[#98989D] cursor-pointer mb-2">Stack Trace (Development)</summary>
                <pre className="text-xs text-red-400 overflow-x-auto whitespace-pre-wrap">
                  {error.stack}
                </pre>
              </details>
            )}
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
                className="flex items-center gap-2 px-6 py-3 bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors"
              >
                <Home size={18} />
                Go Home
              </Link>
              
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-3 border border-[#3A3A3C] text-[#98989D] rounded-lg hover:bg-[#3A3A3C] hover:text-white transition-colors"
              >
                <RefreshCw size={18} />
                Try Again
              </button>
            </div>

            <div className="text-sm text-[#98989D]">
              <p>If this problem persists, please contact support.</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  )
}