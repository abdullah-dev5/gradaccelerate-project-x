import { Head, Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Lock, Home, ArrowLeft } from 'lucide-react'

interface UnauthorizedProps {
  message?: string
  redirectUrl?: string
}

export default function Unauthorized({ 
  message = "You don't have permission to access this resource",
  redirectUrl = "/login"
}: UnauthorizedProps) {
  return (
    <>
      <Head title="Unauthorized Access" />
      
      <div className="min-h-screen bg-[#1C1C1E] text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-8"
          >
            <div className="w-24 h-24 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <Lock size={48} className="text-red-400" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold mb-4"
          >
            Unauthorized Access
          </motion.h1>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[#98989D] text-lg mb-8"
          >
            {message}
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href={redirectUrl}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A84FF] hover:bg-[#0A74FF] rounded-lg transition-colors duration-200 font-medium"
            >
              <ArrowLeft size={20} />
              Sign In
            </Link>
            
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2C2C2E] hover:bg-[#3C3C3E] rounded-lg transition-colors duration-200 font-medium"
            >
              <Home size={20} />
              Go Home
            </Link>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-sm text-[#98989D]"
          >
            <p>Need help? Contact support or check your permissions.</p>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
