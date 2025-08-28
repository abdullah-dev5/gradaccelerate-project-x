import { useToastContext } from '../contexts/ToastContext'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

export interface UseToastReturn {
  toasts: Toast[]
  showToast: (title: string, type?: ToastType, message?: string, duration?: number) => void
  hideToast: (id: string) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
}

export function useToast(): UseToastReturn {
  const { toasts, showToast, hideToast, clearToasts } = useToastContext()
  
  const success = (title: string, message?: string) => {
    showToast(title, 'success', message)
  }
  
  const error = (title: string, message?: string) => {
    showToast(title, 'error', message)
  }
  
  const info = (title: string, message?: string) => {
    showToast(title, 'info', message)
  }
  
  const warning = (title: string, message?: string) => {
    showToast(title, 'warning', message)
  }
  
  return {
    toasts,
    showToast,
    hideToast,
    removeToast: hideToast, // Alias for compatibility
    clearToasts,
    success,
    error,
    info,
    warning
  }
}
