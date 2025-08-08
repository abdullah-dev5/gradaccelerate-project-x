import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: AlertCircle
}

const toastStyles = {
  success: 'bg-green-400/10 border-green-400/20 text-green-400',
  error: 'bg-red-400/10 border-red-400/20 text-red-400',
  warning: 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400',
  info: 'bg-blue-400/10 border-blue-400/20 text-blue-400'
}

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const Icon = toastIcons[type]

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(id), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(id), 300)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.3 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.3 }}
          className={`relative p-4 rounded-lg border ${toastStyles[type]} bg-[#2C2C2E] min-w-80 max-w-md`}
        >
          <div className="flex items-start gap-3">
            <Icon size={20} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white">{title}</h4>
              {message && (
                <p className="mt-1 text-sm text-[#98989D]">{message}</p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 text-[#98989D] hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface ToastContainerProps {
  toasts: Array<{
    id: string
    type: ToastType
    title: string
    message?: string
  }>
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
